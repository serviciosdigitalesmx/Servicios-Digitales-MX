"use client";

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  ChevronDown, 
  Calendar, 
  Tag, 
  User, 
  Link as LinkIcon,
  Trash2,
  Edit3,
  X,
  Save,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  FileText,
  DollarSign
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Expense {
  id: string;
  fecha: string;
  tipo: 'fijo' | 'variable';
  categoria: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  metodoPago: string;
  proveedor?: string;
  folioRelacionado?: string;
}

const MOCK_GASTOS: any[] = [];

export default function ExpensesPanel() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = {
    total: expenses.reduce((acc, e) => acc + e.monto, 0),
    fixed: expenses.filter(e => e.tipo === 'fijo').reduce((acc, e) => acc + e.monto, 0),
    variable: expenses.filter(e => e.tipo === 'variable').reduce((acc, e) => acc + e.monto, 0),
  };

  const filteredExpenses = expenses.filter(e => 
    e.concepto.toLowerCase().includes(search.toLowerCase()) || 
    e.categoria.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-black text-white">Egresos y Gastos Operativos</h1>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mt-1">Control detallado de flujo de salida</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           <div className="relative flex-1 min-w-[200px]">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
             <input 
               type="text" 
               placeholder="Buscar gasto o categoría..." 
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-accent-blue transition-all"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <button 
             onClick={() => { setSelected(null); setShowModal(true); }}
             className="bg-accent-orange hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 text-sm"
           >
              <Plus size={18} /> Registrar Gasto
           </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Egresos", value: stats.total, icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Gastos Fijos", value: stats.fixed, icon: TrendingDown, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Gastos Variables", value: stats.variable, icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-black/40 border border-white/10 rounded-[32px] p-8 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className={cn("p-4 rounded-2xl w-fit mb-4", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div className="text-3xl font-jakarta font-black text-white mb-1">
              {loading ? '...' : `$${stat.value.toLocaleString()}`}
            </div>
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{stat.label}</div>
            
            {/* Subtle background decoration */}
            <div className={cn("absolute -bottom-6 -right-6 opacity-5 transition-transform group-hover:scale-110", stat.color)}>
               <stat.icon size={120} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Monthly Summary mini-table */}
         <div className="xl:col-span-1 space-y-6">
            <div className="glass-card p-8 border-white/5 space-y-6">
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 border-b border-white/5 pb-4">
                 <DollarSign size={14} className="text-accent-orange" /> Resumen Mensual
               </h3>
               <div className="space-y-4">
                  {[
                    { mes: 'Abril 2026', total: 10800 },
                    { mes: 'Marzo 2026', total: 15400 },
                    { mes: 'Febrero 2026', total: 12900 }
                  ].map((m, i) => (
                    <div key={i} className="flex justify-between items-center group cursor-default">
                       <span className="text-xs text-text-secondary group-hover:text-white transition-colors">{m.mes}</span>
                       <span className="text-sm font-bold text-white tracking-widest">${m.total.toLocaleString()}</span>
                    </div>
                  ))}
               </div>
               <button className="w-full btn-primary py-3 text-[9px] font-black uppercase tracking-widest shadow-inner">
                  Generar Reporte PDF
               </button>
            </div>
         </div>

         {/* Transactions Table */}
         <div className="xl:col-span-3">
            <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
               <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                   <thead>
                     <tr className="bg-white/5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] text-left">
                       <th className="px-6 py-5">Fecha / Tipo</th>
                       <th className="px-6 py-5">Categoría / Concepto</th>
                       <th className="px-6 py-5">Proveedor</th>
                       <th className="px-6 py-5 text-right">Monto</th>
                       <th className="px-6 py-5">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {filteredExpenses.map((g) => (
                       <tr key={g.id} className="group hover:bg-white/[0.02] transition-colors">
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-white mb-1">{g.fecha}</span>
                               <span className={cn(
                                 "w-fit px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                 g.tipo === 'fijo' ? "text-blue-500 bg-blue-500/10 border-blue-500/20" : "text-orange-500 bg-orange-500/10 border-orange-500/20"
                               )}>
                                 {g.tipo}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1">{g.categoria}</span>
                               <span className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors">{g.concepto}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-xs font-medium text-text-secondary">
                            {g.proveedor || 'N/A'}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                               <span className="text-lg font-black text-white tracking-widest">${g.monto.toLocaleString()}</span>
                               <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{g.metodoPago}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => { setSelected(g); setShowModal(true); }}
                                 className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-accent-blue hover:bg-accent-blue/10 transition-all shadow-inner"
                                >
                                 <Edit3 size={16} />
                               </button>
                               <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all shadow-inner">
                                 <Trash2 size={16} />
                               </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
         </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ExpenseModal 
          expense={selected} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

function ExpenseModal({ expense, onClose }: { expense: Expense | null, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#121214] border border-white/10 w-full max-w-3xl rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col scale-in h-[90vh]">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent-orange/10 rounded-2xl flex items-center justify-center text-accent-orange border border-accent-orange/20 shadow-inner">
                 <CreditCard size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-jakarta font-black text-white">
                  {expense ? `Detalle de Egreso #${expense.id}` : 'Registrar Nuevo Gasto'}
                </h3>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.4em] mt-1">Control de Flujo de Efectivo</p>
              </div>
           </div>
           <button onClick={onClose} className="p-4 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-all">
             <X size={28} />
           </button>
        </div>

        <div className="p-12 space-y-10 overflow-y-auto scrollbar-hide flex-1">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Fecha del Gasto</label>
                 <div className="relative">
                   <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-blue" />
                   <input type="date" className="w-full input-srf p-4 pl-12 font-bold" defaultValue={expense?.fecha || new Date().toISOString().split('T')[0]} />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Concepto General</label>
                 <input type="text" className="w-full input-srf p-4" placeholder="Ej: Pago de Luz..." defaultValue={expense?.concepto} />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Categoría</label>
                 <select className="w-full input-srf p-4 appearance-none cursor-pointer" defaultValue={expense?.categoria || 'Insumos'}>
                   <option>Insumos</option>
                   <option>Renta</option>
                   <option>Servicios</option>
                   <option>Sueldos</option>
                   <option>Publicidad</option>
                   <option>Otros</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Tipo de Gasto</label>
                 <div className="grid grid-cols-2 gap-4">
                    <button className="py-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">Fijo</button>
                    <button className="py-4 rounded-xl border border-white/10 bg-white/5 text-text-secondary text-[10px] font-black uppercase tracking-widest">Variable</button>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 p-10 rounded-[32px] border border-white/5 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Monto Total $</label>
                   <input type="number" className="w-full bg-transparent border-b border-accent-orange/30 p-2 text-3xl font-black text-white outline-none focus:border-accent-orange transition-all" placeholder="0.00" defaultValue={expense?.monto} />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Método de Pago</label>
                   <select className="w-full input-srf p-4 appearance-none" defaultValue={expense?.metodoPago || 'Efectivo'}>
                      <option>Efectivo</option>
                      <option>Transferencia</option>
                      <option>Tarjeta</option>
                      <option>Caja Chica</option>
                   </select>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Folio Relacionado</label>
                   <div className="relative">
                      <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input type="text" className="w-full input-srf p-4 pl-10 font-mono text-xs" placeholder="SR-XXXX" defaultValue={expense?.folioRelacionado} />
                   </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Proveedor / Beneficiario</label>
                 <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="text" className="w-full input-srf p-4 pl-12" placeholder="Nombre de la empresa o persona..." defaultValue={expense?.proveedor} />
                 </div>
              </div>
           </div>
           
           <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Información Adicional / Comprobante</label>
              <textarea rows={3} className="w-full input-srf p-4 text-sm" placeholder="Detalles extra del movimiento..."></textarea>
              <div className="flex gap-4 mt-2">
                 <button className="flex-1 border border-dashed border-white/20 rounded-2xl py-8 flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all text-text-secondary hover:text-white">
                    <FileText size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Subir Comprobante</span>
                 </button>
              </div>
           </div>
        </div>

        <div className="p-10 border-t border-white/5 flex gap-4 bg-white/[0.02]">
           <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl transition-all border border-white/5 text-xs uppercase tracking-widest shadow-inner">
             Cancelar
           </button>
           <button className="flex-2 btn-accent py-5 flex items-center justify-center gap-3 shadow-lg shadow-accent-blue/10">
             <Save size={20} /> Guardar Movimiento
           </button>
        </div>
      </div>
    </div>
  );
}
