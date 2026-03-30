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
    cache: "no-store",
    mode: "cors"
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Falló el backend, comunícate con soporte.");
  }

  return data as T;
}

export function ProveedoresNative() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  
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
    setApiStateMessage("");
    setApiStateError("");
    try {
      const result = await fetchJson<{ data: Supplier[] }>("/api/suppliers");
      setSuppliers(result.data);
    } catch (error) {
       setApiStateError(error instanceof Error ? error.message : "Ups, no pudimos cargar los proveedores. Revisa la red.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSuppliers();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setApiStateMessage("");
    setApiStateError("");

    if (!form.businessName.trim()) {
       setFormError("⚠️ Ingrese al menos la Razón Social o Nombre Comercial del proveedor.");
       return;
    }
    
    if (!form.phone && !form.email) {
       setFormError("⚠️ Recomendamos ingresar al menos un número de teléfono o correo electrónico para contacto.");
    }

    setLoading(true);
    try {
      await fetchJson("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm({ businessName: "", contactName: "", phone: "", email: "", categories: "", notes: "" });
      
      await loadSuppliers();
      setApiStateMessage("✅ Proveedor registrado exitosamente en plataforma.");
    } catch (error) {
      setApiStateError(error instanceof Error ? error.message : "El sistema rechazó el guardado del proveedor.");
    } finally {
      setLoading(false);
    }
  }

  const filteredSuppliers = suppliers.filter(s => !search || s.businessName.toLowerCase().includes(search.toLowerCase()) || (s.categories && s.categories.toLowerCase().includes(search.toLowerCase())));

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Red de Suministros</span>
          <h1>Catálogo de Proveedores</h1>
          <p>Centraliza y busca ágilmente los contactos de abastecimiento reales para tus sucursales y reparaciones.</p>
        </div>
        <div className="module-native-actions">
           <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <span style={{ position: "absolute", top: "16px", left: "14px", opacity: 0.5 }}>🔍</span>
            <input
              className="module-search-input"
              style={{ width: "100%", paddingLeft: "38px" }}
              placeholder="Filtro rápido..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="console-message is-warning">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <h3>Registrar Nueva Entidad</h3>
          {formError && <div className="form-message is-warning">{formError}</div>}
          <label>
            Entidad Comercial / Razón Social *
            <input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} placeholder="Ej. Distribuidora Central SA" />
          </label>
          <div className="grid-cols-auto">
             <label>Teléfono<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="10+ dígitos"/></label>
             <label>Correo Soporte<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="ventas@proveedor.com"/></label>
          </div>
          <div className="grid-cols-2">
             <label>Representante Directo<input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} placeholder="Ej. Lic. Martínez"/></label>
             <label>Categorías Distribuidas<input value={form.categories} onChange={(event) => setForm({ ...form, categories: event.target.value })} placeholder="Refacciones, Displays, Insumos..."/></label>
          </div>
          <button type="submit" disabled={loading} >Integrar Proveedor al Catálogo</button>
        </form>

        <article className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column'}}>
          <h3>Directorio de Distribuidores</h3>
          <p className="muted" style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '12px', marginBottom: '14px'}}>Listado con {filteredSuppliers.length} entidad(es) halladas.</p>
          <ul className="data-list scrollable-list">
            {filteredSuppliers.length === 0 ? (
               <li className="empty-state">
                  <strong>Busqueda Vacía</strong>
                  <span>Registra a la izquierda un nuevo flujo logístico.</span>
               </li>
            ) : (
              filteredSuppliers.map((supplier) => (
                <li key={supplier.id} className="list-item-grid">
                  <div className="flex-col">
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{supplier.businessName}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      👤 Rep: {supplier.contactName || "NA"} · 📞 {supplier.phone || "Sin Teléfono"} · 📧 {supplier.email || "Sin Email"}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{color: '#1e3a8a', backgroundColor: 'rgba(30,58,138,0.06)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                       {supplier.categories || "Cat. Múltiple"}
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
