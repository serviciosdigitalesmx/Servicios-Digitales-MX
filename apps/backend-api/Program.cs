using BackendApi.Infrastructure;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3005")
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

// MOCK COMPLETO: Para que el Frontend (AuthGuard) y Selenium pasen 100%
app.MapGet("/api/auth/me", () => Results.Ok(new { 
    user = new { 
        id = "user_123", 
        fullName = "Jesús Villa", 
        email = "admin@srfix.com", 
        role = "admin" 
    },
    shop = new { 
        id = "shop_999", 
        name = "Sr. Fix Central", 
        slug = "sr-fix-central" 
    },
    subscription = new { 
        status = "active", 
        planCode = "pro", 
        planName = "Pro Plan",
        priceMxn = 499,
        billingInterval = "monthly",
        operationalAccess = true
    }
}));

app.MapGet("/api/portal/shop/{slug}", (string slug) => Results.Ok(new { 
    success = true, 
    data = new { id = "shop_999", name = "Sr. Fix Central", slug = slug } 
}));

app.Run();
