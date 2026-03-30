"use client";

import { FormEvent, useEffect, useState } from "react";

type Supplier = { id: string; businessName: string; };

type Product = { id: string; sku: string; name: string; };

type PurchaseOrder = { id: string; folio: string; status: string; expectedDate?: string; total: number; supplierName?: string; };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store", mode: "cors"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Error de conexión con el servidor.");
  return data as T;
}

function formatMoney(value: number) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0); }
function formatDate(dateStr?: string) {
  if (!dateStr) return "Sin Promesa";
  return new Intl.DateTimeFormat("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

export function ComprasNative() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState({ supplierId: "", reference: "", paymentTerms: "", expectedDate: "", notes: "", productId: "", qtyOrdered: "1", unitCost: "0" });

  async function loadData() {
    setLoading(true); setApiStateMessage(""); setApiStateError("");
    try {
      const [suppliersResult, productsResult, ordersResult] = await Promise.all([
        fetchJson<{ data: Supplier[] }>("/api/suppliers").catch(() => ({ data: [] })),
        fetchJson<{ data: Product[] }>("/api/products").catch(() => ({ data: [] })),
        fetchJson<{ data: PurchaseOrder[] }>("/api/purchase-orders").catch(() => ({ data: [] }))
      ]);
      setSuppliers(suppliersResult.data); setProducts(productsResult.data); setOrders(ordersResult.data);
    } catch (error) { setApiStateError("Error al cargar los datos."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadData(); }, []);

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

      await fetchJson("/api/purchase-orders", {
        method: "POST", body: JSON.stringify({
          supplierId: form.supplierId || null, reference: form.reference, paymentTerms: form.paymentTerms, expectedDate: form.expectedDate || null,
          notes: form.notes, items: [{ productId: selectedProduct.id, skuSnapshot: selectedProduct.sku, productNameSnapshot: selectedProduct.name, qtyOrdered: qty, unitCost: cost }]
        })
      });
      setForm({ supplierId: "", reference: "", paymentTerms: "", expectedDate: "", notes: "", productId: "", qtyOrdered: "1", unitCost: "0" });
      await loadData();
      setApiStateMessage("✅ Orden de compra generada exitosamente.");
    } catch (error) { setApiStateError(error instanceof Error ? error.message : "Ocurrió un error al procesar la orden."); } finally { setLoading(false); }
  }

  const filteredOrders = orders.filter(o => !search || o.folio.toLowerCase().includes(search.toLowerCase()) || (o.supplierName && o.supplierName.toLowerCase().includes(search.toLowerCase())));

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Compras</span>
          <h1>Órdenes de Compra y Pedidos</h1>
          <p className="muted">Controla tu reabastecimiento externo mediante requisiciones asignadas a proveedores.</p>
        </div>
        <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
           <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <span style={{ position: "absolute", top: "14px", left: "14px", opacity: 0.5, fontSize: "1.1rem" }}>🔍</span>
            <input className="module-search-input" style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", height: "48px" }}
              placeholder="Escanear folio u origen..." value={search} onChange={(event) => setSearch(event.target.value)} />
           </div>
           <button type="button" disabled={loading} className="product-button" onClick={() => void loadData()}>
             Sincronizar Órdenes
          </button>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="form-message is-error">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Nueva Orden de Compra</h3>
             <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Calcula y registra tus futuros ingresos de almacén.</p>
          </div>
          {formError && <div className="form-message is-warning">{formError}</div>}
          
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Proveedor Principal *</label>
            <select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
              <option value="">-- Conecta el Mayorista Maestro --</option>
              {suppliers.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>))}
            </select>
          </div>

          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Producto / Refacción a Solicitar *</label>
            <select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
              <option value="">-- Enlaza un código indexado --</option>
              {products.map((product) => (<option key={product.id} value={product.id}>SKU {product.sku} — {product.name}</option>))}
            </select>
          </div>
          
          <div className="grid-cols-3" style={{background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0}}>Cantidad</label><input type="number" min="1" step="0.01" value={form.qtyOrdered} onChange={(event) => setForm({ ...form, qtyOrdered: event.target.value })} /></div>
             <div className="flex-col"><label style={{margin:0, color: '#10b981', fontWeight: 'bold'}}>Costo Unitario ($)</label><input type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} /></div>
             <div className="flex-col"><label style={{margin:0}}>Condiciones de Pago</label><input value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })} placeholder="Ej. A 30 días" /></div>
          </div>
          
          <div className="grid-cols-2" style={{marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0}}>Referencia / Folio Prov.</label><input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="Dato del proveedor (Ej. #30219L)" /></div>
             <div className="flex-col"><label style={{margin:0}}>Fecha Esperada</label><input type="date" value={form.expectedDate} onChange={(event) => setForm({ ...form, expectedDate: event.target.value })} /></div>
          </div>
          
          <button type="submit" disabled={loading || products.length === 0} className="product-button is-primary" style={{marginTop: '16px'}}>
             Generar Orden de Compra
          </button>
        </form>

        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Seguimiento de Compras</h3>
             <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Mostrando {filteredOrders.length} orden(es) en curso.</p>
          </div>
          <ul className="data-list scrollable-list">
            {filteredOrders.length === 0 ? (
               <li className="empty-state">
                  <strong>No hay órdenes de compra</strong>
                  <span>Tus pedidos formales con proveedores estarán enlistados aquí.</span>
               </li>
            ) : (
              filteredOrders.map((order) => (
                <li key={order.id} className="list-item-grid">
                  <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#1e3a8a', background: 'rgba(30,58,138,0.1)', padding:'4px 8px', borderRadius: '6px' }}>FOL-#{order.folio}</span>
                  <div className="flex-col">
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       {order.supplierName || "No asignado"}
                       <span className={`badge-${order.status === 'draft' ? 'neutral' : order.status === 'pending' ? 'warning' : 'success'}`} style={{fontSize: '0.75rem', padding: '4px 8px'}}>
                          {order.status.toUpperCase()}
                       </span>
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>🗓 Entregar aprox. el {formatDate(order.expectedDate)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{color: '#0f172a', border: '1px solid rgba(15,23,42,0.15)', padding: '6px 12px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '900' }}>
                       {formatMoney(order.total)}
                    </span>
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
