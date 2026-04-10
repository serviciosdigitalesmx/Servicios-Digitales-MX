"use client";
import React, { useState, useEffect } from 'react';
import { Laptop, Clock, CheckCircle2, FileText, Activity, AlertTriangle } from 'lucide-react';

const stats = [
  { label: "Equipos en taller", value: "14", icon: Laptop, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Pendientes de firma", value: "6", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Listos para entrega", value: "9", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Ingreso mensual", value: "$28,450", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function ModernDashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#161B2C]/60 border border-white/5 rounded-[32px] p-6 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md">
            <div className={`p-4 rounded-2xl w-fit mb-6 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="text-4xl font-black text-white mb-2 tracking-tighter">{loading ? '...' : stat.value}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#161B2C]/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-3 italic">
              <Activity size={20} className="text-blue-500" /> OPERACIONES RECIENTES
            </h2>
            <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse border border-blue-500/10">Live</div>
          </div>
          <div className="p-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-1 h-12 bg-blue-500/20 rounded-full group-hover:bg-blue-500 transition-colors" />
                <div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    <strong className="text-blue-400">Orden #492{i}</strong> registrada por Jesús Chávez
                  </p>
                  <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">Hace {i * 5}m</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161B2C]/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-center items-center p-12">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-gray-700 opacity-30 shadow-inner">
               <AlertTriangle size={32} />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Sincronizando inventario global...</p>
        </div>
      </div>
    </div>
  );
}
