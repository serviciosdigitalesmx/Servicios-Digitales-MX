"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { fetchWithAuth } from "../../lib/apiClient";
import { 
  IconSearch, IconPlus, IconCheckCircular, IconWarning, IconPen, 
  IconThumbsUp, IconChart, IconSync, IconArchive, IconMonitor, 
  IconClose, IconUser, IconPaperPlane, IconCircleNotch 
} from "./Icons";

type RequestStatusFilter = "ALL" | "pendiente" | "aprobada";

type ServiceRequest = {
  id: string; folio: string; customerName: string; customerPhone?: string; customerEmail?: string;
  deviceType?: string; deviceModel?: string; issueDescription?: string; urgency?: string;
  status: string; quotedTotal: number; depositAmount: number; balanceAmount: number;
  createdAt?: string;
  solicitudOrigenIp?: string;
};

type ServiceRequestApiRow = {
  id: string;
  folio: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  deviceType: string | null;
  deviceModel: string | null;
  issueDescription: string | null;
  urgency: string | null;
  status: string;
  quotedTotal: number | null;
  depositAmount: number | null;
  balanceAmount: number | null;
  createdAt?: string | null;
  solicitudOrigenIp: string | null;
};

import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

const SERVICE_REQUEST_STATUS_LABELS: Record<string, string> = { pendiente: "En Dictamen / Pausa", aprobada: "Autorizada (Comercial)" };
function getRequestStatusLabel(value?: string) { return SERVICE_REQUEST_STATUS_LABELS[(value ?? "").trim().toLowerCase()] ?? (value ? value.charAt(0).toUpperCase() + value.slice(1) : "Abierto"); }
function normalizeRequestStatus(value?: string) { return (value ?? "").trim().toLowerCase(); }
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error || isPostgrestError(error) ? error.message : fallback;
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "message" in error;
}

function mapServiceRequestRow(request: ServiceRequestApiRow): ServiceRequest {
  return {
    id: request.id,
    folio: request.folio,
    customerName: request.customerName,
    customerPhone: request.customerPhone ?? undefined,
    customerEmail: request.customerEmail ?? undefined,
    deviceType: request.deviceType ?? undefined,
    deviceModel: request.deviceModel ?? undefined,
    issueDescription: request.issueDescription ?? undefined,
    urgency: request.urgency ?? undefined,
    status: request.status,
    quotedTotal: Number(request.quotedTotal || 0),
    depositAmount: Number(request.depositAmount || 0),
    balanceAmount: Number(request.balanceAmount || 0),
    createdAt: request.createdAt ?? undefined,
    solicitudOrigenIp: request.solicitudOrigenIp ?? undefined
  };
}

export function SolicitudesNative() {
  const { session } = useAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "", deviceType: "", deviceModel: "",
    issueDescription: "", urgency: "normal", quotedTotal: "0", depositAmount: "0"
  });

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true); setApiStateMessage(""); setApiStateError("");
    try {
      const response = await fetchWithAuth("/api/service-requests?page=1&pageSize=100");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo cargar la bandeja de solicitudes");
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      setItems(data.map(mapServiceRequestRow));
    } catch (error: unknown) {
       setApiStateError(getErrorMessage(error, "Error de conexión al cargar la bandeja."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  useEffect(() => {
    if (!session?.shop.id) return;

    const channel = supabase
      .channel(`solicitudes-live-${session.shop.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
          filter: `tenant_id=eq.${session.shop.id}`
        },
        () => {
          void loadData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.shop.id]);

  useEffect(() => {
    if (!selectedRequestId && items.length > 0) {
      setSelectedRequestId(items[0].id);
    }
    if (items.length === 0) {
      setSelectedRequestId("");
    }
  }, [items, selectedRequestId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setApiStateMessage(""); setApiStateError("");

    if (!session?.shop.id) return;
    if (!form.customerName.trim() || !form.deviceType.trim()) return setFormError("Los campos Prospecto y Equipo son obligatorios.");
    const quoted = Number(form.quotedTotal || 0);
    const deposit = Number(form.depositAmount || 0);
    if (deposit > quoted) return setFormError("El anticipo no puede ser mayor al costo cotizado.");

    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/service-requests", {
        method: "POST",
        body: JSON.stringify({
          branchId: session.user.branchId || null,
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim() || null,
          customerEmail: form.customerEmail.trim() || null,
          deviceType: form.deviceType.trim(),
          deviceModel: form.deviceModel.trim() || null,
          issueDescription: form.issueDescription.trim() || null,
          urgency: form.urgency,
          quotedTotal: quoted,
          depositAmount: deposit,
          balanceAmount: Math.max(quoted - deposit, 0)
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo registrar la cotización");
      }

      setForm({ customerName: "", customerPhone: "", customerEmail: "", deviceType: "", deviceModel: "", issueDescription: "", urgency: "normal", quotedTotal: "0", depositAmount: "0" });
      setIsModalOpen(false);
      await loadData();
      setApiStateMessage(`Solicitud completada exitosamente${payload?.data?.folio ? ` (${payload.data.folio})` : ""}.`);
      setTimeout(() => setApiStateMessage(""), 4000);
    } catch (error: unknown) {
       setApiStateError(getErrorMessage(error, "Error al registrar la cotización."));
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesSearch =
      !search ||
      item.folio.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (item.deviceType && item.deviceType.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || normalizeRequestStatus(item.status) === statusFilter;
    return matchesSearch && matchesStatus;
  }), [items, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      borradores: items.filter(i => i.status.toLowerCase() === 'pendiente').length,
      aprobadas: items.filter(i => i.status.toLowerCase() === 'aprobada').length,
      potencial: items.reduce((acc, curr) => acc + curr.quotedTotal, 0)
    };
  }, [items]);

  const selectedRequest = useMemo(
    () => filteredItems.find((item) => item.id === selectedRequestId) ?? filteredItems[0],
    [filteredItems, selectedRequestId]
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', transition: 'all 0.3s ease'}}>
      
      {/* HEADER & GLOBAL ACTIONS */}
      <div className="finanzas-header" style={{marginBottom: 0}}>
         <div>
            <h1>Cotizaciones</h1>
            <p>Captura diagnósticos previos y presupuesta nuevos servicios.</p>
         </div>
         <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
           <div style={{position: 'relative', width: '280px'}}>
             <div style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center'}}>
                <IconSearch width={14} height={14} />
             </div>
             <input 
               type="text" 
               placeholder="Buscar folio o cliente..." 
               value={search} 
               onChange={(e) => setSearch(e.target.value)}
               style={{width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.875rem', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)'}}
             />
           </div>
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value as RequestStatusFilter)}
             style={{padding: '0.625rem 1rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.875rem', outline: 'none'}}
           >
             <option value="ALL">Todos los estados</option>
             <option value="pendiente">Pendientes</option>
             <option value="aprobada">Aprobadas</option>
           </select>
           <button onClick={() => setIsModalOpen(true)} className="sdmx-btn-primary">
              <IconPlus width={16} height={16} />
              Nueva Cotización
           </button>
         </div>
      </div>

      {apiStateMessage && <div style={{padding: '1rem', background: '#ecfdf5', color: '#059669', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconCheckCircular width={16} height={16} />{apiStateMessage}</div>}
      {apiStateError && <div style={{padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconWarning width={16} height={16} />{apiStateError}</div>}

      {/* STATS ROW */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem'}}>
         <div className="sdmx-card-premium" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{background: '#f8fafc', color: '#64748b', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <IconPen width={20} height={20} />
            </div>
            <div>
               <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Borradores</p>
               <p style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0'}}>{stats.borradores}</p>
            </div>
         </div>
         <div className="sdmx-card-premium" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{background: '#ecfdf5', color: '#10b981', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <IconThumbsUp width={20} height={20} />
            </div>
            <div>
               <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Aprobadas</p>
               <p style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0'}}>{stats.aprobadas}</p>
            </div>
         </div>
         <div className="sdmx-card-premium" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{background: '#eff6ff', color: '#3b82f6', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <IconChart width={20} height={20} />
            </div>
            <div>
               <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Ingreso Potencial</p>
               <p style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0'}}>{formatMoney(stats.potencial)}</p>
            </div>
         </div>
         <div className="sdmx-card-premium" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{background: '#fff7ed', color: '#ea580c', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <IconPaperPlane width={20} height={20} />
            </div>
            <div>
               <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Saldo por convertir</p>
               <p style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0'}}>{formatMoney(items.reduce((acc, curr) => acc + curr.balanceAmount, 0))}</p>
            </div>
         </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.7fr)', gap: '1.5rem'}}>
      {/* LIST VIEW */}
      <div className="sdmx-card-premium">
         <div className="sdmx-card-header">
            <div>
               <h3>Bandeja de Entrada</h3>
               <p>Registros de cotización activos</p>
            </div>
            <div>
               <button className="sdmx-btn-ghost" onClick={() => void loadData()} disabled={loading}>
                 <IconSync width={14} height={14} style={{animation: loading ? 'sdmx-spin 1s linear infinite' : 'none'}} />
               </button>
            </div>
         </div>
         <div className="sdmx-card-body" style={{padding: 0}}>
            <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
               {filteredItems.length === 0 ? (
                  <li style={{padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8'}}>
                     <div style={{background: '#f1f5f9', width: '4rem', height: '4rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#64748b'}}>
                        <IconArchive width={24} height={24} />
                     </div>
                     <strong style={{display: 'block', color: '#1e293b', fontSize: '1.125rem', marginBottom: '0.25rem'}}>No hay registros activos</strong>
                     <span style={{fontSize: '0.875rem'}}>Registra una nueva cotización comercial disponible en el botón superior.</span>
                  </li>
               ) : (
                  filteredItems.map((item, idx) => (
                    <li key={item.id} onClick={() => setSelectedRequestId(item.id)} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: selectedRequest?.id === item.id ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#f8fafc', transition: 'background 0.2s', cursor: 'pointer'}}>
                       <div style={{display: 'flex', gap: '1.25rem'}}>
                          <div style={{background: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '4.5rem', border: '1px solid #dbeafe'}}>
                             <span style={{fontSize: '0.5625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8}}>FOLIO</span>
                             <strong style={{fontSize: '0.875rem'}}>{item.folio}</strong>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                             <strong style={{fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem'}}>{item.customerName}</strong>
                             <div style={{fontSize: '0.8125rem', color: '#64748b', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                                <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><IconMonitor width={12} height={12} style={{opacity:0.7}} /> {item.deviceType || "Genérico"}</span>
                                <span style={{color: '#cbd5e1'}}>•</span>
                                <span>{item.issueDescription?.slice(0, 60) || "Sin historial vinculado"}...</span>
                                {item.solicitudOrigenIp && (
                                  <>
                                    <span style={{color: '#cbd5e1'}}>•</span>
                                    <span style={{fontSize: '0.625rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace'}}>IP: {item.solicitudOrigenIp}</span>
                                  </>
                                )}
                             </div>
                          </div>
                       </div>

                       <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem'}}>
                          <span className={`sdmx-badge ${item.status.toLowerCase() === 'aprobada' ? 'sdmx-badge-emerald' : 'sdmx-badge-amber'}`}>
                             {getRequestStatusLabel(item.status)}
                          </span>
                          {item.quotedTotal > 0 && (
                            <div style={{display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600}}>
                               <span style={{color: '#64748b'}}>Costo: <strong style={{color: '#0f172a'}}>{formatMoney(item.quotedTotal)}</strong></span>
                               {item.depositAmount > 0 && <span style={{color: '#10b981'}}>Anticipo: {formatMoney(item.depositAmount)}</span>}
                            </div>
                          )}
                       </div>
                    </li>
                  ))
               )}
            </ul>
         </div>
      </div>

      <aside className="sdmx-card-premium" style={{alignSelf: 'start', position: 'sticky', top: '96px'}}>
        <div className="sdmx-card-header">
          <div>
            <h3>Cotización Activa</h3>
            <p>Lectura rápida comercial de la solicitud seleccionada.</p>
          </div>
        </div>
        <div className="sdmx-card-body" style={{display: 'grid', gap: '1rem'}}>
          {!selectedRequest ? (
            <div className="empty-state">
              <strong>Sin solicitud seleccionada</strong>
              <span>Elige una cotización de la bandeja para ver su resumen comercial.</span>
            </div>
          ) : (
            <>
              <div style={{padding: '1rem', borderRadius: '1rem', background: '#eff6ff', border: '1px solid #dbeafe'}}>
                <span className="hero-eyebrow">Folio activo</span>
                <strong style={{display: 'block', fontSize: '1.15rem', marginTop: '6px', color: '#1d4ed8'}}>{selectedRequest.folio}</strong>
                <p style={{margin: '6px 0 0 0', color: '#334155', fontWeight: 600}}>{selectedRequest.customerName}</p>
              </div>

              <div style={{display: 'grid', gap: '0.75rem'}}>
                <div>
                  <span className="hero-eyebrow">Contacto</span>
                  <p style={{margin: '4px 0 0 0', color: '#0f172a'}}>{selectedRequest.customerPhone || "Sin teléfono"} · {selectedRequest.customerEmail || "Sin correo"}</p>
                </div>
                <div>
                  <span className="hero-eyebrow">Equipo</span>
                  <p style={{margin: '4px 0 0 0', color: '#0f172a'}}>{[selectedRequest.deviceType, selectedRequest.deviceModel].filter(Boolean).join(" ") || "Equipo por definir"}</p>
                </div>
                <div>
                  <span className="hero-eyebrow">Necesidad del cliente</span>
                  <p style={{margin: '4px 0 0 0', color: '#334155', lineHeight: 1.6}}>{selectedRequest.issueDescription || "Sin descripción detallada"}</p>
                </div>
              </div>

              <div style={{padding: '1rem', borderRadius: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0'}}>
                  <span className="muted">Estado</span>
                  <strong style={{color: '#0f172a'}}>{getRequestStatusLabel(selectedRequest.status)}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0'}}>
                  <span className="muted">Urgencia</span>
                  <strong style={{color: '#0f172a'}}>{selectedRequest.urgency?.toUpperCase() || "NORMAL"}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0'}}>
                  <span className="muted">Costo cotizado</span>
                  <strong style={{color: '#0f172a'}}>{formatMoney(selectedRequest.quotedTotal)}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0'}}>
                  <span className="muted">Anticipo</span>
                  <strong style={{color: '#059669'}}>{formatMoney(selectedRequest.depositAmount)}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span className="muted">Saldo</span>
                  <strong style={{color: '#ea580c'}}>{formatMoney(selectedRequest.balanceAmount)}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
      </div>

      {/* FLOATING MODAL */}
      {isModalOpen && (
        <div style={{position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)'}}>
           <div style={{background: 'white', borderRadius: '1.25rem', width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}} className="sdmx-scrollbar">
              
              <div style={{padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 10}}>
                 <div>
                    <h3 style={{fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0}}>Nueva Cotización</h3>
                    <p style={{fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0'}}>Emite un dictamen preliminar.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} style={{background: '#f1f5f9', border: 'none', width: '2rem', height: '2rem', borderRadius: '0.5rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <IconClose width={16} height={16} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} style={{padding: '1.5rem'}}>
                 {formError && <div style={{padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #fee2e2', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconWarning width={16} height={16} />{formError}</div>}
                 
                 <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    {/* CLIENT INFO */}
                    <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9'}}>
                       <h4 style={{fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconUser width={14} height={14} />Datos de Contacto</h4>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Prospecto / Organización *</label>
                             <input required style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Ej. Corporativo Zenith"/>
                          </div>
                       </div>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Teléfono Celular</label>
                             <input style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="10 dígitos"/>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Correo Electrónico</label>
                             <input type="email" style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="usuario@empresa.com"/>
                          </div>
                       </div>
                    </div>

                    {/* DEVICE INFO */}
                    <div>
                       <h4 style={{fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0, display:'flex', alignItems:'center', gap:'0.5rem'}}><IconMonitor width={14} height={14} />Activo Tecnológico</h4>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Tipo de Equipo *</label>
                             <input required style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} placeholder="Laptop, Servidor..."/>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Modelo Específico</label>
                             <input style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} placeholder="Ej. ThinkPad T14"/>
                          </div>
                       </div>
                       <div style={{display: 'flex', flexDirection: 'column', marginTop: '1rem'}}>
                          <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Descripción del Requerimiento</label>
                          <textarea style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem', minHeight: '5rem', resize: 'vertical'}} value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} placeholder="Detalla el escenario de falla o mejora esperada..."></textarea>
                       </div>
                    </div>

                    {/* FINANCIAL INFO */}
                    <div style={{background: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #dbeafe'}}>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.375rem'}}>SLA Prioridad</label>
                             <select style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', background: 'white', outline: 'none', fontSize: '0.875rem'}} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                                <option value="baja">Baja</option>
                                <option value="normal">Estándar</option>
                                <option value="alta">Prioritaria</option>
                                <option value="urgente">Crítica</option>
                             </select>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.375rem'}}>Presupuesto (MXN) *</label>
                             <input type="number" min="0" step="0.01" style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', outline: 'none', fontSize: '0.875rem', fontWeight: 'bold'}} value={form.quotedTotal} onChange={(e) => setForm({ ...form, quotedTotal: e.target.value })} />
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginBottom: '0.375rem'}}>Anticipo</label>
                             <input type="number" min="0" step="0.01" style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #a7f3d0', background: '#ecfdf5', outline: 'none', fontSize: '0.875rem', color: '#059669', fontWeight: 'bold'}} value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
                          </div>
                       </div>
                    </div>

                 </div>

                 <div style={{paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="sdmx-btn-ghost">Cancelar</button>
                    <button type="submit" disabled={loading} className="sdmx-btn-primary">
                       {loading ? <IconCircleNotch width={16} height={16} style={{animation:'sdmx-spin 1s linear infinite'}} /> : <IconPaperPlane width={16} height={16} />}
                       Confirmar Alta
                    </button>
                 </div>
              </form>

           </div>
        </div>
      )}

    </div>
  );
}
