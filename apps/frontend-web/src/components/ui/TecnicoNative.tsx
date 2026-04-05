"use client";

import React, { useState, useEffect } from "react";
import { 
  IconDashboard, 
  IconCheckCircular, 
  IconStar, 
  IconMicrochip,
  IconWallet,
  IconStore
} from "./Icons";

// ----------------------------------------------------------------------
// Mock Data (PARA VISUALIZACIÓN INICIAL)
// ----------------------------------------------------------------------
const MOCK_EQUIPOS = [
  { id: 1, folio: "SRF-24001", cliente: "Jesús Villa", equipo: "iPhone 13 Pro", falla: "Cambio de pantalla", estado: "En Reparación", dias: 1, color: "rojo" },
  { id: 2, folio: "SRF-24002", cliente: "Maria Gza", equipo: "Surface Pro 7", falla: "No enciende", estado: "En Diagnóstico", dias: 3, color: "amarillo" },
  { id: 3, folio: "SRF-24003", cliente: "Pedro Soto", equipo: "GPU RTX 3080", falla: "Reballing", estado: "Listo", dias: 6, color: "verde" },
];

export function TecnicoNative({ tenantId }: { tenantId: string }) {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipo, setSelectedEquipo] = useState<any>(null);

  const filtered = MOCK_EQUIPOS.filter(e => {
    const matchesSearch = e.folio.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "todos" || e.color === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (color: string) => {
    switch (color) {
      case "rojo": return "bg-red-500/10 border-red-500/30 text-red-500";
      case "amarillo": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
      case "verde": return "bg-green-500/10 border-green-500/30 text-green-500";
      default: return "bg-slate-800 text-slate-400";
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      
      {/* KPIs DE SEMÁFORO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-srf p-5 border-red-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl"></div>
          <p className="text-[10px] text-red-500 font-tech uppercase tracking-widest mb-1">Críticos</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">01</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">≤ 2 DÍAS</span>
          </div>
        </div>
        <div className="card-srf p-5 border-yellow-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 blur-2xl"></div>
          <p className="text-[10px] text-yellow-500 font-tech uppercase tracking-widest mb-1">Atención</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">01</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">3-4 DÍAS</span>
          </div>
        </div>
        <div className="card-srf p-5 border-green-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 blur-2xl"></div>
          <p className="text-[10px] text-green-500 font-tech uppercase tracking-widest mb-1">A Tiempo</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">01</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">≥ 5 DÍAS</span>
          </div>
        </div>
        <div className="card-srf p-5 border-blue-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl"></div>
          <p className="text-[10px] text-blue-500 font-tech uppercase tracking-widest mb-1">En Taller</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">03</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">TOTAL</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR DE BÚSQUEDA */}
      <div className="card-srf p-4 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Buscar folio o cliente..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-slate-900 border border-blue-500/20 rounded-xl px-5 py-3 text-sm text-white focus:border-orange-500 outline-none transition-all"
        />
        <select 
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-slate-900 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-400 font-tech uppercase tracking-widest outline-none"
        >
          <option value="todos">Todos los Estatus</option>
          <option value="rojo">🔴 Urgentes</option>
          <option value="amarillo">🟡 Atención</option>
          <option value="verde">🟢 A Tiempo</option>
        </select>
      </div>

      {/* GRID DE EQUIPOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((e) => (
          <div 
            key={e.id} 
            onClick={() => setSelectedEquipo(e)}
            className="card-srf p-6 hover:border-orange-500/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${e.color === 'rojo' ? 'bg-red-500' : e.color === 'amarillo' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 block">Folio</span>
                <h4 className="text-lg font-tech text-white">{e.folio}</h4>
              </div>
              <span className={`text-[9px] px-3 py-1 rounded-full border uppercase font-label font-black tracking-widest ${getStatusColor(e.color)}`}>
                {e.color === 'rojo' ? 'Urgente' : e.color === 'amarillo' ? 'Atención' : 'Estable'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
               <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold font-label tracking-widest">Cliente</span>
                  <p className="text-sm text-slate-300">{e.cliente}</p>
               </div>
               <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold font-label tracking-widest">Dispositivo</span>
                  <p className="text-sm text-blue-400 font-medium">{e.equipo}</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold font-label">{e.estado}</span>
               </div>
               <span className="text-[10px] text-orange-500 font-tech uppercase">{e.dias} Días</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE DETALLES (Look Sr-Fix Master) */}
      {selectedEquipo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="card-srf w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
              <header className="p-6 border-b border-white/10 flex justify-between items-center">
                 <h3 className="text-xl font-tech text-white uppercase tracking-wider flex items-center gap-3">
                    <IconMicrochip width={20} height={20} className="text-blue-500" />
                    Detalle: {selectedEquipo.folio}
                 </h3>
                 <button onClick={() => setSelectedEquipo(null)} className="text-slate-500 hover:text-white transition-colors">
                    <IconCheckCircular width={24} height={24} />
                 </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-8 bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-1">Propietario</span>
                        <p className="text-sm text-white font-tech">{selectedEquipo.cliente}</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-1">Equipo</span>
                        <p className="text-sm text-blue-400 font-tech">{selectedEquipo.equipo}</p>
                    </div>
                 </div>

                 <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Falla Reportada</span>
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl italic">"{selectedEquipo.falla}"</p>
                 </div>

                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Actualizar Estatus Técnico</label>
                    <select className="w-full input-srf rounded-xl p-4 text-sm outline-none">
                       <option>En Diagnóstico</option>
                       <option>Esperando Refacción</option>
                       <option>En Reparación</option>
                       <option>Listo para Entrega</option>
                    </select>
                 </div>
              </div>

              <footer className="p-6 border-t border-white/10 flex gap-4">
                 <button onClick={() => setSelectedEquipo(null)} className="flex-1 bg-slate-800 text-slate-400 font-tech text-[10px] uppercase py-4 rounded-xl tracking-widest">
                    Cerrar
                 </button>
                 <button className="flex-[2] btn-naranja font-tech text-xs uppercase py-4 rounded-xl tracking-[0.2em]">
                    Guardar Cambios
                 </button>
              </footer>
           </div>
        </div>
      )}

    </div>
  );
}
