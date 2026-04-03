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

      const mappedOrders: TechOrder[] = ordersData.map((order: any) => ({
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

      const mappedTasks: TechTask[] = tasksData.map((task: any) => ({
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
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Técnico nativo</span>
          <h1>Cola de trabajo técnica</h1>
          <p>Gestiona diagnósticos, reparaciones, prioridades y entregas con un tablero más claro.</p>
        </div>
      </div>
      
      {message ? <div className={`console-message ${message.includes('Error') ? 'error' : ''}`} style={{background: message.includes('exitosamente') ? '#ecfdf5' : '#f8fafc', color: message.includes('exitosamente') ? '#059669' : '#0f172a', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontWeight: 600}}>{message}</div> : null}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px'}}>
        <article className="sdmx-card-premium" style={{background: '#fef2f2', border: '1px solid #fecaca'}}>
          <span className="hero-eyebrow" style={{color: '#dc2626'}}>Críticos</span>
          <strong style={{display: 'block', fontSize: '2rem', color: '#b91c1c', marginTop: '6px'}}>{queueMetrics.rojos}</strong>
          <p className="muted" style={{margin: '4px 0 0 0'}}>Equipos con más de 48h sin avance.</p>
        </article>
        <article className="sdmx-card-premium" style={{background: '#fffbeb', border: '1px solid #fde68a'}}>
          <span className="hero-eyebrow" style={{color: '#d97706'}}>Atención</span>
          <strong style={{display: 'block', fontSize: '2rem', color: '#b45309', marginTop: '6px'}}>{queueMetrics.amarillos}</strong>
          <p className="muted" style={{margin: '4px 0 0 0'}}>Equipos que ya requieren seguimiento técnico.</p>
        </article>
        <article className="sdmx-card-premium" style={{background: '#ecfdf5', border: '1px solid #a7f3d0'}}>
          <span className="hero-eyebrow" style={{color: '#059669'}}>A tiempo</span>
          <strong style={{display: 'block', fontSize: '2rem', color: '#047857', marginTop: '6px'}}>{queueMetrics.verdes}</strong>
          <p className="muted" style={{margin: '4px 0 0 0'}}>Equipos dentro de la ventana operativa sana.</p>
        </article>
        <article className="sdmx-card-premium" style={{background: '#eff6ff', border: '1px solid #bfdbfe'}}>
          <span className="hero-eyebrow" style={{color: '#2563eb'}}>En taller</span>
          <strong style={{display: 'block', fontSize: '2rem', color: '#1d4ed8', marginTop: '6px'}}>{orders.length}</strong>
          <p className="muted" style={{margin: '4px 0 0 0'}}>Total de órdenes activas en cola técnica.</p>
        </article>
      </div>

      <div className="sdmx-card-premium" style={{marginBottom: '16px'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(220px, 1.6fr) repeat(3, minmax(160px, 1fr))', gap: '12px'}}>
          <input
            type="text"
            className="module-search-input"
            placeholder="Buscar por folio, equipo o falla..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <select className="module-search-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TechStatusFilter)}>
            {TECH_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select className="module-search-input" value={colorFilter} onChange={(event) => setColorFilter(event.target.value as TechColorFilter)}>
            <option value="ALL">Todos los colores</option>
            <option value="rojo">Rojo crítico</option>
            <option value="amarillo">Amarillo atención</option>
            <option value="verde">Verde a tiempo</option>
          </select>
          <select className="module-search-input" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as TechSortOrder)}>
            <option value="urgency">Ordenar por urgencia</option>
            <option value="recent">Más recientes primero</option>
            <option value="folio">Folio</option>
          </select>
        </div>
      </div>

      <div className="module-native-grid">
        <form className="sdmx-card-premium" onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: 800}}>Actualizar orden</h3>
          {selectedOrder ? (
            <div style={{padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0'}}>
              <span className="hero-eyebrow">Orden activa</span>
              <strong style={{display: 'block', marginTop: '4px', color: '#0f172a'}}>
                {selectedOrder.folio} · {[selectedOrder.deviceType, selectedOrder.deviceBrand, selectedOrder.deviceModel].filter(Boolean).join(" ")}
              </strong>
              <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>
                {selectedOrder.reportedIssue || "Sin falla reportada"}
              </p>
            </div>
          ) : null}

          {selectedOrder ? (
            <div style={{padding: '14px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'grid', gap: '12px'}}>
              <div>
                <span className="hero-eyebrow">Evidencias del expediente</span>
                <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.82rem'}}>
                  Primer corte de Storage: ya puedes listar y subir evidencias ligadas a la orden seleccionada.
                </p>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '180px 1fr', gap: '10px'}}>
                <select
                  style={{padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid #bfdbfe', background: 'white'}}
                  value={assetType}
                  onChange={(event) => setAssetType(event.target.value)}
                  disabled={!canUploadTechAssets || assetUploading}
                >
                  <option value="progress_photo">Foto de avance</option>
                  <option value="delivery_photo">Foto de entrega</option>
                  <option value="evidence">Evidencia general</option>
                </select>
                <label style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '0.75rem', border: '1px dashed #60a5fa', background: 'white', padding: '0.75rem 1rem', cursor: assetUploading ? 'wait' : 'pointer', fontWeight: 700, color: '#1d4ed8'}}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{display: 'none'}}
                    disabled={assetUploading || !canUploadTechAssets}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleAssetUpload(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  {!canUploadTechAssets ? "Solo lectura para tu rol" : assetUploading ? "Subiendo evidencia..." : "Seleccionar imagen para expediente"}
                </label>
              </div>

              {assetFeedback ? (
                <div style={{fontSize: '0.8rem', fontWeight: 700, color: assetFeedback.includes("exitosamente") ? '#047857' : '#b91c1c'}}>
                  {assetFeedback}
                </div>
              ) : null}

              <div style={{display: 'grid', gap: '8px'}}>
                {assets.length === 0 ? (
                  <div style={{fontSize: '0.8rem', color: '#64748b'}}>Sin evidencias registradas todavía para esta orden.</div>
                ) : (
                  assets.map((asset) => (
                    <a
                      key={asset.id}
                      href={asset.publicUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      style={{display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'white', border: '1px solid #dbeafe', color: '#0f172a', textDecoration: 'none'}}
                    >
                      <span style={{fontWeight: 700}}>{asset.fileType}</span>
                      <span className="muted" style={{fontSize: '0.75rem'}}>{new Date(asset.createdAt).toLocaleString("es-MX")}</span>
                    </a>
                  ))
                )}
              </div>
            </div>
          ) : null}
          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
            Seleccionar Orden
            <select style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}} value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
              <option value="">-- Elige un equipo --</option>
              {orders.map((order) => <option key={order.id} value={order.id}>{order.folio} · {order.deviceType || "Equipo"}</option>)}
            </select>
          </label>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
              Estatus técnico
              <select style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="diagnostico">Diagnóstico</option>
                <option value="reparacion">Reparación</option>
                <option value="espera_refaccion">Espera Refacción</option>
                <option value="listo">Listo para Entrega</option>
              </select>
            </label>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
              Costo final (MXN)
              <input type="number" min="0" step="0.01" style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}} value={finalCost} onChange={(e) => setFinalCost(e.target.value)} />
            </label>
          </div>

          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
            Bitácora de Seguimiento (Interno)
            <textarea style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minHeight: '80px'}} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="¿Qué se le ha hecho al equipo?" />
          </label>

          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
            Resolución del Caso (Visible en PDF Cliente)
            <textarea style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minHeight: '80px', background: '#f8fafc'}} value={resolucion} onChange={(e) => setResolucion(e.target.value)} placeholder="Ej. Cambio de centro de carga y limpieza profunda." />
          </label>

          <button type="submit" className="sdmx-btn-primary" style={{marginTop: '0.5rem'}}>Guardar Avance Técnico</button>
        </form>

        <article className="sdmx-card-premium">
          <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '1rem'}}>
            <div>
              <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: 800}}>Semáforo técnico</h3>
              <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Visualizando {filteredOrders.length} orden(es) dentro de la cola filtrada.</p>
            </div>
          </div>
          <ul className="data-list" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            {orders.length === 0 ? (
              <li style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Sin órdenes técnicas pendientes.</li>
            ) : (
              filteredOrders.map((order) => {
                const urgency = getUrgencyMetrics(order.createdAt);
                return (
                  <li key={order.id} style={{
                    padding: '1rem', 
                    borderRadius: '0.95rem', 
                    border: `1px solid ${urgency.border}`, 
                    background: urgency.background,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    position: 'relative',
                    boxShadow: selectedOrderId === order.id ? '0 0 0 2px rgba(37, 99, 235, 0.16)' : 'none',
                    cursor: 'pointer'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <strong style={{fontSize: '0.875rem', color: '#0f172a'}}>{order.folio} · {order.deviceType || "Equipo"}</strong>
                      <span className={`sdmx-badge ${order.status === 'listo' ? 'sdmx-badge-emerald' : 'sdmx-badge-amber'}`}>{order.status}</span>
                    </div>
                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>{[order.deviceBrand, order.deviceModel].filter(Boolean).join(" ") || "Equipo sin marca/modelo capturado"}</span>
                    <span style={{fontSize: '0.75rem', color: '#475569'}}>{order.reportedIssue || "Sin falla capturada"}</span>
                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap'}}>
                      <span style={{fontSize: '0.7rem', fontWeight: 900, color: urgency.accent, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                        {urgency.label}
                      </span>
                      <span style={{fontSize: '0.72rem', color: '#475569'}}>
                        {urgency.ageCopy}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      style={{
                        marginTop: '4px',
                        alignSelf: 'flex-start',
                        background: '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      Ver y editar
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </article>

        <article className="sdmx-card-premium">
          <h3 style={{margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 800}}>Tareas del Taller</h3>
          <ul className="data-list" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            {tasks.length === 0 ? (
              <li style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>No hay tareas asignadas.</li>
            ) : (
              tasks.map((task) => (
                <li key={task.id} style={{padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9', background: 'white'}}>
                  <strong style={{fontSize: '0.875rem', color: '#0f172a', display: 'block'}}>{task.title}</strong>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem'}}>
                     <span style={{fontSize: '0.75rem', color: '#64748b'}}>{task.status}</span>
                     <span style={{fontSize: '0.75rem', fontWeight: 600, color: task.priority === 'alta' ? '#ef4444' : '#3b82f6'}}>{task.priority}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </article>
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
