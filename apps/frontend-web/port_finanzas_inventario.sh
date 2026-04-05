#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
cd "$BASE"

mkdir -p ./src/components/hub

cat > ./src/components/hub/FinancePanel.tsx <<'TSX'
"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  BarChart3,
  Calendar,
  Wallet,
  PieChart,
  RefreshCcw,
  FileText,
  Target,
  Layers,
  ArrowRight
} from "lucide-react";

const MOCK_STATS = {
  ingresos: 45200,
  egresos: 12800,
  utilidad: 32400,
  ticketPromedio: 1850,
  ordenesEntregadas: 24,
  cotizacionesConvertidas: 18,
  cxc: 5400,
  anticipos: 3200,
};

const MOCK_MONTHLY = [
  { mes: "Abril 2026", ingresos: 45200, egresos: 12800, utilidad: 32400 },
  { mes: "Marzo 2026", ingresos: 38900, egresos: 15400, utilidad: 23500 },
  { mes: "Febrero 2026", ingresos: 41200, egresos: 12900, utilidad: 28300 },
];

const MOCK_CATEGORIES = [
  { name: "Pantallas", total: 18400, color: "bg-blue-500" },
  { name: "Baterías", total: 6200, color: "bg-purple-500" },
  { name: "Labor de Técnico", total: 12500, color: "bg-green-500" },
  { name: "Accesorios", total: 8100, color: "bg-orange-500" },
];

export default function FinancePanel() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "2026-04-01", to: "2026-04-30" });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl gap-6">
        <div>
          <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Análisis Financiero Hub</h1>
          <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-[0.3em] mt-1">
            Inteligencia de negocio y rentabilidad
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 px-4">
              <Calendar size={18} className="text-[var(--accent-blue)]" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="bg-transparent text-sm font-bold text-white outline-none"
              />
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-3 px-4">
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="bg-transparent text-sm font-bold text-white outline-none"
              />
            </div>
          </div>

          <button className="bg-white/5 hover:bg-white/10 p-3.5 rounded-2xl border border-white/10 text-[var(--text-secondary)] hover:text-white transition-all shadow-inner">
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Ingresos Totales", value: MOCK_STATS.ingresos, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Egresos / Gastos", value: MOCK_STATS.egresos, icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Utilidad Bruta", value: MOCK_STATS.utilidad, icon: DollarSign, color: "text-[var(--accent-blue)]", bg: "bg-[var(--accent-blue)]/10" },
          { label: "Utilidad Neta (%)", value: `${((MOCK_STATS.utilidad / MOCK_STATS.ingresos) * 100).toFixed(1)}%`, icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10", noCurrency: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-8 border-white/5 relative group overflow-hidden">
              <div className={`p-4 rounded-2xl w-fit mb-6 ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div className="text-3xl font-jakarta font-black text-white mb-1">
                {loading ? "---" : stat.noCurrency ? stat.value : `$${stat.value.toLocaleString()}`}
              </div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                {stat.label}
              </div>
              <div className={`absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform ${stat.color}`}>
                <Icon size={120} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Ticket Promedio", value: `$${MOCK_STATS.ticketPromedio}`, icon: CircleDollarSign },
          { label: "Entregadas", value: MOCK_STATS.ordenesEntregadas, icon: Target },
          { label: "CXC Pendiente", value: `$${MOCK_STATS.cxc}`, icon: Wallet, color: "text-red-400" },
          { label: "Anticipos", value: `$${MOCK_STATS.anticipos}`, icon: Layers, color: "text-[var(--accent-orange)]" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-black/40 border border-white/5 rounded-[32px] p-6 hover:bg-white/[0.02] transition-all flex items-center gap-6 shadow-xl">
              <div className="p-3 bg-white/5 rounded-2xl text-[var(--text-secondary)]">
                <Icon size={20} />
              </div>
              <div>
                <div className={`text-xl font-jakarta font-black text-white ${stat.color || ""}`}>
                  {loading ? "..." : stat.value}
                </div>
                <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-10 border-white/10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <TrendingUp size={16} className="text-[var(--accent-blue)]" /> Desempeño Comparativo
              </h3>
              <button className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2 hover:text-white transition-all">
                Ver Historial <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-6">
              {MOCK_MONTHLY.map((m, i) => {
                const max = Math.max(...MOCK_MONTHLY.map((x) => x.ingresos));
                return (
                  <div key={i} className="space-y-3 group">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-white">{m.mes}</span>
                      <div className="flex gap-4">
                        <span className="text-[10px] font-bold text-green-500 uppercase">Ingresos: ${m.ingresos.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-white/40 uppercase">Egresos: ${m.egresos.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-[var(--accent-blue)] transition-all duration-1000 ease-out"
                        style={{ width: loading ? "0%" : `${(m.ingresos / max) * 100}%` }}
                      />
                      <div
                        className="h-full bg-red-500 transition-all duration-1000 ease-out delay-150"
                        style={{ width: loading ? "0%" : `${(m.egresos / max) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Utilidad Estimada</span>
                      <span className="text-xs font-black text-[var(--accent-blue)] tracking-widest">+ ${m.utilidad.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-10 border-white/5 h-full space-y-8 flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <PieChart size={16} className="text-[var(--accent-orange)]" /> Por Categoría
            </h3>

            <div className="flex-1 space-y-6">
              {MOCK_CATEGORIES.map((cat, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${cat.color}`}>
                    <span className="text-[10px] font-black uppercase">{cat.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-[var(--accent-blue)] transition-colors truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs font-black text-white">${cat.total.toLocaleString()}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${cat.color}`}
                        style={{ width: loading ? "0%" : `${(cat.total / MOCK_STATS.ingresos) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/5">
              <div className="bg-[var(--accent-blue)]/5 p-6 rounded-3xl border border-[var(--accent-blue)]/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">
                    Ticket Promedio
                  </p>
                  <p className="text-2xl font-black text-white">${MOCK_STATS.ticketPromedio.toLocaleString()}</p>
                </div>
                <BarChart3 size={32} className="text-[var(--accent-blue)] opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex justify-center gap-6">
        <button className="btn-accent px-10 py-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
          <FileText size={18} /> Exportar Cierre Mensual
        </button>
        <button className="bg-white/5 hover:bg-white/10 text-white font-bold px-10 py-4 rounded-[20px] transition-all border border-white/10 text-xs uppercase tracking-[0.2em] shadow-inner">
          Auditoría de Caja
        </button>
      </footer>
    </div>
  );
}
TSX

cat > ./src/components/hub/InventoryPanel.tsx <<'TSX'
"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Boxes,
  Plus,
  Wrench,
  BatteryCharging,
  Monitor,
  Cpu,
  MoreVertical
} from "lucide-react";

interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  sku: string;
  stock: number;
  minimo: number;
  costo: number;
  ubicacion: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", nombre: "Pantalla iPhone 13", categoria: "Pantallas", sku: "SCR-IP13", stock: 8, minimo: 3, costo: 950, ubicacion: "Estante A1" },
  { id: "2", nombre: "Batería Samsung S22", categoria: "Baterías", sku: "BAT-S22", stock: 2, minimo: 4, costo: 420, ubicacion: "Estante B2" },
  { id: "3", nombre: "Teclado MacBook Air", categoria: "Periféricos", sku: "KEY-MBA", stock: 6, minimo: 2, costo: 1350, ubicacion: "Estante C3" },
  { id: "4", nombre: "IC de carga Xiaomi", categoria: "Microcomponentes", sku: "IC-XM-44", stock: 15, minimo: 6, costo: 90, ubicacion: "Gaveta D1" },
];

function getCategoryIcon(category: string) {
  if (category === "Pantallas") return Monitor;
  if (category === "Baterías") return BatteryCharging;
  if (category === "Microcomponentes") return Cpu;
  return Wrench;
}

export default function InventoryPanel() {
  const [items] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const filtered = items.filter(
    (i) =>
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter((i) => i.stock <= i.minimo).length;
  const totalStock = items.reduce((acc, i) => acc + i.stock, 0);
  const totalValue = items.reduce((acc, i) => acc + i.stock * i.costo, 0);

  return (
    <div className="space-y-8 pb-12">
      <header className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 glass-card p-10 border-white/5 bg-[var(--accent-blue)]/5 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Inventario</h1>
            <p className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-[0.3em] mt-2">
              Control de refacciones y stock
            </p>
          </div>

          <button className="mt-10 btn-accent py-4 flex items-center justify-center gap-3 text-xs uppercase font-black tracking-widest">
            <Plus size={18} /> Nuevo Ítem
          </button>
        </div>

        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Piezas en stock", value: totalStock, icon: Boxes, color: "text-white" },
            { label: "Stock crítico", value: lowStock, icon: AlertTriangle, color: "text-red-500" },
            { label: "Valor inventario", value: `$${totalValue.toLocaleString()}`, icon: Package, color: "text-[var(--accent-blue)]" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-black/40 border border-white/5 rounded-[40px] p-8 flex items-center gap-8 shadow-2xl backdrop-blur-md">
                <div className={`p-4 rounded-3xl bg-white/5 ${s.color}`}>
                  <Icon size={32} />
                </div>
                <div>
                  <div className={`text-4xl font-jakarta font-black ${s.color}`}>{loading ? "..." : s.value}</div>
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none focus:border-[var(--accent-blue)] transition-all backdrop-blur-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[var(--text-secondary)] hover:text-white transition-all">
          <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => {
          const Icon = getCategoryIcon(item.categoria);
          const low = item.stock <= item.minimo;
          return (
            <div key={item.id} className="bg-black/40 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-2xl bg-white/5 ${low ? "text-red-500" : "text-[var(--accent-blue)]"}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-jakarta font-extrabold text-white">{item.nombre}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-1">
                      {item.sku}
                    </p>
                  </div>
                </div>

                <button className="text-[var(--text-secondary)] hover:text-white">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Categoría</p>
                  <p className="text-white font-bold">{item.categoria}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Ubicación</p>
                  <p className="text-white font-bold">{item.ubicacion}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Stock</p>
                  <p className={`font-black ${low ? "text-red-500" : "text-white"}`}>{item.stock}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Costo</p>
                  <p className="text-white font-black">${item.costo}</p>
                </div>
              </div>

              {low && (
                <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                  Stock bajo. Mínimo requerido: {item.minimo}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
TSX

python3 - <<'PY'
from pathlib import Path
p = Path("src/app/(dashboard)/hub/page.tsx")
text = p.read_text()

if 'import FinancePanel from "../../../components/hub/FinancePanel";' not in text:
    text = text.replace(
        'import ArchivePanel from "../../../components/hub/ArchivePanel";',
        'import ArchivePanel from "../../../components/hub/ArchivePanel";\nimport FinancePanel from "../../../components/hub/FinancePanel";\nimport InventoryPanel from "../../../components/hub/InventoryPanel";'
    )

text = text.replace(
    'case "inventario":\n        return <Placeholder title="Inventario" />;',
    'case "inventario":\n        return <InventoryPanel />;'
)

text = text.replace(
    'case "finanzas":\n        return <Placeholder title="Finanzas" />;',
    'case "finanzas":\n        return <FinancePanel />;'
)

p.write_text(text)
PY

echo "===== HUB PAGE ACTUALIZADA ====="
sed -n '1,180p' "./src/app/(dashboard)/hub/page.tsx"
echo

rm -rf .next
npm run dev
