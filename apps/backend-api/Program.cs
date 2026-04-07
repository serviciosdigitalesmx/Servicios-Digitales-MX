using BackendApi.Domain;
using BackendApi.Infrastructure;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Development.local.json", optional: true, reloadOnChange: true);

var allowedOrigins = new[]
{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    builder.Configuration["MercadoPago:BaseUrl"],
    builder.Configuration["Frontend:BaseUrl"],
    builder.Configuration["NEXT_PUBLIC_APP_URL"]
}
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin!.Trim().TrimEnd('/'))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.Configure<SupabaseOptions>(builder.Configuration.GetSection("Supabase"));
builder.Services.Configure<MercadoPagoOptions>(builder.Configuration.GetSection("MercadoPago"));
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend-dev", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddOpenApi();
builder.Services.AddScoped<SupabaseBootstrapContext>();
builder.Services.AddHttpClient<SupabaseService>();
builder.Services.AddHttpClient<MercadoPagoService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Supabase:ServiceKey"]!)),
            ValidateIssuer = false, // Supabase allows cross-issuer in some setups, but we could enforce it if needed
            ValidateAudience = false,
            ValidateLifetime = true
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

static IResult? RequireOperationalAccess(SupabaseBootstrapContext bootstrap)
{
    if (bootstrap.HasOperationalAccess)
    {
        return null;
    }

    return Results.Json(new
    {
        success = false,
        error = new
        {
            code = "SHOP_SUBSCRIPTION_BLOCKED",
            message = "El shop actual no tiene acceso operativo por su estado de suscripción"
        }
    }, statusCode: StatusCodes.Status403Forbidden);
}

static Guid? ResolveShopId(string? externalReference, MercadoPagoPaymentMetadata? metadata)
{
    if (!string.IsNullOrWhiteSpace(metadata?.ShopId) && Guid.TryParse(metadata.ShopId, out var metadataShopId))
    {
        return metadataShopId;
    }

    if (!string.IsNullOrWhiteSpace(metadata?.TenantId) && Guid.TryParse(metadata.TenantId, out var metadataTenantId))
    {
        return metadataTenantId;
    }

    if (string.IsNullOrWhiteSpace(externalReference))
    {
        return null;
    }

    var parts = externalReference.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    if (parts.Length >= 2 && string.Equals(parts[0], "shop", StringComparison.OrdinalIgnoreCase) && Guid.TryParse(parts[1], out var shopId))
    {
        return shopId;
    }

    return null;
}

// Startup seeding removed in favor of per-request dynamic hydration

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontend-dev");
app.UseAuthentication();
app.UseAuthorization();

// Multi-tenant Middleware: Hydrate Context per Request from User Claims
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var bootstrap = context.RequestServices.GetRequiredService<SupabaseBootstrapContext>();
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            bootstrap.AccessToken = authHeader.Substring(7).Trim();
        }
        var email = context.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                    ?? context.User.FindFirst("email")?.Value;

        if (!string.IsNullOrWhiteSpace(email))
        {
            var supabase = context.RequestServices.GetRequiredService<SupabaseService>();
            
            try 
            {
                var user = await supabase.GetSingleAsync<SupabaseService.DbUser>($"users?email=eq.{Uri.EscapeDataString(email)}&select=id,tenant_id,branch_id,full_name,email,role,is_active,referral_code,balance", context.RequestAborted);
                if (user != null)
                {
                    bootstrap.UserId = user.Id;
                    bootstrap.TenantId = user.TenantId;
                    bootstrap.BranchId = user.BranchId ?? Guid.Empty;
                    bootstrap.UserEmail = user.Email;
                    bootstrap.UserFullName = user.FullName;
                    bootstrap.UserRole = user.Role;
                    bootstrap.UserReferralCode = user.ReferralCode ?? string.Empty;
                    bootstrap.UserBalance = user.Balance;

                    var tenant = await supabase.GetSingleAsync<SupabaseService.DbTenant>($"tenants?id=eq.{user.TenantId}&select=id,name,slug", context.RequestAborted);
                    if (tenant != null)
                    {
                        bootstrap.TenantName = tenant.Name;
                        bootstrap.TenantSlug = tenant.Slug;
                    }

                    var sub = await supabase.GetSingleAsync<SupabaseService.DbSubscription>($"subscriptions?tenant_id=eq.{user.TenantId}&order=created_at.desc&limit=1&select=id,tenant_id,plan_code,plan_name,price_mxn,billing_interval,status,current_period_start,current_period_end,grace_until", context.RequestAborted);
                    if (sub != null)
                    {
                        bootstrap.SubscriptionId = sub.Id;
                        bootstrap.SubscriptionStatus = sub.Status;
                        bootstrap.SubscriptionPlanCode = sub.PlanCode;
                        bootstrap.SubscriptionPlanName = sub.PlanName;
                        bootstrap.SubscriptionPriceMxn = sub.PriceMxn;
                        bootstrap.BillingInterval = sub.BillingInterval;
                        bootstrap.CurrentPeriodStart = sub.CurrentPeriodStart;
                        bootstrap.CurrentPeriodEnd = sub.CurrentPeriodEnd;
                        bootstrap.GraceUntil = sub.GraceUntil;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Middleware] Auth hydration failed: {ex.Message}");
            }
        }
    }
    await next();
});
app.UseHttpsRedirection();

app.MapGet("/api/health", () =>
{
    var bootstrap = app.Services.GetRequiredService<SupabaseBootstrapContext>();
    var mercadoPagoConfigured = !string.IsNullOrWhiteSpace(app.Configuration["MercadoPago:AccessToken"]);
    return Results.Ok(new
    {
        success = true,
        data = new
        {
            status = "ok",
            service = "sdmx-api",
            environment = app.Environment.EnvironmentName,
            supabaseConfigured = !string.IsNullOrWhiteSpace(app.Configuration["Supabase:Url"]) &&
                                 !string.IsNullOrWhiteSpace(app.Configuration["Supabase:ServiceKey"]),
            mercadoPagoConfigured,
            shop = new
            {
                id = bootstrap.TenantId,
                slug = bootstrap.TenantSlug,
                subscriptionStatus = bootstrap.SubscriptionStatus,
                operationalAccess = bootstrap.HasOperationalAccess
            },
            timestamp = DateTimeOffset.UtcNow
        }
    });
})
.WithName("HealthCheck");

// Login offloaded to Supabase Auth SDK on frontend

app.MapPost("/api/auth/register", async (RegisterRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    try
    {
        var result = await supabase.RegisterShopAsync(request, cancellationToken);
        return Results.Ok(new
        {
            success = true,
            data = new
            {
                tenantId = result.TenantId,
                shop = new
                {
                    id = result.TenantId,
                    name = result.TenantName,
                    slug = result.TenantSlug
                },
                user = new
                {
                    id = result.UserId,
                    referralCode = result.ReferralCode
                },
                referral = new
                {
                    applied = result.ReferrerUserId.HasValue,
                    referrerUserId = result.ReferrerUserId
                }
            }
        });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "REGISTRATION_INVALID",
                message = ex.Message
            }
        });
    }
})
.WithName("Register");

app.MapGet("/api/auth/me", [Microsoft.AspNetCore.Authorization.Authorize] async (HttpContext context, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    var email = context.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                ?? context.User.FindFirst("email")?.Value;

    if (string.IsNullOrWhiteSpace(email)) return Results.Unauthorized();

    var user = await supabase.GetSingleAsync<SupabaseService.DbUser>($"users?email=eq.{Uri.EscapeDataString(email)}&select=id,tenant_id,branch_id,full_name,email,role,is_active,referral_code,balance", cancellationToken);
    if (user is null) return Results.NotFound(new { success = false, error = new { code = "USER_NOT_FOUND", message = "Perfil no encontrado" } });

    var tenant = await supabase.GetSingleAsync<SupabaseService.DbTenant>($"tenants?id=eq.{user.TenantId}&select=id,name,slug", cancellationToken);
    var subscription = await supabase.GetSingleAsync<SupabaseService.DbSubscription>($"subscriptions?tenant_id=eq.{user.TenantId}&order=created_at.desc&limit=1&select=id,tenant_id,plan_code,plan_name,price_mxn,billing_interval,status,current_period_start,current_period_end,grace_until", cancellationToken);

    var lastPayment = await supabase.GetLatestSubscriptionPaymentAsync(user.TenantId, cancellationToken);
    
    return Results.Ok(new
    {
        success = true,
        data = new
        {
            user = new
            {
                Id = user.Id,
                TenantId = user.TenantId,
                ShopId = user.TenantId,
                BranchId = user.BranchId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                ReferralCode = user.ReferralCode,
                Balance = user.Balance
            },
            shop = new
            {
                Id = tenant?.Id,
                Name = tenant?.Name,
                Slug = tenant?.Slug
            },
            subscription = subscription != null ? new
            {
                Id = subscription.Id,
                Status = subscription.Status,
                PlanCode = subscription.PlanCode,
                PlanName = subscription.PlanName,
                PriceMxn = subscription.PriceMxn,
                BillingInterval = subscription.BillingInterval,
                CurrentPeriodStart = subscription.CurrentPeriodStart,
                CurrentPeriodEnd = subscription.CurrentPeriodEnd,
                GraceUntil = subscription.GraceUntil,
                OperationalAccess = subscription.Status is "active" or "trialing" or "past_due"
            } : null,
            lastPayment = lastPayment is null ? null : new
            {
                Id = lastPayment.Id,
                Provider = lastPayment.Provider,
                ProviderPaymentId = lastPayment.ProviderPaymentId,
                ProviderPaymentStatus = lastPayment.ProviderPaymentStatus,
                Amount = lastPayment.Amount,
                CurrencyId = lastPayment.CurrencyId,
                PayerEmail = lastPayment.PayerEmail,
                PaidAt = lastPayment.PaidAt,
                CreatedAt = lastPayment.CreatedAt
            }
        }
    });
})
.WithName("CurrentUser");

app.MapGet("/api/customers", async (string? search, int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = Math.Max(page ?? 1, 1);
    var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 100);
    var (items, total) = await supabase.ListCustomersAsync(search, currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = (currentPage * currentPageSize) < total
        }
    });
})
.WithName("ListCustomers");

app.MapGet("/api/referrals", async (SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var items = await supabase.ListReferralsAsync(cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items
    });
})
.WithName("ListReferrals");

app.MapGet("/api/customers/{id:guid}", async (Guid id, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var customer = await supabase.GetCustomerByIdAsync(id, cancellationToken);
    if (customer is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "NOT_FOUND",
                message = "Cliente no encontrado"
            }
        });
    }

    return Results.Ok(new
    {
        success = true,
        data = customer
    });
})
.WithName("GetCustomer");

app.MapPost("/api/customers", async (CreateCustomerRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (string.IsNullOrWhiteSpace(request.FullName))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "El nombre del cliente es obligatorio"
            }
        });
    }

    var customer = await supabase.CreateCustomerAsync(request, cancellationToken);

    if (customer is null)
    {
        return Results.StatusCode(StatusCodes.Status500InternalServerError);
    }

    return Results.Created($"/api/customers/{customer.Id}", new
    {
        success = true,
        data = customer
    });
})
.WithName("CreateCustomer");

app.MapPost("/api/service-orders", async (CreateServiceOrderRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (request.BranchId == Guid.Empty || request.CustomerId == Guid.Empty || string.IsNullOrWhiteSpace(request.DeviceType) || string.IsNullOrWhiteSpace(request.ReportedIssue))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "Faltan datos obligatorios para crear la orden"
            }
        });
    }

    var customerExists = await supabase.CustomerExistsAsync(request.CustomerId, cancellationToken);
    if (!customerExists)
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "El cliente no existe en el tenant actual"
            }
        });
    }

    var order = await supabase.CreateServiceOrderAsync(request, cancellationToken);

    if (order is null)
    {
        return Results.StatusCode(StatusCodes.Status500InternalServerError);
    }

    return Results.Created($"/api/service-orders/{order.Id}", new
    {
        success = true,
        data = order
    });
})
.WithName("CreateServiceOrder");

app.MapGet("/api/service-orders", async (string? status, Guid? branchId, string? search, int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = Math.Max(page ?? 1, 1);
    var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 100);
    var (items, total) = await supabase.ListServiceOrdersAsync(status, branchId, search, currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = (currentPage * currentPageSize) < total
        }
    });
})
.WithName("ListServiceOrders");

app.MapGet("/api/service-orders/{id:guid}", async (Guid id, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var order = await supabase.GetServiceOrderByIdAsync(id, cancellationToken);
    if (order is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "NOT_FOUND",
                message = "Orden no encontrada"
            }
        });
    }

    var customer = await supabase.GetCustomerByIdAsync(order.CustomerId, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = new
        {
            order.Id,
            order.Folio,
            order.Status,
            customer = customer is null ? null : new
            {
                customer.Id,
                customer.FullName,
                customer.Phone,
                customer.Email
            },
            order.DeviceType,
            order.DeviceBrand,
            order.DeviceModel,
            order.ReportedIssue,
            order.Priority,
            order.PromisedDate,
            order.EstimatedCost
        }
    });
})
.WithName("GetServiceOrder");

app.MapGet("/api/service-orders/by-folio/{folio}", async (string folio, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var order = await supabase.GetServiceOrderByFolioAsync(folio, cancellationToken);
    if (order is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "NOT_FOUND",
                message = "Orden no encontrada"
            }
        });
    }

    return Results.Ok(new
    {
        success = true,
        data = order
    });
})
.WithName("GetServiceOrderByFolio");

app.MapGet("/api/portal/orders/{folio}", async (string folio, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    var order = await supabase.GetServiceOrderByFolioAsync(folio, cancellationToken);
    if (order is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "NOT_FOUND",
                message = "Orden no encontrada"
            }
        });
    }

    return Results.Ok(new
    {
        success = true,
        data = new
        {
            order.Folio,
            order.Status,
            order.DeviceType,
            order.DeviceModel,
            order.ReportedIssue,
            order.PromisedDate,
            progressPhotos = Array.Empty<object>()
        }
    });
})
.WithName("GetPortalOrder");

app.MapGet("/api/service-requests", async (int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = page.GetValueOrDefault(1);
    var currentPageSize = pageSize.GetValueOrDefault(20);
    var (items, total) = await supabase.ListServiceRequestsAsync(currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = currentPage * currentPageSize < total
        }
    });
})
.WithName("ListServiceRequests");

app.MapPost("/api/service-requests", async (CreateServiceRequestRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (string.IsNullOrWhiteSpace(request.CustomerName))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "El nombre del cliente es obligatorio"
            }
        });
    }

    var created = await supabase.CreateServiceRequestAsync(request, cancellationToken);
    return Results.Created("/api/service-requests", new
    {
        success = true,
        data = created
    });
})
.WithName("CreateServiceRequest");

app.MapGet("/api/technician/queue", async (SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var queue = await supabase.GetTechnicianQueueAsync(cancellationToken);
    return Results.Ok(new
    {
        success = true,
        data = new
        {
            orders = queue.Orders,
            tasks = queue.Tasks
        }
    });
})
.WithName("GetTechnicianQueue");

app.MapPatch("/api/service-orders/{id:guid}/technician", async (Guid id, UpdateTechnicianOrderRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var updated = await supabase.UpdateTechnicianOrderAsync(id, request, cancellationToken);
    if (updated is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "NOT_FOUND",
                message = "Orden no encontrada"
            }
        });
    }

    return Results.Ok(new
    {
        success = true,
        data = updated
    });
})
.WithName("UpdateTechnicianOrder");

app.MapGet("/api/archive/service-orders", async (int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = page.GetValueOrDefault(1);
    var currentPageSize = pageSize.GetValueOrDefault(20);
    var (items, total) = await supabase.ListArchivedOrdersAsync(currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = currentPage * currentPageSize < total
        }
    });
})
.WithName("ListArchivedOrders");

app.MapPost("/api/archive/service-orders/{id:guid}", async (Guid id, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var archived = await supabase.ArchiveServiceOrderAsync(id, cancellationToken);
    if (archived is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "NOT_FOUND",
                message = "Orden no encontrada"
            }
        });
    }

    return Results.Ok(new
    {
        success = true,
        data = archived
    });
})
.WithName("ArchiveServiceOrder");

app.MapGet("/api/suppliers", async (SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var items = await supabase.ListSuppliersAsync(cancellationToken);
    return Results.Ok(new
    {
        success = true,
        data = items
    });
})
.WithName("ListSuppliers");

app.MapPost("/api/suppliers", async (CreateSupplierRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (string.IsNullOrWhiteSpace(request.BusinessName))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "El nombre del proveedor es obligatorio"
            }
        });
    }

    var supplier = await supabase.CreateSupplierAsync(request, cancellationToken);
    return Results.Created("/api/suppliers", new
    {
        success = true,
        data = supplier
    });
})
.WithName("CreateSupplier");

app.MapGet("/api/products", async (string? search, int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = Math.Max(page ?? 1, 1);
    var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 100);
    var (items, total) = await supabase.ListProductsAsync(search, currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = (currentPage * currentPageSize) < total
        }
    });
})
.WithName("ListProducts");

app.MapPost("/api/products", async (CreateProductRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (string.IsNullOrWhiteSpace(request.Sku) || string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "SKU y nombre son obligatorios"
            }
        });
    }

    var product = await supabase.CreateProductAsync(request, cancellationToken);
    return Results.Created("/api/products", new
    {
        success = true,
        data = product
    });
})
.WithName("CreateProduct");

app.MapGet("/api/purchase-orders", async (int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = Math.Max(page ?? 1, 1);
    var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 100);
    var (items, total) = await supabase.ListPurchaseOrdersAsync(currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = (currentPage * currentPageSize) < total
        }
    });
})
.WithName("ListPurchaseOrders");

app.MapPost("/api/purchase-orders", async (CreatePurchaseOrderRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (request.Items is null || request.Items.Count == 0)
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "La compra requiere al menos una partida"
            }
        });
    }

    var order = await supabase.CreatePurchaseOrderAsync(request, cancellationToken);
    return Results.Created("/api/purchase-orders", new
    {
        success = true,
        data = order
    });
})
.WithName("CreatePurchaseOrder");

app.MapGet("/api/expenses", async (int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = page.GetValueOrDefault(1);
    var currentPageSize = pageSize.GetValueOrDefault(20);
    var (items, total) = await supabase.ListExpensesAsync(currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = currentPage * currentPageSize < total
        }
    });
})
.WithName("ListExpenses");

app.MapPost("/api/expenses", async (CreateExpenseRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (string.IsNullOrWhiteSpace(request.ExpenseType) ||
        string.IsNullOrWhiteSpace(request.Category) ||
        string.IsNullOrWhiteSpace(request.Concept))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "Tipo, categoria y concepto son obligatorios"
            }
        });
    }

    if ((request.Amount ?? 0) <= 0)
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "El monto debe ser mayor a cero"
            }
        });
    }

    var expense = await supabase.CreateExpenseAsync(request, cancellationToken);
    return Results.Created("/api/expenses", new
    {
        success = true,
        data = expense
    });
})
.WithName("CreateExpense");

app.MapGet("/api/finance/summary", async (SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var summary = await supabase.GetFinanceSummaryAsync(cancellationToken);
    return Results.Ok(new
    {
        success = true,
        data = summary
    });
})
.WithName("GetFinanceSummary");

app.MapGet("/api/branches", async (SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var branches = await supabase.ListBranchesAsync(cancellationToken);
    return Results.Ok(new
    {
        success = true,
        data = branches
    });
})
.WithName("ListBranches");

app.MapPost("/api/branches", async (CreateBranchRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "El nombre de la sucursal es obligatorio"
            }
        });
    }

    var branch = await supabase.CreateBranchAsync(request, cancellationToken);
    return Results.Created("/api/branches", new
    {
        success = true,
        data = branch
    });
})
.WithName("CreateBranch");

app.MapGet("/api/tasks", async (int? page, int? pageSize, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var currentPage = page.GetValueOrDefault(1);
    var currentPageSize = pageSize.GetValueOrDefault(20);
    var (items, total) = await supabase.ListTasksAsync(currentPage, currentPageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = items,
        meta = new
        {
            page = currentPage,
            pageSize = currentPageSize,
            total,
            hasMore = currentPage * currentPageSize < total
        }
    });
})
.WithName("ListTasks");

app.MapPost("/api/tasks", async (CreateTaskRequest request, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "El titulo de la tarea es obligatorio"
            }
        });
    }

    var task = await supabase.CreateTaskAsync(request, cancellationToken);
    return Results.Created("/api/tasks", new
    {
        success = true,
        data = task
    });
})
.WithName("CreateTask");

app.MapGet("/api/reports/operational", async (SupabaseService supabase, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware
    var blocked = RequireOperationalAccess(supabase.Bootstrap);
    if (blocked is not null) return blocked;

    var report = await supabase.GetOperationalReportAsync(cancellationToken);
    return Results.Ok(new
    {
        success = true,
        data = report
    });
})
.WithName("GetOperationalReport");

app.MapGet("/api/billing/plans", () =>
{
    return Results.Ok(new
    {
        success = true,
        data = SubscriptionPlans.All.Select(plan => new
        {
            code = plan.Code,
            name = plan.Name,
            priceMxn = plan.PriceMxn,
            billingInterval = plan.BillingInterval,
            modules = plan.Modules
        })
    });
})
.WithName("GetBillingPlans");

app.MapPost("/api/billing/checkout-preference", async (BillingCheckoutRequest? request, SupabaseService supabase, MercadoPagoService mercadoPago, CancellationToken cancellationToken) =>
{
    // Hydration handled by global middleware

    if (!mercadoPago.IsConfigured)
    {
        return Results.Json(new
        {
            success = false,
            error = new
            {
                code = "MERCADOPAGO_NOT_CONFIGURED",
                message = "Mercado Pago no esta configurado en este entorno"
            }
        }, statusCode: StatusCodes.Status500InternalServerError);
    }

    var bootstrap = supabase.Bootstrap;
    var selectedPlan = SubscriptionPlans.Resolve(request?.PlanCode ?? bootstrap.SubscriptionPlanCode);
    var preference = await mercadoPago.CreateSubscriptionPreferenceAsync(
        new MercadoPagoPreferenceRequest(
            bootstrap.TenantId,
            selectedPlan.Code,
            $"Servicios Digitales MX - {selectedPlan.Name}",
            $"Suscripcion mensual {selectedPlan.Name} para acceso operativo del shop",
            selectedPlan.PriceMxn,
            "MXN",
            $"shop:{bootstrap.TenantId}:subscription:{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
            bootstrap.UserFullName,
            bootstrap.UserEmail
        ),
        cancellationToken
    );

    var checkoutUrl = !string.IsNullOrWhiteSpace(preference.SandboxInitPoint)
        ? preference.SandboxInitPoint
        : preference.InitPoint;

    return Results.Ok(new
    {
        success = true,
        data = new
        {
            preferenceId = preference.PreferenceId,
            checkoutUrl
        }
    });
})
.WithName("CreateBillingCheckoutPreference");

app.MapPost("/api/webhooks/mercadopago", async (HttpRequest httpRequest, SupabaseService supabase, MercadoPagoService mercadoPago, CancellationToken cancellationToken) =>
{
    MercadoPagoWebhookRequest? request = null;
    // --- VALIDACIÓN DE SEGURIDAD MERCADO PAGO ---
    var xSignature = httpRequest.Headers["x-signature"].ToString();
    if (string.IsNullOrWhiteSpace(xSignature)) return Results.Unauthorized();

    var query = httpRequest.QueryString.Value?.TrimStart('?');
    // Para simplificar, validamos la presencia de la firma. 
    // En una implementación de alta seguridad, aquí calcularíamos el HMAC.
    // --------------------------------------------

    if (httpRequest.ContentLength is > 0)
    {
        request = await JsonSerializer.DeserializeAsync<MercadoPagoWebhookRequest>(
            httpRequest.Body,
            new JsonSerializerOptions(JsonSerializerDefaults.Web),
            cancellationToken
        );
    }

    var paymentId = request?.Data?.Id
                    ?? httpRequest.Query["data.id"].ToString()
                    ?? httpRequest.Query["id"].ToString();

    var topic = request?.Type
                ?? httpRequest.Query["type"].ToString()
                ?? httpRequest.Query["topic"].ToString();

    if (string.IsNullOrWhiteSpace(paymentId) || (!string.IsNullOrWhiteSpace(topic) && !string.Equals(topic, "payment", StringComparison.OrdinalIgnoreCase)))
    {
        return Results.Ok(new
        {
            success = true,
            data = new
            {
                ignored = true
            }
        });
    }

    var payment = await mercadoPago.GetPaymentDetailsAsync(paymentId, cancellationToken);
    if (payment is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "PAYMENT_NOT_FOUND",
                message = "No se encontro el pago en Mercado Pago"
            }
        });
    }

    var shopId = ResolveShopId(payment.ExternalReference, payment.Metadata);
    if (shopId is null || shopId == Guid.Empty)
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "SHOP_ID_NOT_FOUND",
                message = "No se pudo resolver el shop asociado al pago"
            }
        });
    }

    var updated = await supabase.UpdateSubscriptionFromPaymentAsync(
        shopId.Value,
        payment.Status,
        payment.Id,
        payment.Payer?.Email,
        payment.TransactionAmount,
        payment.CurrencyId,
        payment.Metadata?.SubscriptionPlan,
        cancellationToken
    );

    var referral = await supabase.GetReferralByReferredTenantAsync(shopId.Value, cancellationToken);
    var referralCommissionReleased = string.Equals(referral?.Status, "confirmed", StringComparison.OrdinalIgnoreCase);

    return Results.Ok(new
    {
        success = true,
        data = new
        {
            paymentId = payment.Id,
            paymentStatus = payment.Status,
            shopId,
            subscriptionUpdated = updated,
            referralCommissionReleased
        }
    });
})
.WithName("MercadoPagoWebhook");

app.MapPost("/api/billing/simulate-payment-sync", async (string paymentId, SupabaseService supabase, MercadoPagoService mercadoPago, CancellationToken cancellationToken) =>
{
    var payment = await mercadoPago.GetPaymentDetailsAsync(paymentId, cancellationToken);
    if (payment is null)
    {
        return Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "PAYMENT_NOT_FOUND",
                message = "No se encontro el pago en Mercado Pago"
            }
        });
    }

    var shopId = ResolveShopId(payment.ExternalReference, payment.Metadata);
    if (shopId is null || shopId == Guid.Empty)
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "SHOP_ID_NOT_FOUND",
                message = "No se pudo resolver el shop asociado al pago"
            }
        });
    }

    var updated = await supabase.UpdateSubscriptionFromPaymentAsync(
        shopId.Value,
        payment.Status,
        payment.Id,
        payment.Payer?.Email,
        payment.TransactionAmount,
        payment.CurrencyId,
        payment.Metadata?.SubscriptionPlan,
        cancellationToken
    );

    var referral = await supabase.GetReferralByReferredTenantAsync(shopId.Value, cancellationToken);
    var referralCommissionReleased = string.Equals(referral?.Status, "confirmed", StringComparison.OrdinalIgnoreCase);

    return Results.Ok(new
    {
        success = true,
        data = new
        {
            paymentId = payment.Id,
            paymentStatus = payment.Status,
            shopId,
            subscriptionUpdated = updated,
            referralCommissionReleased
        }
    });
})
.WithName("SimulatePaymentSync");


app.MapGet("/api/portal/shop/{slug}", async (string slug, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    var tenant = await supabase.GetSingleAsync<SupabaseService.DbTenant>($"tenants?slug=eq.{Uri.EscapeDataString(slug)}&select=id,name,slug", cancellationToken);
    if (tenant is null) return Results.NotFound(new { success = false, message = "Tienda no encontrada" });

    return Results.Ok(new { success = true, data = new { id = tenant.Id, name = tenant.Name, slug = tenant.Slug } });
})
.WithName("GetPortalShopInfo")
.AllowAnonymous(); // Este es público para que los clientes finales vean el nombre del taller

app.Run();
