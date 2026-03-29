"use client";

import { FormEvent, useEffect, useState } from "react";

type Branch = {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  phone?: string;
  isActive: boolean;
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

export function SucursalesNative() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    phone: ""
  });

  async function loadBranches() {
    setLoading(true);
    try {
      const result = await fetchJson<{ data: Branch[] }>("/api/branches");
      setBranches(result.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar las sucursales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBranches();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await fetchJson("/api/branches", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm({
        name: "",
        code: "",
        address: "",
        city: "",
        state: "",
        phone: ""
      });
      await loadBranches();
      setMessage("Sucursal guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la sucursal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Sucursales nativo</span>
          <h1>Administración de sucursales</h1>
          <p>Este panel ya gestiona las sucursales reales del shop sobre el backend nuevo.</p>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="module-native-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Nueva sucursal</h3>
          <label>
            Nombre
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Código
            <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </label>
          <label>
            Dirección
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </label>
          <label>
            Ciudad
            <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          </label>
          <label>
            Estado
            <input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
          </label>
          <label>
            Teléfono
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <button type="submit" disabled={loading}>Guardar sucursal</button>
        </form>

        <article className="card">
          <h3>Sucursales registradas</h3>
          <ul className="data-list">
            {branches.length === 0 ? (
              <li>
                <strong>Sin sucursales todavía</strong>
                <span>La primera sucursal nueva que des de alta aparecerá aquí.</span>
              </li>
            ) : (
              branches.map((branch) => (
                <li key={branch.id}>
                  <strong>{branch.name}{branch.code ? ` · ${branch.code}` : ""}</strong>
                  <span>
                    {branch.city || "Sin ciudad"}
                    {branch.state ? `, ${branch.state}` : ""}
                    {branch.phone ? ` · ${branch.phone}` : ""}
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
