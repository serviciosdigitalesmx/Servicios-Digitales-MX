"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthGuard";

type AuthResponse = {
  data: {
    user: { branchId: string; fullName: string; };
    shop: { name: string; };
    subscription: { operationalAccess: boolean; status: string; };
  };
};

type Customer = { id: string; fullName: string; phone?: string; email?: string; tag: string; };

type Order = {
  id: string; folio: string; status: string; deviceType: string; deviceModel?: string;
  priority?: string; customerName?: string; assignedTechnician?: string; estimatedCost?: number;
  promisedDate?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store", mode: "cors"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "El backend devolvió un error inesperado al procesar tu solicitud.");
  return data as T;
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

export function OperativoNative() {
  const { session } = useAuth();
  const auth = session as AuthResponse["data"] | null;
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  
  const [formErrorOrder, setFormErrorOrder] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [orderForm, setOrderForm] = useState({
    customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "",
    reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0"
  });

  async function loadData() {
    setLoading(true); setApiStateError(""); setApiStateMessage("");
    try {
      if (!auth || !auth.subscription.operationalAccess) { setCustomers([]); setOrders([]); return; }
      const [customersData, ordersData] = await Promise.all([
        fetchJson<{ data: Customer[] }>("/api/customers"), fetchJson<{ data: Order[] }>("/api/service-orders")
      ]);
      setCustomers(customersData.data); setOrders(ordersData.data);
    } catch (error) {
       setApiStateError("Error de red al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (auth) {
      void loadData(); 
    }
  }, [auth]);

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormErrorOrder(""); setApiStateError(""); setApiStateMessage("");

    if (!auth?.user.branchId) return setFormErrorOrder("⚠️ Tu usuario no tiene asignada una sucursal.");
    if (!orderForm.customerId) return setFormErrorOrder("⚠️ Selecciona a qué cliente se le asignará el equipo.");
    if (!orderForm.deviceType.trim()) return setFormErrorOrder("⚠️ Indica el tipo de equipo a recibir.");
    if (!orderForm.reportedIssue.trim()) return setFormErrorOrder("⚠️ Describe cuál es el desgaste físico o falla.");

    setLoading(true);
    try {
      await fetchJson("/api/service-orders", {
        method: "POST", body: JSON.stringify({
          branchId: auth.user.branchId, serviceRequestId: null,
          ...orderForm, estimatedCost: Number(orderForm.estimatedCost || 0)
        })
      });
      setOrderForm({ customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "", reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0" });
      await loadData();
      setApiStateMessage("✅ Orden de servicio creada exitosamente.");
    } catch (error) {
      setApiStateError(error instanceof Error ? error.message : "Error al procesar la orden.");
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
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Recepción Rápida</h3>
             <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Genera el folio que acompañará al equipo.</p>
          </div>
          {formErrorOrder && <div className="form-message is-warning">{formErrorOrder}</div>}
          
          <div className="flex-col">
             <label style={{fontWeight: 'bold', color: '#1e3a8a'}}>Cliente *</label>
             <select value={orderForm.customerId} onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}>
               <option value="">-- Selecciona del directorio comercial --</option>
               {customers.map((c) => (<option key={c.id} value={c.id}>{c.fullName}</option>))}
             </select>
          </div>
          
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
          
          <div className="flex-col" style={{marginTop: '8px'}}>
             <label style={{fontWeight: 'bold'}}>Problema Reportado *</label>
             <textarea required value={orderForm.reportedIssue} onChange={(e) => setOrderForm({ ...orderForm, reportedIssue: e.target.value })} placeholder="Ej. No enciende. La pantalla parpadea..." style={{minHeight: '80px'}}/>
          </div>
          
          <div className="grid-cols-3" style={{marginTop: '8px', padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
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
          
          <button type="submit" disabled={loading || customers.length === 0} className="product-button is-primary" style={{marginTop: '16px'}}>
            Crear Orden de Servicio
          </button>
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
              filteredOrders.map((order) => (
                <li key={order.id} className="list-item-grid" style={{background: order.status === 'entregado' ? '#f0fdf4' : '#fff'}}>
                   <div style={{ background: '#0f172a', color: 'white', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Folio: {order.folio}
                   </div>
                   <div className="flex-col">
                     <strong style={{fontSize: '1.05rem', color: '#1e3a8a'}}>{order.deviceType} {order.deviceModel ?? ""}</strong>
                     <span style={{color: '#64748b', fontSize: '0.85rem'}}>Nivel Carga: {order.priority?.toUpperCase() || "NORMAL"} · Entrega: {formatDate(order.promisedDate)}</span>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <span className={`badge-${order.status === 'entregado' ? 'success' : order.status === 'reparacion' ? 'warning' : 'info'}`}>{getServiceOrderStatusLabel(order.status)}</span>
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
