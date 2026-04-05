"use client";

import { FormEvent, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import { useApiData } from "../../hooks/useApiData";

type Supplier = {
  id: string;
  businessName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  categories?: string;
};

export function ProveedoresNative() {
  // 1. Hook genérico para carga de datos
  const { 
    data: suppliers, 
    loading, 
    error: apiStateError, 
    refresh: loadSuppliers 
  } = useApiData<Supplier[]>('/api/suppliers');

  const [apiStateMessage, setApiStateMessage] = useState("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setApiStateMessage("");

    if (!form.businessName.trim()) {
       setFormError("⚠️ Ingrese al menos la Razón Social o Nombre Comercial del proveedor.");
       return;
    }

    try {
      // Hardening: No enviamos tenant_id, el backend lo resuelve del JWT
      const result = await apiClient.post('/api/suppliers', {
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        categories: form.categories.trim() || null,
        notes: form.notes.trim() || null
      });

      if (!result.success) {
        throw new Error(result.error?.message || "Error al guardar el proveedor.");
      }
      
      setForm({ businessName: "", contactName: "", phone: "", email: "", categories: "", notes: "" });
      await loadSuppliers();
      setApiStateMessage("✅ Proveedor registrado exitosamente.");
    } catch (error: any) {
      setFormError(error.message);
    }
  }

  const filteredSuppliers = (suppliers || []).filter(s => 
    !search || 
    s.businessName.toLowerCase().includes(search.toLowerCase()) || 
    (s.categories && s.categories.toLowerCase().includes(search.toLowerCase()))
  );

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
          <button type="submit" disabled={loading} >
            {loading ? "Registrando..." : "Integrar Proveedor al Catálogo"}
          </button>
        </form>

        <article className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column'}}>
          <h3>Directorio de Distribuidores</h3>
          <p className="muted" style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '12px', marginBottom: '14px'}}>Listado con {filteredSuppliers.length} entidad(es) halladas.</p>
          
          {loading && !suppliers ? (
            <div className="text-center py-10 opacity-50">Cargando catálogo...</div>
          ) : (
            <ul className="data-list scrollable-list">
              {filteredSuppliers.length === 0 ? (
                 <li className="empty-state">
                    <strong>Búsqueda Vacía</strong>
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
          )}
        </article>
      </div>
    </section>
  );
}
