"use client";

import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Clock, 
  CheckCircle2, 
  FileText, 
  RefreshCcw, 
  Bell, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const stats = [
  { label: "Equipos en taller", value: "14", icon: Laptop, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Pendientes de firma", value: "6", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Listos para entrega", value: "9", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Ingreso mensual", value: "$28,450", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
        <h1 className="text-2xl font-jakarta font-extrabold text-white">Dashboard Principal</h1>
        <div className="flex items-center gap-4">
          <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-text-secondary outline-none focus:border-accent-blue transition-all cursor-pointer">
            <option>Todas las sucursales</option>
            <option>Sucursal Norte</option>
            <option>Sucursal Sur</option>
          </select>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-colors shadow-inner">
              <Bell size={20} />
            </button>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-colors shadow-inner">
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-black/40 border border-white/10 rounded-[32px] p-6 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md">
            <div className={cn("p-4 rounded-2xl w-fit mb-6 shadow-inner", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div className="text-3xl font-jakarta font-black text-white mb-2">{loading ? '...' : stat.value}</div>
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-jakarta font-bold text-white flex items-center gap-3">
              <Activity size={20} className="text-accent-blue" />
              Operaciones Recientes
            </h2>
            <div className="px-3 py-1 bg-accent-blue/10 text-accent-blue text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse border border-accent-blue/10">Live</div>
          </div>
          <div className="p-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-1.5 h-12 bg-accent-blue/20 rounded-full group-hover:bg-accent-blue transition-colors" />
                <div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    <strong className="text-white">Orden #4922</strong> registrada por Recepción Monterrey
                  </p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Hace {i * 5}m</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-jakarta font-bold text-white flex items-center gap-3">
              <AlertTriangle size={20} className="text-accent-orange" />
              Alertas de Stock Especial
            </h2>
          </div>
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-text-secondary opacity-30 shadow-inner">
               <Activity size={32} />
            </div>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">Sincronizando inventario global...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
