"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";

type Supplier = { id: string; businessName: string; };

type Product = { id: string; sku: string; name: string; };

type PurchaseOrder = { id: string; folio: string; status: string; expectedDate?: string; total: number; supplierName?: string; createdAt?: string; };
import { useAuth } from "./AuthGuard";

type PurchaseOrderOverlay = {
  id: string;
  status: string;
  notes?: string;
  updatedAt: string;
  receivedAt?: string;
};

type PurchaseOrderView = PurchaseOrder & {
  overlayNotes?: string;
  updatedAt?: string;
  receivedAt?: string;
};

const PURCHASE_ORDER_OVERLAY_KEY = "sdmx_purchase_order_overlays";

function formatMoney(value: number) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0); }
function formatDate(dateStr?: string) {
  if (!dateStr) return "Sin Promesa";
  return new Intl.DateTimeFormat("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

function getStoredPurchaseOrderOverlays(): Record<string, PurchaseOrderOverlay> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PURCHASE_ORDER_OVERLAY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredPurchaseOrderOverlays(value: Record<string, PurchaseOrderOverlay>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PURCHASE_ORDER_OVERLAY_KEY, JSON.stringify(value));
}

function normalizePurchaseStatus(status: string) {
  const normalized = status?.toLowerCase?.() || "borrador";
  if (normalized === "draft") return "borrador";
  if (normalized === "pending") return "solicitada";
  if (normalized === "received") return "recibida";
  return normalized;
}

function getPurchaseStatusMeta(status: string) {
  switch (normalizePurchaseStatus(status)) {
    case "recibida":
      return { label: "Recibida", badgeClass: "badge-success", color: "#047857", message: "Esta compra ya fue recibida y está lista para conciliación de inventario." };
    case "en_camino":
      return { label: "En camino", badgeClass: "badge-info", color: "#1d4ed8", message: "La orden ya va en tránsito y conviene monitorear la llegada estimada." };
    case "cancelada":
      return { label: "Cancelada", badgeClass: "badge-danger", color: "#b91c1c", message: "La orden se canceló y no debe considerarse dentro del abastecimiento pendiente." };
    case "solicitada":
      return { label: "Solicitada", badgeClass: "badge-warning", color: "#b45309", message: "La orden ya fue solicitada al proveedor, pero aún no se registra recepción." };
    default:
      return { label: "Borrador", badgeClass: "badge-neutral", color: "#475569", message: "La orden sigue interna; sirve para preparar abastecimiento antes de enviarla." };
  }
}

export function ComprasNative() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [orderOverlays, setOrderOverlays] = useState<Record<string, PurchaseOrderOverlay>>({});
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderView | null>(null);
  
  const [form, setForm] = useState({ supplierId: "", reference: "", paymentTerms: "", expectedDate: "", notes: "", productId: "", qtyOrdered: "1", unitCost: "0" });

  useEffect(() => {
    setOrderOverlays(getStoredPurchaseOrderOverlays());
  }, []);

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true); setApiStateMessage(""); setApiStateError("");
    try {
      const [suppliersRes, productsRes, ordersRes] = await Promise.all([
        fetchWithAuth("/api/suppliers"),
        fetchWithAuth("/api/products?page=1&pageSize=100"),
        fetchWithAuth("/api/purchase-orders?page=1&pageSize=100")
      ]);

      const suppliersPayload = await (suppliersRes as any).json();
      const productsPayload = await (productsRes as any).json();
      const ordersPayload = await (ordersRes as any).json();

      if (!(suppliersRes as any).ok) throw new Error(suppliersPayload?.error?.message || "Error al cargar proveedores.");
      if (!(productsRes as any).ok) throw new Error(productsPayload?.error?.message || "Error al cargar productos.");
      if (!(ordersRes as any).ok) throw new Error(ordersPayload?.error?.message || "Error al cargar órdenes de compra.");

      setSuppliers((Array.isArray(suppliersPayload?.data) ? suppliersPayload.data : []).map((s: any) => ({ id: s.id, businessName: s.businessName })));
      setProducts((Array.isArray(productsPayload?.data) ? productsPayload.data : []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name
      })));
      setOrders((Array.isArray(ordersPayload?.data) ? ordersPayload.data : []).map((o: any) => ({
        id: o.id,
        folio: o.folio,
        status: o.status,
        expectedDate: o.expectedDate,
        total: Number(o.total || 0),
        supplierName: o.supplierName ?? undefined,
        createdAt: o.createdAt ?? undefined
      })));
    } catch (error: unknown) { setApiStateError(error instanceof Error ? error.message : "Error al cargar los datos."); } finally { setLoading(false); }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setApiStateMessage(""); setApiStateError("");

    if (!form.productId) return setFormError("⚠️ Seleccione un producto para la orden.");
    const qty = Number(form.qtyOrdered || 0);
    const cost = Number(form.unitCost || 0);
    if (qty <= 0) return setFormError("⚠️ La cantidad debe ser mayor a cero.");
    if (cost < 0) return setFormError("⚠️ El costo unitario no puede ser negativo.");
    if (!form.supplierId) return setFormError("⚠️ Seleccione un proveedor.");

    setLoading(true);
    try {
      const selectedProduct = products.find((product) => product.id === form.productId);
      if (!selectedProduct) throw new Error("Producto ausente del catálogo");
      const response = await fetchWithAuth("/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierId: form.supplierId,
          reference: form.reference.trim() || null,
          paymentTerms: form.paymentTerms.trim() || null,
          expectedDate: form.expectedDate || null,
          notes: form.notes.trim() || null,
          items: [
            {
              productId: selectedProduct.id,
              skuSnapshot: selectedProduct.sku,
              productNameSnapshot: selectedProduct.name,
              qtyOrdered: qty,
              unitCost: cost
            }
          ]
        })
      });
      const payload = await (response as any).json();
      if (!(response as any).ok) throw new Error(payload?.error?.message || "Ocurrió un error al procesar la orden.");

      setForm({ supplierId: "", reference: "", paymentTerms: "", expectedDate: "", notes: "", productId: "", qtyOrdered: "1", unitCost: "0" });
      await loadData();
      setApiStateMessage("✅ Orden de compra generada exitosamente.");
    } catch (error: unknown) { setApiStateError(error instanceof Error ? error.message : "Ocurrió un error al procesar la orden."); } finally { setLoading(false); }
  }

  function updateOrderOverlay(order: PurchaseOrder, status: string, notes?: string) {
    const nextOverlay: PurchaseOrderOverlay = {
      id: order.id,
      status,
      notes: notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
      receivedAt: status === "recibida" ? new Date().toISOString() : undefined
    };
    const nextState = { ...orderOverlays, [order.id]: nextOverlay };
    setOrderOverlays(nextState);
    saveStoredPurchaseOrderOverlays(nextState);
  }

  const mergedOrders = useMemo<PurchaseOrderView[]>(() => {
    return orders.map((order) => {
      const overlay = orderOverlays[order.id];
      return {
        ...order,
        status: overlay?.status || order.status,
        overlayNotes: overlay?.notes,
        updatedAt: overlay?.updatedAt,
        receivedAt: overlay?.receivedAt
      };
    });
  }, [orders, orderOverlays]);

  const filteredOrders = useMemo(
    () => mergedOrders.filter((o) =>
      !search ||
      o.folio.toLowerCase().includes(search.toLowerCase()) ||
      (o.supplierName && o.supplierName.toLowerCase().includes(search.toLowerCase()))
    ),
    [mergedOrders, search]
  );

  const purchaseSummary = useMemo(() => {
    const today = new Date();
    return {
      total: mergedOrders.length,
      committed: mergedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      requested: mergedOrders.filter((order) => ["solicitada", "en_camino"].includes(normalizePurchaseStatus(order.status))).length,
      received: mergedOrders.filter((order) => normalizePurchaseStatus(order.status) === "recibida").length,
      arrivingSoon: mergedOrders.filter((order) => {
        if (!order.expectedDate) return false;
        const diff = new Date(order.expectedDate).getTime() - today.getTime();
        return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 3;
      }).length
    };
  }, [mergedOrders]);

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Compras</span>
          <h1>Órdenes de compra y abastecimiento</h1>
          <p className="muted">Centraliza pedidos a proveedores, controla fechas de llegada y mantén visible cuánto inventario está por entrar.</p>
        </div>
        <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
           <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <span style={{ position: "absolute", top: "14px", left: "14px", opacity: 0.5, fontSize: "1.1rem" }}>🔍</span>
            <input className="module-search-input" style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", height: "48px" }}
              placeholder="Buscar por folio o proveedor..." value={search} onChange={(event) => setSearch(event.target.value)} />
           </div>
           <button type="button" disabled={loading} className="product-button" onClick={() => void loadData()}>
             Actualizar compras
          </button>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="form-message is-error">{apiStateError}</div>}

      <div className="grid-cols-3" style={{ marginBottom: "20px" }}>
        <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
          <span className="hero-eyebrow">Abastecimiento</span>
          <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{purchaseSummary.total}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {purchaseSummary.requested} activas · {purchaseSummary.received} recibidas.
          </p>
        </article>
        <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
          <span className="hero-eyebrow">Compromiso económico</span>
          <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{formatMoney(purchaseSummary.committed)}</h3>
          <p className="muted" style={{ margin: 0 }}>
            Monto total visible comprometido en compras.
          </p>
        </article>
        <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
          <span className="hero-eyebrow">Ventana inmediata</span>
          <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{purchaseSummary.arrivingSoon}</h3>
          <p className="muted" style={{ margin: 0 }}>
            Orden(es) con llegada estimada en los próximos 3 días.
          </p>
        </article>
      </div>

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Nueva orden de compra</h3>
             <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Registra una compra nueva con proveedor, producto y fecha compromiso.</p>
          </div>
          {formError && <div className="form-message is-warning">{formError}</div>}
          
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Proveedor principal *</label>
            <select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
              <option value="">-- Selecciona un proveedor --</option>
              {suppliers.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>))}
            </select>
          </div>

          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Producto o refacción *</label>
            <select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
              <option value="">-- Selecciona un producto --</option>
              {products.map((product) => (<option key={product.id} value={product.id}>SKU {product.sku} — {product.name}</option>))}
            </select>
          </div>
          
          <div className="grid-cols-3" style={{background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0}}>Cantidad</label><input type="number" min="1" step="0.01" value={form.qtyOrdered} onChange={(event) => setForm({ ...form, qtyOrdered: event.target.value })} /></div>
             <div className="flex-col"><label style={{margin:0, color: '#10b981', fontWeight: 'bold'}}>Costo unitario ($)</label><input type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} /></div>
             <div className="flex-col"><label style={{margin:0}}>Condiciones de pago</label><input value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })} placeholder="Ej. A 30 días" /></div>
          </div>
          
          <div className="grid-cols-2" style={{marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0}}>Referencia del proveedor</label><input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="Dato del proveedor (Ej. #30219L)" /></div>
             <div className="flex-col"><label style={{margin:0}}>Fecha esperada</label><input type="date" value={form.expectedDate} onChange={(event) => setForm({ ...form, expectedDate: event.target.value })} /></div>
          </div>
          
          <button type="submit" disabled={loading || products.length === 0} className="product-button is-primary" style={{marginTop: '16px'}}>
             Generar orden
          </button>
        </form>

        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Seguimiento de compras</h3>
             <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>
              Mostrando {filteredOrders.length} orden(es) visibles. Puedes registrar seguimiento local mientras el backend cierra recepción y estados.
             </p>
          </div>
          <ul className="data-list scrollable-list">
            {filteredOrders.length === 0 ? (
               <li className="empty-state">
                  <strong>No hay órdenes de compra</strong>
                  <span>Crea la primera orden para empezar a dar seguimiento al abastecimiento.</span>
               </li>
            ) : (
              filteredOrders.map((order) => (
                <li key={order.id} className="list-item-grid">
                  <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#1e3a8a', background: 'rgba(30,58,138,0.1)', padding:'4px 8px', borderRadius: '6px' }}>FOL-#{order.folio}</span>
                  <div className="flex-col">
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       {order.supplierName || "No asignado"}
                       <span className={getPurchaseStatusMeta(order.status).badgeClass} style={{fontSize: '0.75rem', padding: '4px 8px'}}>
                          {getPurchaseStatusMeta(order.status).label}
                       </span>
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>🗓 Llegada estimada: {formatDate(order.expectedDate)}</span>
                    {"overlayNotes" in order && order.overlayNotes ? (
                      <span style={{ fontSize: "0.8rem", color: "#475569" }}>📝 {order.overlayNotes}</span>
                    ) : null}
                  </div>
                  <div style={{ textAlign: 'right', display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <span style={{color: '#0f172a', border: '1px solid rgba(15,23,42,0.15)', padding: '6px 12px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '900' }}>
                       {formatMoney(order.total)}
                    </span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button type="button" className="product-button" onClick={() => updateOrderOverlay(order, "solicitada", "Proveedor contactado y orden confirmada.")}>
                        Solicitar
                      </button>
                      <button type="button" className="product-button" onClick={() => updateOrderOverlay(order, "recibida", "Recepción registrada localmente para conciliación posterior.")}>
                        Recibir
                      </button>
                      <button type="button" className="product-button" onClick={() => setSelectedOrder(order)}>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>

      {selectedOrder ? (() => {
        const statusMeta = getPurchaseStatusMeta(selectedOrder.status);
        return (
          <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
            <div
              className="sdmx-card-premium"
              style={{ maxWidth: "720px", width: "100%", padding: "24px", margin: "32px auto" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex-row-between" style={{ alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                <div className="flex-col">
                  <span className="hero-eyebrow">Orden de compra</span>
                  <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.5rem" }}>FOL-#{selectedOrder.folio}</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    {selectedOrder.supplierName || "Proveedor por confirmar"} · llegada estimada {formatDate(selectedOrder.expectedDate)}
                  </p>
                </div>
                <button type="button" className="product-button" onClick={() => setSelectedOrder(null)}>
                  Cerrar
                </button>
              </div>

              <div className="grid-cols-2" style={{ marginBottom: "16px" }}>
                <div style={{ padding: "16px", borderRadius: "16px", background: "#f8fafc" }}>
                  <span className="hero-eyebrow">Estado actual</span>
                  <h4 style={{ margin: "8px 0 4px 0", fontSize: "1.25rem", color: statusMeta.color }}>{statusMeta.label}</h4>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>{statusMeta.message}</p>
                </div>
                <div style={{ padding: "16px", borderRadius: "16px", background: "#f8fafc" }}>
                  <span className="hero-eyebrow">Seguimiento local</span>
                  <p style={{ margin: "8px 0 0 0", color: "#475569", lineHeight: 1.6 }}>
                    {("updatedAt" in selectedOrder && selectedOrder.updatedAt)
                      ? `Última actualización registrada ${new Date(selectedOrder.updatedAt as string).toLocaleString("es-MX")}.`
                      : "Aún no se registra seguimiento local para esta compra."}
                  </p>
                  {("receivedAt" in selectedOrder && selectedOrder.receivedAt)
                    ? <p style={{ margin: "8px 0 0 0", color: "#047857" }}>Recepción registrada el {new Date(selectedOrder.receivedAt as string).toLocaleString("es-MX")}.</p>
                    : null}
                </div>
              </div>

              <div className="grid-cols-3" style={{ marginBottom: "16px" }}>
                <div className="sdmx-card-header">
                  <span className="hero-eyebrow">Total</span>
                  <strong style={{ display: "block", marginTop: "6px", fontSize: "1.4rem" }}>{formatMoney(selectedOrder.total)}</strong>
                </div>
                <div className="sdmx-card-header">
                  <span className="hero-eyebrow">Llegada</span>
                  <strong style={{ display: "block", marginTop: "6px", fontSize: "1.1rem" }}>{formatDate(selectedOrder.expectedDate)}</strong>
                </div>
                <div className="sdmx-card-header">
                  <span className="hero-eyebrow">Proveedor</span>
                  <strong style={{ display: "block", marginTop: "6px", fontSize: "1.1rem" }}>{selectedOrder.supplierName || "Sin asignar"}</strong>
                </div>
              </div>

              {"overlayNotes" in selectedOrder && selectedOrder.overlayNotes ? (
                <div style={{ padding: "16px", borderRadius: "16px", background: "#fff7ed", color: "#9a3412", lineHeight: 1.6 }}>
                  <strong style={{ display: "block", marginBottom: "6px" }}>Nota operativa</strong>
                  {selectedOrder.overlayNotes}
                </div>
              ) : null}
            </div>
          </div>
        );
      })() : null}
    </section>
  );
}
