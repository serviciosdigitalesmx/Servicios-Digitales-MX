"use client";

import React from "react";
import { 
  IconWallet, 
  IconCheckCircular, 
  IconDashboard, 
  IconMicrochip,
  IconStar,
  IconStore
} from "./Icons";

export default function FinanzasNative({ tenantId }: { tenantId: string }) {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      
      {/* FILTROS DE FECHA */}
      <div className="card-srf p-5 flex flex-col md:flex-row gap-4 items-center justify-between border-white/5 bg-slate-900/40">
        <div className="flex gap-4 w-full md:w-auto">
           <div className="flex-1">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Desde</label>
              <input type="date" className="w-full bg-slate-950 border border-blue-500/20 rounded-xl px-4 py-2 text-xs text-white outline-none" />
           </div>
           <div className="flex-1">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Hasta</label>
              <input type="date" className="w-full bg-slate-950 border border-blue-500/20 rounded-xl px-4 py-2 text-xs text-white outline-none" />
           </div>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-label font-bold text-center md:text-right">
           Resumen consolidado de ingresos, egresos y utilidad técnica.
        </p>
      </div>

      {/* KPIs FINANCIEROS (Paleta Sr-Fix Master) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-srf p-6 border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-[10px] text-emerald-500 font-tech uppercase tracking-widest mb-1">Ingresos Brutos</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">$45,200</span>
            <span className="text-[9px] text-emerald-400 font-label font-bold uppercase">MXN</span>
          </div>
        </div>
        <div className="card-srf p-6 border-red-500/30 bg-red-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-all"></div>
          <p className="text-[10px] text-red-500 font-tech uppercase tracking-widest mb-1">Egresos / Costos</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">$12,850</span>
            <span className="text-[9px] text-red-400 font-label font-bold uppercase">MXN</span>
          </div>
        </div>
        <div className="card-srf p-6 border-blue-500/30 bg-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-[10px] text-blue-500 font-tech uppercase tracking-widest mb-1">Utilidad Neta</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">$32,350</span>
            <span className="text-[9px] text-blue-400 font-label font-bold uppercase">MARGEN</span>
          </div>
        </div>
        <div className="card-srf p-6 border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 blur-3xl group-hover:bg-yellow-500/20 transition-all"></div>
          <p className="text-[10px] text-yellow-500 font-tech uppercase tracking-widest mb-1">Ticket Promedio</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">$1,850</span>
            <span className="text-[9px] text-yellow-400 font-label font-bold uppercase">UNITARIO</span>
          </div>
        </div>
      </div>

      {/* MONITOR OPERATIVO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Órdenes Entregadas", val: "24", icon: IconCheckCircular, color: "text-white" },
          { label: "Conversión Cotiz", val: "85%", icon: IconStar, color: "text-orange-500" },
          { label: "CxC (Por Cobrar)", val: "$4,500", icon: IconWallet, color: "text-blue-500" },
          { label: "Pendiente Pago", val: "03", icon: IconDashboard, color: "text-slate-500" },
        ].map((kpi, i) => (
          <div key={i} className="card-srf p-5 border-white/5 flex items-center justify-between">
             <div>
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1 font-label">{kpi.label}</span>
                <span className={`text-xl font-tech ${kpi.color}`}>{kpi.val}</span>
             </div>
             <kpi.icon width={20} height={20} className="text-slate-700" />
          </div>
        ))}
      </div>

      {/* COMPARATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-srf p-8 border-white/5 min-h-[300px]">
           <h3 className="text-lg font-tech text-white uppercase tracking-wider mb-6 flex items-center gap-3">
              <IconDashboard width={18} height={18} className="text-blue-500" /> Comparativo Mensual
           </h3>
           <div className="space-y-6">
              {[
                { m: "Marzo", val: 100, color: "bg-blue-600" },
                { m: "Febrero", val: 75, color: "bg-slate-700" },
                { m: "Enero", val: 88, color: "bg-slate-700" },
              ].map((row, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-widest font-label">
                      <span>{row.m}</span>
                      <span className="text-white">${(row.val * 450).toLocaleString()}</span>
                   </div>
                   <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full ${row.color} transition-all duration-1000`} style={{ width: `${row.val}%` }}></div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="card-srf p-8 border-white/5 min-h-[300px]">
           <h3 className="text-lg font-tech text-white uppercase tracking-wider mb-6 flex items-center gap-3">
              <IconStore width={18} height={18} className="text-orange-500" /> Utilidad por Categoría
           </h3>
           <div className="space-y-4">
              {[
                { cat: "Smartphone", count: 18, color: "border-blue-500/40" },
                { cat: "Laptop", count: 4, color: "border-orange-500/40" },
                { cat: "Tablet", count: 2, color: "border-emerald-500/40" },
              ].map((cat, i) => (
                <div key={i} className={`p-4 rounded-xl border ${cat.color} bg-slate-900/30 flex justify-between items-center group hover:bg-slate-900/50 transition-all cursor-pointer`}>
                   <span className="text-xs text-slate-300 font-label font-bold uppercase tracking-widest">{cat.cat}</span>
                   <span className="text-sm font-tech text-white">{cat.count} Equipos</span>
                </div>
              ))}
           </div>
        </div>
      </div>

    </div>
  );
}
