"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCcw, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Boxes,
  Screwdriver,
  Eye,
  MoreVertical,
  X,
  FileText,
  Save,
  MessageSquare,
  History,
  ClipboardCheck,
  Video,
  ChevronRight,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Equipment {
  id: string;
  folio: string;
  cliente: string;
  telefono: string;
  equipo: string;
  fechaPromesa: string;
  estado: string;
  costo: number;
  falla: string;
  tecnico?: string;
  notasInternas?: string;
  seguimientoCliente?: string;
  youtubeId?: string;
}

// --- MOCK DATA ---
const MOCK_EQUIPOS: Equipment[] = [
  { id: '1', folio: 'SR-4922', cliente: 'Juan Pérez', telefono: '8112345678', equipo: 'Laptop ASUS ROG', fechaPromesa: '2026-04-05', estado: 'En Reparación', costo: 1500, falla: 'No enciende, posible corto en tarjeta madre', tecnico: 'Carlos T.' },
  { id: '2', folio: 'SR-4890', cliente: 'María García', telefono: '8119876543', equipo: 'iPhone 15 Pro', fechaPromesa: '2026-04-04', estado: 'En Diagnóstico', costo: 800, falla: 'Pantalla estrellada y no da touch', tecnico: 'Luis M.' },
  { id: '3', folio: 'SR-4875', cliente: 'Robert De Niro', telefono: '8110001112', equipo: 'MacBook Air M2', fechaPromesa: '2026-04-10', estado: 'Recibido', costo: 2200, falla: 'Limpieza preventiva y cambio de pasta térmica' },
  { id: '4', folio: 'SR-4860', cliente: 'Elon Musk', telefono: '8180009000', equipo: 'Tesla Tablet', fechaPromesa: '2026-04-03', estado: 'Esperando Refacción', costo: 4500, falla: 'Batería inflada' },
];

export default function TechnicalPanel() {
  const [items, setItems] = useState<Equipment[]>(MOCK_EQUIPOS);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [tab, setTab] = useState<'detalles' | 'notas' | 'checklist' | 'historial'>('detalles');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const getKPIs = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const critical = items.filter(i => {
      const p = new Date(i.fechaPromesa + 'T00:00:00');
      const diff = Math.ceil((p.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 1;
    }).length;
    const attention = items.filter(i => {
      const p = new Date(i.fechaPromesa + 'T00:00:00');
      const diff = Math.ceil((p.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 1 && diff <= 3;
    }).length;
    return { critical, attention, total: items.length, ready: items.filter(i => i.estado === 'Listo').length };
  };

  const kpis = getKPIs();

  const filteredItems = items.filter(i => 
    i.folio.toLowerCase().includes(search.toLowerCase()) ||
    i.cliente.toLowerCase().includes(search.toLowerCase()) ||
    i.equipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-extrabold text-white">Taller Técnico Profesional</h1>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mt-1">Gestión de diagnósticos y reparaciones</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
             <input 
               type="text" 
               placeholder="Buscar orden..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-accent-blue transition-all"
             />
           </div>
           <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-colors">
              <RotateCcw size={20} />
           </button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Urgentes / Vencidos", value: kpis.critical, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
          { label: "Atención Próxima", value: kpis.attention, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
          { label: "Listos p/ Entrega", value: kpis.ready, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
          { label: "Total en Taller", value: kpis.total, icon: Boxes, color: "text-accent-blue", bg: "bg-accent-blue/10", border: "border-accent-blue/20" },
        ].map((stat) => (
          <div key={stat.label} className={cn("border rounded-[32px] p-6 flex items-center justify-between shadow-2xl backdrop-blur-md", stat.bg, stat.border)}>
            <div>
               <div className="text-3xl font-jakarta font-black text-white mb-1">{loading ? '...' : stat.value}</div>
               <div className={cn("text-[10px] font-bold uppercase tracking-widest", stat.color)}>{stat.label}</div>
            </div>
            <div className={cn("p-4 rounded-2xl", stat.color)}>
              <stat.icon size={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <EquipmentCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} />
        ))}
      </div>

      {loading && (
        <div className="py-20 text-center">
           <RotateCcw size={32} className="animate-spin mx-auto text-accent-blue opacity-50" />
           <p className="mt-4 text-text-secondary text-sm font-bold uppercase tracking-widest">Sincronizando taller...</p>
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <TechnicalModal 
          item={selectedItem} 
          tab={tab} 
          setTab={setTab} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function EquipmentCard({ item, onOpen }: { item: Equipment, onOpen: () => void }) {
  const getStatusColor = () => {
    switch (item.estado) {
      case 'Listo': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'En Reparación': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'En Diagnóstico': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Esperando Refacción': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-white/5 text-text-secondary border-white/10';
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-[32px] p-6 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1">{item.folio}</div>
          <h3 className="text-lg font-jakarta font-extrabold text-white truncate max-w-[180px]">{item.equipo}</h3>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getStatusColor())}>
          {item.estado}
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex justify-between text-xs py-1 border-b border-white/5">
          <span className="text-text-secondary">Cliente</span>
          <span className="text-white font-bold">{item.cliente}</span>
        </div>
        <div className="flex justify-between text-xs py-1 border-b border-white/5">
          <span className="text-text-secondary">Entrega</span>
          <span className="text-accent-orange font-bold font-mono">{item.fechaPromesa}</span>
        </div>
        <div className="pt-2">
          <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mb-2">Falla Reportada</p>
          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed bg-white/5 p-3 rounded-xl italic">"{item.falla}"</p>
        </div>
      </div>

      <button 
        onClick={onOpen}
        className="w-full bg-white/5 hover:bg-accent-blue text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
      >
        <Eye size={18} className="group-hover/btn:scale-110 transition-transform" /> Ver detalles
      </button>
    </div>
  );
}

function TechnicalModal({ item, tab, setTab, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 outfit animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-[#121214] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col scale-in">
        {/* Modal Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue border border-accent-blue/20 shadow-inner">
               <Screwdriver size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-jakarta font-black text-white">{item.folio}</h3>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em]">{item.equipo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Tabs navigation */}
        <div className="px-8 pt-4 border-b border-white/5 flex gap-8 overflow-x-auto scrollbar-hide">
          {[
            { id: 'detalles', label: 'Detalles', icon: FileText },
            { id: 'notas', label: 'Notas e Informe', icon: MessageSquare },
            { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
            { id: 'historial', label: 'Cronología', icon: History },
          ].map((t) => (
            <button 
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cn(
                "pb-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all border-b-2",
                tab === t.id ? "border-accent-blue text-accent-blue" : "border-transparent text-text-secondary hover:text-white"
              )}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Modal Content container */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-gradient-to-b from-transparent to-black/20">
          
          {tab === 'detalles' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                       <p className="text-[10px] font-bold text-accent-blue uppercase tracking-widest px-1">Información del Cliente</p>
                       <div className="flex flex-col gap-1">
                          <span className="text-xl font-bold text-white tracking-tight">{item.cliente}</span>
                          <span className="text-text-secondary flex items-center gap-2 text-sm">
                             < smartphone size={14} /> {item.telefono}
                          </span>
                       </div>
                       <button className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-[#25D366]/10">
                         <Smartphone size={16} /> WhatsApp de Contacto
                       </button>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Control de Estado</p>
                       <select className="w-full input-srf bg-white/5 font-bold cursor-pointer transition-all">
                          <option>Recibido</option>
                          <option>En Diagnóstico</option>
                          <option>En Reparación</option>
                          <option>Esperando Refacción</option>
                          <option>Listo</option>
                          <option>Entregado</option>
                       </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                       <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Detalles Técnicos</p>
                       <div className="space-y-4">
                          <div className="flex justify-between border-b border-white/5 pb-3">
                             <span className="text-xs text-text-secondary">Fecha Promesa</span>
                             <span className="text-sm font-bold text-accent-orange bg-accent-orange/10 px-2 py-0.5 rounded-lg">{item.fechaPromesa}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-3">
                             <span className="text-xs text-text-secondary">Presupuesto</span>
                             <span className="text-sm font-bold text-white underline decoration-accent-blue decoration-2 underline-offset-4">${item.costo}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-xs text-text-secondary">Técnico Asignado</span>
                             <span className="text-sm font-bold text-white">{item.tecnico || 'Sin asignar'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Cámara en Vivo (ID Youtube)</p>
                       <div className="flex gap-2">
                          <input type="text" className="flex-1 input-srf p-3 text-sm font-mono" placeholder="v=..." />
                          <button className="bg-red-600/10 hover:bg-red-600/20 text-red-500 p-3 rounded-xl border border-red-500/10 transition-all">
                             <Video size={18} />
                          </button>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Falla Reportada en Ingreso</p>
                  <p className="text-sm text-white/80 leading-relaxed bg-[#1E1E1E] p-6 rounded-3xl border border-white/5 italic">
                    {item.falla}
                  </p>
               </div>
            </div>
          )}

          {tab === 'notas' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Notas Internas (Solo equipo)</label>
                  <textarea rows={6} className="w-full input-srf text-sm leading-relaxed" placeholder="Registra hallazgos técnicos internos..." />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-accent-blue uppercase tracking-[0.2em] px-1">Informe p/ Cliente (App de seguimiento)</label>
                  <textarea rows={4} className="w-full input-srf text-sm leading-relaxed" placeholder="Describe los avances para que el cliente los vea en su portal..." />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-accent-orange uppercase tracking-[0.2em] px-1">Resolución Final</label>
                  <textarea rows={3} className="w-full input-srf text-sm leading-relaxed" placeholder="Resumen de la solución aplicada..." />
               </div>
            </div>
          )}

          {tab === 'historial' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               {[
                 { action: 'Estado cambiado a En Reparación', time: 'Hace 2 horas', user: 'Carlos T.' },
                 { action: 'Diagnóstico completado', time: 'Hace 5 horas', user: 'Carlos T.' },
                 { action: 'Ingreso al sistema', time: 'Hierba 10:45 AM', user: 'Recepción' }
               ].map((h, i) => (
                 <div key={i} className="flex gap-4 items-start group">
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-secondary border border-white/5 mt-1 group-hover:bg-accent-blue/10 transition-colors">
                      <ChevronRight size={14} />
                   </div>
                   <div className="flex-1 pb-4 border-b border-white/5">
                      <div className="flex justify-between">
                         <p className="text-sm font-bold text-white">{h.action}</p>
                         <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{h.time}</span>
                      </div>
                      <p className="text-[10px] text-accent-blue mt-1 uppercase tracking-widest font-bold">Por: {h.user}</p>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
           <button className="p-4 bg-white/5 border border-white/5 rounded-2xl text-text-secondary hover:text-white transition-all shadow-inner">
             <FileText size={20} />
           </button>
           <button className="flex-1 btn-accent flex items-center justify-center gap-3">
             <Save size={20} /> Guardar Cambios
           </button>
           <button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-3">
             <CheckCircle2 size={20} /> Entregar Equipo
           </button>
        </div>
      </div>
    </div>
  );
}
