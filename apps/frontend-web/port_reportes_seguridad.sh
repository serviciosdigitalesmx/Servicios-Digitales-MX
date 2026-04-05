#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
cd "$BASE"

mkdir -p ./src/components/hub

cat > ./src/components/hub/ReportsPanel.tsx <<'TSX'
"use client";

import React from "react";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ClipboardList
} from "lucide-react";

const REPORTS = [
  { id: "1", name: "Reporte de Ventas", desc: "Ingresos, tickets, conversiones", icon: TrendingUp },
  { id: "2", name: "Reporte de Taller", desc: "Órdenes, tiempos, eficiencia", icon: ClipboardList },
  { id: "3", name: "Reporte Financiero", desc: "Utilidad, flujo, gastos", icon: BarChart3 },
];

export default function ReportsPanel() {
  return (
    <div className="space-y-10 pb-12">
      <header className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Reportes & Analytics</h1>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-2">
            Exportación e inteligencia de negocio
          </p>
        </div>

        <div className="flex gap-4">
          <button className="btn-accent flex items-center gap-2 px-6 py-3">
            <Calendar size={16} /> Rango
          </button>
          <button className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-white flex items-center gap-2">
            <Download size={16} /> Exportar todo
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="bg-black/40 border border-white/10 rounded-[32px] p-8 hover:scale-[1.02] transition-all">
              <div className="p-4 bg-white/5 rounded-2xl w-fit mb-6 text-[var(--accent-blue)]">
                <Icon size={24} />
              </div>

              <h3 className="text-lg font-black text-white">{r.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{r.desc}</p>

              <button className="mt-6 w-full btn-primary flex items-center justify-center gap-2">
                <FileText size={16} /> Generar reporte
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
TSX

cat > ./src/components/hub/SecurityPanel.tsx <<'TSX'
"use client";

import React, { useState } from "react";
import {
  Shield,
  Users,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";

export default function SecurityPanel() {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-10 pb-12">
      <header className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
        <h1 className="text-3xl font-black text-white">Seguridad & Accesos</h1>
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-2">
          Control de usuarios y permisos
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-black/40 border border-white/10 rounded-[32px] p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Users size={18} /> Usuarios del sistema
          </h3>

          <div className="space-y-4">
            {["Admin", "Técnico", "Recepción"].map((role, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <span className="text-white font-bold">{role}</span>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Activo
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-[32px] p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Key size={18} /> Credenciales
          </h3>

          <div className="space-y-4">
            <input
              type="text"
              value="admin@taller.com"
              readOnly
              className="w-full input-srf"
            />

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value="Admin123!"
                readOnly
                className="w-full input-srf pr-12"
              />
              <button
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button className="btn-accent w-full flex items-center justify-center gap-2">
              <Lock size={16} /> Cambiar contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
TSX

python3 - <<'PY'
from pathlib import Path
p = Path("src/app/(dashboard)/hub/page.tsx")
text = p.read_text()

if 'import ReportsPanel' not in text:
    text = text.replace(
        'import PurchasesPanel from "../../../components/hub/PurchasesPanel";',
        'import PurchasesPanel from "../../../components/hub/PurchasesPanel";\nimport ReportsPanel from "../../../components/hub/ReportsPanel";\nimport SecurityPanel from "../../../components/hub/SecurityPanel";'
    )

text = text.replace(
    'case "reportes":\n        return <Placeholder title="Reportes" />;',
    'case "reportes":\n        return <ReportsPanel />;'
)

text = text.replace(
    'case "seguridad":\n        return <Placeholder title="Seguridad" />;',
    'case "seguridad":\n        return <SecurityPanel />;'
)

p.write_text(text)
PY

echo "===== HUB COMPLETO ====="
sed -n '1,240p' "./src/app/(dashboard)/hub/page.tsx"

rm -rf .next
npm run dev
