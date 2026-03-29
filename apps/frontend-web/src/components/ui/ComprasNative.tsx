"use client";

import { FormEvent, useEffect, useState } from "react";

type Supplier = {
  id: string;
  businessName: string;
};

type Product = {
  id: string;
  sku: string;
  name: string;
};

type PurchaseOrder = {
  id: string;
  folio: string;
  status: string;
  expectedDate?: string;
  total: number;
  supplierName?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "No se pudo completar la operación");
  }

  return data as T;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function ComprasNative() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    supplierId: "",
    reference: "",
    paymentTerms: "",
    expectedDate: "",
    notes: "",
    productId: "",
    qtyOrdered: "1",
    unitCost: "0"
  });

  async function loadData() {
    setLoading(true);
    try {
      const [suppliersResult, productsResult, ordersResult] = await Promise.all([
        fetchJson<{ data: Supplier[] }>("/api/suppliers"),
        fetchJson<{ data: Product[] }>("/api/products"),
        fetchJson<{ data: PurchaseOrder[] }>("/api/purchase-orders")
      ]);

      setSuppliers(suppliersResult.data);
      setProducts(productsResult.data);
      setOrders(ordersResult.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar las compras");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const selectedProduct = products.find((product) => product.id === form.productId);
      if (!selectedProduct) {
        throw new Error("Selecciona un producto para la compra");
      }

      await fetchJson("/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierId: form.supplierId || null,
          reference: form.reference,
          paymentTerms: form.paymentTerms,
          expectedDate: form.expectedDate || null,
          notes: form.notes,
          items: [
            {
              productId: selectedProduct.id,
              skuSnapshot: selectedProduct.sku,
              productNameSnapshot: selectedProduct.name,
              qtyOrdered: Number(form.qtyOrdered || 0),
              unitCost: Number(form.unitCost || 0)
            }
          ]
        })
      });

      setForm({
        supplierId: "",
        reference: "",
        paymentTerms: "",
        expectedDate: "",
        notes: "",
        productId: "",
        qtyOrdered: "1",
        unitCost: "0"
      });

      await loadData();
      setMessage("Orden de compra creada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la compra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Compras nativo</span>
          <h1>Órdenes de compra</h1>
          <p>Este panel ya crea compras reales sobre el backend nuevo.</p>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="module-native-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Nueva orden de compra</h3>
          <label>
            Proveedor
            <select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
              <option value="">Sin proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>
              ))}
            </select>
          </label>
          <label>
            Producto
            <select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required>
              <option value="">Selecciona producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <input type="number" min="1" step="0.01" value={form.qtyOrdered} onChange={(event) => setForm({ ...form, qtyOrdered: event.target.value })} />
          </label>
          <label>
            Costo unitario
            <input type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} />
          </label>
          <label>
            Referencia
            <input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
          </label>
          <label>
            Condiciones de pago
            <input value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })} />
          </label>
          <label>
            Fecha esperada
            <input type="date" value={form.expectedDate} onChange={(event) => setForm({ ...form, expectedDate: event.target.value })} />
          </label>
          <label>
            Notas
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <button type="submit" disabled={loading || products.length === 0}>
            Guardar compra
          </button>
        </form>

        <article className="card">
          <h3>Compras recientes</h3>
          <ul className="data-list">
            {orders.length === 0 ? (
              <li>
                <strong>Sin órdenes de compra todavía</strong>
                <span>Este panel ya está listo para generar la primera.</span>
              </li>
            ) : (
              orders.map((order) => (
                <li key={order.id}>
                  <strong>{order.folio}</strong>
                  <span>
                    {order.supplierName || "Sin proveedor"} · {order.status} · {formatMoney(order.total)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
