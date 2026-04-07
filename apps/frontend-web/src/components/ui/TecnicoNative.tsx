"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  IconDashboard, IconCheckCircular, IconStar, 
  IconMicrochip, IconWallet, IconStore
} from "./Icons";

type TechnicianDraft = {
  internalDiagnosis: string;
  technicalResolution: string;
  finalCost: string;
  checklist: {
    ingresoValidado: boolean;
    diagnosticoCompleto: boolean;
    refaccionConfirmada: boolean;
    pruebasFinales: boolean;
  };
};

const DRAFTS_STORAGE_KEY = "sdmx_tecnico_drafts";

function getDrafts(): Record<string, TechnicianDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDrafts(drafts: Record<string, TechnicianDraft>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

function getQueueColor(status?: string, priority?: string) {
  if ((priority || "").toLowerCase() === "urgente") return "rojo";
  if (["listo", "entregado"].includes((status || "").toLowerCase())) return "verde";
  return "amarillo";
}

function createDefaultDraft(source?: any): TechnicianDraft {
  return {
    internalDiagnosis: source?.originalData?.internalDiagnosis || "",
    technicalResolution: source?.originalData?.casoResolucionTecnica || "",
    finalCost: source?.originalData?.finalCost ? String(source.originalData.finalCost) : "",
    checklist: {
      ingresoValidado: false,
      diagnosticoCompleto: false,
      refaccionConfirmada: false,
      pruebasFinales: false,
    },
  };
}

export function TecnicoNative({ tenantId }: any = {}) {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
  const [nuevoEstatus, setNuevoEstatus] = useState("");
  const [draft, setDraft] = useState<TechnicianDraft>(createDefaultDraft());
  const [toast, setToast] = useState("");

  const [equipos, setEquipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchQueue = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5111";
      const res = await fetch(`${baseUrl}/api/technician/queue`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) throw new Error('Falló al cargar la cola');

      const json = await res.json();
      if (json.success && json.data && json.data.orders) {
        const mapped = json.data.orders.map((o: any) => {
          const color = getQueueColor(o.status, o.priority);

          const ms = new Date().getTime() - new Date(o.createdAt).getTime();
          const dias = Math.max(0, Math.floor(ms / (1000 * 3600 * 24)));

          return {
            id: o.id,
            folio: o.folio,
            cliente: "Asignado", // Protegido en la vista del técnico
            equipo: `${o.deviceBrand || ''} ${o.deviceModel || o.deviceType || 'Equipo'}`.trim(),
            falla: o.reportedIssue || "Revisión general",
            estado: o.status,
            dias: dias,
            color: color,
            originalData: o
          };
        });
        setEquipos(mapped);
      }
    } catch (err) {
      console.error("Error cargando cola de técnico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenModal = (e: any) => {
    setSelectedEquipo(e);
    setNuevoEstatus(e.estado);
    const drafts = getDrafts();
    setDraft(drafts[e.id] || createDefaultDraft(e));
  };

  const handleSaveStatus = async () => {
    if (!selectedEquipo) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5111";
      
      const res = await fetch(`${baseUrl}/api/service-orders/${selectedEquipo.id}/technician`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          status: nuevoEstatus,
          internalDiagnosis: draft.internalDiagnosis,
          casoResolucionTecnica: draft.technicalResolution,
          finalCost: draft.finalCost ? Number(draft.finalCost) : null
        })
      });

      if (res.ok) {
        const drafts = getDrafts();
        drafts[selectedEquipo.id] = draft;
        saveDrafts(drafts);
        setEquipos(prev => prev.map(e => e.id === selectedEquipo.id ? {
          ...e,
          estado: nuevoEstatus,
          color: getQueueColor(nuevoEstatus, e.originalData?.priority),
          originalData: {
            ...e.originalData,
            internalDiagnosis: draft.internalDiagnosis,
            casoResolucionTecnica: draft.technicalResolution,
            finalCost: draft.finalCost ? Number(draft.finalCost) : null
          }
        } : e));
        setToast("Cambios técnicos guardados correctamente.");
        setSelectedEquipo(null);
      } else {
        const drafts = getDrafts();
        drafts[selectedEquipo.id] = draft;
        saveDrafts(drafts);
        setEquipos(prev => prev.map(e => e.id === selectedEquipo.id ? {
          ...e,
          originalData: {
            ...e.originalData,
            internalDiagnosis: draft.internalDiagnosis,
            casoResolucionTecnica: draft.technicalResolution,
            finalCost: draft.finalCost ? Number(draft.finalCost) : null
          }
        } : e));
        setToast("Se guardó el avance local del técnico, pero el backend todavía no confirmó la actualización.");
        setSelectedEquipo(null);
      }
    } catch (error) {
      const drafts = getDrafts();
      drafts[selectedEquipo.id] = draft;
      saveDrafts(drafts);
      console.error(error);
      setToast("Se guardó el avance local del técnico. Revisa la conexión con el backend para sincronizar.");
      setSelectedEquipo(null);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filtered = equipos.filter(e => {
    const matchesSearch = e.folio.toLowerCase().includes(searchTerm.toLowerCase());
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <IconMicrochip className="animate-spin-slow text-blue-500" width={40} height={40} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {toast && (
        <div className="form-message is-success">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-srf p-5 border-red-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl"></div>
          <p className="text-[10px] text-red-500 font-tech uppercase tracking-widest mb-1">Críticos</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">{equipos.filter(e => e.color === 'rojo').length}</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">URGENTES</span>
          </div>
        </div>
        <div className="card-srf p-5 border-yellow-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 blur-2xl"></div>
          <p className="text-[10px] text-yellow-500 font-tech uppercase tracking-widest mb-1">Atención</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">{equipos.filter(e => e.color === 'amarillo').length}</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">NORMALES</span>
          </div>
        </div>
        <div className="card-srf p-5 border-green-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 blur-2xl"></div>
          <p className="text-[10px] text-green-500 font-tech uppercase tracking-widest mb-1">Listos</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">{equipos.filter(e => e.color === 'verde').length}</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">PARA ENTREGA</span>
          </div>
        </div>
        <div className="card-srf p-5 border-blue-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl"></div>
          <p className="text-[10px] text-blue-500 font-tech uppercase tracking-widest mb-1">En Taller</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">{equipos.length}</span>
            <span className="text-[9px] text-slate-500 font-label font-bold">TOTAL</span>
          </div>
        </div>
      </div>

      <div className="card-srf p-4 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Buscar por folio..."
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
          <option value="verde">🟢 Listos</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((e) => (
          <div 
            key={e.id} 
            onClick={() => handleOpenModal(e)}
            className="card-srf p-6 hover:border-orange-500/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${e.color === 'rojo' ? 'bg-red-500' : e.color === 'amarillo' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 block">Folio</span>
                <h4 className="text-lg font-tech text-white">{e.folio}</h4>
              </div>
              <span className={`text-[9px] px-3 py-1 rounded-full border uppercase font-label font-black tracking-widest ${getStatusColor(e.color)}`}>
                {e.estado}
              </span>
            </div>

            <div className="space-y-3 mb-6">
               <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold font-label tracking-widest block mb-1">Dispositivo</span>
                  <p className="text-sm text-blue-400 font-medium">{e.equipo}</p>
               </div>
               <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold font-label tracking-widest block mb-1">Falla Reportada</span>
                  <p className="text-xs text-slate-300 line-clamp-2">{e.falla}</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${e.estado === 'listo' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold font-label">{e.estado}</span>
               </div>
               <span className="text-[10px] text-orange-500 font-tech uppercase">{e.dias} Días</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-tech uppercase tracking-widest">
            No hay equipos que coincidan con la búsqueda.
          </div>
        )}
      </div>

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
                    <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-1">Equipo</span>
                        <p className="text-base text-blue-400 font-tech">{selectedEquipo.equipo}</p>
                    </div>
                 </div>

                 <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Falla Reportada</span>
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl italic">"{selectedEquipo.falla}"</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Diagnóstico interno</label>
                      <textarea
                        value={draft.internalDiagnosis}
                        onChange={(e) => setDraft((current) => ({ ...current, internalDiagnosis: e.target.value }))}
                        className="w-full input-srf rounded-xl p-4 text-sm outline-none text-white bg-slate-900 border-white/10 focus:border-blue-500 min-h-[140px]"
                        placeholder="Ej. Se detecta daño en conector de carga y falso contacto en la tarjeta."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Resolución técnica</label>
                      <textarea
                        value={draft.technicalResolution}
                        onChange={(e) => setDraft((current) => ({ ...current, technicalResolution: e.target.value }))}
                        className="w-full input-srf rounded-xl p-4 text-sm outline-none text-white bg-slate-900 border-white/10 focus:border-blue-500 min-h-[140px]"
                        placeholder="Ej. Reemplazar módulo, hacer limpieza y ejecutar pruebas finales."
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-3">Checklist técnico</span>
                      <div className="space-y-3">
                        {[
                          ["ingresoValidado", "Ingreso y evidencia revisados"],
                          ["diagnosticoCompleto", "Diagnóstico completo"],
                          ["refaccionConfirmada", "Refacción o solución confirmada"],
                          ["pruebasFinales", "Pruebas finales completadas"],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 text-sm text-slate-200">
                            <input
                              type="checkbox"
                              checked={draft.checklist[key as keyof TechnicianDraft["checklist"]]}
                              onChange={(e) =>
                                setDraft((current) => ({
                                  ...current,
                                  checklist: {
                                    ...current.checklist,
                                    [key]: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-3">Cierre del caso</span>
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Costo final</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.finalCost}
                        onChange={(e) => setDraft((current) => ({ ...current, finalCost: e.target.value }))}
                        className="w-full input-srf rounded-xl p-4 text-sm outline-none text-white bg-slate-900 border-white/10 focus:border-blue-500"
                        placeholder="0.00"
                      />

                      <div className="mt-4 rounded-xl border border-white/5 bg-slate-950/70 p-4">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Resumen rápido</span>
                        <div className="space-y-2 text-sm text-slate-300">
                          <p><strong className="text-white">Estatus:</strong> {nuevoEstatus || selectedEquipo.estado}</p>
                          <p><strong className="text-white">Días en taller:</strong> {selectedEquipo.dias}</p>
                          <p><strong className="text-white">Checklist completo:</strong> {Object.values(draft.checklist).filter(Boolean).length}/4</p>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label block mb-2">Actualizar Estatus Técnico</label>
                    <select 
                      value={nuevoEstatus}
                      onChange={(e) => setNuevoEstatus(e.target.value)}
                      className="w-full input-srf rounded-xl p-4 text-sm outline-none text-white bg-slate-900 border-white/10 focus:border-blue-500"
                    >
                       <option value="recibido">Recibido</option>
                       <option value="diagnostico">En Diagnóstico</option>
                       <option value="reparacion">En Reparación</option>
                       <option value="listo">Listo para Entrega</option>
                    </select>
                 </div>
              </div>

              <footer className="p-6 border-t border-white/10 flex gap-4">
                 <button onClick={() => setSelectedEquipo(null)} className="flex-1 bg-slate-800 text-slate-400 font-tech text-[10px] uppercase py-4 rounded-xl tracking-widest hover:bg-slate-700 transition-colors">
                    Cancelar
                 </button>
                 <button 
                   onClick={handleSaveStatus}
                   disabled={saving}
                   className="flex-[2] btn-naranja font-tech text-xs uppercase py-4 rounded-xl tracking-[0.2em] disabled:opacity-50 flex justify-center items-center gap-2"
                 >
                   {saving ? <IconMicrochip className="animate-spin text-white" width={16} height={16} /> : null}
                   {saving ? 'Guardando...' : 'Guardar Cambios'}
                 </button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
}
