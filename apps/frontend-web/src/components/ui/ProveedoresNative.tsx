"use client";

import { FormEvent, useEffect, useState } from "react";

type Supplier = {
  id: string;
  businessName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  categories?: string;
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

export function ProveedoresNative() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    categories: "",
    notes: ""
  });

  async function loadSuppliers() {
    setLoading(true);
    try {
      const result = await fetchJson<{ data: Supplier[] }>("/api/suppliers");
      setSuppliers(result.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar los proveedores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSuppliers();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await fetchJson("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm({
        businessName: "",
        contactName: "",
        phone: "",
        email: "",
        categories: "",
        notes: ""
      });
      await loadSuppliers();
      setMessage("Proveedor guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el proveedor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Proveedores nativo</span>
          <h1>Catálogo de proveedores</h1>
          <p>Este panel centraliza el alta y la consulta de proveedores reales del negocio.</p>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="module-native-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Nuevo proveedor</h3>
          <label>
            Nombre comercial
            <input required value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} />
          </label>
          <label>
            Contacto
            <input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} />
          </label>
          <label>
            Teléfono
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            Categorías
            <input value={form.categories} onChange={(event) => setForm({ ...form, categories: event.target.value })} />
          </label>
          <button type="submit" disabled={loading}>Guardar proveedor</button>
        </form>

        <article className="card">
          <h3>Proveedores registrados</h3>
          <ul className="data-list">
            {suppliers.length === 0 ? (
              <li>
                <strong>Sin proveedores todavía</strong>
                <span>Empieza dando de alta el primero desde este panel.</span>
              </li>
            ) : (
              suppliers.map((supplier) => (
                <li key={supplier.id}>
                  <strong>{supplier.businessName}</strong>
                  <span>
                    {supplier.contactName || "Sin contacto"}
                    {supplier.phone ? ` · ${supplier.phone}` : ""}
                    {supplier.categories ? ` · ${supplier.categories}` : ""}
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
