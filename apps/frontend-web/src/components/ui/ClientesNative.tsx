"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  tag: string;
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

export function ClientesNative() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    tag: "nuevo",
    notes: ""
  });

  async function loadCustomers() {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const result = await fetchJson<{ data: Customer[] }>(`/api/customers${query}`);
      setCustomers(result.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await fetchJson("/api/customers", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setForm({
        fullName: "",
        phone: "",
        email: "",
        tag: "nuevo",
        notes: ""
      });

      await loadCustomers();
      setMessage("Cliente guardado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Clientes nativo</span>
          <h1>Administración de clientes</h1>
          <p>Este panel ya lee y guarda clientes reales desde el backend nuevo.</p>
        </div>
        <div className="module-native-actions">
          <input
            className="module-search-input"
            placeholder="Buscar por nombre, correo o teléfono"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" className="product-button is-primary" onClick={() => void loadCustomers()}>
            Buscar
          </button>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="module-native-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Nuevo cliente</h3>
          <label>
            Nombre completo
            <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          </label>
          <label>
            WhatsApp
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            Etiqueta
            <select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}>
              <option value="nuevo">Nuevo</option>
              <option value="frecuente">Frecuente</option>
              <option value="vip">VIP</option>
            </select>
          </label>
          <label>
            Notas
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <button type="submit" disabled={loading}>
            Guardar cliente
          </button>
        </form>

        <article className="card">
          <h3>Listado de clientes</h3>
          <p className="muted">{customers.length} cliente(s) encontrados.</p>
          <ul className="data-list">
            {customers.length === 0 ? (
              <li>
                <strong>Sin clientes todavía</strong>
                <span>Cuando captures clientes aquí, aparecerán en esta lista.</span>
              </li>
            ) : (
              customers.map((customer) => (
                <li key={customer.id}>
                  <strong>{customer.fullName}</strong>
                  <span>
                    {customer.email || customer.phone || "Sin contacto"} · {customer.tag}
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
