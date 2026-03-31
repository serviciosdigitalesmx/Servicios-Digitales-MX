"use client";

import React, { useState, useEffect } from "react";
import "./portal.css";
import { 
  IconWrench, IconHashtag, IconWarning, IconShield, 
  IconCamera, IconMicrochip, IconUser, IconArrowLeft, 
  IconLaptop, IconWhatsApp, IconClose, IconCircleNotch,
  IconPaperPlane, IconMonitor, IconCheckCircular
} from "../../../components/ui/Icons";

import { supabase } from "../../../lib/supabase";

const CONFIG = {
  TENANT_SLUG: process.env.NEXT_PUBLIC_TENANT_SLUG ?? "taller-centro",
  TIENDA_WHATSAPP: '528117006536',
  SUGGESTIONS_KEY: 'sdmx_folios_historial'
};

function formatDateYMD(valor: any) {
  if (!valor) return '---';
  const raw = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ClientPortal() {
  const [view, setView] = useState<"search" | "status" | "quote">("search");
  const [folio, setFolio] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [equipo, setEquipo] = useState<any>(null);
  const [historial, setHistorial] = useState<string[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [successQuote, setSuccessQuote] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Formulario de Cotización
  const [quoteForm, setQuoteForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "", 
    deviceType: "", deviceModel: "", issueDescription: "",
    urgency: "normal"
  });

  useEffect(() => {
    async function init() {
      // Resolve TenantId by Slug
      const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', CONFIG.TENANT_SLUG).single();
      if (tenant) setTenantId(tenant.id);

      try {
        const raw = localStorage.getItem(CONFIG.SUGGESTIONS_KEY);
        if (raw) setHistorial(JSON.parse(raw));
      } catch(e) {}

      const urlParams = new URLSearchParams(window.location.search);
      const folioParam = urlParams.get('folio');
      if (folioParam) {
        setFolio(folioParam.toUpperCase());
        ejecutarBusqueda(folioParam.toUpperCase());
      }
    }
    void init();
  }, []);

  const agregarHistorial = (f: string) => {
    const clean = f.trim().toUpperCase();
    if (!clean) return;
    const actuales = historial.filter(x => x !== clean);
    actuales.unshift(clean);
    const nuevos = actuales.slice(0, 20);
    setHistorial(nuevos);
    localStorage.setItem(CONFIG.SUGGESTIONS_KEY, JSON.stringify(nuevos));
  };

  const ejecutarBusqueda = async (folioString: string) => {
    if (!folioString.trim()) return;
    setLoading(true);
    setErrorStatus(null);

    try {
      // Find order in Supabase
      const { data: order, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('folio', folioString.trim().toUpperCase())
        .single();

      if (error || !order) throw new Error('Folio no encontrado');
      
      setEquipo({
        folio: order.folio,
        status: order.status,
        deviceType: order.device_type,
        deviceModel: order.device_model,
        reportedIssue: order.reported_issue,
        promisedDate: order.promised_date ? formatDateYMD(order.promised_date) : 'Pendiente',
        internalDiagnosis: order.internal_diagnosis,
        progressPhotos: order.progress_photos || []
      });
      setView("status");
      agregarHistorial(folioString);
    } catch (e: any) {
      setErrorStatus(e.message);
      setEquipo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    ejecutarBusqueda(folio);
  };

  const generateFolio = async (tid: string) => {
    const { data: lastReq } = await supabase
      .from('service_requests')
      .select('folio')
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastReq && lastReq.folio.startsWith('COT-')) {
      const lastNum = parseInt(lastReq.folio.split('-')[1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    return `COT-${String(nextNumber).padStart(6, '0')}`;
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) { setErrorStatus("⚠️ No se pudo establecer conexión con el sistema."); return; }
    setLoading(true);
    setErrorStatus(null);

    try {
      // Hardening Task 1.1: Capture IP
      let userIp = "0.0.0.0";
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIp = ipData.ip;
      } catch (e) {
        console.warn("Failed to capture IP directly, using default.");
      }

      const folio = await generateFolio(tenantId);

      const { error } = await supabase.from('service_requests').insert({
        tenant_id: tenantId,
        folio,
        customer_name: quoteForm.customerName.trim(),
        customer_phone: quoteForm.customerPhone.trim() || null,
        customer_email: quoteForm.customerEmail.trim() || null,
        device_type: quoteForm.deviceType.trim(),
        device_model: quoteForm.deviceModel.trim() || null,
        issue_description: quoteForm.issueDescription.trim(),
        urgency: quoteForm.urgency,
        status: "pendiente",
        quoted_total: 0,
        deposit_amount: 0,
        balance_amount: 0,
        solicitud_origen_ip: userIp
      });

      if (error) throw error;

      setSuccessQuote(true);
      setQuoteForm({ customerName: "", customerPhone: "", customerEmail: "", deviceType: "", deviceModel: "", issueDescription: "", urgency: "normal" });
      setTimeout(() => setSuccessQuote(false), 5000);
    } catch (e: any) {
      setErrorStatus(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderizarFotos = (rawFotos: any) => {
    if (!rawFotos || !Array.isArray(rawFotos) || rawFotos.length === 0) return null;
    return (
      <div className="portal-tech-card p-6 mt-6">
        <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-4">Evidencia de Reparación</h3>
        <div className="grid grid-cols-2 gap-3">
          {rawFotos.map((src, idx) => (
            <button key={idx} type="button" onClick={() => setLightboxImg(src)} className="aspect-square rounded-lg overflow-hidden border border-[#e2e8f0] hover:ring-2 ring-[#2563eb] transition-all">
              <img src={src} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="portal-wrapper">
      <header className="portal-header">
        <div className="portal-header-max">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563eb] rounded-lg flex items-center justify-center text-white shadow-sm">
              <IconWrench width={20} height={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight leading-none" style={{ margin: 0 }}>SR. FIX<span className="text-[#2563eb]">.</span></h1>
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mt-1" style={{ margin: 0 }}>Portal de Cliente</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => { setView("search"); setErrorStatus(null); setEquipo(null); }} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${view !== 'quote' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>Estatus</button>
             <button onClick={() => { setView("quote"); setErrorStatus(null); }} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${view === 'quote' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>Cotizar</button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 max-w-5xl mx-auto w-full">
        {view === "search" && !equipo && (
          <div className="py-12 portal-animate-up text-center">
            <h2 className="text-4xl font-extrabold text-[#0f172a] mb-4 tracking-tight">Rastrea tu reparación</h2>
            <p className="text-[#64748b] font-medium max-w-md mx-auto mb-10">Consulta el estado técnico y avances de tu equipo en tiempo real.</p>

            <form onSubmit={handleBuscar} className="portal-tech-card p-8 max-w-lg mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block text-left">Número de Folio</label>
                  <div className="relative">
                    <IconHashtag width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input 
                      type="text" 
                      value={folio}
                      onChange={(e) => setFolio(e.target.value.toUpperCase())}
                      placeholder="ORD-XXXXXX" 
                      className="portal-input-tech"
                      list="folio-sugerencias"
                    />
                    <datalist id="folio-sugerencias">
                      {historial.map((f, i) => <option key={i} value={f} />)}
                    </datalist>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="portal-btn-naranja">
                  {loading ? <IconCircleNotch className="animate-spin" width={20} height={20} /> : "Consultar Ahora"}
                </button>
                {errorStatus && (
                  <p className="text-red-500 text-center text-sm font-bold py-2 bg-red-50 rounded-lg flex items-center justify-center gap-1 mt-4">
                    <IconWarning width={16} height={16} /> {errorStatus}
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {view === "quote" && (
          <div className="py-12 portal-animate-up">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-[#0f172a] mb-4 tracking-tight">Solicita Presupuesto</h2>
              <p className="text-[#64748b] font-medium max-w-md mx-auto">Cuéntanos sobre tu equipo y te enviaremos una cotización formal.</p>
            </div>

            {successQuote ? (
               <div className="portal-tech-card p-12 text-center max-w-2xl mx-auto border-2 border-emerald-100 bg-emerald-50/30">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                    <IconCheckCircular width={32} height={32} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0f172a] mb-2">¡Solicitud Enviada!</h3>
                  <p className="text-[#475569] font-medium">Hemos recibido tus datos. Un técnico revisará tu caso y te contactará vía WhatsApp o correo electrónico muy pronto.</p>
                  <button onClick={() => setView("search")} className="mt-8 px-6 py-3 bg-[#0f172a] text-white font-bold rounded-xl hover:bg-black transition-all">Regresar al Portal</button>
               </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="portal-tech-card p-8 max-w-2xl mx-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block">Nombre Completo *</label>
                    <div className="relative">
                      <IconUser width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input required type="text" value={quoteForm.customerName} onChange={e => setQuoteForm({...quoteForm, customerName: e.target.value})} className="portal-input-tech pl-12" placeholder="Ej. Juan Pérez" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block">WhatsApp / Teléfono *</label>
                    <input required type="tel" value={quoteForm.customerPhone} onChange={e => setQuoteForm({...quoteForm, customerPhone: e.target.value})} className="portal-input-tech" placeholder="10 dígitos" />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block">Correo Electrónico</label>
                    <input type="email" value={quoteForm.customerEmail} onChange={e => setQuoteForm({...quoteForm, customerEmail: e.target.value})} className="portal-input-tech" placeholder="usuario@gmail.com" />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block">Tipo de Equipo *</label>
                    <div className="relative">
                      <IconMonitor width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input required type="text" value={quoteForm.deviceType} onChange={e => setQuoteForm({...quoteForm, deviceType: e.target.value})} className="portal-input-tech pl-12" placeholder="Laptop, Consola, etc." />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block">Modelo / Marca</label>
                    <input type="text" value={quoteForm.deviceModel} onChange={e => setQuoteForm({...quoteForm, deviceModel: e.target.value})} className="portal-input-tech" placeholder="Ej. Dell XPS 13" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block">¿Qué falla presenta? *</label>
                    <textarea required value={quoteForm.issueDescription} onChange={e => setQuoteForm({...quoteForm, issueDescription: e.target.value})} className="portal-input-tech min-h-[100px] py-4" placeholder="Describe brevemente el problema..."></textarea>
                  </div>
                </div>

                <div className="mt-8 bg-[#f8fafc] p-4 rounded-xl border border-[#f1f5f9]">
                   <p className="text-[10px] text-[#64748b] leading-relaxed">
                     * Al enviar esta solicitud, aceptas que tus datos sean utilizados únicamente para fines de contacto técnico y comercial relacionados con tu servicio. 
                     Consulta nuestro <a href="#" className="text-[#2563eb] font-bold">Aviso de Privacidad</a>.
                   </p>
                </div>

                <button type="submit" disabled={loading} className="portal-btn-naranja mt-6">
                  {loading ? <IconCircleNotch className="animate-spin" width={20} height={20} /> : (
                    <span className="flex items-center justify-center gap-2">
                       <IconPaperPlane width={18} height={18} /> Enviar Solicitud
                    </span>
                  )}
                </button>

                {errorStatus && (
                  <p className="text-red-500 text-center text-sm font-bold py-2 bg-red-50 rounded-lg flex items-center justify-center gap-1 mt-4">
                    <IconWarning width={16} height={16} /> {errorStatus}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {view === "status" && equipo && (
          <div className="space-y-6 py-6 portal-animate-up">
            <div className="flex items-center justify-between">
              <button onClick={() => { setEquipo(null); setView("search"); }} className="text-[#64748b] hover:text-[#2563eb] flex items-center gap-2 transition font-bold text-sm uppercase tracking-widest cursor-pointer bg-transparent border-none">
                <IconArrowLeft width={16} height={16} /> Nueva Búsqueda
              </button>
              <div className={`portal-status-badge portal-status-${(equipo.status || 'Recibido').replace(/ /g, '')}`}>
                {equipo.status || 'Recibido'}
              </div>
            </div>

            <div className="portal-tech-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#f8fafc] rounded-xl flex items-center justify-center text-[#2563eb] border border-[#f1f5f9]">
                  <IconLaptop width={24} height={24} />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest" style={{margin:0}}>Orden de Servicio</p>
                  <h2 className="text-3xl font-black text-[#0f172a] tracking-tighter" style={{margin:0}}>{equipo.folio}</h2>
                </div>
              </div>
              <div className="text-left md:text-right flex flex-col">
                <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest" style={{margin:0}}>Fecha Promesa</p>
                <p className="text-xl font-extrabold text-[#FF6A2A]" style={{margin:0}}>{equipo.promisedDate || 'Pendiente'}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6 text-left">
                <div className="portal-tech-card p-6">
                  <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-6 border-b border-[#f1f5f9] pb-4 m-0">Detalles del Equipo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Dispositivo</p>
                      <p className="font-bold text-[#0f172a] m-0">{equipo.deviceType || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Modelo/Marca</p>
                      <p className="font-bold text-[#0f172a] m-0">{equipo.deviceModel || '---'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Falla Reportada</p>
                      <p className="text-[#475569] leading-relaxed m-0">{equipo.reportedIssue || 'Diagnóstico general solicitado.'}</p>
                    </div>
                  </div>
                </div>

                <div className="portal-tech-card p-6">
                  <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-4 mt-0">Bitácora de Avance</h3>
                  <div className="text-sm text-[#475569] bg-[#f8fafc] p-4 rounded-xl border border-[#f1f5f9] whitespace-pre-line leading-relaxed">
                    {equipo.internalDiagnosis || 'El técnico está trabajando en tu equipo. Pronto verás una actualización aquí.'}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="portal-tech-card p-6 flex flex-col items-center">
                  <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-4 w-full text-left">Ayuda Directa</h3>
                  <a 
                    href={`https://wa.me/${CONFIG.TIENDA_WHATSAPP}?text=${encodeURIComponent(`Hola SrFix, consulto por mi folio ${equipo.folio} (${equipo.deviceType || 'equipo'}).`)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="portal-btn-wa"
                    style={{ textDecoration: 'none' }}
                  >
                    <IconWhatsApp width={20} height={20} /> WhatsApp
                  </a>
                  <p className="text-[10px] text-[#94a3b8] text-center font-medium mt-3">Horario: Lun-Sáb 10am-7pm</p>
                </div>
                {renderizarFotos(equipo.progressPhotos)}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#e2e8f0] p-8 text-center mt-auto">
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest m-0">© 2026 SrFix Monterrey · Sucursal San Nicolás</p>
      </footer>

      {lightboxImg && (
        <div className="portal-lightbox" onClick={() => setLightboxImg(null)}>
          <button className="portal-lightbox-close" onClick={() => setLightboxImg(null)}>
            <IconClose width={32} height={32} />
          </button>
          <img src={lightboxImg} alt="Avance ampliado" className="portal-lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
