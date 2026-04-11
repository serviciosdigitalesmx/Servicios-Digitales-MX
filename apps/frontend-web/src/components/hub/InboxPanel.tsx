"use client";

import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Search, 
  RotateCcw, 
  MessageSquare, 
  FileText, 
  Archive, 
  CheckCircle2, 
  User,
  Smartphone,
  Info,
  ChevronRight,
  X,
  Plus,
  Trash2,
  DollarSign,
  Send,
  Printer,
  Mail,
  Zap,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface QuoteRequest {
  folio: string;
  nombre: string;
  telefono: string;
  email: string;
  dispositivo: string;
  modelo: string;
  problemas: string;
  urgencia: string;
  fecha: string;
}

interface QuoteItem {
  id: string;
  concepto: string;
  cantidad: number;
  precio: number;
}

const MOCK_SOLICITUDES: any[] = [];

export default function InboxPanel() {
  const [solicitudes, setSolicitudes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([{ id: '1', concepto: '', cantidad: 1, precio: 0 }]);
  const [iva, setIva] = useState(false);
  const [anticipo, setAnticipo] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAddRow = () => {
    setQuoteItems([...quoteItems, { id: Date.now().toString(), concepto: '', cantidad: 1, precio: 0 }]);
  };

  const handleUpdateRow = (id: string, field: keyof QuoteItem, value: any) => {
    setQuoteItems(quoteItems.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((acc, it) => acc + (it.cantidad * it.precio), 0);
    const tax = iva ? subtotal * 0.16 : 0;
    const total = subtotal + tax;
    const saldo = Math.max(0, total - anticipo);
    return { subtotal, tax, total, saldo };
  };

  const { subtotal, tax, total, saldo } = calculateTotals();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-extrabold text-white">Bandeja de Solicitudes</h1>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mt-1">Nuevas cotizaciones desde el portal web</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="px-4 py-2 bg-accent-blue/10 rounded-full border border-accent-blue/20 text-accent-blue text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" /> Live Monitoring
           </div>
           <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-colors">
              <RotateCcw size={20} />
           </button>
        </div>
      </header>

      {/* Stats Mini Row */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
         {[
           { label: 'Pendientes', value: solicitudes.length, color: 'text-orange-500' },
           { label: 'Urgencia Alta', value: solicitudes.filter(s => s.urgencia === 'Alta').length, color: 'text-red-500' },
           { label: 'Hoy', value: 2, color: 'text-accent-blue' }
         ].map((s, idx) => (
           <div key={idx} className="bg-white/5 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-4 min-w-[160px]">
              <span className={cn("text-2xl font-black font-jakarta", s.color)}>{s.value}</span>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-tight">{s.label}</span>
           </div>
         ))}
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solicitudes.map((s) => (
          <div key={s.folio} className="bg-black/40 border border-white/10 rounded-[32px] p-8 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
               <div className="bg-accent-blue/10 px-3 py-1 rounded-lg border border-accent-blue/20 text-[10px] font-mono font-bold text-accent-blue">
                 {s.folio}
               </div>
               <span className={cn(
                 "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest",
                 s.urgencia === 'Alta' ? "bg-red-500/20 text-red-500 border border-red-500/10" : "bg-white/5 text-text-secondary"
               )}>
                 {s.urgencia}
               </span>
            </div>

            <h3 className="text-xl font-jakarta font-black text-white mb-2">{s.nombre}</h3>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Smartphone size={12} /> {s.dispositivo} · {s.modelo}
            </p>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex-1 mb-8 overflow-hidden">
               <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                 <Info size={12} className="text-accent-blue" /> Problema Reportado
               </p>
               <p className="text-xs text-white/80 line-clamp-3 leading-relaxed italic">"{s.problemas}"</p>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setSelected(s)}
                className="w-full btn-accent flex items-center justify-center gap-2 py-3.5 text-xs tracking-widest uppercase font-black"
              >
                <FileText size={18} /> Cotizar Ahora
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                   <MessageSquare size={14} /> WhatsApp
                </button>
                <button className="bg-white/5 border border-white/5 text-text-secondary hover:text-red-500 transition-all py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                   <Archive size={14} /> Archivar
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center text-[10px] text-text-secondary font-bold tracking-widest opacity-50">
               <span className="flex items-center gap-2"><Clock size={10} /> RECIBIDA</span>
               <span>{s.fecha}</span>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="py-20 text-center opacity-30">
          <RotateCcw size={32} className="animate-spin mx-auto text-accent-blue mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest">Sincronizando Inbox...</p>
        </div>
      )}

      {/* Quote Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelected(null)} />
           
           <div className="bg-[#121214] border border-white/10 w-full max-w-4xl rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col scale-in h-[90vh]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-jakarta font-black text-white">Cotización {selected.folio}</h3>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em]">{selected.nombre} · {selected.dispositivo}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-3 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
                 {/* Top summary row */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 relative group">
                       <span className="absolute top-4 right-4 bg-accent-blue/10 text-accent-blue text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Prospecto</span>
                       <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4">Caso Web</p>
                       <p className="text-sm text-white/80 leading-relaxed italic line-clamp-4">
                         "{selected.problemas} - {selected.modelo}"
                       </p>
                    </div>

                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                       <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Resumen de Contacto</p>
                       <div className="space-y-3">
                          <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                             <span className="text-text-secondary">Teléfono</span>
                             <span className="text-white font-bold">{selected.telefono}</span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                             <span className="text-text-secondary">Email</span>
                             <span className="text-white font-bold">{selected.email}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="text-text-secondary">Urgencia</span>
                             <span className={cn("font-black uppercase tracking-widest", selected.urgencia === 'Alta' ? "text-red-500" : "text-white")}>{selected.urgencia}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Dynamic Quote Items */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h4 className="text-lg font-jakarta font-black text-white">Conceptos del Servicio</h4>
                       <button 
                         onClick={handleAddRow}
                         className="flex items-center gap-2 text-[10px] font-black text-accent-blue uppercase tracking-widest hover:underline"
                        >
                         <Plus size={14} /> Agregar Item
                       </button>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="grid grid-cols-12 gap-4 px-2 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                          <div className="col-span-7">Descripción / Concepto</div>
                          <div className="col-span-2 text-center">Cant.</div>
                          <div className="col-span-3 text-right">Precio Unit.</div>
                       </div>
                       
                       {quoteItems.map((it, idx) => (
                         <div key={it.id} className="grid grid-cols-12 gap-3 group">
                            <div className="col-span-7 border border-white/10 bg-white/5 rounded-xl flex items-center">
                               <input 
                                 type="text" 
                                 placeholder="Describa el trabajo o pieza..." 
                                 className="w-full bg-transparent p-3 text-sm text-white outline-none"
                                 value={it.concepto}
                                 onChange={(e) => handleUpdateRow(it.id, 'concepto', e.target.value)}
                               />
                            </div>
                            <div className="col-span-2 border border-white/10 bg-white/5 rounded-xl">
                               <input 
                                 type="number" 
                                 placeholder="1" 
                                 className="w-full bg-transparent p-3 text-sm text-white text-center outline-none"
                                 value={it.cantidad}
                                 onChange={(e) => handleUpdateRow(it.id, 'cantidad', parseInt(e.target.value) || 0)}
                               />
                            </div>
                            <div className="col-span-3 flex gap-2">
                               <div className="flex-1 border border-white/10 bg-white/5 rounded-xl flex items-center px-3">
                                  <span className="text-text-secondary text-xs font-bold mr-1">$</span>
                                  <input 
                                    type="number" 
                                    placeholder="0" 
                                    className="w-full bg-transparent p-3 text-sm text-white text-right outline-none font-bold"
                                    value={it.precio}
                                    onChange={(e) => handleUpdateRow(it.id, 'precio', parseFloat(e.target.value) || 0)}
                                  />
                               </div>
                               <button 
                                 onClick={() => setQuoteItems(quoteItems.filter(x => x.id !== it.id))}
                                 disabled={quoteItems.length === 1}
                                 className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-0"
                                >
                                  <Trash2 size={18} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Totals & Notes */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Notas de Cotización</label>
                        <textarea rows={4} className="w-full input-srf text-sm leading-relaxed" placeholder="Vigencia, condiciones, garantía..."></textarea>
                        
                        <div className="flex items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                           <label className="flex items-center gap-3 cursor-pointer group flex-1">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  checked={iva}
                                  onChange={() => setIva(!iva)}
                                  className="w-6 h-6 rounded-lg border-2 border-white/10 bg-transparent checked:bg-accent-blue checked:border-accent-blue transition-all appearance-none cursor-pointer" 
                                />
                                {iva && <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white" />}
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">Aplicar IVA (16%)</span>
                           </label>
                           <div className="flex-1">
                             <label className="text-[8px] font-bold text-text-secondary uppercase block mb-1">Anticipo / Depósito</label>
                             <div className="flex items-center border-b border-white/10 pb-1">
                                <span className="text-text-secondary text-xs mr-2">$</span>
                                <input 
                                  type="number" 
                                  value={anticipo}
                                  onChange={(e) => setAnticipo(parseFloat(e.target.value) || 0)}
                                  className="bg-transparent text-white font-bold outline-none w-full text-right" 
                                />
                             </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="bg-black/40 border border-white/10 rounded-[32px] p-8 space-y-4 shadow-2xl">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-text-secondary font-bold uppercase tracking-widest">Subtotal</span>
                              <span className="text-white font-bold tracking-tight">${subtotal.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-text-secondary font-bold uppercase tracking-widest">Impuestos (IVA)</span>
                              <span className="text-white font-bold tracking-tight">${tax.toLocaleString()}</span>
                           </div>
                           <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.3em]">Total General</span>
                              <span className="text-3xl font-black text-white font-jakarta tracking-tighter">${total.toLocaleString()}</span>
                           </div>
                           <div className="p-4 bg-accent-orange/10 border border-accent-orange/20 rounded-2xl flex justify-between items-center">
                              <span className="text-[10px] font-black text-accent-orange uppercase tracking-widest">Saldo Restante</span>
                              <span className="text-xl font-black text-white tracking-widest">${saldo.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
                 <button className="p-4 bg-white/5 border border-white/5 rounded-2xl text-text-secondary hover:text-white transition-all shadow-inner">
                   <Printer size={20} />
                 </button>
                 <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/5 text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-inner">
                    <Send size={18} className="text-accent-blue" /> WhatsApp Cotización
                 </button>
                 <button className="flex-1 btn-accent py-4 flex items-center justify-center gap-3">
                   <Zap size={20} /> Archivar y Enviar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
