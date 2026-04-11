using BackendApi.Domain;
using BackendApi.Infrastructure;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);
var shopBranding = new ShopBrandingState
{
    Id = "shop_999",
    Name = "Sr. Fix Central",
    Slug = "sr-fix-central",
    LegalName = "Sr. Fix Central",
    Address = "Av. Tecnológico 123, Monterrey, N.L.",
    Phone = "8110000000",
    SupportEmail = "hola@srfixcentral.mx",
    LogoUrl = null,
    PrimaryColor = "#2563EB",
    SecondaryColor = "#0F172A"
};

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:3005",
                "http://127.0.0.1:3005",
                "https://servicios-digitales-mx-frontend-web.vercel.app"
            )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.Configure<SupabaseOptions>(builder.Configuration.GetSection("Supabase"));
builder.Services.AddHttpClient();
builder.Services.AddSingleton<SupabaseBootstrapContext>(); 
builder.Services.AddScoped<SupabaseService>();

var app = builder.Build();
app.UseCors();

static async Task<IResult?> EnsureSupabaseContextAsync(SupabaseService service, CancellationToken cancellationToken)
{
    try
    {
        if (!service.IsConfigured)
        {
            return Results.Json(new
            {
                success = false,
                error = new
                {
                    code = "SUPABASE_NOT_CONFIGURED",
                    message = "Configura Supabase__Url y Supabase__ServiceKey para usar datos reales."
                }
            }, statusCode: 503);
        }

        var bootstrapped = await service.EnsureBootstrapAsync(cancellationToken: cancellationToken);
        if (!bootstrapped)
        {
            return Results.Json(new
            {
                success = false,
                error = new
                {
                    code = "SUPABASE_BOOTSTRAP_FAILED",
                    message = "No se pudo inicializar el contexto del tenant real."
                }
            }, statusCode: 503);
        }
    }
    catch (HttpRequestException exception)
    {
        return Results.Json(new
        {
            success = false,
            error = new
            {
                code = "SUPABASE_REQUEST_FAILED",
                message = exception.Message
            }
        }, statusCode: 502);
    }

    return null;
}

app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", time = DateTime.UtcNow }));

app.MapPost("/api/auth/register", () => Results.Ok(new { success = true }));

app.MapPost("/api/auth/login", ([FromBody] LoginRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new
        {
            success = false,
            message = "Debes proporcionar correo y contraseña."
        });
    }

    return Results.Ok(new
    {
        success = true,
        session = new
        {
            token = Guid.NewGuid().ToString("N"),
            email = request.Email
        }
    });
});

app.MapGet("/api/auth/me", async (SupabaseService service, CancellationToken cancellationToken) =>
{
    if (service.IsConfigured)
    {
        var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
        if (contextError is not null) return contextError;

        var bootstrap = service.Bootstrap;
        return Results.Ok(new
        {
            user = new
            {
                id = bootstrap.UserId,
                fullName = bootstrap.UserFullName,
                email = bootstrap.UserEmail,
                role = bootstrap.UserRole,
                branchId = bootstrap.BranchId
            },
            shop = new
            {
                id = bootstrap.TenantId,
                name = bootstrap.TenantName,
                slug = bootstrap.TenantSlug,
                legalName = bootstrap.TenantName,
                address = shopBranding.Address,
                phone = shopBranding.Phone,
                supportEmail = shopBranding.SupportEmail,
                logoUrl = shopBranding.LogoUrl,
                primaryColor = shopBranding.PrimaryColor,
                secondaryColor = shopBranding.SecondaryColor
            },
            subscription = new
            {
                status = bootstrap.SubscriptionStatus,
                planCode = bootstrap.SubscriptionPlanCode,
                planName = bootstrap.SubscriptionPlanName,
                priceMxn = bootstrap.SubscriptionPriceMxn,
                billingInterval = bootstrap.BillingInterval,
                operationalAccess = bootstrap.HasOperationalAccess,
                currentPeriodStart = bootstrap.CurrentPeriodStart,
                currentPeriodEnd = bootstrap.CurrentPeriodEnd,
                graceUntil = bootstrap.GraceUntil
            }
        });
    }

    return Results.Ok(new
    {
        user = new
        {
            id = "user_123",
            fullName = "Jesús Villa",
            email = "admin@srfix.com",
            role = "admin",
            branchId = (string?)null
        },
        shop = new
        {
            id = shopBranding.Id,
            name = shopBranding.Name,
            slug = shopBranding.Slug,
            legalName = shopBranding.LegalName,
            address = shopBranding.Address,
            phone = shopBranding.Phone,
            supportEmail = shopBranding.SupportEmail,
            logoUrl = shopBranding.LogoUrl,
            primaryColor = shopBranding.PrimaryColor,
            secondaryColor = shopBranding.SecondaryColor
        },
        subscription = new
        {
            status = "active",
            planCode = "integral-550",
            planName = "Plan Integral",
            priceMxn = 550,
            billingInterval = "monthly",
            operationalAccess = true
        }
    });
});

app.MapGet("/api/service-orders", async (
    [FromQuery] string? status,
    [FromQuery] Guid? branchId,
    [FromQuery] string? search,
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListServiceOrdersAsync(status, branchId, search, safePage, safePageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = result.Items,
        meta = new
        {
            page = safePage,
            pageSize = safePageSize,
            total = result.Total
        }
    });
});

app.MapPost("/api/service-orders", async ([FromBody] CreateServiceOrderRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    if (request.BranchId == Guid.Empty || request.CustomerId == Guid.Empty || string.IsNullOrWhiteSpace(request.DeviceType) || string.IsNullOrWhiteSpace(request.ReportedIssue))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "INVALID_SERVICE_ORDER",
                message = "Sucursal, cliente, equipo y falla reportada son obligatorios."
            }
        });
    }

    if (!await service.CustomerExistsAsync(request.CustomerId, cancellationToken))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "CUSTOMER_NOT_FOUND",
                message = "El cliente seleccionado no existe dentro del tenant actual."
            }
        });
    }

    var order = await service.CreateServiceOrderAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = order });
});

app.MapGet("/api/service-requests", async (
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListServiceRequestsAsync(safePage, safePageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = result.Items,
        meta = new
        {
            page = safePage,
            pageSize = safePageSize,
            total = result.Total
        }
    });
});

app.MapPost("/api/service-requests", async ([FromBody] CreateServiceRequestRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    if (string.IsNullOrWhiteSpace(request.CustomerName) || string.IsNullOrWhiteSpace(request.DeviceType))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "INVALID_SERVICE_REQUEST",
                message = "Prospecto y equipo son obligatorios."
            }
        });
    }

    var item = await service.CreateServiceRequestAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = item });
});

app.MapPatch("/api/service-requests/{requestId:guid}/status", async (Guid requestId, [FromBody] UpdateServiceRequestStatusRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    if (string.IsNullOrWhiteSpace(request.Status))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "INVALID_SERVICE_REQUEST_STATUS",
                message = "Debes enviar un estatus válido."
            }
        });
    }

    var updated = await service.UpdateServiceRequestStatusAsync(requestId, request.Status, cancellationToken);
    return updated is null
        ? Results.NotFound(new
        {
            success = false,
            error = new
            {
                code = "SERVICE_REQUEST_NOT_FOUND",
                message = "La solicitud no existe o no pertenece al tenant actual."
            }
        })
        : Results.Ok(new { success = true, data = updated });
});

app.MapGet("/api/suppliers", async (SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    var items = await service.ListSuppliersAsync(cancellationToken);
    return Results.Ok(new { success = true, data = items });
});

app.MapPost("/api/suppliers", async ([FromBody] CreateSupplierRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    if (string.IsNullOrWhiteSpace(request.BusinessName))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "INVALID_SUPPLIER",
                message = "El nombre comercial del proveedor es obligatorio."
            }
        });
    }

    var supplier = await service.CreateSupplierAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = supplier });
});

app.MapGet("/api/products", async (
    [FromQuery] string? search,
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListProductsAsync(search, safePage, safePageSize, cancellationToken);

    return Results.Ok(new
    {
        success = true,
        data = result.Items,
        meta = new
        {
            page = safePage,
            pageSize = safePageSize,
            total = result.Total
        }
    });
});

app.MapPost("/api/products", async ([FromBody] CreateProductRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    if (string.IsNullOrWhiteSpace(request.Sku) || string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "INVALID_PRODUCT",
                message = "SKU y nombre son obligatorios para crear un producto."
            }
        });
    }

    var product = await service.CreateProductAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = product });
});

app.MapGet("/api/customers", async (
    [FromQuery] string? search,
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;

    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListCustomersAsync(search, safePage, safePageSize, cancellationToken);
    return Results.Ok(new { success = true, data = result.Items, meta = new { page = safePage, pageSize = safePageSize, total = result.Total } });
});

app.MapPost("/api/customers", async ([FromBody] CreateCustomerRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    if (string.IsNullOrWhiteSpace(request.FullName))
    {
        return Results.BadRequest(new { success = false, error = new { code = "INVALID_CUSTOMER", message = "El nombre del cliente es obligatorio." } });
    }

    var customer = await service.CreateCustomerAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = customer });
});

app.MapGet("/api/purchase-orders", async (
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListPurchaseOrdersAsync(safePage, safePageSize, cancellationToken);
    return Results.Ok(new { success = true, data = result.Items, meta = new { page = safePage, pageSize = safePageSize, total = result.Total } });
});

app.MapPost("/api/purchase-orders", async ([FromBody] CreatePurchaseOrderRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    if (request.Items is null || request.Items.Count == 0)
    {
        return Results.BadRequest(new { success = false, error = new { code = "INVALID_PURCHASE_ORDER", message = "Debes agregar al menos un item a la orden de compra." } });
    }

    var order = await service.CreatePurchaseOrderAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = order });
});

app.MapGet("/api/expenses", async (
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListExpensesAsync(safePage, safePageSize, cancellationToken);
    return Results.Ok(new { success = true, data = result.Items, meta = new { page = safePage, pageSize = safePageSize, total = result.Total } });
});

app.MapPost("/api/expenses", async ([FromBody] CreateExpenseRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    if (string.IsNullOrWhiteSpace(request.Concept))
    {
        return Results.BadRequest(new { success = false, error = new { code = "INVALID_EXPENSE", message = "El concepto del gasto es obligatorio." } });
    }

    var expense = await service.CreateExpenseAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = expense });
});

app.MapGet("/api/tasks", async (
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListTasksAsync(safePage, safePageSize, cancellationToken);
    return Results.Ok(new { success = true, data = result.Items, meta = new { page = safePage, pageSize = safePageSize, total = result.Total } });
});

app.MapPost("/api/tasks", async ([FromBody] CreateTaskRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { success = false, error = new { code = "INVALID_TASK", message = "El título de la tarea es obligatorio." } });
    }

    var task = await service.CreateTaskAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = task });
});

app.MapGet("/api/branches", async (SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var items = await service.ListBranchesAsync(cancellationToken);
    return Results.Ok(new { success = true, data = items });
});

app.MapPost("/api/branches", async ([FromBody] CreateBranchRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { success = false, error = new { code = "INVALID_BRANCH", message = "El nombre de la sucursal es obligatorio." } });
    }

    var branch = await service.CreateBranchAsync(request, cancellationToken);
    return Results.Ok(new { success = true, data = branch });
});

app.MapGet("/api/archive/service-orders", async (
    [FromQuery] int? page,
    [FromQuery] int? pageSize,
    SupabaseService service,
    CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var safePage = !page.HasValue || page.Value <= 0 ? 1 : page.Value;
    var safePageSize = !pageSize.HasValue || pageSize.Value <= 0 ? 100 : Math.Min(pageSize.Value, 250);
    var result = await service.ListArchivedOrdersAsync(safePage, safePageSize, cancellationToken);
    return Results.Ok(new { success = true, data = result.Items, meta = new { page = safePage, pageSize = safePageSize, total = result.Total } });
});

app.MapGet("/api/technician/queue", async (SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var result = await service.GetTechnicianQueueAsync(cancellationToken);
    return Results.Ok(new { success = true, data = new { orders = result.Orders, tasks = result.Tasks } });
});

app.MapPatch("/api/service-orders/{orderId:guid}/technician", async (Guid orderId, [FromBody] UpdateTechnicianOrderRequest request, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var result = await service.UpdateTechnicianOrderAsync(orderId, request, cancellationToken);
    return result is null
        ? Results.NotFound(new { success = false, error = new { code = "ORDER_NOT_FOUND", message = "No se encontró la orden técnica." } })
        : Results.Ok(new { success = true, data = result });
});

app.MapGet("/api/finance/summary", async (SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var result = await service.GetFinanceSummaryAsync(cancellationToken);
    return Results.Ok(new { success = true, data = result });
});

app.MapGet("/api/reports/operational", async ([FromQuery] int? rangeDays, SupabaseService service, CancellationToken cancellationToken) =>
{
    var contextError = await EnsureSupabaseContextAsync(service, cancellationToken);
    if (contextError is not null) return contextError;
    var result = await service.GetOperationalReportAsync(rangeDays, cancellationToken);
    return Results.Ok(new { success = true, data = result });
});

app.MapGet("/api/shop/settings", () => Results.Ok(new
{
    success = true,
    data = shopBranding
}));

app.MapPut("/api/shop/settings", ([FromBody] UpdateShopBrandingRequest request) =>
{
    shopBranding = shopBranding with
    {
        Name = string.IsNullOrWhiteSpace(request.Name) ? shopBranding.Name : request.Name.Trim(),
        LegalName = string.IsNullOrWhiteSpace(request.LegalName) ? shopBranding.LegalName : request.LegalName.Trim(),
        Address = request.Address?.Trim(),
        Phone = request.Phone?.Trim(),
        SupportEmail = request.SupportEmail?.Trim(),
        LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim(),
        PrimaryColor = string.IsNullOrWhiteSpace(request.PrimaryColor) ? shopBranding.PrimaryColor : request.PrimaryColor.Trim(),
        SecondaryColor = string.IsNullOrWhiteSpace(request.SecondaryColor) ? shopBranding.SecondaryColor : request.SecondaryColor.Trim()
    };

    return Results.Ok(new
    {
        success = true,
        data = shopBranding
    });
});

app.MapGet("/api/portal/shop/{slug}", (string slug) => Results.Ok(new { 
    success = true, 
    data = new {
        id = shopBranding.Id,
        name = shopBranding.Name,
        slug = slug,
        legalName = shopBranding.LegalName,
        address = shopBranding.Address,
        phone = shopBranding.Phone,
        supportEmail = shopBranding.SupportEmail,
        logoUrl = shopBranding.LogoUrl,
        primaryColor = shopBranding.PrimaryColor,
        secondaryColor = shopBranding.SecondaryColor
    } 
}));

app.MapGet("/api/portal/orders/{folio}", (string folio) =>
{
    var normalized = (folio ?? string.Empty).Trim().ToUpperInvariant();
    if (string.IsNullOrWhiteSpace(normalized))
    {
        return Results.BadRequest(new
        {
            success = false,
            error = new
            {
                code = "INVALID_FOLIO",
                message = "Debes proporcionar un folio válido."
            }
        });
    }

    var steps = new[] { "recibido", "diagnostico", "reparacion", "listo" };
    var currentStatus = steps[Math.Abs(normalized.GetHashCode()) % steps.Length];

    return Results.Ok(new
    {
        success = true,
        data = new
        {
            folio = normalized,
            status = currentStatus,
            deviceType = "Laptop",
            deviceBrand = "Dell",
            deviceModel = "Inspiron 15",
            reportedIssue = "No enciende y presenta fallo intermitente de carga.",
            promisedDate = DateTime.UtcNow.AddDays(2).ToString("yyyy-MM-dd"),
            progressPhotos = Array.Empty<string>(),
            resolution = currentStatus == "listo"
                ? "El equipo ya pasó pruebas y está listo para entrega."
                : null,
            updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    });
});

app.Run();

public record UpdateShopBrandingRequest(
    string? Name,
    string? LegalName,
    string? Address,
    string? Phone,
    string? SupportEmail,
    string? LogoUrl,
    string? PrimaryColor,
    string? SecondaryColor
);
public record ShopBrandingState
{
    public string Id { get; init; } = "shop_999";
    public string Name { get; init; } = "Sr. Fix Central";
    public string Slug { get; init; } = "sr-fix-central";
    public string LegalName { get; init; } = "Sr. Fix Central";
    public string? Address { get; init; }
    public string? Phone { get; init; }
    public string? SupportEmail { get; init; }
    public string? LogoUrl { get; init; }
    public string PrimaryColor { get; init; } = "#2563EB";
    public string SecondaryColor { get; init; } = "#0F172A";
}
