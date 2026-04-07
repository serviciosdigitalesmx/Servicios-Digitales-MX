path = 'apps/backend-api/Program.cs'
with open(path, 'r') as f: content = f.read()

# Corregimos el MapGet de health para usar un scope manual
old_health = 'app.MapGet("/api/health", (SupabaseBootstrapContext db) =>'
new_health = 'app.MapGet("/api/health", (IServiceProvider sp) => { using var scope = sp.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<SupabaseService>();'

content = content.replace(old_health, new_health)
with open(path, 'w') as f: f.write(content)
