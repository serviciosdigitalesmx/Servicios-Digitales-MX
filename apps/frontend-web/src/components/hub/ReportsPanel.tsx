"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, Package, Activity } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ReportsPanel() {
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5111";
        const res = await fetch(`${baseUrl}/api/reports/operational`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setReporte(json.data);
        }
      } catch (err) {
        console.error("Error cargando reporte:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading || !reporte) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Activity className="text-green-500 animate-pulse" size={40} />
        <p className="text-[var(--text-secondary)] font-medium text-sm animate-pulse">Calculando métricas operativas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 p-8 rounded-[32px]">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <BarChart3 className="text-green-400" size={32} />
          Pulso Operativo
        </h1>
        <p className="text-sm text-green-500/80 mt-2 font-bold uppercase tracking-widest">Resumen en tiempo real</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/5 p-6 rounded-[24px]">
          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12}/> Órdenes Activas</p>
          <p className="text-3xl font-black text-white">{reporte.ordersOpen}</p>
        </div>
        <div className="bg-black/40 border border-white/5 p-6 rounded-[24px]">
          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp size={12}/> Ingreso Proyectado</p>
          <p className="text-3xl font-black text-green-400">${reporte.estimatedRevenue?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-black/40 border border-white/5 p-6 rounded-[24px]">
          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Package size={12}/> Equipos Entregados</p>
          <p className="text-3xl font-black text-blue-400">{reporte.ordersDelivered}</p>
        </div>
        <div className="bg-black/40 border border-white/5 p-6 rounded-[24px]">
          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={12}/> Tareas Urgentes</p>
          <p className="text-3xl font-black text-red-500">{reporte.tasksUrgent}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20}/> Alerta de Inventario
          </h3>
          <div className="space-y-4">
            {reporte.criticalStock?.length > 0 ? reporte.criticalStock.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl">
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{item.sku}</p>
                  <p className="text-sm font-bold text-white">{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-red-500">{item.StockCurrent}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Min: {item.MinimumStock}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500 italic">Inventario sano. Sin alertas.</p>}
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20}/> Fallas más comunes
          </h3>
          <div className="space-y-4">
            {reporte.commonIssues?.length > 0 ? reporte.commonIssues.map((issue: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl">
                <p className="text-sm font-medium text-slate-300 capitalize flex-1 truncate mr-4">{issue.issue}</p>
                <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-black">
                  {issue.total}
                </div>
              </div>
            )) : <p className="text-sm text-slate-500 italic">No hay suficientes datos.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
