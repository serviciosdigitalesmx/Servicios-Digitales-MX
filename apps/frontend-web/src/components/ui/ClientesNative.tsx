"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = { id: string; fullName: string; phone?: string; email?: string; tag: string; notes?: string; };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store", mode: "cors" });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "El backend devolvió un error inesperado al procesar tu solicitud.");
  return data as T;
}

export function ClientesNative() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", tag: "nuevo", notes: "" });

  async function loadCustomers() {
    setLoading(true); setApiStateError(""); setApiStateMessage("");
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const result = await fetchJson<{ data: Customer[] }>(`/api/customers${query}`);
      setCustomers(result.data);
    } catch (error) {
       setApiStateError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      void loadCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setFormNotice(""); setApiStateError(""); setApiStateMessage("");

    if (!form.fullName.trim()) return setFormError("⚠️ Ingrese forzosamente el Nombre o Título Comercial de la ficha.");
    if (!form.phone.trim() && !form.email.trim()) setFormNotice("⚠️ Atención: El cliente se registrará sin datos de contacto.");

    setLoading(true);
    try {
      await fetchJson("/api/customers", { method: "POST", body: JSON.stringify({ ...form, phone: form.phone.trim() || null, email: form.email.trim() || null }) });
      setForm({ fullName: "", phone: "", email: "", tag: "nuevo", notes: "" });
      void loadCustomers();
      setApiStateMessage("✅ Cliente registrado exitosamente.");
    } catch (error) {
       setApiStateError(error instanceof Error ? error.message : "Ocurrió un error al registrar al cliente. Verifique los datos e intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Directorio</span>
          <h1>Directorio de Clientes</h1>
          <p className="muted">Gestiona tu base de clientes y prospectos.</p>
        </div>
        <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
           <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <span style={{ position: "absolute", top: "14px", left: "14px", opacity: 0.5, fontSize: "1.1rem" }}>🔍</span>
            <input className="module-search-input" style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", height: "48px" }}
              placeholder="Filtro rápido por persona o medio..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <button type="button" disabled={loading} className="product-button" style={{height: "48px", background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1"}} onClick={() => void loadCustomers()}>
             {loading ? 'Refrescando...' : 'Recargar Lista'}
          </button>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="form-message is-error">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Crear Nuevo Cliente</h3>
             <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Registra la información de contacto para futuras atenciones.</p>
          </div>

          {formError && <div className="form-message is-error">{formError}</div>}
          {formNotice && !formError && <div className="form-message is-warning">{formNotice}</div>}
          
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Nombre o Razón Social *</label>
             <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Ej. Instituto Cultural Norte. SA" />
          </div>
          
          <div className="grid-cols-2" style={{background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '10px'}}>
            <div className="flex-col">
               <label style={{margin: 0}}>Teléfono / WhatsApp</label>
               <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Ej. 811..." />
            </div>
            <div className="flex-col">
               <label style={{margin: 0}}>Correo Electrónico</label>
               <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="titular@comercio.mx" />
            </div>
          </div>
          
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Categoría de Cliente</label>
             <select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}>
               <option value="nuevo">Cliente Nuevo</option>
               <option value="frecuente">Cliente Frecuente</option>
               <option value="vip">Cliente VIP</option>
             </select>
          </div>
          
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label>Notas u Observaciones</label>
             <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Garantías directas, referencias directas..." style={{minHeight: '80px'}}/>
          </div>
          
          <button type="submit" disabled={loading} style={{padding: '14px', fontSize: '1rem', marginTop: '16px', fontWeight: 'bold'}}>Guardar Cliente</button>
        </form>

        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Listado de Clientes</h3>
             <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>{customers.length} clientes registrados.</p>
          </div>
          
          <ul className="data-list scrollable-list">
            {customers.length === 0 ? (
              <li className="empty-state">
                <strong>No hay clientes registrados</strong>
                <span>Agrega tu primer cliente usando el formulario de lado izquierdo.</span>
              </li>
            ) : (
              customers.map((customer) => (
                <li key={customer.id} className="list-item-grid">
                  <div className="flex-col">
                     <strong style={{fontSize: '1.1rem', color: '#0f172a'}}>{customer.fullName}</strong>
                     <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '16px' }}>
                       <span>📞 {customer.phone || "Sin Fon"}</span>
                       <span>📧 {customer.email || "Sin Correo Institucional"}</span>
                     </span>
                  </div>
                  <div style={{textAlign: 'right'}}>
                     <span className={`badge-${customer.tag === 'vip' ? 'warning' : customer.tag === 'nuevo' ? 'info' : 'success'}`}>
                        SECTOR: {customer.tag.toUpperCase()}
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
