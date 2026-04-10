"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Settings, 
  Download, 
  RefreshCcw, 
  Smartphone, 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  Tag, 
  Filter,
  Layers,
  Zap,
  ArrowRight,
  Target
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
type ReportMode = 'diario' | 'semanal' | 'mensual';

interface KPIData {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}

const MOCK_REPORTS: Record<ReportMode, { kpis: KPIData[], mainList: any[], secList: any[] }> = {
  diario: {
    kpis: [
      { label: 'Recibidos Hoy', value: 8, icon: Smartphone, color: 'text-blue-500' },
      { label: 'Entregados', value: 5, icon: CheckCircle2, color: 'text-green-500' },
      { label: 'Cotizaciones', value: 12, icon: Tag, color: 'text-accent-orange' },
      { label: 'Venta Est.', value: '$8,400', icon: TrendingUp, color: 'text-accent-blue' },
      { label: 'Gastos Caja', value: '$450', icon: Clock, color: 'text-red-500' },
    ],
    mainList: [
      { id: '1', title: 'SR-4812 · Eduardo Torres', sub: 'iPhone 13 Pro · Batería' },
      { id: '2', title: 'SR-4811 · Brenda Luna', sub: 'MacBook Air M1 · Pantalla' },
    ],
    secList: [
      { id: '1', title: 'COT-7712 · Marcos Ruiz', sub: 'Total: $4,200', value: '$4,200' },
      { id: '2', title: 'COT-7710 · Sofia G.', sub: 'Total: $1,500', value: '$1,500' },
    ]
  },
  semanal: {
    kpis: [
      { label: 'Equipos Recib.', value: 42, icon: Smartphone, color: 'text-blue-500' },
      { label: 'Entregados', value: 38, icon: CheckCircle2, color: 'text-green-500' },
      { label: 'Cotizaciones', value: 55, icon: Tag, color: 'text-accent-orange' },
      { label: 'Días Entrega', value: 2.4, icon: Clock, color: 'text-purple-500' },
      { label: 'Stock Crítico', value: 4, icon: Package, color: 'text-red-500' },
    ],
    mainList: [
      { id: '1', title: 'Tec. Carlos Torres', sub: '18 reparaciones' },
      { id: '2', title: 'Tec. Martin Sosa', sub: '12 reparaciones' },
    ],
    secList: [
      { id: '1', title: 'Pantalla iPhone 13', sub: 'Actual: 2 · Min: 3' },
      { id: '2', title: 'Batería Mac A2337', sub: 'Actual: 0 · Min: 1' },
    ]
  },
  mensual: {
    kpis: [
      { label: 'Ingresos Hub', value: '$124.8k', icon: TrendingUp, color: 'text-green-500' },
      { label: 'Egresos Hub', value: '$42.5k', icon: BarChart3, color: 'text-red-500' },
      { label: 'Utilidad Bruta', value: '$82.3k', icon: Zap, color: 'text-accent-blue' },
      { label: 'Servicios Top', value: 84, icon: Layers, color: 'text-purple-500' },
      { label: 'Cltes Recur.', value: 12, icon: User, color: 'text-accent-orange' },
    ],
    mainList: [
      { id: '1', title: 'Cambio de Pantalla', sub: '42 servicios' },
      { id: '2', title: 'Mantenimiento Pro', sub: '28 servicios' },
    ],
    secList: [
      { id: '1', title: 'Ricardo Salinas', sub: '5 visitas este mes' },
      { id: '2', title: 'Inmobiliaria RT', sub: '3 visitas este mes' },
    ]
  }
};

export default function ReportsPanel() {
  const [mode, setMode] = useState<ReportMode>('diario');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '2026-04-01', to: '2026-04-30' });

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [mode]);

  const currentData = MOCK_REPORTS[mode];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-accent-orange/10 rounded-[28px] flex items-center justify-center text-accent-orange border border-accent-orange/20 shadow-lg shadow-orange-500/10">
              <BarChart3 size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Reportes de Operación</h1>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-[0.3em] mt-1 italic">Inteligencia de negocio automatizada</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
           <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              {(['diario', 'semanal', 'mensual'] as ReportMode[]).map((m) => (
                <button 
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    mode === m ? "bg-accent-blue text-white shadow-lg shadow-blue-500/20" : "text-text-secondary hover:text-white"
                  )}
                >
                  {m}
                </button>
              ))}
           </div>
           <button className="bg-white/5 hover:bg-white/10 text-white font-bold p-4 rounded-2xl border border-white/10 transition-all shadow-inner">
             <Download size={20} />
           </button>
        </div>
      </header>

      {/* Analytics KPIs Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
         {currentData.kpis.map((k, i) => (
           <div key={i} className="glass-card p-6 border-white/5 relative group overflow-hidden">
              <div className={cn("p-2 rounded-xl w-fit mb-4 bg-white/5 shadow-inner", k.color)}>
                 <k.icon size={18} />
              </div>
              <div className="text-2xl font-black text-white tracking-tighter mb-1">
                 {loading ? '...' : k.value}
              </div>
              <div className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">
                 {k.label}
              </div>
              <div className={cn("absolute -bottom-4 -right-4 opacity-5 transition-transform group-hover:scale-110 mb-2", k.color)}>
                 <k.icon size={80} />
              </div>
           </div>
         ))}
      </div>

      {/* Main Analysis Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         
         {/* Main Activity Breakdown */}
         <section className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-4">
               <Target size={18} className="text-accent-blue" /> Desglose Operativo Principal
            </h3>
            
            <div className="space-y-4 min-h-[300px] relative">
               {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     <RefreshCcw size={32} className="animate-spin text-accent-blue" />
                  </div>
               ) : (
                  currentData.mainList.map((item) => (
                    <div key={item.id} className="bg-black/40 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] flex items-center justify-between group transition-all cursor-default">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-text-secondary group-hover:text-accent-blue transition-colors border border-white/5">
                             <ArrowRight size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white tracking-tight">{item.title}</p>
                             <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1 italic">{item.sub}</p>
                          </div>
                       </div>
                       <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all opacity-0 group-hover:opacity-100">
                          <Download size={14} />
                       </button>
                    </div>
                  ))
               )}
            </div>
         </section>

         {/* Secondary Breakdown / Alarms */}
         <section className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-4">
               <Zap size={18} className="text-accent-orange" /> Métricas de Conversión y Alertas
            </h3>

            <div className="space-y-4">
               {loading ? (
                  <div className="h-64 flex items-center justify-center opacity-30">
                     <RefreshCcw size={32} className="animate-spin text-accent-orange" />
                  </div>
               ) : (
                  currentData.secList.map((item) => (
                    <div key={item.id} className="bg-black/40 border border-[#1F7EDC]/10 rounded-3xl p-6 hover:border-[#1F7EDC]/30 flex items-center justify-between group transition-all">
                       <div>
                          <p className="text-sm font-bold text-white tracking-tight">{item.title}</p>
                          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1 italic">{item.sub}</p>
                       </div>
                       {item.value && (
                          <div className="text-lg font-black text-white font-jakarta">{item.value}</div>
                       )}
                    </div>
                  ))
               )}
               
               <div className="bg-accent-blue/[0.02] border border-dashed border-white/10 rounded-[32px] p-8 mt-10 text-center space-y-4">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.4em]">¿Necesitas reporte personalizado?</p>
                  <button className="btn-accent px-8 py-3 text-[9px] font-black uppercase tracking-widest shadow-inner">
                    Configurar Tablero BI
                  </button>
               </div>
            </div>
         </section>
      </div>

      {/* Historical Trend Preview (Bottom) */}
      <footer className="glass-card p-10 border-white/5 bg-accent-blue/5">
         <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-2xl bg-accent-blue flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <TrendingUp size={24} />
               </div>
               <div>
                  <h4 className="text-lg font-jakarta font-black text-white">Consolidación Anual Hub</h4>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Corte parcial: Abril 2026</p>
               </div>
            </div>
            <div className="flex gap-10">
               <div className="text-center">
                  <p className="text-2xl font-black text-white">$452,400</p>
                  <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Ingresos YTD</p>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="text-center">
                  <p className="text-2xl font-black text-green-500">22.4%</p>
                  <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Margen Bruto</p>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
