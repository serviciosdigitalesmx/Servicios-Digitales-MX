#!/usr/bin/env bash
set -euo pipefail

echo "===== INICIANDO DEPLOY A GITHUB ====="

# Ir a raíz del proyecto
cd "$HOME/Servicios-Digitales-MX"

# Inicializar git si no existe
if [ ! -d ".git" ]; then
  git init
fi

# Rama main
git branch -M main

# Asegurar .gitignore
if ! grep -q ".env" .gitignore 2>/dev/null; then
  echo ".env" >> .gitignore
fi

# Agregar todo
git add .

# Commit
git commit -m "🚀 sistema SrFix conectado a Supabase + módulos completos" || echo "Sin cambios nuevos"

# Conectar repo remoto
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/serviciosdigitalesmx/Servicios-Digitales-MX.git

# Push
git push -u origin main

echo "===== DEPLOY COMPLETO ====="
