"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { fetchWithAuth } from "../../lib/apiClient";
import { useAuth } from "./AuthGuard";

type ReceptionStep = 1 | 2 | 3;

type Customer = { id: string; fullName: string; phone?: string; email?: string; tag: string; };

type Order = {
  id: string; folio: string; status: string; deviceType: string; deviceModel?: string;
  priority?: string; customerName?: string; assignedTechnician?: string; estimatedCost?: number;
  promisedDate?: string; createdAt: string;
};

type OrderAsset = {
  id: string;
  serviceOrderId?: string;
  fileType: string;
  bucketName: string;
  storagePath: string;
  publicUrl?: string;
  createdAt: string;
};

type CustomerApiRow = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  tag?: string | null;
};

type ServiceOrderApiRow = {
  id: string;
  folio: string;
  status: string;
  deviceType: string;
  deviceModel?: string | null;
  priority?: string | null;
  estimatedCost?: number | null;
  promisedDate?: string | null;
  createdAt: string;
};

import { supabase } from "../../lib/supabase";

function normalizeRole(role?: string) {
  const normalized = (role ?? "").trim().toLowerCase();
  return normalized === "admin" ? "owner" : normalized;
}

function formatDate(value?: string) {
  if (!value) return "Sin promesa";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatMoney(value?: number) {
  if (value === undefined || value === null) return "$0.00";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);
}

const SERVICE_ORDER_STATUS_ALIASES: Record<string, string> = { received: "recibido", diagnosing: "diagnostico", repairing: "reparacion", completed: "entregado" };
const SERVICE_ORDER_STATUS_LABELS: Record<string, string> = { recibido: "Recibido", diagnostico: "En diagnóstico", reparacion: "En reparación", listo: "Listo", entregado: "Entregado", cancelado: "Cancelado", archivado: "Archivado" };

const SERVICE_ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "Todos los estados" }, { value: "recibido", label: "Recibido" },
  { value: "diagnostico", label: "En diagnóstico" }, { value: "reparacion", label: "En reparación" },
  { value: "listo", label: "Listo" }, { value: "entregado", label: "Entregado" }
];

function normalizeServiceOrderStatus(value?: string) { return SERVICE_ORDER_STATUS_ALIASES[(value ?? "").trim().toLowerCase()] ?? (value ?? "").trim().toLowerCase(); }
function getServiceOrderStatusLabel(value?: string) { return SERVICE_ORDER_STATUS_LABELS[normalizeServiceOrderStatus(value)] ?? (value ? value : "Sin estado"); }
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error || isPostgrestError(error) ? error.message : fallback;
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "message" in error;
}

function mapCustomerApiRow(customer: CustomerApiRow): Customer {
  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    tag: customer.tag || "nuevo"
  };
}

function mapServiceOrderApiRow(order: ServiceOrderApiRow): Order {
  return {
    id: order.id,
    folio: order.folio,
    status: order.status,
    deviceType: order.deviceType,
    deviceModel: order.deviceModel ?? undefined,
    priority: order.priority ?? undefined,
    estimatedCost: Number(order.estimatedCost || 0),
    promisedDate: order.promisedDate ?? undefined,
    createdAt: order.createdAt
  };
}

export function OperativoNative() {
  const { session } = useAuth();
  const normalizedRole = normalizeRole(session?.user?.role);
  const canUploadOperationalAssets = ["owner", "manager", "receptionist"].includes(normalizedRole);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formErrorOrder, setFormErrorOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [receptionStep, setReceptionStep] = useState<ReceptionStep>(1);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [assets, setAssets] = useState<OrderAsset[]>([]);
  const [assetType, setAssetType] = useState("reception_photo");
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetFeedback, setAssetFeedback] = useState("");

  const [orderForm, setOrderForm] = useState({
    customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "",
    reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0"
  });

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true); setApiStateError(""); setApiStateMessage("");
    try {
      if (!session.subscription.operationalAccess) { setCustomers([]); setOrders([]); return; }

      const [customersRes, ordersRes] = await Promise.all([
        fetchWithAuth("/api/customers?page=1&pageSize=100"),
        fetchWithAuth("/api/service-orders?page=1&pageSize=100")
      ]);

      const customersPayload = await customersRes.json();
      const ordersPayload = await ordersRes.json();

      if (!customersRes.ok) {
        throw new Error(customersPayload?.error?.message || "No se pudieron cargar los clientes");
      }
      if (!ordersRes.ok) {
        throw new Error(ordersPayload?.error?.message || "No se pudieron cargar las órdenes");
      }

      const customersData = Array.isArray(customersPayload?.data) ? customersPayload.data : [];
      const ordersData = Array.isArray(ordersPayload?.data) ? ordersPayload.data : [];

      setCustomers(customersData.map(mapCustomerApiRow));
      setOrders(ordersData.map(mapServiceOrderApiRow));
    } catch (error: unknown) {
       setApiStateError(getErrorMessage(error, "Error al conectar con Supabase."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  useEffect(() => {
    if (!session?.shop.id || !session.subscription.operationalAccess) return;

    const channel = supabase
      .channel(`operativo-live-${session.shop.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_orders",
          filter: `tenant_id=eq.${session.shop.id}`
        },
        () => {
          void loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
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
  }, [session?.shop.id, session?.subscription.operationalAccess]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === orderForm.customerId),
    [customers, orderForm.customerId]
  );

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormErrorOrder(""); setApiStateError(""); setApiStateMessage("");

    if (!session?.user.branchId) return setFormErrorOrder("⚠️ Tu usuario no tiene asignada una sucursal.");
    if (!orderForm.customerId) return setFormErrorOrder("⚠️ Selecciona a qué cliente se le asignará el equipo.");
    if (!orderForm.deviceType.trim()) return setFormErrorOrder("⚠️ Indica el tipo de equipo a recibir.");
    if (!orderForm.reportedIssue.trim()) return setFormErrorOrder("⚠️ Describe cuál es el desgaste físico o falla.");

    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/service-orders", {
        method: "POST",
        body: JSON.stringify({
          branchId: session.user.branchId,
          customerId: orderForm.customerId,
          serviceRequestId: null,
          deviceType: orderForm.deviceType,
          deviceBrand: orderForm.deviceBrand || null,
          deviceModel: orderForm.deviceModel || null,
          serialNumber: orderForm.serialNumber || null,
          reportedIssue: orderForm.reportedIssue,
          priority: orderForm.priority || null,
          promisedDate: orderForm.promisedDate || null,
          estimatedCost: Number(orderForm.estimatedCost || 0)
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo crear la orden");
      }

      setOrderForm({ customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "", reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0" });
      setReceptionStep(1);
      await loadData();
      setApiStateMessage(`✅ Orden de servicio creada exitosamente${payload?.data?.folio ? ` (${payload.data.folio})` : ""}.`);
    } catch (error: unknown) {
      setApiStateError(getErrorMessage(error, "Error al procesar la orden."));
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchQuery || order.folio.toLowerCase().includes(searchQuery.toLowerCase()) || order.deviceType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || normalizeServiceOrderStatus(order.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0],
    [filteredOrders, selectedOrderId]
  );

  useEffect(() => {
    if (!selectedOrderId && filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id);
    }
    if (filteredOrders.length === 0) {
      setSelectedOrderId("");
    }
  }, [filteredOrders, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrder?.id) {
      setAssets([]);
      setAssetFeedback("");
      return;
    }

    let cancelled = false;

    async function loadAssets() {
      try {
        const response = await fetchWithAuth(`/api/service-orders/${selectedOrder.id}/assets`);
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
  }, [selectedOrder?.id]);

  function validateStep(step: ReceptionStep) {
    if (step === 1) {
      if (!orderForm.customerId) {
        setFormErrorOrder("⚠️ Selecciona el cliente antes de continuar.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!orderForm.deviceType.trim()) {
        setFormErrorOrder("⚠️ Indica el tipo de equipo.");
        return false;
      }
      if (!orderForm.reportedIssue.trim()) {
        setFormErrorOrder("⚠️ Describe la falla reportada.");
        return false;
      }
      return true;
    }

    return true;
  }

  function goToStep(step: ReceptionStep) {
    setFormErrorOrder("");
    setReceptionStep(step);
  }

  function handleStepAdvance() {
    if (!validateStep(receptionStep)) return;
    setFormErrorOrder("");
    setReceptionStep((current) => (current === 3 ? current : ((current + 1) as ReceptionStep)));
  }

  const receptionStepCopy = {
    1: {
      eyebrow: "Paso 1",
      title: "Cliente y compromiso comercial",
      description: "Selecciona al cliente y deja listo el marco operativo de la recepción."
    },
    2: {
      eyebrow: "Paso 2",
      title: "Equipo y falla reportada",
      description: "Captura el dispositivo, la serie y el problema con más contexto."
    },
    3: {
      eyebrow: "Paso 3",
      title: "Confirmación de recepción",
      description: "Revisa el resumen final antes de generar el folio de servicio."
    }
  } as const;

  async function handleAssetUpload(file: File | null) {
    if (!file || !selectedOrder?.id) return;
    if (!canUploadOperationalAssets) {
      setAssetFeedback("Tu rol no puede subir evidencias de recepción desde este módulo.");
      return;
    }

    setAssetUploading(true);
    setAssetFeedback("");
    try {
      const base64 = await fileToBase64(file);
      const response = await fetchWithAuth(`/api/service-orders/${selectedOrder.id}/assets`, {
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

      setAssetFeedback("Evidencia de recepción subida correctamente.");
      const refreshed = await fetchWithAuth(`/api/service-orders/${selectedOrder.id}/assets`);
      const refreshedPayload = await refreshed.json();
      setAssets(Array.isArray(refreshedPayload?.data) ? refreshedPayload.data : []);
    } catch (error) {
      setAssetFeedback(getErrorMessage(error, "No se pudo subir la evidencia"));
    } finally {
      setAssetUploading(false);
    }
  }

  return (
    <section className="operativo-shell">
      <div className="operativo-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Operativo nativo</span>
          <h1>Órdenes de servicio y Laboratorio</h1>
          <p className="muted">Panel integral para dar seguimiento y administrar todas las recepciones.</p>
        </div>
        <div className="operativo-summary" style={{alignItems: 'center', marginTop: '16px'}}>
           <div className="flex-col" style={{gridColumn: '1 / -1', flexDirection: 'row', gap: '8px', marginBottom: '8px', width: '100%'}}>
              <input type="text" className="module-search-input" style={{flex: 1}} placeholder="🔍 Buscar por Folio o Equipo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select className="module-search-input" style={{width: '240px'}} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {SERVICE_ORDER_STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
           </div>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="form-message is-error">{apiStateError}</div>}

      <div className="operativo-grid">
        <form className="sdmx-card-premium" onSubmit={handleCreateOrder}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap'}}>
               <div>
                 <span className="hero-eyebrow">{receptionStepCopy[receptionStep].eyebrow}</span>
                 <h3 style={{fontSize: '1.25rem', margin: '4px 0 0 0'}}>{receptionStepCopy[receptionStep].title}</h3>
                 <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>{receptionStepCopy[receptionStep].description}</p>
               </div>
               <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                 {[1, 2, 3].map((step) => {
                   const active = receptionStep === step;
                   const unlocked = step <= receptionStep;
                   return (
                     <button
                       key={step}
                       type="button"
                       onClick={() => unlocked && goToStep(step as ReceptionStep)}
                       style={{
                         width: '40px',
                         height: '40px',
                         borderRadius: '999px',
                         border: active ? '2px solid #f97316' : '1px solid rgba(30,58,138,0.18)',
                         background: active ? '#eff6ff' : unlocked ? '#ffffff' : '#f8fafc',
                         color: active ? '#ea580c' : '#1e3a8a',
                         fontWeight: 900,
                         cursor: unlocked ? 'pointer' : 'default'
                       }}
                     >
                       {step}
                     </button>
                   );
                 })}
               </div>
             </div>
          </div>
          {formErrorOrder && <div className="form-message is-warning">{formErrorOrder}</div>}

          {receptionStep === 1 ? (
            <>
              <div className="flex-col">
                 <label style={{fontWeight: 'bold', color: '#1e3a8a'}}>Cliente *</label>
                 <select value={orderForm.customerId} onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}>
                   <option value="">-- Selecciona del directorio comercial --</option>
                   {customers.map((c) => (<option key={c.id} value={c.id}>{c.fullName}</option>))}
                 </select>
              </div>

              <div style={{marginTop: '12px', padding: '16px', borderRadius: '16px', background: '#eff6ff', border: '1px solid rgba(30, 64, 175, 0.12)'}}>
                <div style={{display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))'}}>
                  <div>
                    <span className="hero-eyebrow">Contacto</span>
                    <strong style={{display: 'block', marginTop: '4px', color: '#1e3a8a'}}>
                      {selectedCustomer?.fullName ?? "Cliente por definir"}
                    </strong>
                    <span className="muted" style={{fontSize: '0.8rem'}}>{selectedCustomer?.phone ?? "Sin teléfono registrado"}</span>
                  </div>
                  <div>
                    <span className="hero-eyebrow">Email</span>
                    <strong style={{display: 'block', marginTop: '4px', color: '#1e3a8a'}}>
                      {selectedCustomer?.email ?? "Sin correo"}
                    </strong>
                  </div>
                  <div>
                    <span className="hero-eyebrow">Segmento</span>
                    <strong style={{display: 'block', marginTop: '4px', color: '#1e3a8a'}}>
                      {selectedCustomer?.tag?.toUpperCase() ?? "NUEVO"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid-cols-3" style={{marginTop: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px'}}>
                  <label style={{margin: 0}}>Prioridad
                    <select value={orderForm.priority} onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}>
                      <option value="normal">Estándar</option><option value="alta">Alta Demanda</option><option value="urgente">Urgencia Crítica</option>
                    </select>
                  </label>
                  <label style={{margin: 0}}>Fecha Compromiso
                    <input type="date" value={orderForm.promisedDate} onChange={(e) => setOrderForm({ ...orderForm, promisedDate: e.target.value })} />
                  </label>
                  <label style={{margin: 0}}>Costo Estimado
                    <input type="number" min="0" step="0.01" value={orderForm.estimatedCost} onChange={(e) => setOrderForm({ ...orderForm, estimatedCost: e.target.value })} />
                  </label>
              </div>
            </>
          ) : null}

          {receptionStep === 2 ? (
            <>
              <div className="grid-cols-2" style={{marginTop: '8px'}}>
                <label>Tipo de Dispositivo *
                  <input required value={orderForm.deviceType} onChange={(e) => setOrderForm({ ...orderForm, deviceType: e.target.value })} placeholder="Laptop, Consola..."/>
                </label>
                <label>Marca
                  <input value={orderForm.deviceBrand} onChange={(e) => setOrderForm({ ...orderForm, deviceBrand: e.target.value })} placeholder="Ej. Dell, Apple" />
                </label>
              </div>
              <div className="grid-cols-2">
                <label>Modelo
                  <input value={orderForm.deviceModel} onChange={(e) => setOrderForm({ ...orderForm, deviceModel: e.target.value })} />
                </label>
                <label>Número de Serie / IMEI
                  <input value={orderForm.serialNumber} onChange={(e) => setOrderForm({ ...orderForm, serialNumber: e.target.value })} />
                </label>
              </div>

              <div style={{marginTop: '12px', padding: '16px', background: '#0f172a', borderRadius: '14px', color: 'white'}}>
                <span className="hero-eyebrow" style={{color: '#93c5fd'}}>Recepción guiada</span>
                <p style={{margin: '6px 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)'}}>
                  Estamos dejando la captura del equipo más parecida al flujo profesional de `Sr-Fix`: más clara, más móvil y más ordenada para mostrador.
                </p>
              </div>

              <div className="flex-col" style={{marginTop: '8px'}}>
                 <label style={{fontWeight: 'bold'}}>Problema Reportado *</label>
                 <textarea required value={orderForm.reportedIssue} onChange={(e) => setOrderForm({ ...orderForm, reportedIssue: e.target.value })} placeholder="Ej. No enciende. La pantalla parpadea..." style={{minHeight: '110px'}}/>
              </div>
            </>
          ) : null}

          {receptionStep === 3 ? (
            <div style={{display: 'grid', gap: '12px'}}>
              <div style={{padding: '16px', borderRadius: '16px', border: '1px solid rgba(30,58,138,0.12)', background: '#f8fafc'}}>
                <span className="hero-eyebrow">Cliente</span>
                <div style={{marginTop: '6px', fontWeight: 800, color: '#0f172a'}}>{selectedCustomer?.fullName ?? "Sin cliente"}</div>
                <div className="muted" style={{fontSize: '0.85rem'}}>{selectedCustomer?.phone ?? "Sin teléfono"} · {selectedCustomer?.email ?? "Sin correo"}</div>
              </div>

              <div style={{padding: '16px', borderRadius: '16px', border: '1px solid rgba(30,58,138,0.12)', background: 'white'}}>
                <span className="hero-eyebrow">Equipo</span>
                <div style={{marginTop: '6px', fontWeight: 800, color: '#0f172a'}}>
                  {[orderForm.deviceType, orderForm.deviceBrand, orderForm.deviceModel].filter(Boolean).join(" ")}
                </div>
                <div className="muted" style={{fontSize: '0.85rem'}}>Serie: {orderForm.serialNumber || "Sin serie capturada"}</div>
              </div>

              <div style={{padding: '16px', borderRadius: '16px', border: '1px solid rgba(30,58,138,0.12)', background: 'white'}}>
                <span className="hero-eyebrow">Compromiso</span>
                <div style={{display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginTop: '6px'}}>
                  <div>
                    <strong style={{display: 'block', color: '#1e3a8a'}}>Prioridad</strong>
                    <span className="muted">{orderForm.priority.toUpperCase()}</span>
                  </div>
                  <div>
                    <strong style={{display: 'block', color: '#1e3a8a'}}>Entrega</strong>
                    <span className="muted">{formatDate(orderForm.promisedDate)}</span>
                  </div>
                  <div>
                    <strong style={{display: 'block', color: '#1e3a8a'}}>Costo estimado</strong>
                    <span className="muted">{formatMoney(Number(orderForm.estimatedCost || 0))}</span>
                  </div>
                </div>
              </div>

              <div style={{padding: '16px', borderRadius: '16px', border: '1px solid rgba(30,58,138,0.12)', background: '#eff6ff'}}>
                <span className="hero-eyebrow">Falla reportada</span>
                <p style={{margin: '8px 0 0 0', color: '#0f172a', lineHeight: 1.6}}>
                  {orderForm.reportedIssue || "Sin descripción capturada."}
                </p>
              </div>
            </div>
          ) : null}

          <div style={{display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap'}}>
            {receptionStep > 1 ? (
              <button type="button" onClick={() => goToStep((receptionStep - 1) as ReceptionStep)} className="product-button" style={{background: '#e2e8f0', color: '#0f172a'}}>
                Regresar
              </button>
            ) : null}

            {receptionStep < 3 ? (
              <button type="button" disabled={loading || customers.length === 0} onClick={handleStepAdvance} className="product-button is-primary" style={{marginLeft: 'auto'}}>
                Continuar
              </button>
            ) : (
              <button type="submit" disabled={loading || customers.length === 0} className="product-button is-primary" style={{marginLeft: 'auto'}}>
                Crear Orden de Servicio
              </button>
            )}
          </div>
        </form>

        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between'}}>
             <div className="flex-col">
                <h3 style={{fontSize: '1.25rem', margin: 0}}>Listado de Órdenes</h3>
                <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Visualizando {filteredOrders.length} orden(es) vigentes.</p>
             </div>
          </div>

          <ul className="data-list scrollable-list">
            {filteredOrders.length === 0 ? (
              <li className="empty-state">
                <strong>No hay órdenes activas</strong>
                <span>Genera las primeras recepciones de mostrador para poblar la tabla.</span>
              </li>
            ) : (
              filteredOrders.map((order) => {
                const created = new Date(order.createdAt);
                const now = new Date();
                const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
                const delayed = diffHours > 48 && !['entregado', 'listo'].includes(normalizeServiceOrderStatus(order.status));

                return (
                  <li key={order.id} className="list-item-grid" style={{
                    background: selectedOrder?.id === order.id ? '#eff6ff' : order.status === 'entregado' ? '#f0fdf4' : '#fff',
                    borderLeft: delayed ? '4px solid #ef4444' : '4px solid transparent',
                    paddingLeft: delayed ? '8px' : '12px'
                  }}>
                    <div style={{ background: delayed ? '#ef4444' : '#0f172a', color: 'white', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Folio: {order.folio}
                    </div>
                    <div className="flex-col">
                      <strong style={{fontSize: '1.05rem', color: '#1e3a8a'}}>{order.deviceType} {order.deviceModel ?? ""}</strong>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <span style={{color: '#64748b', fontSize: '0.85rem'}}>Nivel Carga: {order.priority?.toUpperCase() || "NORMAL"} · Entrega: {formatDate(order.promisedDate)}</span>
                        {delayed && <span style={{fontSize: '0.625rem', fontWeight: 900, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px'}}>⚠️ SIN AVANCE (+48H)</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge-${order.status === 'entregado' ? 'success' : order.status === 'reparacion' ? 'warning' : 'info'}`}>{getServiceOrderStatusLabel(order.status)}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        style={{
                          marginTop: '8px',
                          display: 'inline-flex',
                          background: '#0f172a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '6px 12px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Expediente
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </article>

        <article className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div>
            <span className="hero-eyebrow">Expediente de Recepción</span>
            <h3 style={{margin: '6px 0 0 0'}}>Evidencias del equipo</h3>
            <p className="muted" style={{margin: '4px 0 0 0'}}>
              Primer tramo de Storage desde mostrador: expediente visual ligado a la orden activa.
            </p>
          </div>

          {!selectedOrder ? (
            <div className="empty-state">
              <strong>Sin orden seleccionada</strong>
              <span>Elige una orden del listado para ver o subir evidencias.</span>
            </div>
          ) : (
            <>
              <div style={{padding: '14px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe'}}>
                <strong style={{display: 'block', color: '#1d4ed8'}}>{selectedOrder.folio}</strong>
                <span className="muted" style={{fontSize: '0.82rem'}}>
                  {[selectedOrder.deviceType, selectedOrder.deviceModel].filter(Boolean).join(" ")} · {formatDate(selectedOrder.promisedDate)}
                </span>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '180px 1fr', gap: '10px'}}>
                <select
                  style={{padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid #bfdbfe', background: 'white'}}
                  value={assetType}
                  onChange={(event) => setAssetType(event.target.value)}
                  disabled={!canUploadOperationalAssets || assetUploading}
                >
                  <option value="reception_photo">Foto de recepción</option>
                  <option value="evidence">Evidencia general</option>
                  <option value="delivery_photo">Foto de entrega</option>
                </select>
                <label style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '0.75rem', border: '1px dashed #60a5fa', background: 'white', padding: '0.75rem 1rem', cursor: assetUploading ? 'wait' : 'pointer', fontWeight: 700, color: '#1d4ed8'}}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{display: 'none'}}
                    disabled={assetUploading || !canUploadOperationalAssets}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleAssetUpload(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  {!canUploadOperationalAssets ? "Solo lectura para tu rol" : assetUploading ? "Subiendo evidencia..." : "Adjuntar imagen al expediente"}
                </label>
              </div>

              {assetFeedback ? (
                <div style={{fontSize: '0.8rem', fontWeight: 700, color: assetFeedback.includes("correctamente") ? '#047857' : '#b91c1c'}}>
                  {assetFeedback}
                </div>
              ) : null}

              <div style={{display: 'grid', gap: '8px'}}>
                {assets.length === 0 ? (
                  <div style={{fontSize: '0.8rem', color: '#64748b'}}>Sin evidencias cargadas todavía para esta orden.</div>
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
            </>
          )}
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
