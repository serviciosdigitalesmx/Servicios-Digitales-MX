"use client";

import { FormEvent, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import { useApiData } from "../../hooks/useApiData";

type Branch = {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  phone?: string;
  isActive: boolean;
};

export function SucursalesNative() {
  // 1. Hook genérico para carga de datos
  const { 
    data: branches, 
    loading, 
    error: apiStateError, 
    refresh: loadBranches 
  } = useApiData<Branch[]>('/api/branches');

  const [apiStateMessage, setApiStateMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    phone: ""
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setApiStateMessage("");

    if (!form.name.trim()) {
      setFormError("⚠️ El nombre de la sucursal es obligatorio.");
      return;
    }
    if (!form.code.trim()) {
       setFormError("⚠️ El código de la sucursal es obligatorio.");
       return;
    }

    try {
      // Hardening: No enviamos tenant_id, el backend lo resuelve del JWT
      const result = await apiClient.post('/api/branches', {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address,
        city: form.city,
        state: form.state,
        phone: form.phone,
        isActive: true
      });

      if (!result.success) {
        throw new Error(result.error?.message || "Error al guardar la sucursal.");
      }

      setForm({
        name: "", code: "", address: "", city: "", state: "", phone: ""
      });
      await loadBranches();
      setApiStateMessage("✅ Sucursal guardada exitosamente.");
    } catch (error: any) {
       setFormError(error.message);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
           <span className="hero-eyebrow">Sucursales</span>
           <h1>Gestión de Sucursales</h1>
           <p>Administra las sucursales y puntos de venta activos.</p>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="console-message is-warning">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <h3>Nueva Sucursal</h3>
          {formError && <div className="form-message is-warning">{formError}</div>}
          
          <div className="grid-cols-auto">
             <label>Nombre de la Sucursal *
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
          
          <button type="submit" disabled={loading} >
            {loading ? "Guardando..." : "Guardar Sucursal"}
          </button>
        </form>

        <article className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column'}}>
           <div className="flex-row-between">
              <h3>Directorio de Sucursales</h3>
           </div>
          
          {loading && !branches ? (
            <div className="text-center py-10 opacity-50">Sincronizando red...</div>
          ) : (
            <ul className="data-list scrollable-list">
              {(!branches || branches.length === 0) ? (
                 <li className="empty-state">
                    <strong>No hay sucursales registradas.</strong>
                    <span>Agrega tu primera sucursal usando el formulario.</span>
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
          )}
        </article>
      </div>
    </section>
  );
}
