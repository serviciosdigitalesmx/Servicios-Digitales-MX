"use client";

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CircleDollarSign, 
  BarChart3, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PieChart, 
  RefreshCcw, 
  FileText,
  Target,
  Layers,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- MOCK DATA ---
const MOCK_STATS = {
  ingresos: 45200,
  egresos: 12800,
  utilidad: 32400,
  ticketPromedio: 1850,
  ordenesEntregadas: 24,
  cotizacionesConvertidas: 18,
  cxc: 5400, // Cuentas por cobrar
  anticipos: 3200, // Anticipos pendientes
};

const MOCK_MONTHLY = [];

const MOCK_CATEGORIES = [];

export default function FinancePanel() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '2026-04-01', to: '2026-04-30' });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl gap-6">
        <div>
          <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Análisis Financiero Hub</h1>
          <p className="text-text-secondary text-sm font-bold uppercase tracking-[0.3em] mt-1">Inteligencia de negocio y rentabilidad</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
           <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 px-4">
                 <Calendar size={18} className="text-accent-blue" />
                 <input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent text-sm font-bold text-white outline-none" />
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-3 px-4">
                 <input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent text-sm font-bold text-white outline-none" />
              </div>
           </div>
           <button className="bg-white/5 hover:bg-white/10 p-3.5 rounded-2xl border border-white/10 text-text-secondary hover:text-white transition-all shadow-inner">
             <RefreshCcw size={20} className={cn(loading && "animate-spin")} />
           </button>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Totales', value: MOCK_STATS.ingresos, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Egresos / Gastos', value: MOCK_STATS.egresos, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Utilidad Bruta', value: MOCK_STATS.utilidad, icon: DollarSign, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
          { label: 'Utilidad Neta (%)', value: `${((MOCK_STATS.utilidad/MOCK_STATS.ingresos)*100).toFixed(1)}%`, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10', noCurrency: true }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-8 border-white/5 relative group overflow-hidden">
             <div className={cn("p-4 rounded-2xl w-fit mb-6", stat.bg, stat.color)}>
               <stat.icon size={24} />
             </div>
             <div className="text-3xl font-jakarta font-black text-white mb-1">
               {loading ? '---' : (stat.noCurrency ? stat.value : `$${stat.value.toLocaleString()}`)}
             </div>
             <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{stat.label}</div>
             <div className={cn("absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 mb-4 transition-transform", stat.color)}>
               <stat.icon size={120} />
             </div>
          </div>
        ))}
      </div>

      {/* Second Row: Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ticket Promedio', value: `$${MOCK_STATS.ticketPromedio}`, icon: CircleDollarSign },
          { label: 'Entregadas', value: MOCK_STATS.ordenesEntregadas, icon: Target },
          { label: 'CXC Pendiente', value: `$${MOCK_STATS.cxc}`, icon: Wallet, color: 'text-red-400' },
          { label: 'Anticipos', value: `$${MOCK_STATS.anticipos}`, icon: Layers, color: 'text-accent-orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-black/40 border border-white/5 rounded-[32px] p-6 hover:bg-white/[0.02] transition-all flex items-center gap-6 shadow-xl">
             <div className="p-3 bg-white/5 rounded-2xl text-text-secondary">
               <stat.icon size={20} />
             </div>
             <div>
                <div className={cn("text-xl font-jakarta font-black text-white", stat.color)}>{loading ? '...' : stat.value}</div>
                <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{stat.label}</div>
             </div>
          </div>
        ))}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         
         {/* Monthly Trends */}
         <div className="xl:col-span-2 space-y-6">
            <div className="glass-card p-10 border-white/10 space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                    <TrendingUp size={16} className="text-accent-blue" /> Desempeño Comparativo
                  </h3>
                  <button className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2 hover:text-white transition-all">
                    Ver Historial <ArrowRight size={14} />
                  </button>
               </div>
               
               <div className="space-y-6">
                  {MOCK_MONTHLY.map((m, i) => {
                    const max = Math.max(...MOCK_MONTHLY.map(x => x.ingresos));
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
                              className="h-full bg-accent-blue transition-all duration-1000 ease-out shadow-lg shadow-blue-500/20" 
                              style={{ width: loading ? '0%' : `${(m.ingresos / max) * 100}%` }} 
                            />
                            <div 
                              className="h-full bg-red-500 transition-all duration-1000 ease-out delay-150" 
                              style={{ width: loading ? '0%' : `${(m.egresos / max) * 100}%` }} 
                            />
                         </div>
                         <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Utilidad Estimada</span>
                            <span className="text-xs font-black text-accent-blue tracking-widest">+ ${m.utilidad.toLocaleString()}</span>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
         </div>

         {/* Categories Breakdown */}
         <div className="xl:col-span-1 space-y-6">
            <div className="glass-card p-10 border-white/5 h-full space-y-8 flex flex-col">
               <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                 <PieChart size={16} className="text-accent-orange" /> Por Categoría
               </h3>

               <div className="flex-1 space-y-6">
                  {MOCK_CATEGORIES.map((cat, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                       <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg", cat.color)}>
                          <span className="text-[10px] font-black uppercase">{cat.name[0]}</span>
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                             <span className="text-xs font-bold text-white group-hover:text-accent-blue transition-colors truncate">{cat.name}</span>
                             <span className="text-xs font-black text-white">${cat.total.toLocaleString()}</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <div 
                               className={cn("h-full transition-all duration-1000 ease-out", cat.color)}
                               style={{ width: loading ? '0%' : `${(cat.total / MOCK_STATS.ingresos) * 100}%` }}
                             />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="pt-8 border-t border-white/5">
                  <div className="bg-accent-blue/5 p-6 rounded-3xl border border-accent-blue/10 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Ticket Promedio</p>
                        <p className="text-2xl font-black text-white">${MOCK_STATS.ticketPromedio.toLocaleString()}</p>
                     </div>
                     <BarChart3 size={32} className="text-accent-blue opacity-50" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Action Footer */}
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
