"use client";
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CircleDollarSign, BarChart3, Calendar, Wallet, PieChart, RefreshCcw, FileText, Target, Layers, ArrowRight } from 'lucide-react';

const MOCK_STATS = { ingresos: 45200, egresos: 12800, utilidad: 32400, ticketPromedio: 1850, ordenesEntregadas: 24, cxc: 5400, anticipos: 3200 };
const MOCK_MONTHLY = [
  { mes: 'Abril 2026', ingresos: 45200, egresos: 12800, utilidad: 32400 },
  { mes: 'Marzo 2026', ingresos: 38900, egresos: 15400, utilidad: 23500 },
  { mes: 'Febrero 2026', ingresos: 41200, egresos: 12900, utilidad: 28300 },
];
const MOCK_CATEGORIES = [
  { name: 'Pantallas', total: 18400, color: 'bg-blue-500' },
  { name: 'Baterías', total: 6200, color: 'bg-purple-500' },
  { name: 'Labor de Técnico', total: 12500, color: 'bg-green-500' },
  { name: 'Accesorios', total: 8100, color: 'bg-orange-500' },
];

export default function FinancePanelPro() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Totales', value: MOCK_STATS.ingresos, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Egresos / Gastos', value: MOCK_STATS.egresos, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Utilidad Bruta', value: MOCK_STATS.utilidad, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Utilidad Neta (%)', value: "71.6%", icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#161B2C]/60 border border-white/5 p-8 rounded-[32px] backdrop-blur-md relative group overflow-hidden">
            <div className={`p-4 rounded-2xl w-fit mb-6 ${stat.bg} ${stat.color}`}><stat.icon size={24} /></div>
            <div className="text-3xl font-black text-white mb-1">{loading ? '---' : (typeof stat.value === 'number' ? `$${stat.value.toLocaleString()}` : stat.value)}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-[#161B2C]/40 border border-white/5 p-10 rounded-[40px] backdrop-blur-md">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <TrendingUp size={16} className="text-blue-500" /> DESEMPEÑO MENSUAL
          </h3>
          <div className="space-y-6">
            {MOCK_MONTHLY.map((m, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-white"><span>{m.mes}</span><span className="text-green-500">${m.ingresos.toLocaleString()}</span></div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500 shadow-lg" style={{ width: loading ? '0%' : `${(m.ingresos / 50000) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="xl:col-span-1 bg-[#161B2C]/40 border border-white/5 p-10 rounded-[40px] backdrop-blur-md">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-8">POR CATEGORÍA</h3>
           {MOCK_CATEGORIES.map((cat, i) => (
             <div key={i} className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-gray-400">{cat.name}</span>
               <span className="text-xs font-black text-white">${cat.total.toLocaleString()}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
