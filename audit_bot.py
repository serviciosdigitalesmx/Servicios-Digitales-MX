import os

def check_security():
    bad_seeds = ["Admin123!", "/api/health", "EnsureBootstrapDataAsync"]
    found = []
    
    for root, _, files in os.walk("."):
        if any(x in root for x in ["node_modules", ".next", "bin", "obj"]): continue
        for file in files:
            if file.endswith((".cs", ".tsx", ".ts")):
                path = os.path.join(root, file)
                with open(path, "r", errors="ignore") as f:
                    content = f.read()
                    # Si detectamos la contraseña o el llamado en Program.cs
                    if "Admin123!" in content and "//" not in content:
                        found.append(f"Hardcoded Password en: {path}")
                    if "Program.cs" in file and "EnsureBootstrap" in content:
                        found.append(f"Mutación activa en Startup/Health: {path}")

    if not found:
        print("✅ TODO LIMPIO: No se detectaron las cagadas de seguridad.")
    else:
        print("⚠️ ALERTA: Se encontraron riesgos:")
        for item in found: print(f"  - {item}")

if __name__ == "__main__":
    check_security()
