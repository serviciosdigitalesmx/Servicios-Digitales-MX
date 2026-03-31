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

import { supabase } from "../../lib/supabase";
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
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', session.shop.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBranches((data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        city: b.city,
        state: b.state,
        phone: b.phone,
        isActive: b.is_active
      })));
    } catch (error: any) {
       setApiStateError(error.message || "Error al cargar las sucursales.");
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
      const { error } = await supabase.from('branches').insert({
        tenant_id: session.shop.id,
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address,
        city: form.city,
        state: form.state,
        phone: form.phone,
        is_active: true,
        created_by: session.user.id
      });

      if (error) throw error;

      setForm({
        name: "", code: "", address: "", city: "", state: "", phone: ""
      });
      await loadBranches();
      setApiStateMessage("✅ Sucursal guardada exitosamente.");
    } catch (error: any) {
       setApiStateError(error.message || "Error al guardar la sucursal.");
    } finally {
      setLoading(false);
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
          
          <button type="submit" disabled={loading} >Guardar Sucursal</button>
        </form>

        <article className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column'}}>
           <div className="flex-row-between">
              <h3>Directorio de Sucursales</h3>
           </div>
          <ul className="data-list scrollable-list">
            {branches.length === 0 ? (
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
        </article>
      </div>
    </section>
  );
}
