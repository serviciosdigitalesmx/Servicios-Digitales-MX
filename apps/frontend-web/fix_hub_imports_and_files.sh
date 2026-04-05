#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
cd "$BASE"

echo "===== VERIFICANDO tsconfig ====="
if [ -f "./tsconfig.json" ]; then
  cat ./tsconfig.json
else
  echo "No existe tsconfig.json"
fi
echo

echo "===== CREANDO CARPETA HUB ====="
mkdir -p ./src/components/hub
mkdir -p "./src/app/(dashboard)/hub"
echo

cat > ./src/components/hub/Sidebar.tsx <<'TSX'
"use client";

import React from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Cpu,
  Inbox,
  Archive,
  Users,
  Package,
  Receipt,
  ShoppingCart,
  BarChart3,
  DollarSign,
  ShieldCheck,
  Power,
  Zap
} from "lucide-react";

const navGroups = [
  {
    label: "General",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operaciones",
    items: [
      { id: "recepcion", label: "Recepción", icon: ClipboardList },
      { id: "taller", label: "Taller Técnico", icon: Cpu },
      { id: "solicitudes", label: "Solicitudes", icon: Inbox },
      { id: "archivo", label: "Archivo Histórico", icon: Archive },
    ],
  },
  {
    label: "Administración",
    items: [
      { id: "clientes", label: "Clientes", icon: Users },
      { id: "inventario", label: "Inventario", icon: Package },
      { id: "gastos", label: "Gastos & Pagos", icon: Receipt },
      { id: "compras", label: "Compras", icon: ShoppingCart },
    ],
  },
  {
    label: "Analítica & Sistema",
    items: [
      { id: "reportes", label: "Reportes Hub", icon: BarChart3 },
      { id: "finanzas", label: "Finanzas", icon: DollarSign },
      { id: "seguridad", label: "Seguridad", icon: ShieldCheck },
    ],
  },
];

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: { name: string; role: string };
};

export default function Sidebar({ activeTab, onTabChange, user }: Props) {
  return (
    <aside className="w-64 bg-black/60 border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-40 backdrop-blur-3xl">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-xl flex items-center justify-center text-[var(--accent-blue)] shadow-lg shadow-blue-500/10">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="font-jakarta font-extrabold text-xl tracking-tight text-white">
          SrFix<span className="text-[var(--accent-blue)]">Hub</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      active
                        ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/20"
                        : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-white" : "text-[var(--text-secondary)] group-hover:text-white"}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shadow-inner">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate text-white">{user?.name || "Admin"}</div>
            <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
              {user?.role || "Moderador"}
            </div>
          </div>
          <button className="text-[var(--text-secondary)] hover:text-red-500 transition-colors">
            <Power size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
TSX

cat > ./src/components/hub/Dashboard.tsx <<'TSX'
"use client";

import React, { useEffect, useState } from "react";
import {
  Laptop,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCcw,
  Bell,
  Activity,
  AlertTriangle,
} from "lucide-react";

const stats = [
  { label: "Equipos en taller", value: "14", icon: Laptop, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Pendientes de firma", value: "6", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Listos para entrega", value: "9", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Ingreso mensual", value: "$28,450", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 space-y-8">
      <header className="flex justify-between items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
        <h1 className="text-2xl font-jakarta font-extrabold text-white">Dashboard Principal</h1>
        <div className="flex items-center gap-4">
          <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-secondary)] outline-none focus:border-[var(--accent-blue)] transition-all cursor-pointer">
            <option>Todas las sucursales</option>
          </select>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white transition-colors shadow-inner">
              <Bell size={20} />
            </button>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white transition-colors shadow-inner">
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-black/40 border border-white/10 rounded-[32px] p-6 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md">
              <div className={`p-4 rounded-2xl w-fit mb-6 shadow-inner ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div className="text-3xl font-jakarta font-black text-white mb-2">
                {loading ? "..." : stat.value}
              </div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-jakarta font-bold text-white flex items-center gap-3">
              <Activity size={20} className="text-[var(--accent-blue)]" />
              Operaciones Recientes
            </h2>
            <div className="px-3 py-1 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse border border-[var(--accent-blue)]/10">
              Live
            </div>
          </div>
          <div className="p-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-1.5 h-12 bg-[var(--accent-blue)]/20 rounded-full group-hover:bg-[var(--accent-blue)] transition-colors" />
                <div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    <strong className="text-white">Orden #4922</strong> registrada por Recepción Monterrey
                  </p>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                    Hace {i * 5}m
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-jakarta font-bold text-white flex items-center gap-3">
              <AlertTriangle size={20} className="text-[var(--accent-orange)]" />
              Alertas de Stock Especial
            </h2>
          </div>
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--text-secondary)] opacity-30 shadow-inner">
              <Activity size={32} />
            </div>
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              Sincronizando inventario global...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
TSX

cat > "./src/app/(dashboard)/hub/page.tsx" <<'TSX'
"use client";

import React, { useState } from "react";
import Sidebar from "../../../components/hub/Sidebar";
import Dashboard from "../../../components/hub/Dashboard";

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

echo "===== ARCHIVOS HUB ====="
find ./src/components/hub "./src/app/(dashboard)/hub" -type f | sort
echo

echo "===== PROBANDO IMPORTS ====="
sed -n '1,40p' "./src/app/(dashboard)/hub/page.tsx"
echo

rm -rf .next
npm run dev
