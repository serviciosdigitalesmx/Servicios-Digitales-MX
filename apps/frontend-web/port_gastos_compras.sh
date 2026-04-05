#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
cd "$BASE"

mkdir -p ./src/components/hub

cat > ./src/components/hub/ExpensesPanel.tsx <<'TSX'
"use client";

import React, { useEffect, useState } from "react";
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Calendar,
  Wallet,
  TrendingDown,
  BadgeDollarSign,
  MoreVertical,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface ExpenseItem {
  id: string;
  concepto: string;
  categoria: string;
  proveedor: string;
  fecha: string;
  monto: number;
  metodo: string;
  estado: "pagado" | "pendiente";
}

const MOCK_EXPENSES: ExpenseItem[] = [
  { id: "1", concepto: "Compra de pantallas OLED", categoria: "Refacciones", proveedor: "Display MX", fecha: "2026-04-03", monto: 5200, metodo: "Transferencia", estado: "pagado" },
  { id: "2", concepto: "Renta del local", categoria: "Fijos", proveedor: "Inmobiliaria Norte", fecha: "2026-04-01", monto: 12000, metodo: "Transferencia", estado: "pagado" },
  { id: "3", concepto: "Pago técnico externo", categoria: "Servicios", proveedor: "Carlos T.", fecha: "2026-04-04", monto: 1800, metodo: "Efectivo", estado: "pendiente" },
  { id: "4", concepto: "Compra de baterías Samsung", categoria: "Refacciones", proveedor: "Battery Parts", fecha: "2026-04-05", monto: 3400, metodo: "Tarjeta", estado: "pagado" },
];

export default function ExpensesPanel() {
  const [items] = useState<ExpenseItem[]>(MOCK_EXPENSES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const filtered = items.filter(
    (i) =>
      i.concepto.toLowerCase().includes(search.toLowerCase()) ||
      i.categoria.toLowerCase().includes(search.toLowerCase()) ||
      i.proveedor.toLowerCase().includes(search.toLowerCase())
  );

  const total = items.reduce((acc, i) => acc + i.monto, 0);
  const pendientes = items.filter((i) => i.estado === "pendiente").length;
  const pagados = items.filter((i) => i.estado === "pagado").length;

  return (
    <div className="space-y-8 pb-12">
      <header className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 glass-card p-10 border-white/5 bg-[var(--accent-orange)]/5 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Gastos & Pagos</h1>
            <p className="text-[10px] font-bold text-[var(--accent-orange)] uppercase tracking-[0.3em] mt-2">
              Control de egresos operativos
            </p>
          </div>
          <button className="mt-10 btn-accent py-4 flex items-center justify-center gap-3 text-xs uppercase font-black tracking-widest">
            <Plus size={18} /> Nuevo Gasto
          </button>
        </div>

        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Egreso total", value: `$${total.toLocaleString()}`, icon: TrendingDown, color: "text-red-500" },
            { label: "Pagados", value: pagados, icon: CheckCircle2, color: "text-green-500" },
            { label: "Pendientes", value: pendientes, icon: AlertTriangle, color: "text-amber-500" },
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
            placeholder="Buscar gasto por concepto, categoría o proveedor..."
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
        {filtered.map((item) => (
          <div key={item.id} className="bg-black/40 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-md">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-white/5 text-[var(--accent-orange)]">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-jakarta font-extrabold text-white">{item.concepto}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-1">
                    {item.categoria}
                  </p>
                </div>
              </div>
              <button className="text-[var(--text-secondary)] hover:text-white">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Proveedor</p>
                <p className="text-white font-bold">{item.proveedor}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Fecha</p>
                <p className="text-white font-bold">{item.fecha}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Monto</p>
                <p className="text-white font-black">${item.monto.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Método</p>
                <p className="text-white font-bold">{item.metodo}</p>
              </div>
            </div>

            <div className={`mt-4 px-4 py-3 rounded-2xl text-sm font-bold border ${
              item.estado === "pagado"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              {item.estado === "pagado" ? "Pagado" : "Pendiente de pago"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
TSX

cat > ./src/components/hub/PurchasesPanel.tsx <<'TSX'
"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Truck,
  PackageCheck,
  Clock3,
  BadgeDollarSign,
  MoreVertical
} from "lucide-react";

interface PurchaseItem {
  id: string;
  proveedor: string;
  folio: string;
  fecha: string;
  total: number;
  estado: "solicitada" | "en_camino" | "recibida";
  piezas: number;
}

const MOCK_PURCHASES: PurchaseItem[] = [
  { id: "1", proveedor: "Display MX", folio: "OC-1001", fecha: "2026-04-02", total: 8500, estado: "recibida", piezas: 14 },
  { id: "2", proveedor: "Battery Parts", folio: "OC-1002", fecha: "2026-04-04", total: 4300, estado: "en_camino", piezas: 9 },
  { id: "3", proveedor: "Refa Pro", folio: "OC-1003", fecha: "2026-04-05", total: 2200, estado: "solicitada", piezas: 5 },
];

function stateStyle(state: PurchaseItem["estado"]) {
  if (state === "recibida") return "bg-green-500/10 border-green-500/20 text-green-400";
  if (state === "en_camino") return "bg-blue-500/10 border-blue-500/20 text-blue-400";
  return "bg-amber-500/10 border-amber-500/20 text-amber-400";
}

function stateLabel(state: PurchaseItem["estado"]) {
  if (state === "recibida") return "Recibida";
  if (state === "en_camino") return "En camino";
  return "Solicitada";
}

function stateIcon(state: PurchaseItem["estado"]) {
  if (state === "recibida") return PackageCheck;
  if (state === "en_camino") return Truck;
  return Clock3;
}

export default function PurchasesPanel() {
  const [items] = useState<PurchaseItem[]>(MOCK_PURCHASES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const filtered = items.filter(
    (i) =>
      i.proveedor.toLowerCase().includes(search.toLowerCase()) ||
      i.folio.toLowerCase().includes(search.toLowerCase())
  );

  const total = items.reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="space-y-8 pb-12">
      <header className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 glass-card p-10 border-white/5 bg-[var(--accent-blue)]/5 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Compras</h1>
            <p className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-[0.3em] mt-2">
              Órdenes de compra y abastecimiento
            </p>
          </div>
          <button className="mt-10 btn-primary py-4 flex items-center justify-center gap-3 text-xs uppercase font-black tracking-widest">
            <Plus size={18} /> Nueva Compra
          </button>
        </div>

        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Total compras", value: `$${total.toLocaleString()}`, icon: BadgeDollarSign, color: "text-white" },
            { label: "En tránsito", value: items.filter(i => i.estado === "en_camino").length, icon: Truck, color: "text-blue-500" },
            { label: "Recibidas", value: items.filter(i => i.estado === "recibida").length, icon: PackageCheck, color: "text-green-500" },
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
            placeholder="Buscar por proveedor o folio..."
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
          const Icon = stateIcon(item.estado);
          return (
            <div key={item.id} className="bg-black/40 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 text-[var(--accent-blue)]">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-jakarta font-extrabold text-white">{item.folio}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-1">
                      {item.proveedor}
                    </p>
                  </div>
                </div>
                <button className="text-[var(--text-secondary)] hover:text-white">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Fecha</p>
                  <p className="text-white font-bold">{item.fecha}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Piezas</p>
                  <p className="text-white font-bold">{item.piezas}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Total</p>
                  <p className="text-white font-black text-xl">${item.total.toLocaleString()}</p>
                </div>
              </div>

              <div className={`mt-4 px-4 py-3 rounded-2xl text-sm font-bold border flex items-center gap-2 ${stateStyle(item.estado)}`}>
                <Icon size={16} />
                {stateLabel(item.estado)}
              </div>
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

if 'import ExpensesPanel from "../../../components/hub/ExpensesPanel";' not in text:
    text = text.replace(
        'import InventoryPanel from "../../../components/hub/InventoryPanel";',
        'import InventoryPanel from "../../../components/hub/InventoryPanel";\nimport ExpensesPanel from "../../../components/hub/ExpensesPanel";\nimport PurchasesPanel from "../../../components/hub/PurchasesPanel";'
    )

text = text.replace(
    'case "gastos":\n        return <Placeholder title="Gastos & Pagos" />;',
    'case "gastos":\n        return <ExpensesPanel />;'
)

text = text.replace(
    'case "compras":\n        return <Placeholder title="Compras" />;',
    'case "compras":\n        return <PurchasesPanel />;'
)

p.write_text(text)
PY

echo "===== HUB PAGE ACTUALIZADA ====="
sed -n '1,220p' "./src/app/(dashboard)/hub/page.tsx"
echo

rm -rf .next
npm run dev
