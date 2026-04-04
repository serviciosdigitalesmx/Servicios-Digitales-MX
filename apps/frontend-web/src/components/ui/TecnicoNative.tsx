"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";

type TechOrder = {
  id: string;
  folio: string;
  status: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  reportedIssue?: string;
  internalDiagnosis?: string;
  finalCost: number;
  priority?: string;
  createdAt: string;
  casoResolucionTecnica?: string;
  promisedDate?: string;
};

type TechTask = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
};

type TechAsset = {
  id: string;
  serviceOrderId?: string;
  fileType: string;
  bucketName: string;
  storagePath: string;
  publicUrl?: string;
  createdAt: string;
};

type TechStatusFilter = "ALL" | "diagnostico" | "reparacion" | "espera_refaccion" | "listo";
type TechColorFilter = "ALL" | "rojo" | "amarillo" | "verde";
type TechSortOrder = "urgency" | "recent" | "folio";

import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";

const TECH_STATUS_OPTIONS: Array<{ value: TechStatusFilter; label: string }> = [
  { value: "ALL", label: "Todos los estados" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "reparacion", label: "Reparación" },
  { value: "espera_refaccion", label: "Espera refacción" },
  { value: "listo", label: "Listo para entrega" }
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeStatus(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeRole(role?: string) {
  const normalized = (role ?? "").trim().toLowerCase();
  return normalized === "admin" ? "owner" : normalized;
}

function getUrgencyMetrics(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours > 48) {
    return {
      color: "rojo" as const,
      label: "Crítico",
      accent: "#ef4444",
      background: "#fef2f2",
      border: "#fecaca",
      ageCopy: `+${Math.floor(diffHours)}h sin avance`
    };
  }

  if (diffHours > 24) {
    return {
      color: "amarillo" as const,
      label: "Atención",
      accent: "#f59e0b",
      background: "#fffbeb",
      border: "#fde68a",
      ageCopy: `${Math.ceil(diffDays)} día(s) en taller`
    };
  }

  return {
    color: "verde" as const,
    label: "A tiempo",
    accent: "#10b981",
    background: "#ecfdf5",
    border: "#a7f3d0",
    ageCopy: `${Math.max(1, Math.ceil(diffHours))}h desde ingreso`
  };
}

export function TecnicoNative() {
  const { session } = useAuth();
  const normalizedRole = normalizeRole(session?.user?.role);
  const canUploadTechAssets = ["owner", "manager", "technician"].includes(normalizedRole);
  const [orders, setOrders] = useState<TechOrder[]>([]);
  const [tasks, setTasks] = useState<TechTask[]>([]);
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [resolucion, setResolucion] = useState("");
  const [status, setStatus] = useState("diagnostico");
  const [finalCost, setFinalCost] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TechStatusFilter>("ALL");
  const [colorFilter, setColorFilter] = useState<TechColorFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<TechSortOrder>("urgency");
  const [assets, setAssets] = useState<TechAsset[]>([]);
  const [assetType, setAssetType] = useState("progress_photo");
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetFeedback, setAssetFeedback] = useState("");

  async function loadQueue() {
    if (!session?.shop.id) return;
    
    try {
      const response = await fetchWithAuth("/api/technician/queue");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo cargar la cola técnica");
      }

      const ordersData = Array.isArray(payload?.data?.orders) ? payload.data.orders : [];
      const tasksData = Array.isArray(payload?.data?.tasks) ? payload.data.tasks : [];

      const mappedOrders: TechOrder[] = ordersData.map((order: TechOrder) => ({
        id: order.id,
        folio: order.folio,
        status: order.status,
        deviceType: order.deviceType,
        deviceBrand: order.deviceBrand,
        deviceModel: order.deviceModel,
        reportedIssue: order.reportedIssue,
        internalDiagnosis: order.internalDiagnosis,
        casoResolucionTecnica: order.casoResolucionTecnica,
        finalCost: Number(order.finalCost || 0),
        priority: order.priority,
        promisedDate: order.promisedDate,
        createdAt: order.createdAt
      }));

      const mappedTasks: TechTask[] = tasksData.map((task: TechTask) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
      }));

      setOrders(mappedOrders);
      setTasks(mappedTasks);

      setMessage("");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "No se pudo cargar la cola técnica"));
    }
  }

  useEffect(() => {
    if (session) void loadQueue();
  }, [session]);

  useEffect(() => {
    if (!session?.shop.id) return;

    const channel = supabase
      .channel(`tecnico-live-${session.shop.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_orders",
          filter: `tenant_id=eq.${session.shop.id}`
        },
        () => {
          void loadQueue();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `tenant_id=eq.${session.shop.id}`
        },
        () => {
          void loadQueue();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.shop.id]);

  // Seleccionar orden y precargar datos
  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find(o => o.id === selectedOrderId);
      if (order) {
        setDiagnosis(order.internalDiagnosis || "");
        setResolucion(order.casoResolucionTecnica || "");
        setStatus(order.status || "diagnostico");
        setFinalCost(String(order.finalCost || 0));
      }
    }
  }, [selectedOrderId, orders]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrderId) {
      setMessage("Selecciona una orden para actualizar.");
      return;
    }
    try {
      const response = await fetchWithAuth(`/api/service-orders/${selectedOrderId}/technician`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          internalDiagnosis: diagnosis,
          casoResolucionTecnica: resolucion,
          finalCost: Number(finalCost || 0)
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo actualizar la orden");
      }

      setMessage("Orden técnica actualizada exitosamente.");
      await loadQueue();
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "No se pudo actualizar la orden"));
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const nextOrders = orders.filter((order) => {
      const urgency = getUrgencyMetrics(order.createdAt);
      const matchesSearch =
        !normalizedQuery ||
        order.folio.toLowerCase().includes(normalizedQuery) ||
        `${order.deviceType ?? ""} ${order.deviceBrand ?? ""} ${order.deviceModel ?? ""}`.toLowerCase().includes(normalizedQuery) ||
        (order.reportedIssue ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL" || normalizeStatus(order.status) === statusFilter;
      const matchesColor = colorFilter === "ALL" || urgency.color === colorFilter;
      return matchesSearch && matchesStatus && matchesColor;
    });

    nextOrders.sort((left, right) => {
      if (sortOrder === "recent") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      if (sortOrder === "folio") {
        return left.folio.localeCompare(right.folio);
      }

      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });

    return nextOrders;
  }, [orders, searchQuery, statusFilter, colorFilter, sortOrder]);

  const queueMetrics = useMemo(() => {
    const metrics = {
      rojos: 0,
      amarillos: 0,
      verdes: 0
    };

    for (const order of orders) {
      const urgency = getUrgencyMetrics(order.createdAt);
      if (urgency.color === "rojo") metrics.rojos += 1;
      if (urgency.color === "amarillo") metrics.amarillos += 1;
      if (urgency.color === "verde") metrics.verdes += 1;
    }

    return metrics;
  }, [orders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (!selectedOrderId) {
      setAssets([]);
      setAssetFeedback("");
      return;
    }

    let cancelled = false;

    async function loadAssets() {
      try {
        const response = await fetchWithAuth(`/api/service-orders/${selectedOrderId}/assets`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar las evidencias");
        }

        const payload = await response.json();
        if (!cancelled) {
          setAssets(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setAssets([]);
          setAssetFeedback(getErrorMessage(error, "No se pudieron leer las evidencias"));
        }
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  async function handleAssetUpload(file: File | null) {
    if (!file || !selectedOrderId) return;
    if (!canUploadTechAssets) {
      setAssetFeedback("Tu rol no puede subir evidencias técnicas desde este módulo.");
      return;
    }

    setAssetUploading(true);
    setAssetFeedback("");
    try {
      const base64 = await fileToBase64(file);
      const response = await fetchWithAuth(`/api/service-orders/${selectedOrderId}/assets`, {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          base64Data: base64,
          fileType: assetType
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo subir la evidencia");
      }

      setAssetFeedback("Evidencia subida exitosamente.");
      const refreshed = await fetchWithAuth(`/api/service-orders/${selectedOrderId}/assets`);
      const refreshedPayload = await refreshed.json();
      setAssets(Array.isArray(refreshedPayload?.data) ? refreshedPayload.data : []);
    } catch (error) {
      setAssetFeedback(getErrorMessage(error, "No se pudo subir la evidencia"));
    } finally {
      setAssetUploading(false);
    }
  }

  return (
    <section className="tecnico-shell animate-fadeIn space-y-8">
      <div className="tecnico-header flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex-col">
          <span className="font-label uppercase tracking-[0.3em] text-blue-500 font-black text-[10px] block mb-2">Puesto de Control Técnico</span>
          <h1 className="font-tech text-white text-4xl uppercase tracking-tighter mb-2">Cola de Trabajo</h1>
          <p className="font-label text-slate-500 max-w-xl text-lg">Monitorea la carga del taller, despacha equipos listos y mantén el flujo de reparaciones bajo control.</p>
        </div>
      </div>
      
      {message && (
        <div className={`p-4 rounded-xl font-label font-bold text-sm animate-fadeIn border ${
          message.includes('Error') 
            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {message}
        </div>
      )}

      {/* MÉTRICAS DE SEMÁFORO TÁCTICO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <article className="sdmx-glass p-6 rounded-3xl border-red-500/20 bg-red-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[60px] rounded-full -mr-12 -mt-12 transition-all group-hover:bg-red-500/20" />
          <span className="font-tech text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">Críticos</span>
          <strong className="block font-tech text-white text-4xl mt-3 tracking-tighter">{queueMetrics.rojos}</strong>
          <p className="font-label text-slate-500 text-[10px] uppercase font-bold mt-2 tracking-widest">+48H Sin Avance</p>
        </article>

        <article className="sdmx-glass p-6 rounded-3xl border-amber-500/20 bg-amber-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-[60px] rounded-full -mr-12 -mt-12 transition-all group-hover:bg-amber-500/20" />
          <span className="font-tech text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">Atención</span>
          <strong className="block font-tech text-white text-4xl mt-3 tracking-tighter">{queueMetrics.amarillos}</strong>
          <p className="font-label text-slate-500 text-[10px] uppercase font-bold mt-2 tracking-widest">Requerido Seguimiento</p>
        </article>

        <article className="sdmx-glass p-6 rounded-3xl border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[60px] rounded-full -mr-12 -mt-12 transition-all group-hover:bg-emerald-500/20" />
          <span className="font-tech text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">A Tiempo</span>
          <strong className="block font-tech text-white text-4xl mt-3 tracking-tighter">{queueMetrics.verdes}</strong>
          <p className="font-label text-slate-500 text-[10px] uppercase font-bold mt-2 tracking-widest">Flujo Saludable</p>
        </article>

        <article className="sdmx-glass p-6 rounded-3xl border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[60px] rounded-full -mr-12 -mt-12 transition-all group-hover:bg-blue-500/20" />
          <span className="font-tech text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">Total Taller</span>
          <strong className="block font-tech text-white text-4xl mt-3 tracking-tighter">{orders.length}</strong>
          <p className="font-label text-slate-500 text-[10px] uppercase font-bold mt-2 tracking-widest">Equipos en Diagnóstico</p>
        </article>
      </div>

      {/* FILTROS DE CONSOLA */}
      <div className="sdmx-glass p-4 rounded-2xl border-white/5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 font-label text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
            placeholder="🔎 Buscar Folio o Equipo..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <select 
            className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 font-label text-blue-400 font-bold text-xs uppercase tracking-widest focus:border-blue-500/50 outline-none cursor-pointer"
            value={statusFilter} 
            onChange={(event) => setStatusFilter(event.target.value as TechStatusFilter)}
          >
            {TECH_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">{option.label}</option>
            ))}
          </select>
          <select 
            className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 font-label text-slate-400 font-bold text-xs uppercase tracking-widest focus:border-blue-500/50 outline-none cursor-pointer"
            value={colorFilter} 
            onChange={(event) => setColorFilter(event.target.value as TechColorFilter)}
          >
            <option value="ALL" className="bg-slate-900">Niveles de Alerta</option>
            <option value="rojo" className="bg-slate-900">Rojo Crítico</option>
            <option value="amarillo" className="bg-slate-900">Amarillo Atención</option>
            <option value="verde" className="bg-slate-900">Verde a Tiempo</option>
          </select>
          <select 
            className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 font-label text-slate-400 font-bold text-xs uppercase tracking-widest focus:border-blue-500/50 outline-none cursor-pointer"
            value={sortOrder} 
            onChange={(event) => setSortOrder(event.target.value as TechSortOrder)}
          >
            <option value="urgency" className="bg-slate-900">Prioridad Operativa</option>
            <option value="recent" className="bg-slate-900">Cronológico</option>
            <option value="folio" className="bg-slate-900">Folio</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* FORMULARIO DE ACTUALIZACIÓN TÉCNICA */}
        <form className="xl:col-span-4 sdmx-glass p-8 rounded-[2.5rem] border-white/5 flex flex-col space-y-6" onSubmit={handleSubmit}>
          <div className="mb-4">
             <span className="font-tech text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">Actualización de Estado</span>
             <h3 className="font-tech text-white text-xl uppercase mt-1">Terminal Técnico</h3>
          </div>

          {selectedOrder ? (
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-blue-500/20 border-l-4 border-l-blue-500 space-y-2">
              <div className="flex justify-between items-start">
                 <strong className="text-white font-tech text-sm uppercase tracking-wider">{selectedOrder.folio}</strong>
                 <span className="bg-blue-600/10 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest animate-pulse">Activa</span>
              </div>
              <p className="font-label text-slate-300 text-xs font-bold uppercase tracking-wider leading-relaxed">
                {[selectedOrder.deviceType, selectedOrder.deviceBrand, selectedOrder.deviceModel].filter(Boolean).join(" ")}
              </p>
              <p className="font-label text-slate-500 text-[10px] italic mt-2 border-t border-white/5 pt-2">
                REPORTE: "{selectedOrder.reportedIssue || "Sin falla capturada"}"
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 border-dashed text-center">
              <p className="font-label text-slate-600 text-xs font-bold uppercase tracking-widest">Selecciona una orden del historial</p>
            </div>
          )}

          {selectedOrder && (
            <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5 space-y-4">
              <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black block">Carga de Evidencias</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  className="bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-label text-xs uppercase tracking-widest focus:border-blue-500/50 outline-none"
                  value={assetType}
                  onChange={(event) => setAssetType(event.target.value)}
                  disabled={!canUploadTechAssets || assetUploading}
                >
                  <option value="progress_photo" className="bg-slate-900">Foto Avance</option>
                  <option value="delivery_photo" className="bg-slate-900">Foto Entrega</option>
                  <option value="evidence" className="bg-slate-900">Evidencia Gral.</option>
                </select>
                <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-tech text-[9px] font-black uppercase tracking-[0.2em] py-3 rounded-xl cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={assetUploading || !canUploadTechAssets}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleAssetUpload(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  {assetUploading ? "Subiendo..." : "Lanzar Captura"}
                </label>
              </div>
              
              {assetFeedback && <p className="text-[10px] font-label font-bold text-blue-400 uppercase tracking-widest mt-2">{assetFeedback}</p>}

              <div className="flex gap-2 overflow-x-auto pb-2 sdmx-scrollbar">
                {assets.length === 0 ? (
                  <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Sin adjuntos</span>
                ) : (
                  assets.map((asset) => (
                    <a key={asset.id} href={asset.publicUrl} target="_blank" className="bg-slate-900 border border-white/5 rounded-lg p-2 flex-shrink-0 group hover:border-blue-500/30">
                       <span className="text-[8px] text-slate-500 group-hover:text-blue-400 font-bold uppercase">{asset.fileType}</span>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black ml-1">Estado Operativo</label>
                <select 
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-label font-bold focus:border-blue-500/50 outline-none"
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="diagnostico" className="bg-slate-900">Diagnóstico</option>
                  <option value="reparacion" className="bg-slate-900">En Reparación</option>
                  <option value="espera_refaccion" className="bg-slate-900">En Espera Refacción</option>
                  <option value="listo" className="bg-slate-900">Listo (Entrega)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black ml-1">Monto de Cierre</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-tech text-sm focus:border-blue-500/50 outline-none"
                  min="0" step="0.01" 
                  value={finalCost} 
                  onChange={(e) => setFinalCost(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black ml-1">Bitácora Técnica (Interno)</label>
              <textarea 
                className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-label font-bold text-sm focus:border-blue-500/50 outline-none min-h-[100px] resize-none"
                value={diagnosis} 
                onChange={(e) => setDiagnosis(e.target.value)} 
                placeholder="Anota hallazgos, componentes probados y pasos técnicos..." 
              />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] text-blue-500 uppercase tracking-widest font-black ml-1">Reporte de Resolución (Público)</label>
              <textarea 
                className="w-full bg-blue-600/5 border border-blue-500/10 rounded-2xl px-6 py-4 text-white font-label font-bold text-sm focus:border-blue-500/30 outline-none min-h-[100px] resize-none"
                value={resolucion} 
                onChange={(e) => setResolucion(e.target.value)} 
                placeholder="¿Qué se le dirá al cliente? Ej. Se reemplazó el disco duro y se reinstaló sistema." 
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-tech text-[10px] uppercase tracking-[0.3em] font-black shadow-xl shadow-blue-500/20 transition-all mt-4">
               Confirmar Registro de Avance
            </button>
          </div>
        </form>

        {/* LISTADO DE PRIORIDADES (SEMÁFORO) */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          <div className="sdmx-glass p-8 rounded-[2.5rem] border-white/5 flex flex-col h-[640px]">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="font-tech text-white text-xl uppercase tracking-wider">Historial Operativo Taller</h3>
                  <p className="font-label text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Sincronizado con Central de Servicios</p>
               </div>
               <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full font-label text-[11px] font-black uppercase tracking-widest border border-white/5">
                 {filteredOrders.length} Resultados
               </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-3 sdmx-scrollbar">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
                   <div className="text-4xl mb-4">⚙️</div>
                   <p className="font-tech text-white text-[10px] uppercase tracking-[0.2em]">Taller sin asignaciones activas</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const urgency = getUrgencyMetrics(order.createdAt);
                  const active = selectedOrderId === order.id;
                  return (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`group flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                        active 
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5' 
                        : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10'
                      }`}
                      style={{
                        borderLeftWidth: '6px',
                        borderLeftColor: urgency.accent
                      }}
                    >
                      <div className="flex items-center gap-5">
                         <div className="flex flex-col">
                            <strong className="font-tech text-white text-sm uppercase tracking-wider">{order.folio}</strong>
                            <p className="font-label text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                              {[order.deviceType, order.deviceBrand].filter(Boolean).join(" ")}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                               <span className="font-tech text-[9px] font-black uppercase tracking-widest" style={{ color: urgency.accent }}>
                                  {urgency.label} · {urgency.ageCopy}
                               </span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 text-right">
                         <span className={`font-label font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                           order.status === 'listo' 
                             ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                             : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                         }`}>
                           {order.status}
                         </span>
                         <span className="font-tech text-slate-600 text-[10px] group-hover:text-white transition-all uppercase">
                           Ver Detalles →
                         </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TAREAS RÁPIDAS */}
          <div className="sdmx-glass p-8 rounded-[2.5rem] border-white/5">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                   <div className="w-4 h-4 border-2 border-current rounded-full animate-spin-slow" />
                </div>
                <div>
                   <h3 className="font-tech text-white text-base uppercase tracking-wider">Tablero de Tareas Taller</h3>
                   <p className="font-label text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">Mantenimiento y Logística Interna</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-slate-900/40 rounded-3xl border border-white/5 opacity-40 font-label text-[10px] font-black uppercase tracking-[0.2em]">Cero pendientes administrativos</div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex justify-between items-center group">
                       <div>
                          <strong className="font-label text-white text-xs block truncate max-w-[200px]">{task.title}</strong>
                          <span className={`text-[9px] font-black uppercase tracking-widest mt-1 block ${
                            task.priority === 'alta' ? 'text-red-400' : 'text-blue-400'
                          }`}>{task.priority}</span>
                       </div>
                       <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-all cursor-pointer">
                          <div className="w-1 h-1 bg-slate-600 group-hover:bg-blue-400 rounded-full" />
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el archivo"));
        return;
      }

      const [, base64 = ""] = result.split(",", 2);
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("No se pudo procesar el archivo"));
    reader.readAsDataURL(file);
  });
}
