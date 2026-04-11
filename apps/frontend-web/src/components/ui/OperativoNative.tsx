"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthGuard";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";
import { fetchWithAuth } from "../../lib/apiClient";

type Customer = { id: string; fullName: string; phone?: string; email?: string; tag: string; };

type ServiceRequest = {
  id: string;
  folio: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  issueDescription?: string;
  urgency?: string;
  quotedTotal?: number;
};

type Order = {
  id: string; folio: string; status: string; deviceType: string; deviceModel?: string;
  deviceBrand?: string; priority?: string; customerId?: string; customerName?: string; customerPhone?: string;
  assignedTechnician?: string; estimatedCost?: number; reportedIssue?: string;
  promisedDate?: string; createdAt: string;
};

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
function mapUrgencyToPriority(value?: string) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "urgente") return "urgente";
  if (normalized === "alta") return "alta";
  return "normal";
}

export function OperativoNative({ tenantId }: any = {}) {
  const { session } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formErrorOrder, setFormErrorOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  const [orderForm, setOrderForm] = useState({
    customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "",
    reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0"
  });

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true); setApiStateError(""); setApiStateMessage("");
    try {
      if (!session.subscription.operationalAccess) { setCustomers([]); setOrders([]); return; }

      const [customersRes, ordersRes, requestsRes] = await Promise.all([
        fetchWithAuth<any>('/api/customers?page=1&pageSize=250'),
        fetchWithAuth<any>('/api/service-orders?page=1&pageSize=250'),
        fetchWithAuth<any>('/api/service-requests?page=1&pageSize=25')
      ]);

      const [customersPayload, ordersPayload, requestsPayload] = await Promise.all([
        customersRes.json(),
        ordersRes.json(),
        requestsRes.json()
      ]);

      if (!customersRes.ok) throw new Error(customersPayload.error?.message || "No se pudieron cargar los clientes.");
      if (!ordersRes.ok) throw new Error(ordersPayload.error?.message || "No se pudieron cargar las órdenes.");
      if (!requestsRes.ok) throw new Error(requestsPayload.error?.message || "No se pudieron cargar las solicitudes.");

      const customerRows = Array.isArray(customersPayload.data) ? customersPayload.data : [];
      const orderRows = Array.isArray(ordersPayload.data) ? ordersPayload.data : [];
      const requestRows = Array.isArray(requestsPayload.data) ? requestsPayload.data : [];

      const mappedCustomers = customerRows.map((c: any) => ({
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        tag: c.tag || 'nuevo'
      }));

      const customerMap = new Map<string, Customer>(mappedCustomers.map((c: Customer) => [c.id, c]));

      setCustomers(mappedCustomers);

      setOrders(orderRows.map((o: any) => ({
        id: o.id,
        folio: o.folio,
        status: o.status,
        customerId: o.customerId,
        customerName: customerMap.get(o.customerId)?.fullName,
        customerPhone: customerMap.get(o.customerId)?.phone,
        deviceType: o.deviceType,
        deviceBrand: o.deviceBrand,
        deviceModel: o.deviceModel,
        priority: o.priority,
        estimatedCost: Number(o.estimatedCost || 0),
        reportedIssue: o.reportedIssue,
        promisedDate: o.promisedDate,
        createdAt: o.createdAt
      })));

      setRequests(requestRows.map((r: any) => ({
        id: r.id,
        folio: r.folio,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerEmail: r.customerEmail,
        deviceType: r.deviceType,
        deviceBrand: r.deviceBrand,
        deviceModel: r.deviceModel,
        issueDescription: r.issueDescription,
        urgency: r.urgency,
        quotedTotal: Number(r.quotedTotal || 0),
      })));

    } catch (error: any) {
       setApiStateError(error.message || "Error al conectar con la API real.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  useEffect(() => {
    if (!customers.length) return;
    const raw = localStorage.getItem("sdmx_operativo_prefill_customer");
    if (!raw) return;
    try {
      const customer = JSON.parse(raw);
      if (customer?.id && customers.some((item) => item.id === customer.id)) {
        setOrderForm((current) => ({ ...current, customerId: customer.id }));
        setApiStateMessage(`Cliente precargado desde directorio: ${customer.fullName || "Cliente seleccionado"}.`);
        localStorage.removeItem("sdmx_operativo_prefill_customer");
      }
    } catch {
      localStorage.removeItem("sdmx_operativo_prefill_customer");
    }
  }, [customers]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === orderForm.customerId) ?? null,
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
      const response = await fetchWithAuth<any>('/api/service-orders', {
        method: 'POST',
        body: JSON.stringify({
          branchId: session.user.branchId,
          customerId: orderForm.customerId,
          serviceRequestId: selectedRequestId || null,
          deviceType: orderForm.deviceType,
          deviceBrand: orderForm.deviceBrand || null,
          deviceModel: orderForm.deviceModel || null,
          serialNumber: orderForm.serialNumber || null,
          reportedIssue: orderForm.reportedIssue,
          priority: orderForm.priority,
          promisedDate: orderForm.promisedDate || null,
          estimatedCost: Number(orderForm.estimatedCost || 0),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "No se pudo crear la orden.");
      const created = payload.data;

      setLastCreatedOrder({
        id: created.id,
        folio: created.folio,
        status: 'recibido',
        customerId: orderForm.customerId,
        customerName: selectedCustomer?.fullName,
        customerPhone: selectedCustomer?.phone,
        deviceType: orderForm.deviceType,
        deviceBrand: orderForm.deviceBrand,
        deviceModel: orderForm.deviceModel,
        priority: orderForm.priority,
        estimatedCost: Number(orderForm.estimatedCost || 0),
        reportedIssue: orderForm.reportedIssue,
        promisedDate: orderForm.promisedDate || undefined,
        createdAt: created.createdAt || new Date().toISOString(),
      });
      setOrderForm({ customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "", reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0" });
      setSelectedRequestId("");
      await loadData();
      setApiStateMessage("✅ Orden de servicio creada exitosamente.");
    } catch (error: any) {
      setApiStateError(error.message || "Error al procesar la orden.");
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

  function handleRequestPrefill(requestId: string) {
    setSelectedRequestId(requestId);
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;

    const matchedCustomer = customers.find((customer) =>
      customer.fullName.toLowerCase() === request.customerName.toLowerCase() ||
      (!!request.customerPhone && customer.phone === request.customerPhone) ||
      (!!request.customerEmail && customer.email?.toLowerCase() === request.customerEmail.toLowerCase())
    );

    setOrderForm((current) => ({
      ...current,
      customerId: matchedCustomer?.id || current.customerId,
      deviceType: request.deviceType || current.deviceType,
      deviceBrand: request.deviceBrand || current.deviceBrand,
      deviceModel: request.deviceModel || current.deviceModel,
      reportedIssue: request.issueDescription || current.reportedIssue,
      priority: mapUrgencyToPriority(request.urgency),
      estimatedCost: request.quotedTotal ? String(request.quotedTotal) : current.estimatedCost,
    }));
  }

  function handleWhatsapp(order: Order) {
    const phone = (order.customerPhone || selectedCustomer?.phone || "").replace(/\D/g, "");
    if (!phone) {
      setApiStateError("Este cliente no tiene teléfono o WhatsApp registrado.");
      return;
    }
    const message = `Hola ${order.customerName || ""}, tu folio ${order.folio} fue registrado en ${session?.shop.name || "Servicios Digitales MX"}. Te compartimos tu recepción para seguimiento.`;
    window.open(`https://wa.me/52${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function handlePrintReceipt(order: Order) {
    const receiptWindow = window.open("", "_blank", "noopener,noreferrer,width=860,height=960");
    if (!receiptWindow) return;

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Orden ${order.folio}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1, h2, h3, p { margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
            .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
            .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
            .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px; }
            .value { font-size: 16px; font-weight: 700; color: #0f172a; }
            .full { grid-column: 1 / -1; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Servicios Digitales MX</h1>
              <p style="margin-top:8px;color:#475569;">Orden de recepción generada para seguimiento interno y cliente.</p>
            </div>
            <div style="text-align:right;">
              <span class="badge">${order.folio}</span>
              <p style="margin-top:8px;color:#64748b;">${formatDate(order.createdAt)}</p>
            </div>
          </div>
          <div class="grid">
            <div class="card">
              <div class="label">Cliente</div>
              <div class="value">${order.customerName || "Sin cliente"}</div>
              <p style="margin-top:8px;color:#475569;">${order.customerPhone || "Sin teléfono registrado"}</p>
            </div>
            <div class="card">
              <div class="label">Estado</div>
              <div class="value">${getServiceOrderStatusLabel(order.status)}</div>
              <p style="margin-top:8px;color:#475569;">Prioridad ${order.priority || "normal"}</p>
            </div>
            <div class="card">
              <div class="label">Equipo</div>
              <div class="value">${order.deviceType}</div>
              <p style="margin-top:8px;color:#475569;">${[order.deviceBrand, order.deviceModel].filter(Boolean).join(" · ") || "Sin modelo registrado"}</p>
            </div>
            <div class="card">
              <div class="label">Fecha compromiso</div>
              <div class="value">${formatDate(order.promisedDate)}</div>
              <p style="margin-top:8px;color:#475569;">Costo estimado ${formatMoney(order.estimatedCost)}</p>
            </div>
            <div class="card full">
              <div class="label">Falla reportada</div>
              <div class="value">${order.reportedIssue || "Sin detalle registrado"}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
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
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Recepción Rápida</h3>
             <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Genera el folio que acompañará al equipo.</p>
          </div>
          {formErrorOrder && <div className="form-message is-warning">{formErrorOrder}</div>}

          {requests.length > 0 && (
            <div className="flex-col" style={{ marginBottom: '8px' }}>
              <label style={{fontWeight: 'bold', color: '#1e3a8a'}}>Cargar desde cotización</label>
              <select value={selectedRequestId} onChange={(e) => handleRequestPrefill(e.target.value)}>
                <option value="">-- Selecciona una cotización existente --</option>
                {requests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.folio} · {request.customerName} · {request.deviceType || "Equipo"}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex-col">
             <label style={{fontWeight: 'bold', color: '#1e3a8a'}}>Cliente *</label>
             <select value={orderForm.customerId} onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}>
               <option value="">-- Selecciona del directorio comercial --</option>
               {customers.map((c) => (<option key={c.id} value={c.id}>{c.fullName}</option>))}
             </select>
          </div>

          {selectedCustomer && (
            <div className="form-message" style={{background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8'}}>
              Cliente seleccionado: <strong>{selectedCustomer.fullName}</strong>
              {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}
              {selectedCustomer.email ? ` · ${selectedCustomer.email}` : ""}
            </div>
          )}
          
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

          {lastCreatedOrder && (
            <div className="form-message is-success" style={{display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start'}}>
              <div>
                <strong>Recepción lista:</strong> {lastCreatedOrder.folio} para {lastCreatedOrder.customerName || "cliente seleccionado"}.
              </div>
              <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                <button type="button" className="sdmx-btn-ghost" onClick={() => handleWhatsapp(lastCreatedOrder)}>
                  WhatsApp al cliente
                </button>
                <button type="button" className="sdmx-btn-ghost" onClick={() => handlePrintReceipt(lastCreatedOrder)}>
                  Imprimir / PDF
                </button>
              </div>
            </div>
          )}
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
                    background: order.status === 'entregado' ? '#f0fdf4' : '#fff',
                    borderLeft: delayed ? '4px solid #ef4444' : '4px solid transparent',
                    paddingLeft: delayed ? '8px' : '12px',
                    position: 'relative'
                  }}>
                    <div style={{ background: delayed ? '#ef4444' : '#0f172a', color: 'white', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Folio: {order.folio}
                    </div>
                    <div className="flex-col">
                      <strong style={{fontSize: '1.05rem', color: '#1e3a8a'}}>{order.deviceType} {order.deviceModel ?? ""}</strong>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        {order.customerName && (
                          <>
                            <span style={{color: '#0f172a', fontWeight: 700, fontSize: '0.85rem'}}>{order.customerName}</span>
                            <span style={{color: '#cbd5e1'}}>•</span>
                          </>
                        )}
                        <span style={{color: '#64748b', fontSize: '0.85rem'}}>Nivel Carga: {order.priority?.toUpperCase() || "NORMAL"} · Entrega: {formatDate(order.promisedDate)}</span>
                        {delayed && (
                          <FeatureGuard requiredLevel={PlanLevel.AVANZADO} featureName="Semáforo de Alertas" variant="compact">
                            <span style={{fontSize: '0.625rem', fontWeight: 900, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px'}}>⚠️ SIN AVANCE (+48H)</span>
                          </FeatureGuard>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="sdmx-btn-ghost" style={{padding: '4px 8px', fontSize: '0.75rem'}} onClick={() => handleWhatsapp(order)}>
                        WhatsApp
                      </button>
                      <FeatureGuard requiredLevel={PlanLevel.PROFESIONAL} featureName="Notas Privadas" variant="compact">
                        <button className="sdmx-btn-ghost" style={{padding: '4px 8px', fontSize: '0.75rem'}}>📝 Notas</button>
                      </FeatureGuard>
                      <FeatureGuard requiredLevel={PlanLevel.AVANZADO} featureName="Evidencia Fotográfica" variant="compact">
                        <button className="sdmx-btn-ghost" style={{padding: '4px 8px', fontSize: '0.75rem'}}>📷 Fotos</button>
                      </FeatureGuard>
                      <FeatureGuard requiredLevel={PlanLevel.AVANZADO} featureName="Reporte PDF" variant="compact">
                        <button className="sdmx-btn-ghost" style={{padding: '4px 8px', fontSize: '0.75rem'}} onClick={() => handlePrintReceipt(order)}>📄 PDF</button>
                      </FeatureGuard>
                      <span className={`badge-${order.status === 'entregado' ? 'success' : order.status === 'reparacion' ? 'warning' : 'info'}`}>{getServiceOrderStatusLabel(order.status)}</span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
