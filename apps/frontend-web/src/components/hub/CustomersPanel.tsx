"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  User, 
  Smartphone, 
  Mail, 
  History as HistoryIcon, 
  Screwdriver, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Star,
  CheckCircle2,
  X,
  Save,
  RotateCcw,
  ShieldAlert,
  Calendar,
  DollarSign,
  MessageSquare,
  Wrench
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  etiqueta: 'vip' | 'frecuente' | 'nuevo' | 'moroso';
  totalEquipos: number;
  totalReparaciones: number;
  totalCotizaciones: number;
  ticketPromedio: number;
  ultimaVisita: string;
  notas?: string;
  moroso?: boolean;
}

const MOCK_CUSTOMERS: Customer[] = [];

export default function CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = {
    total: customers.length,
    vips: customers.filter(c => c.etiqueta === 'vip').length,
    morosos: customers.filter(c => c.etiqueta === 'moroso' || c.moroso).length,
    frecuentes: customers.filter(c => c.etiqueta === 'frecuente').length,
  };

  const filtered = customers.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.telefono.includes(search)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header with KPI cards integrated */}
      <header className="grid grid-cols-1 xl:grid-cols-4 gap-6">
         <div className="xl:col-span-1 glass-card p-10 border-white/5 bg-accent-blue/5 flex flex-col justify-between">
            <div>
               <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">CRM Clientes</h1>
               <p className="text-[10px] font-bold text-accent-blue uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                 <CheckCircle2 size={12} /> SrFix Intelligence
               </p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-10 btn-accent py-4 flex items-center justify-center gap-3 text-xs uppercase font-black tracking-widest shadow-lg shadow-accent-blue/10"
            >
               <Plus size={18} /> Nuevo Cliente
            </button>
         </div>

         <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Base de Datos', value: stats.total, sub: 'Clientes Únicos', icon: Users, color: 'text-white' },
              { label: 'Top / VIP', value: stats.vips, sub: 'Mayor Rentabilidad', icon: Star, color: 'text-amber-500' },
              { label: 'Riesgo / Morosidad', value: stats.morosos, sub: 'Atención Requerida', icon: ShieldAlert, color: 'text-red-500' },
            ].map((s, i) => (
              <div key={i} className="bg-black/40 border border-white/5 rounded-[40px] p-8 flex items-center gap-8 shadow-2xl backdrop-blur-md">
                 <div className={cn("p-4 rounded-3xl bg-white/5", s.color)}>
                    <s.icon size={32} />
                 </div>
                 <div>
                    <div className={cn("text-4xl font-jakarta font-black", s.color)}>{loading ? '...' : s.value}</div>
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">{s.label}</div>
                    <div className="text-[8px] text-text-secondary/50 font-bold uppercase tracking-widest mt-0.5">{s.sub}</div>
                 </div>
              </div>
            ))}
         </div>
      </header>

      {/* Search & Main Table */}
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
               <input 
                 type="text" 
                 placeholder="Identificar cliente por nombre, teléfono o email..." 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none focus:border-accent-blue transition-all backdrop-blur-xl"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all">
               <Filter size={20} />
            </button>
         </div>

         <div className="bg-black/40 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                  <thead>
                     <tr className="bg-white/5 text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] text-left">
                        <th className="px-8 py-6">Identidad</th>
                        <th className="px-8 py-6">Contacto</th>
                        <th className="px-8 py-6">Volumen</th>
                        <th className="px-8 py-6">Perfil / Label</th>
                        <th className="px-8 py-6 text-right">Ticket Avg.</th>
                        <th className="px-8 py-6">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filtered.map((c) => (
                        <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-accent-blue border border-white/10">
                                   {c.nombre[0]}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black text-white group-hover:text-accent-blue transition-colors">{c.nombre}</span>
                                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">ID: {c.id.padStart(4, '0')}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="space-y-1">
                                 <p className="text-xs font-bold text-white flex items-center gap-2">
                                    <Smartphone size={12} className="text-accent-blue" /> {c.telefono}
                                 </p>
                                 <p className="text-[10px] text-text-secondary truncate max-w-[150px]">{c.email}</p>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-white">{c.totalEquipos} Equipos</span>
                                 <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-1">{c.totalReparaciones} Entregados</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <CustomerBadge tag={c.etiqueta} />
                           </td>
                           <td className="px-8 py-6 text-right">
                              <span className="text-sm font-black text-white tracking-widest">${c.ticketPromedio.toLocaleString()}</span>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                 <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-green-500 hover:bg-green-500/10 transition-all shadow-inner">
                                    <MessageSquare size={16} />
                                 </button>
                                 <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-accent-orange hover:bg-accent-orange/10 transition-all shadow-inner">
                                    <Wrench size={16} />
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

      {/* Customer Profile Modal */}
      {selected && (
        <CustomerProfileModal 
          customer={selected} 
          onClose={() => setSelected(null)} 
        />
      )}
    </div>
  );
}

function CustomerBadge({ tag }: { tag: string }) {
  const styles: any = {
    vip: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    frecuente: "text-green-500 bg-green-500/10 border-green-500/20",
    moroso: "text-red-500 bg-red-500/10 border-red-500/20",
    nuevo: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border", styles[tag])}>
      {tag}
    </span>
  );
}

function CustomerProfileModal({ customer, onClose }: { customer: Customer, onClose: () => void }) {
  const [tab, setTab] = useState<'perfil' | 'historial' | 'cotizaciones'>('perfil');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#121214] border border-white/10 w-full max-w-5xl rounded-[50px] shadow-3xl overflow-hidden relative flex flex-col scale-in h-[90vh]">
        
        {/* Header Profile */}
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-accent-blue/10 to-transparent gap-8">
           <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-[32px] bg-accent-blue flex items-center justify-center text-4xl font-black text-white shadow-2xl relative">
                 {customer.nombre[0]}
                 <div className="absolute -bottom-2 -right-2 p-2 bg-black rounded-xl border border-white/10 text-white">
                    <User size={16} />
                 </div>
              </div>
              <div>
                <h3 className="text-3xl font-jakarta font-black text-white tracking-tighter">{customer.nombre}</h3>
                <div className="flex gap-4 mt-2">
                   <div className="flex items-center gap-2 text-text-secondary text-xs">
                      <Smartphone size={14} className="text-accent-blue" /> {customer.telefono}
                   </div>
                   <div className="flex items-center gap-2 text-text-secondary text-xs">
                      <Mail size={14} className="text-accent-blue" /> {customer.email}
                   </div>
                </div>
              </div>
           </div>
           
           <div className="flex gap-4">
              <button className="btn-accent px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Wrench size={16} /> Nueva Orden
              </button>
              <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl text-text-secondary hover:text-white transition-all">
                <X size={24} />
              </button>
           </div>
        </div>

        {/* Tab Nav */}
        <div className="px-10 pt-4 border-b border-white/5 flex gap-12 overflow-x-auto scrollbar-hide">
           {[
             { id: 'perfil', label: 'Resumen Global', icon: User },
             { id: 'historial', label: 'Historial Taller', icon: HistoryIcon },
             { id: 'cotizaciones', label: 'Ventas & Cotizaciones', icon: DollarSign },
           ].map((t) => (
             <button 
               key={t.id}
               onClick={() => setTab(t.id as any)}
               className={cn(
                 "pb-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all border-b-2",
                 tab === t.id ? "border-accent-blue text-accent-blue" : "border-transparent text-text-secondary hover:text-white"
               )}
             >
               <t.icon size={16} /> {t.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
           
           {tab === 'perfil' && (
             <div className="space-y-12 animate-in fade-in duration-500">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {[
                     { label: 'Equipos Totales', value: customer.totalEquipos, icon: Smartphone, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
                     { label: 'Ingresos Clte', value: `$${(customer.totalReparaciones * customer.ticketPromedio).toLocaleString()}`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
                     { label: 'Última Cita', value: customer.ultimaVisita, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                     { label: 'Fidelidad', value: customer.etiqueta.toUpperCase(), icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' }
                   ].map((s, i) => (
                     <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <div className={cn("p-2 rounded-xl w-fit mb-4", s.bg, s.color)}><s.icon size={18} /></div>
                        <div className="text-xl font-black text-white">{s.value}</div>
                        <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{s.label}</div>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   <div className="lg:col-span-2 space-y-6">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Notas Internas CRM</h4>
                      <textarea className="w-full input-srf p-6 text-sm italic" rows={5} defaultValue={customer.notas || 'Sin anotaciones especiales...'} />
                      <div className="flex justify-end">
                         <button className="btn-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest">Actualizar Notas</button>
                      </div>
                   </div>

                   <div className="lg:col-span-1 space-y-6">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Nivel de Riesgo</h4>
                      <div className={cn(
                        "p-8 rounded-[40px] border flex flex-col items-center gap-4 text-center",
                        customer.moroso ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
                      )}>
                         <div className={cn("p-4 rounded-full", customer.moroso ? "bg-red-500 text-white" : "bg-green-500 text-white shadow-lg shadow-green-500/20")}>
                            {customer.moroso ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
                         </div>
                         <div>
                            <p className="text-lg font-black text-white">{customer.moroso ? 'ATENCIÓN REQUERIDA' : 'ESTADO OPTIMO'}</p>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-2">
                               {customer.moroso ? 'Cliente con deudas o conflictos previos.' : 'Respaldo total para crédito o reparaciones.'}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {tab === 'historial' && (
             <div className="animate-in fade-in duration-500">
                <div className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-white/5 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                         <tr>
                           <th className="px-6 py-4">Folio</th>
                           <th className="px-6 py-4">Equipo</th>
                           <th className="px-6 py-4">Falla</th>
                           <th className="px-6 py-4">Estado</th>
                           <th className="px-6 py-4 text-right">Inversión</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {[1,2,3].map((i) => (
                           <tr key={i} className="hover:bg-white/[0.02]">
                             <td className="px-6 py-4 text-xs font-mono font-bold text-accent-blue">SR-48{i}2</td>
                             <td className="px-6 py-4 text-xs font-bold text-white">iPhone 13 Pro</td>
                             <td className="px-6 py-4 text-xs text-text-secondary italic">Cambio de batería original</td>
                             <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[8px] font-black uppercase">Entregado</span></td>
                             <td className="px-6 py-4 text-right text-xs font-bold text-white">$1,500.00</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
        </div>

        {/* Footer actions */}
        <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
           <button className="flex-1 bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold py-5 rounded-3xl transition-all shadow-lg flex items-center justify-center gap-3">
              <MessageSquare size={20} /> WhatsApp
           </button>
           <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-3xl border border-white/5 transition-all text-xs uppercase tracking-widest">
              Llamar al Cliente
           </button>
        </div>
      </div>
    </div>
  );
}
