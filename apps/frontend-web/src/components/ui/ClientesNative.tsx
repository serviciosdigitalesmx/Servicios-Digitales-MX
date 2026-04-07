"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";
import { useAuth } from "./AuthGuard";

type Customer = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  tag: string;
  notes?: string;
};

export function ClientesNative() {
  const { session } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", tag: "nuevo", notes: "" });

  const duplicateSummary = useMemo(() => {
    const phoneMap = new Map<string, number>();
    const emailMap = new Map<string, number>();

    customers.forEach((customer) => {
      const normalizedPhone = (customer.phone || "").replace(/\D/g, "");
      const normalizedEmail = (customer.email || "").trim().toLowerCase();
      if (normalizedPhone) phoneMap.set(normalizedPhone, (phoneMap.get(normalizedPhone) || 0) + 1);
      if (normalizedEmail) emailMap.set(normalizedEmail, (emailMap.get(normalizedEmail) || 0) + 1);
    });

    const duplicates = customers.map((customer) => {
      const normalizedPhone = (customer.phone || "").replace(/\D/g, "");
      const normalizedEmail = (customer.email || "").trim().toLowerCase();
      return {
        id: customer.id,
        hasPhoneDuplicate: normalizedPhone ? (phoneMap.get(normalizedPhone) || 0) > 1 : false,
        hasEmailDuplicate: normalizedEmail ? (emailMap.get(normalizedEmail) || 0) > 1 : false,
      };
    });

    return {
      duplicatesById: new Map(duplicates.map((item) => [item.id, item])),
      duplicatesCount: duplicates.filter((item) => item.hasPhoneDuplicate || item.hasEmailDuplicate).length,
      vipCount: customers.filter((customer) => customer.tag === "vip").length,
      riskCount: customers.filter((customer) =>
        /moroso|adeudo|pendiente|cobro/i.test(customer.tag || "") ||
        /moroso|adeudo|pendiente|cobro/i.test(customer.notes || "")
      ).length,
    };
  }, [customers]);

  async function loadCustomers() {
    if (!session?.shop.id) return;
    setLoading(true);
    setApiStateError("");
    setApiStateMessage("");

    try {
      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetchWithAuth(`/api/customers?${params.toString()}`);
      const payload = await (response as any).json();

      if (!(response as any).ok) {
        throw new Error(payload?.error?.message || "Error de conexión con el servidor.");
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      setCustomers(
        data.map((customer: Customer) => ({
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone ?? undefined,
          email: customer.email ?? undefined,
          tag: customer.tag,
          notes: customer.notes ?? undefined
        }))
      );
    } catch (error: unknown) {
      setApiStateError(error instanceof Error ? error.message : "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      const delayDebounceFn = setTimeout(() => {
        void loadCustomers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormNotice("");
    setApiStateError("");
    setApiStateMessage("");

    if (!session?.shop.id) return;
    if (!form.fullName.trim()) {
      return setFormError("⚠️ Ingrese forzosamente el Nombre o Título Comercial de la ficha.");
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setFormNotice("⚠️ Atención: El cliente se registrará sin datos de contacto.");
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          tag: form.tag,
          notes: form.notes.trim() || null
        })
      });
      const payload = await (response as any).json();

      if (!(response as any).ok) {
        throw new Error(payload?.error?.message || "Ocurrió un error al registrar al cliente. Verifique los datos e intente de nuevo.");
      }

      setForm({ fullName: "", phone: "", email: "", tag: "nuevo", notes: "" });
      await loadCustomers();
      setApiStateMessage("✅ Cliente registrado exitosamente.");
    } catch (error: unknown) {
      setApiStateError(error instanceof Error ? error.message : "Ocurrió un error al registrar al cliente. Verifique los datos e intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function getCustomerRisk(customer: Customer) {
    if (/moroso|adeudo|pendiente|cobro/i.test(customer.tag || "") || /moroso|adeudo|pendiente|cobro/i.test(customer.notes || "")) {
      return "riesgo";
    }
    if (customer.tag === "vip") return "vip";
    return "normal";
  }

  function handleWhatsapp(customer: Customer) {
    const normalizedPhone = (customer.phone || "").replace(/\D/g, "");
    if (!normalizedPhone) {
      setApiStateError("Este cliente no tiene teléfono o WhatsApp registrado.");
      return;
    }
    const message = `Hola ${customer.fullName}, te contactamos desde ${session?.shop?.name || "Servicios Digitales MX"} para dar seguimiento a tu servicio.`;
    window.open(`https://wa.me/52${normalizedPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function handleCreateOrderFromCustomer(customer: Customer) {
    localStorage.setItem("sdmx_operativo_prefill_customer", JSON.stringify({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone || "",
      email: customer.email || "",
    }));
    window.location.href = "/interno?modulo=operativo";
  }

  return (
    <section className="clientes-shell animate-fadeIn space-y-8">
      <div className="clientes-header flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex-col">
          <span className="font-label uppercase tracking-[0.3em] text-blue-500 font-black text-[10px] block mb-2">Base de Inteligencia Comercial</span>
          <h1 className="font-tech text-white text-4xl uppercase tracking-tighter mb-2">Directorio de Clientes</h1>
          <p className="font-label text-slate-500 max-w-xl text-lg">Gestiona tu red de contactos, identifica perfiles clave y asegura un seguimiento de élite para cada cliente.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="relative group min-w-[320px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-100 transition-all">🔍</span>
              <input 
                type="text" 
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-12 pr-4 py-3 font-label text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600" 
                placeholder="Buscar por Nombre, Tel o Correo..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
           </div>
           <button 
             type="button"
             disabled={loading}
             onClick={() => void loadCustomers()}
             className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-tech text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5 font-black"
           >
             {loading ? "Sincronizando..." : "Actualizar Central"}
           </button>
        </div>
      </div>

      {apiStateMessage && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-label font-bold text-sm rounded-xl animate-fadeIn">{apiStateMessage}</div>}
      {apiStateError && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-label font-bold text-sm rounded-xl animate-fadeIn">{apiStateError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sdmx-glass p-5 rounded-2xl border-white/5">
          <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black">Clientes VIP</p>
          <p className="font-tech text-white text-3xl mt-2">{duplicateSummary.vipCount}</p>
        </div>
        <div className="sdmx-glass p-5 rounded-2xl border-white/5">
          <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black">Duplicados detectados</p>
          <p className="font-tech text-white text-3xl mt-2">{duplicateSummary.duplicatesCount}</p>
        </div>
        <div className="sdmx-glass p-5 rounded-2xl border-white/5">
          <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black">Clientes en riesgo</p>
          <p className="font-tech text-white text-3xl mt-2">{duplicateSummary.riskCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* FORMULARIO DE CAPTURA RÁPIDA */}
        <form className="xl:col-span-4 sdmx-glass p-8 rounded-[2.5rem] border-white/5 flex flex-col space-y-6" onSubmit={handleSubmit}>
          <div className="border-b border-white/5 pb-4">
             <span className="font-tech text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">Registro de Entrada</span>
             <h3 className="font-tech text-white text-lg uppercase tracking-wider mt-1">Nueva Ficha de Cliente</h3>
          </div>

          <div className="space-y-6 flex-1">
            {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-label font-bold text-[10px] rounded-lg">{formError}</div>}
            {formNotice && !formError && <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-label font-bold text-[10px] rounded-lg">{formNotice}</div>}

            <div className="space-y-2">
              <label className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black ml-1">Nombre o Razón Social *</label>
              <input 
                required 
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-4 text-white font-label font-bold text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                value={form.fullName} 
                onChange={(event) => setForm({ ...form, fullName: event.target.value })} 
                placeholder="Ej. Instituto Norte / Juan Pérez" 
              />
            </div>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
               <div className="space-y-2">
                 <label className="font-label text-[9px] text-slate-600 uppercase tracking-widest font-black ml-1">Teléfono Móvil / WhatsApp</label>
                 <input 
                   className="w-full bg-transparent border-b border-white/10 py-2 text-white font-tech text-xs focus:border-blue-500 outline-none transition-all"
                   value={form.phone} 
                   onChange={(event) => setForm({ ...form, phone: event.target.value })} 
                   placeholder="Ej. 811..." 
                 />
               </div>
               <div className="space-y-2">
                 <label className="font-label text-[9px] text-slate-600 uppercase tracking-widest font-black ml-1">Correo Electrónico</label>
                 <input 
                   type="email" 
                   className="w-full bg-transparent border-b border-white/10 py-2 text-white font-label text-xs focus:border-blue-500 outline-none transition-all"
                   value={form.email} 
                   onChange={(event) => setForm({ ...form, email: event.target.value })} 
                   placeholder="contacto@dominio.mx" 
                 />
               </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black ml-1">Categoría de Perfil</label>
              <select 
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-label font-bold text-xs focus:border-blue-500/50 outline-none cursor-pointer"
                value={form.tag} 
                onChange={(event) => setForm({ ...form, tag: event.target.value })}
              >
                <option value="nuevo" className="bg-slate-900">Cliente Nuevo</option>
                <option value="frecuente" className="bg-slate-900">Frecuente / Aliado</option>
                <option value="vip" className="bg-slate-900 font-bold text-amber-400">Cliente VIP / Institucional</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black ml-1">Notas y Preferencias</label>
              <textarea 
                className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-label font-bold text-xs focus:border-blue-500/50 outline-none min-h-[100px] resize-none"
                value={form.notes} 
                onChange={(event) => setForm({ ...form, notes: event.target.value })} 
                placeholder="Indica alergias al servicio, preferencias de entrega o contexto comercial..." 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-tech text-[10px] uppercase tracking-[0.3em] font-black shadow-xl shadow-blue-500/20 transition-all mt-4"
          >
            Fijar Ficha de Cliente
          </button>
        </form>

        {/* DIRECTORIO ACTIVO */}
        <div className="xl:col-span-8 flex flex-col gap-8 h-[740px]">
          <div className="sdmx-glass p-8 rounded-[2.5rem] border-white/5 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="font-tech text-white text-xl uppercase tracking-wider">Directorio Centralizado</h3>
                  <p className="font-label text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Total de {customers.length} Entidades Registradas</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-3 sdmx-scrollbar">
              {customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 text-center py-20 border border-white/5 border-dashed rounded-[3rem]">
                   <div className="text-5xl mb-6">📇</div>
                   <p className="font-tech text-white text-[10px] uppercase tracking-[0.2em] mb-2 font-black">Directorio Vacío</p>
                   <p className="font-label text-slate-600 text-xs font-bold uppercase tracking-widest">Inicia el registro para construir tu base comercial.</p>
                </div>
              ) : (
                customers.map((customer) => (
                  <div key={customer.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-800/60 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex items-center gap-6 z-10">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-tech text-lg font-black border transition-all ${
                         customer.tag === 'vip' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-glow shadow-amber-500/20' 
                          : 'bg-slate-800 text-slate-500 border-white/5'
                       }`}>
                         {customer.fullName.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <strong className="text-white font-tech text-base uppercase tracking-wider block group-hover:text-blue-400 transition-all">{customer.fullName}</strong>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                             <span className="font-label text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                               <span className="opacity-40">📞</span> {customer.phone || "Sin Teléfono"}
                             </span>
                             <span className="font-label text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 italic">
                               <span className="opacity-40">📧</span> {customer.email || "Sin Correo"}
                             </span>
                             {duplicateSummary.duplicatesById.get(customer.id)?.hasPhoneDuplicate || duplicateSummary.duplicatesById.get(customer.id)?.hasEmailDuplicate ? (
                               <span className="font-label text-amber-400 text-[10px] font-bold uppercase tracking-widest">Duplicado detectado</span>
                             ) : null}
                             {getCustomerRisk(customer) === "riesgo" ? (
                               <span className="font-label text-red-400 text-[10px] font-bold uppercase tracking-widest">Riesgo de cobro</span>
                             ) : null}
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-6 sm:mt-0 text-right z-10">
                       <span className={`font-label font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${
                         customer.tag === 'vip' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                          : customer.tag === 'nuevo' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                       }`}>
                         {customer.tag}
                       </span>
                       <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-600 group-hover:text-white transition-all">
                          <span className="text-xs uppercase font-black">⚙️</span>
                       </div>
                    </div>

                    <div className="w-full sm:w-auto mt-6 sm:mt-0 flex flex-wrap gap-2 z-10">
                      <button type="button" className="sdmx-btn-ghost" onClick={() => handleWhatsapp(customer)}>WhatsApp</button>
                      <button type="button" className="sdmx-btn-ghost" onClick={() => handleCreateOrderFromCustomer(customer)}>Nueva orden</button>
                      <button type="button" className="sdmx-btn-ghost" onClick={() => setSelectedCustomer(customer)}>Perfil</button>
                    </div>

                    {/* Efecto de fondo para VIP */}
                    {customer.tag === 'vip' && (
                      <div className="absolute top-0 right-0 w-32 h-full bg-amber-500/5 skew-x-12 translate-x-12 blur-2xl" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <div style={{position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)'}}>
          <div className="sdmx-glass p-8 rounded-[2rem] border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto sdmx-scrollbar">
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <span className="font-label uppercase tracking-[0.3em] text-blue-500 font-black text-[10px] block mb-2">Perfil Comercial</span>
                <h3 className="font-tech text-white text-2xl uppercase tracking-tighter">{selectedCustomer.fullName}</h3>
                <p className="font-label text-slate-500 text-sm mt-2">Resumen rápido del cliente para seguimiento, cobro y nueva recepción.</p>
              </div>
              <button type="button" className="sdmx-btn-ghost" onClick={() => setSelectedCustomer(null)}>Cerrar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="sdmx-glass p-5 rounded-2xl border-white/5">
                <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black">Perfil</p>
                <p className="font-tech text-white text-xl mt-2">{selectedCustomer.tag.toUpperCase()}</p>
              </div>
              <div className="sdmx-glass p-5 rounded-2xl border-white/5">
                <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black">Duplicidad</p>
                <p className="font-tech text-white text-xl mt-2">
                  {duplicateSummary.duplicatesById.get(selectedCustomer.id)?.hasPhoneDuplicate || duplicateSummary.duplicatesById.get(selectedCustomer.id)?.hasEmailDuplicate ? "Detectada" : "Limpio"}
                </p>
              </div>
              <div className="sdmx-glass p-5 rounded-2xl border-white/5">
                <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black">Riesgo comercial</p>
                <p className="font-tech text-white text-xl mt-2">{getCustomerRisk(selectedCustomer) === "riesgo" ? "Revisar cobro" : "Controlado"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="sdmx-glass p-6 rounded-[1.5rem] border-white/5">
                <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black mb-4">Contacto</p>
                <div className="space-y-3 text-sm">
                  <p className="text-slate-300"><strong className="text-white">WhatsApp:</strong> {selectedCustomer.phone || "Sin teléfono registrado"}</p>
                  <p className="text-slate-300"><strong className="text-white">Correo:</strong> {selectedCustomer.email || "Sin correo registrado"}</p>
                  <p className="text-slate-300"><strong className="text-white">Notas:</strong> {selectedCustomer.notes || "Sin notas internas registradas"}</p>
                </div>
              </div>

              <div className="sdmx-glass p-6 rounded-[1.5rem] border-white/5">
                <p className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black mb-4">Acciones rápidas</p>
                <div className="flex flex-col gap-3">
                  <button type="button" className="sdmx-btn-primary" onClick={() => handleWhatsapp(selectedCustomer)}>Contactar por WhatsApp</button>
                  <button type="button" className="sdmx-btn-ghost" onClick={() => handleCreateOrderFromCustomer(selectedCustomer)}>Crear orden desde cliente</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
