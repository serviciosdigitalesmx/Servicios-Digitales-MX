"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";

type Branch = {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  phone?: string;
  isActive: boolean;
};
import { useAuth } from "./AuthGuard";

export function SucursalesNative() {
  const { session } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    phone: ""
  });

  async function loadBranches() {
    if (!session?.shop.id) return;
    setLoading(true);
    setApiStateMessage("");
    setApiStateError("");
    try {
      const response = await fetchWithAuth("/api/branches");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Error al cargar las sucursales.");
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      setBranches(data.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        city: b.city,
        state: b.state,
        phone: b.phone,
        isActive: b.isActive
      })));
    } catch (error: unknown) {
       setApiStateError(error instanceof Error ? error.message : "Error al cargar las sucursales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void loadBranches();
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setApiStateMessage("");
    setApiStateError("");

    if (!session?.shop.id) return;
    if (!form.name.trim()) {
      setFormError("⚠️ El nombre de la sucursal es obligatorio.");
      return;
    }
    if (!form.code.trim()) {
       setFormError("⚠️ El código de la sucursal es obligatorio.");
       return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/branches", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim(),
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          phone: form.phone.trim() || null
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Error al guardar la sucursal.");
      }

      setForm({
        name: "", code: "", address: "", city: "", state: "", phone: ""
      });
      await loadBranches();
      setApiStateMessage("✅ Sucursal guardada exitosamente.");
    } catch (error: unknown) {
       setApiStateError(error instanceof Error ? error.message : "Error al guardar la sucursal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
           <span className="hero-eyebrow">Sucursales</span>
           <h1>Red de sucursales</h1>
           <p>Organiza puntos de atención, laboratorios y sedes activas para operar con contexto claro por ubicación.</p>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="console-message is-warning">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <h3>Nueva sucursal</h3>
          {formError && <div className="form-message is-warning">{formError}</div>}
          
          <div className="grid-cols-auto">
             <label>Nombre de la sucursal *
               <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Laboratorio Tech"/>
             </label>
             <label>Código *
               <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Ej. LAB-01"/>
             </label>
          </div>
          
          <label>Dirección
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Calle, Plaza, Local..." />
          </label>
          
          <div className="grid-cols-2">
             <label>Ciudad<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
             <label>Estado<input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></label>
          </div>
          
          <label>Teléfono
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          
          <button type="submit" disabled={loading} >Guardar sucursal</button>
        </form>

        <article className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column'}}>
           <div className="flex-row-between">
              <div className="flex-col">
                <h3 style={{margin: 0}}>Sucursales activas</h3>
                <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>{branches.length} sucursal(es) visibles.</p>
              </div>
           </div>
          <ul className="data-list scrollable-list">
            {branches.length === 0 ? (
               <li className="empty-state">
                  <strong>No hay sucursales registradas.</strong>
                  <span>Crea la primera sede para empezar a operar con contexto multiubicación.</span>
               </li>
            ) : (
              branches.map((branch) => (
                <li key={branch.id} className="list-item-grid">
                  <div style={{ background: '#3b82f6', color: 'white', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {branch.code || "NA"}
                  </div>
                  <div className="flex-col">
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{branch.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {branch.city || "Sin ciudad"}, {branch.state || "NA"} 
                      {branch.phone ? ` · Contacto: ${branch.phone}` : ""}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-pill ${branch.isActive ? 'is-success' : 'is-warning'}`} style={{minWidth: '50px', textAlign: 'center'}}>
                       {branch.isActive ? 'Activa' : 'Inactiva'}
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
