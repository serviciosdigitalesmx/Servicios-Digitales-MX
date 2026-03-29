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
  category?: string;
  brand?: string;
  cost: number;
  salePrice: number;
  minimumStock: number;
  stockCurrent: number;
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

export function StockNative() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [supplierForm, setSupplierForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    categories: "",
    notes: ""
  });
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    brand: "",
    compatibleModel: "",
    primarySupplierId: "",
    cost: "0",
    salePrice: "0",
    minimumStock: "0",
    unit: "pieza",
    location: "",
    notes: "",
    initialStock: "0"
  });

  async function loadData() {
    setLoading(true);
    try {
      const [suppliersResult, productsResult] = await Promise.all([
        fetchJson<{ data: Supplier[] }>("/api/suppliers"),
        fetchJson<{ data: Product[] }>("/api/products")
      ]);
      setSuppliers(suppliersResult.data);
      setProducts(productsResult.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar stock");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSupplierSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await fetchJson("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(supplierForm)
      });
      setSupplierForm({
        businessName: "",
        contactName: "",
        phone: "",
        email: "",
        categories: "",
        notes: ""
      });
      await loadData();
      setMessage("Proveedor guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el proveedor");
    } finally {
      setLoading(false);
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await fetchJson("/api/products", {
        method: "POST",
        body: JSON.stringify({
          ...productForm,
          primarySupplierId: productForm.primarySupplierId || null,
          cost: Number(productForm.cost || 0),
          salePrice: Number(productForm.salePrice || 0),
          minimumStock: Number(productForm.minimumStock || 0),
          initialStock: Number(productForm.initialStock || 0)
        })
      });
      setProductForm({
        sku: "",
        name: "",
        category: "",
        brand: "",
        compatibleModel: "",
        primarySupplierId: "",
        cost: "0",
        salePrice: "0",
        minimumStock: "0",
        unit: "pieza",
        location: "",
        notes: "",
        initialStock: "0"
      });
      await loadData();
      setMessage("Producto guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el producto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Stock nativo</span>
          <h1>Inventario y proveedores</h1>
          <p>Este panel ya guarda proveedores, productos y stock inicial en el backend nuevo.</p>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="module-native-grid module-native-grid-wide">
        <form className="card form-card" onSubmit={handleSupplierSubmit}>
          <h3>Proveedor</h3>
          <label>
            Nombre comercial
            <input value={supplierForm.businessName} onChange={(event) => setSupplierForm({ ...supplierForm, businessName: event.target.value })} required />
          </label>
          <label>
            Contacto
            <input value={supplierForm.contactName} onChange={(event) => setSupplierForm({ ...supplierForm, contactName: event.target.value })} />
          </label>
          <label>
            Teléfono
            <input value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} />
          </label>
          <label>
            Categorías
            <input value={supplierForm.categories} onChange={(event) => setSupplierForm({ ...supplierForm, categories: event.target.value })} />
          </label>
          <button type="submit" disabled={loading}>Guardar proveedor</button>
        </form>

        <form className="card form-card" onSubmit={handleProductSubmit}>
          <h3>Producto</h3>
          <label>SKU<input value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} required /></label>
          <label>Nombre<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label>
          <label>Categoría<input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} /></label>
          <label>Marca<input value={productForm.brand} onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })} /></label>
          <label>Modelo compatible<input value={productForm.compatibleModel} onChange={(event) => setProductForm({ ...productForm, compatibleModel: event.target.value })} /></label>
          <label>
            Proveedor principal
            <select value={productForm.primarySupplierId} onChange={(event) => setProductForm({ ...productForm, primarySupplierId: event.target.value })}>
              <option value="">Sin proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>
              ))}
            </select>
          </label>
          <label>Costo<input type="number" min="0" step="0.01" value={productForm.cost} onChange={(event) => setProductForm({ ...productForm, cost: event.target.value })} /></label>
          <label>Precio<input type="number" min="0" step="0.01" value={productForm.salePrice} onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })} /></label>
          <label>Stock mínimo<input type="number" min="0" step="0.01" value={productForm.minimumStock} onChange={(event) => setProductForm({ ...productForm, minimumStock: event.target.value })} /></label>
          <label>Stock inicial<input type="number" min="0" step="0.01" value={productForm.initialStock} onChange={(event) => setProductForm({ ...productForm, initialStock: event.target.value })} /></label>
          <button type="submit" disabled={loading}>Guardar producto</button>
        </form>
      </div>

      <article className="card">
        <h3>Inventario actual</h3>
        <ul className="data-list">
          {products.length === 0 ? (
            <li>
              <strong>Sin productos todavía</strong>
              <span>Empieza cargando proveedor y producto desde este panel.</span>
            </li>
          ) : (
            products.map((product) => (
              <li key={product.id}>
                <strong>{product.sku} · {product.name}</strong>
                <span>
                  {product.brand || "Sin marca"} · Stock {product.stockCurrent} · Min {product.minimumStock}
                  {product.supplierName ? ` · ${product.supplierName}` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
