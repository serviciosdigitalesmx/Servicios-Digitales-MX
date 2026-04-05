#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
TARGET="$BASE/src/app/(dashboard)/hub/page.tsx"

cat > "$TARGET" <<'TSX'
"use client";

import React, { useState } from "react";
import Sidebar from "@/components/hub/Sidebar";
import Dashboard from "@/components/hub/Dashboard";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="glass-card p-12 text-center bg-black/40 border-white/5 shadow-2xl backdrop-blur-3xl min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-3xl flex items-center justify-center text-[var(--accent-blue)] mb-8 shadow-inner">
        <span className="text-3xl">•</span>
      </div>
      <h2 className="text-3xl font-jakarta font-black text-white mb-4">{title}</h2>
      <p className="max-w-md text-[var(--text-secondary)] font-medium tracking-tight leading-relaxed">
        Este módulo se va a conectar después con Supabase y Render, pero el shell visual ya quedó montado.
      </p>
    </div>
  );
}

export default function HubPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user] = useState({ name: "Jesús Villa", role: "Administrador" });

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "recepcion":
        return <Placeholder title="Recepción" />;
      case "taller":
        return <Placeholder title="Taller Técnico" />;
      case "solicitudes":
        return <Placeholder title="Solicitudes" />;
      case "archivo":
        return <Placeholder title="Archivo Histórico" />;
      case "clientes":
        return <Placeholder title="Clientes" />;
      case "inventario":
        return <Placeholder title="Inventario" />;
      case "gastos":
        return <Placeholder title="Gastos & Pagos" />;
      case "compras":
        return <Placeholder title="Compras" />;
      case "reportes":
        return <Placeholder title="Reportes Hub" />;
      case "finanzas":
        return <Placeholder title="Finanzas" />;
      case "seguridad":
        return <Placeholder title="Seguridad" />;
      default:
        return <Placeholder title="Módulo" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#060608] text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">{renderContent()}</div>
      </main>
    </div>
  );
}
TSX

echo "===== HUB REAL REEMPLAZADO ====="
sed -n '1,260p' "$TARGET"
echo

cd "$BASE"
rm -rf .next
npm run dev
