using BackendApi.Infrastructure;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURACIÓN DE SERVICIOS
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3005")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// REGISTRO DE DEPENDENCIAS CRÍTICAS
builder.Services.AddHttpClient();
// Registramos un Singleton vacío de SupabaseBootstrapContext para que SupabaseService no truene
builder.Services.AddSingleton<SupabaseBootstrapContext>(); 
builder.Services.AddScoped<SupabaseService>();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseCors();

// 2. ENDPOINTS
app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", time = DateTime.UtcNow }));

app.MapGet("/api/portal/shop/{slug}", (string slug) => {
    return Results.Ok(new { success = true, data = new { id = "123", name = "Taller Centro", slug = slug } });
});

app.MapPost("/api/webhooks/mercadopago", () => Results.Ok(new { received = true }));

app.Run();
