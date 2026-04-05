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
