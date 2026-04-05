"use client";
import { supabase } from "../../lib/supabase";
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
