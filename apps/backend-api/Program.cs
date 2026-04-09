using BackendApi.Domain;
using BackendApi.Infrastructure;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
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

builder.Services.AddHttpClient();
builder.Services.AddSingleton<SupabaseBootstrapContext>();
builder.Services.AddScoped<SupabaseService>();

var app = builder.Build();
app.UseCors();

IResult OkEnvelope(object data) => Results.Ok(new { success = true, data });

IResult ErrorEnvelope(int statusCode, string code, string message)
{
    return Results.Json(
        new
        {
            success = false,
            error = new
            {
                code,
                message
            }
        },
        statusCode: statusCode
    );
}

app.MapGet("/api/health", () =>
    Results.Ok(new
    {
        status = "Healthy",
        time = DateTime.UtcNow
    })
);

app.MapPost("/api/auth/register", () =>
    ErrorEnvelope(
        501,
        "REGISTER_NOT_IMPLEMENTED",
        "El registro real todavía no está conectado en Program.cs. Usa el flujo principal del servicio."
    )
);

app.MapPost("/api/auth/login", ([FromBody] LoginRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return ErrorEnvelope(
            400,
            "INVALID_LOGIN_PAYLOAD",
            "Debes proporcionar correo y contraseña."
        );
    }

    return ErrorEnvelope(
        501,
        "LOGIN_NOT_IMPLEMENTED",
        "El login real todavía no está conectado en Program.cs. Usa el flujo principal del servicio."
    );
});

app.MapGet("/api/auth/me", async (SupabaseService supabase, CancellationToken cancellationToken) =>
{
    if (!supabase.IsConfigured || supabase.Bootstrap.TenantId == Guid.Empty || supabase.Bootstrap.UserId == Guid.Empty)
    {
        return ErrorEnvelope(
            503,
            "SUPABASE_NOT_READY",
            "El contexto de Supabase no está listo para auth/me."
        );
    }

    await supabase.RefreshSubscriptionContextAsync(cancellationToken);
    var latestPayment = await supabase.GetLatestSubscriptionPaymentAsync(supabase.Bootstrap.TenantId, cancellationToken);

    return OkEnvelope(new
    {
        user = new
        {
            id = supabase.Bootstrap.UserId,
            fullName = supabase.Bootstrap.UserFullName,
            email = supabase.Bootstrap.UserEmail,
            role = supabase.Bootstrap.UserRole,
            branchId = supabase.Bootstrap.BranchId == Guid.Empty ? (Guid?)null : supabase.Bootstrap.BranchId
        },
        shop = new
        {
            id = supabase.Bootstrap.TenantId,
            name = supabase.Bootstrap.TenantName,
            slug = supabase.Bootstrap.TenantSlug,
            legalName = supabase.Bootstrap.TenantName,
            address = (string?)null,
            phone = (string?)null,
            supportEmail = supabase.Bootstrap.UserEmail,
            logoUrl = (string?)null,
            primaryColor = "#2563EB",
            secondaryColor = "#0F172A"
        },
        subscription = new
        {
            status = supabase.Bootstrap.SubscriptionStatus,
            planCode = supabase.Bootstrap.SubscriptionPlanCode,
            planName = supabase.Bootstrap.SubscriptionPlanName,
            priceMxn = supabase.Bootstrap.SubscriptionPriceMxn,
            billingInterval = supabase.Bootstrap.BillingInterval,
            operationalAccess = supabase.Bootstrap.HasOperationalAccess,
            currentPeriodStart = supabase.Bootstrap.CurrentPeriodStart,
            currentPeriodEnd = supabase.Bootstrap.CurrentPeriodEnd,
            graceUntil = supabase.Bootstrap.GraceUntil
        },
        lastPayment = latestPayment is null ? null : new
        {
            latestPayment.Id,
            latestPayment.Provider,
            latestPayment.ProviderPaymentId,
            latestPayment.ProviderPaymentStatus,
            latestPayment.Amount,
            latestPayment.CurrencyId,
            latestPayment.PayerEmail,
            latestPayment.PaidAt,
            latestPayment.CreatedAt
        }
    });
});

app.MapGet("/api/shop/settings", (SupabaseService supabase) =>
{
    if (!supabase.IsConfigured || supabase.Bootstrap.TenantId == Guid.Empty)
    {
        return ErrorEnvelope(
            503,
            "SUPABASE_NOT_READY",
            "El contexto de Supabase no está listo para branding."
        );
    }

    return OkEnvelope(new
    {
        id = supabase.Bootstrap.TenantId,
        name = string.IsNullOrWhiteSpace(supabase.Bootstrap.TenantName) ? "Servicios Digitales MX" : supabase.Bootstrap.TenantName,
        slug = supabase.Bootstrap.TenantSlug,
        legalName = supabase.Bootstrap.TenantName,
        address = (string?)null,
        phone = (string?)null,
        supportEmail = supabase.Bootstrap.UserEmail,
        logoUrl = (string?)null,
        primaryColor = "#2563EB",
        secondaryColor = "#0F172A"
    });
});

app.MapPut("/api/shop/settings", () =>
    ErrorEnvelope(
        501,
        "SHOP_SETTINGS_UPDATE_NOT_IMPLEMENTED",
        "La actualización real de branding todavía no está conectada en Program.cs."
    )
);

app.MapGet("/api/portal/shop/{slug}", (string slug, SupabaseService supabase) =>
{
    if (!supabase.IsConfigured || supabase.Bootstrap.TenantId == Guid.Empty)
    {
        return ErrorEnvelope(
            503,
            "SUPABASE_NOT_READY",
            "El contexto de Supabase no está listo para el portal."
        );
    }

    return OkEnvelope(new
    {
        id = supabase.Bootstrap.TenantId,
        name = string.IsNullOrWhiteSpace(supabase.Bootstrap.TenantName) ? "Servicios Digitales MX" : supabase.Bootstrap.TenantName,
        slug = string.IsNullOrWhiteSpace(supabase.Bootstrap.TenantSlug) ? slug : supabase.Bootstrap.TenantSlug,
        legalName = supabase.Bootstrap.TenantName,
        address = (string?)null,
        phone = (string?)null,
        supportEmail = supabase.Bootstrap.UserEmail,
        logoUrl = (string?)null,
        primaryColor = "#2563EB",
        secondaryColor = "#0F172A"
    });
});

app.MapGet("/api/portal/orders/{folio}", async (string folio, SupabaseService supabase, CancellationToken cancellationToken) =>
{
    var normalized = (folio ?? string.Empty).Trim().ToUpperInvariant();

    if (string.IsNullOrWhiteSpace(normalized))
    {
        return ErrorEnvelope(
            400,
            "INVALID_FOLIO",
            "Debes proporcionar un folio válido."
        );
    }

    if (!supabase.IsConfigured || supabase.Bootstrap.TenantId == Guid.Empty)
    {
        return ErrorEnvelope(
            503,
            "SUPABASE_NOT_READY",
            "El contexto de Supabase no está listo para tracking."
        );
    }

    var order = await supabase.GetServiceOrderByFolioAsync(normalized, cancellationToken);
    if (order is null)
    {
        return ErrorEnvelope(
            404,
            "ORDER_NOT_FOUND",
            "No se encontró una orden con ese folio."
        );
    }

    var timeline = new object[]
    {
        new
        {
            label = "Equipo recibido",
            status = "completed",
            date = order.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            note = "La orden fue registrada correctamente."
        },
        new
        {
            label = "Diagnóstico",
            status = order.Status is "diagnostico" or "reparacion" or "listo" or "entregado" ? "completed" : "pending",
            date = (string?)null,
            note = "Diagnóstico técnico en proceso o concluido."
        },
        new
        {
            label = "Reparación",
            status = order.Status is "reparacion" or "listo" or "entregado" ? "completed" : "pending",
            date = (string?)null,
            note = "Trabajo correctivo sobre el equipo."
        },
        new
        {
            label = "Listo para entrega",
            status = order.Status is "listo" or "entregado" ? "completed" : "pending",
            date = (string?)null,
            note = order.Status is "listo" or "entregado"
                ? "El equipo está listo para entrega."
                : "Aún no está listo para entrega."
        }
    };

    return OkEnvelope(new
    {
        folio = order.Folio,
        status = order.Status,
        deviceType = order.DeviceType,
        deviceBrand = order.DeviceBrand,
        deviceModel = order.DeviceModel,
        reportedIssue = order.ReportedIssue,
        promisedDate = order.PromisedDate?.ToString("yyyy-MM-dd"),
        progressPhotos = Array.Empty<string>(),
        timeline,
        resolution = order.CasoResolucionTecnica,
        updatedAt = order.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
    });
});

app.Run();
