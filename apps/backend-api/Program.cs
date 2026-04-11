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

builder.Services.AddHttpClient();
builder.Services.AddSingleton<SupabaseBootstrapContext>(); 
builder.Services.AddScoped<SupabaseService>();

var app = builder.Build();
app.UseCors();

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
            accessToken = Guid.NewGuid().ToString("N"),
            email = request.Email
        }
    });
});

app.MapGet("/api/auth/me", () => Results.Ok(new {
    user = new {
        id = "",
        fullName = "",
        email = "",
        role = ""
    },
    shop = new {
        id = "",
        name = "",
        slug = "",
        legalName = "",
        address = "",
        phone = "",
        supportEmail = "",
        logoUrl = (string?)null,
        primaryColor = "",
        secondaryColor = ""
    },
    subscription = new {
        status = "",
        planCode = "",
        planName = "",
        priceMxn = 0,
        billingInterval = "",
        operationalAccess = false
    }
}));

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

public record LoginRequest(string Email, string Password);
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
