"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { 
  IconSearch, IconPlus, IconCheckCircular, IconWarning, IconPen, 
  IconThumbsUp, IconChart, IconSync, IconArchive, IconMonitor, 
  IconClose, IconUser, IconPaperPlane, IconCircleNotch 
} from "./Icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";

type ServiceRequest = {
  id: string; folio: string; customerName: string; customerPhone?: string; customerEmail?: string;
  deviceType?: string; deviceModel?: string; issueDescription?: string; urgency?: string;
  status: string; quotedTotal: number; depositAmount: number; balanceAmount: number;
  solicitudOrigenIp?: string; createdAt?: string;
};

type QuoteItem = { description: string; amount: string; };

const QUOTE_ITEMS_STORAGE_KEY = "sdmx_quote_items";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

const SERVICE_REQUEST_STATUS_LABELS: Record<string, string> = { pendiente: "En Dictamen / Pausa", aprobada: "Autorizada (Comercial)", archivada: "Archivada" };
function getRequestStatusLabel(value?: string) { return SERVICE_REQUEST_STATUS_LABELS[(value ?? "").trim().toLowerCase()] ?? (value ? value.charAt(0).toUpperCase() + value.slice(1) : "Abierto"); }

function getStoredQuoteItems(): Record<string, QuoteItem[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(QUOTE_ITEMS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredQuoteItems(payload: Record<string, QuoteItem[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUOTE_ITEMS_STORAGE_KEY, JSON.stringify(payload));
}

export function SolicitudesNative() {
  const { session } = useAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([{ description: "", amount: "" }]);
  
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "", deviceType: "", deviceModel: "",
    issueDescription: "", urgency: "normal", quotedTotal: "0", depositAmount: "0"
  });

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true); setApiStateMessage(""); setApiStateError("");
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('tenant_id', session.shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems((data || []).map((t: any) => ({
        id: t.id,
        folio: t.folio,
        customerName: t.customer_name,
        customerPhone: t.customer_phone,
        customerEmail: t.customer_email,
        deviceType: t.device_type,
        deviceModel: t.device_model,
        issueDescription: t.issue_description,
        urgency: t.urgency,
        status: t.status,
        quotedTotal: Number(t.quoted_total || 0),
        depositAmount: Number(t.deposit_amount || 0),
        balanceAmount: Number(t.balance_amount || 0),
        solicitudOrigenIp: t.solicitud_origen_ip,
        createdAt: t.created_at
      })));
    } catch (error: any) {
       setApiStateError(error.message || "Error de conexión al cargar la bandeja.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  const generateFolio = async () => {
    const { data: lastReq } = await supabase
      .from('service_requests')
      .select('folio')
      .eq('tenant_id', session?.shop.id)
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

  const quoteItemsTotal = useMemo(
    () => quoteItems.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [quoteItems]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setApiStateMessage(""); setApiStateError("");

    if (!session?.shop.id) return;
    if (!form.customerName.trim() || !form.deviceType.trim()) return setFormError("Los campos Prospecto y Equipo son obligatorios.");
    const quoted = Number(form.quotedTotal || 0) > 0 ? Number(form.quotedTotal || 0) : quoteItemsTotal;
    const deposit = Number(form.depositAmount || 0);
    if (deposit > quoted) return setFormError("El anticipo no puede ser mayor al costo cotizado.");

    setLoading(true);
    try {
      const folio = await generateFolio();

      const { error } = await supabase.from('service_requests').insert({
        tenant_id: session.shop.id,
        branch_id: session.user.branchId,
        folio,
        customer_name: form.customerName.trim(),
        customer_phone: form.customerPhone.trim() || null,
        customer_email: form.customerEmail.trim() || null,
        device_type: form.deviceType.trim(),
        device_model: form.deviceModel.trim() || null,
        issue_description: form.issueDescription.trim() || null,
        urgency: form.urgency,
        status: "pendiente",
        quoted_total: quoted,
        deposit_amount: deposit,
        balance_amount: Math.max(quoted - deposit, 0),
        created_by: session.user.id
      });

      if (error) throw error;

      const validItems = quoteItems.filter((item) => item.description.trim() && Number(item.amount || 0) > 0);
      if (validItems.length > 0) {
        const currentItems = getStoredQuoteItems();
        currentItems[folio] = validItems;
        saveStoredQuoteItems(currentItems);
      }

      setForm({ customerName: "", customerPhone: "", customerEmail: "", deviceType: "", deviceModel: "", issueDescription: "", urgency: "normal", quotedTotal: "0", depositAmount: "0" });
      setQuoteItems([{ description: "", amount: "" }]);
      setIsModalOpen(false);
      await loadData();
      setApiStateMessage("Solicitud completada exitosamente.");
      setTimeout(() => setApiStateMessage(""), 4000);
    } catch (error: any) {
       setApiStateError(error.message || "Error al registrar la cotización.");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => items.filter(t => !search || t.folio.toLowerCase().includes(search.toLowerCase()) || t.customerName.toLowerCase().includes(search.toLowerCase()) || (t.deviceType && t.deviceType.toLowerCase().includes(search.toLowerCase()))), [items, search]);

  const stats = useMemo(() => {
    return {
      borradores: items.filter(i => i.status.toLowerCase() === 'pendiente').length,
      aprobadas: items.filter(i => i.status.toLowerCase() === 'aprobada').length,
      potencial: items.reduce((acc, curr) => acc + curr.quotedTotal, 0)
    };
  }, [items]);

  async function updateRequestStatus(item: ServiceRequest, status: string) {
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status })
        .eq("id", item.id)
        .eq("tenant_id", session?.shop.id);

      if (error) throw error;

      setItems((prev) => prev.map((request) => request.id === item.id ? { ...request, status } : request));
      setApiStateMessage(`Cotización ${item.folio} actualizada a ${getRequestStatusLabel(status)}.`);
      setTimeout(() => setApiStateMessage(""), 3000);
    } catch (error: any) {
      setApiStateError(error.message || "No se pudo actualizar el estatus de la cotización.");
    }
  }

  function handleWhatsapp(item: ServiceRequest) {
    const phone = (item.customerPhone || "").replace(/\D/g, "");
    if (!phone) {
      setApiStateError("Esta cotización no tiene teléfono registrado para WhatsApp.");
      return;
    }
    const message = `Hola ${item.customerName}, te compartimos tu cotización ${item.folio} con un total de ${formatMoney(item.quotedTotal)} y anticipo de ${formatMoney(item.depositAmount)}.`;
    window.open(`https://wa.me/52${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function handlePrintQuote(item: ServiceRequest) {
    const quoteWindow = window.open("", "_blank", "noopener,noreferrer,width=860,height=960");
    if (!quoteWindow) return;
    const storedItems = getStoredQuoteItems()[item.folio] || [];

    quoteWindow.document.write(`
      <html>
        <head>
          <title>Cotización ${item.folio}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1, h2, h3, p { margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
            .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
            .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px; }
            .value { font-size: 16px; font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td, th { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Servicios Digitales MX</h1>
              <p style="margin-top:8px;color:#475569;">Cotización preliminar del caso.</p>
            </div>
            <div style="text-align:right;">
              <span class="badge">${item.folio}</span>
              <p style="margin-top:8px;color:#64748b;">${item.createdAt ? new Intl.DateTimeFormat("es-MX").format(new Date(item.createdAt)) : ""}</p>
            </div>
          </div>
          <div class="card">
            <div class="label">Cliente</div>
            <div class="value">${item.customerName}</div>
            <p style="margin-top:8px;color:#475569;">${item.customerPhone || "Sin teléfono"} ${item.customerEmail ? ` · ${item.customerEmail}` : ""}</p>
          </div>
          <div class="card">
            <div class="label">Equipo</div>
            <div class="value">${item.deviceType || "Equipo general"} ${item.deviceModel ? `· ${item.deviceModel}` : ""}</div>
            <p style="margin-top:8px;color:#475569;">${item.issueDescription || "Sin descripción de falla."}</p>
          </div>
          <div class="card">
            <div class="label">Desglose comercial</div>
            ${
              storedItems.length > 0
                ? `<table><thead><tr><th>Concepto</th><th>Monto</th></tr></thead><tbody>${storedItems.map((quoteItem) => `<tr><td>${quoteItem.description}</td><td>${formatMoney(Number(quoteItem.amount || 0))}</td></tr>`).join("")}</tbody></table>`
                : `<p style="color:#475569;">No se capturaron ítems desglosados; se muestra el total global de la cotización.</p>`
            }
            <p style="margin-top:16px;color:#0f172a;font-weight:700;">Total cotizado: ${formatMoney(item.quotedTotal)}</p>
            <p style="margin-top:8px;color:#059669;font-weight:700;">Anticipo: ${formatMoney(item.depositAmount)}</p>
            <p style="margin-top:8px;color:#b45309;font-weight:700;">Pendiente: ${formatMoney(item.balanceAmount)}</p>
          </div>
        </body>
      </html>
    `);
    quoteWindow.document.close();
    quoteWindow.focus();
    quoteWindow.print();
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', transition: 'all 0.3s ease'}}>
      
      {/* HEADER & GLOBAL ACTIONS */}
      <div className="finanzas-header" style={{marginBottom: 0}}>
         <div>
            <h1>Cotizaciones</h1>
            <p>Captura diagnósticos previos y presupuesta nuevos servicios.</p>
         </div>
         <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
           <div style={{position: 'relative', width: '280px'}}>
             <div style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center'}}>
                <IconSearch width={14} height={14} />
             </div>
             <input 
               type="text" 
               placeholder="Buscar folio o cliente..." 
               value={search} 
               onChange={(e) => setSearch(e.target.value)}
               style={{width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.875rem', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)'}}
             />
           </div>
           <button onClick={() => setIsModalOpen(true)} className="sdmx-btn-primary">
              <IconPlus width={16} height={16} />
              Nueva Cotización
           </button>
         </div>
      </div>

      {apiStateMessage && <div style={{padding: '1rem', background: '#ecfdf5', color: '#059669', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconCheckCircular width={16} height={16} />{apiStateMessage}</div>}
      {apiStateError && <div style={{padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconWarning width={16} height={16} />{apiStateError}</div>}

      {/* STATS ROW */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem'}}>
         <div className="sdmx-card-premium" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{background: '#f8fafc', color: '#64748b', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <IconPen width={20} height={20} />
            </div>
            <div>
               <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Borradores</p>
               <p style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0'}}>{stats.borradores}</p>
            </div>
         </div>
         <div className="sdmx-card-premium" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{background: '#ecfdf5', color: '#10b981', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <IconThumbsUp width={20} height={20} />
            </div>
            <div>
               <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Aprobadas</p>
               <p style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0'}}>{stats.aprobadas}</p>
            </div>
         </div>
         <div className="sdmx-card-premium" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{background: '#eff6ff', color: '#3b82f6', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <IconChart width={20} height={20} />
            </div>
            <div>
               <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Ingreso Potencial</p>
               <p style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0'}}>{formatMoney(stats.potencial)}</p>
            </div>
         </div>
      </div>

      {/* LIST VIEW */}
      <div className="sdmx-card-premium">
         <div className="sdmx-card-header">
            <div>
               <h3>Bandeja de Entrada</h3>
               <p>Registros de cotización activos</p>
            </div>
            <div>
               <button className="sdmx-btn-ghost" onClick={() => void loadData()} disabled={loading}>
                 <IconSync width={14} height={14} style={{animation: loading ? 'sdmx-spin 1s linear infinite' : 'none'}} />
               </button>
            </div>
         </div>
         <div className="sdmx-card-body" style={{padding: 0}}>
            <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
               {filteredItems.length === 0 ? (
                  <li style={{padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8'}}>
                     <div style={{background: '#f1f5f9', width: '4rem', height: '4rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#64748b'}}>
                        <IconArchive width={24} height={24} />
                     </div>
                     <strong style={{display: 'block', color: '#1e293b', fontSize: '1.125rem', marginBottom: '0.25rem'}}>No hay registros activos</strong>
                     <span style={{fontSize: '0.875rem'}}>Registra una nueva cotización comercial disponible en el botón superior.</span>
                  </li>
               ) : (
                  filteredItems.map((item, idx) => (
                    <li key={item.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc', transition: 'background 0.2s'}}>
                       <div style={{display: 'flex', gap: '1.25rem'}}>
                          <div style={{background: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '4.5rem', border: '1px solid #dbeafe'}}>
                             <span style={{fontSize: '0.5625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8}}>FOLIO</span>
                             <strong style={{fontSize: '0.875rem'}}>{item.folio}</strong>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                             <strong style={{fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem'}}>{item.customerName}</strong>
                             <div style={{fontSize: '0.8125rem', color: '#64748b', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                                <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><IconMonitor width={12} height={12} style={{opacity:0.7}} /> {item.deviceType || "Genérico"}</span>
                                <span style={{color: '#cbd5e1'}}>•</span>
                                <span>{item.issueDescription?.slice(0, 60) || "Sin historial vinculado"}...</span>
                                {item.solicitudOrigenIp && (
                                  <>
                                    <span style={{color: '#cbd5e1'}}>•</span>
                                    <FeatureGuard requiredLevel={PlanLevel.PROFESIONAL} featureName="Rastreo de IP" variant="compact">
                                      <span style={{fontSize: '0.625rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace'}}>IP: {item.solicitudOrigenIp}</span>
                                    </FeatureGuard>
                                  </>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem'}}>
                          <span className={`sdmx-badge ${item.status.toLowerCase() === 'aprobada' ? 'sdmx-badge-emerald' : 'sdmx-badge-amber'}`}>
                             {getRequestStatusLabel(item.status)}
                          </span>
                         {item.quotedTotal > 0 && (
                            <div style={{display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600}}>
                               <span style={{color: '#64748b'}}>Costo: <strong style={{color: '#0f172a'}}>{formatMoney(item.quotedTotal)}</strong></span>
                               {item.depositAmount > 0 && <span style={{color: '#10b981'}}>Anticipo: {formatMoney(item.depositAmount)}</span>}
                            </div>
                          )}
                          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                             <button type="button" className="sdmx-btn-ghost" onClick={() => handleWhatsapp(item)}>WhatsApp</button>
                             <button type="button" className="sdmx-btn-ghost" onClick={() => handlePrintQuote(item)}>PDF</button>
                             {item.status.toLowerCase() !== "aprobada" && (
                               <button type="button" className="sdmx-btn-ghost" onClick={() => void updateRequestStatus(item, "aprobada")}>Autorizar</button>
                             )}
                             {item.status.toLowerCase() !== "archivada" && (
                               <button type="button" className="sdmx-btn-ghost" onClick={() => void updateRequestStatus(item, "archivada")}>Archivar</button>
                             )}
                          </div>
                       </div>
                    </li>
                  ))
               )}
            </ul>
         </div>
      </div>

      {/* FLOATING MODAL */}
      {isModalOpen && (
        <div style={{position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)'}}>
           <div style={{background: 'white', borderRadius: '1.25rem', width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}} className="sdmx-scrollbar">
              
              <div style={{padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 10}}>
                 <div>
                    <h3 style={{fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0}}>Nueva Cotización</h3>
                    <p style={{fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0'}}>Emite un dictamen preliminar.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} style={{background: '#f1f5f9', border: 'none', width: '2rem', height: '2rem', borderRadius: '0.5rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <IconClose width={16} height={16} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} style={{padding: '1.5rem'}}>
                 {formError && <div style={{padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #fee2e2', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconWarning width={16} height={16} />{formError}</div>}
                 
                 <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    {/* CLIENT INFO */}
                    <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9'}}>
                       <h4 style={{fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}><IconUser width={14} height={14} />Datos de Contacto</h4>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Prospecto / Organización *</label>
                             <input required style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Ej. Corporativo Zenith"/>
                          </div>
                       </div>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Teléfono Celular</label>
                             <input style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="10 dígitos"/>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Correo Electrónico</label>
                             <input type="email" style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="usuario@empresa.com"/>
                          </div>
                       </div>
                    </div>

                    {/* DEVICE INFO */}
                    <div>
                       <h4 style={{fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0, display:'flex', alignItems:'center', gap:'0.5rem'}}><IconMonitor width={14} height={14} />Activo Tecnológico</h4>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Tipo de Equipo *</label>
                             <input required style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} placeholder="Laptop, Servidor..."/>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Modelo Específico</label>
                             <input style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem'}} value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} placeholder="Ej. ThinkPad T14"/>
                          </div>
                       </div>
                       <div style={{display: 'flex', flexDirection: 'column', marginTop: '1rem'}}>
                          <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem'}}>Descripción del Requerimiento</label>
                          <textarea style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem', minHeight: '5rem', resize: 'vertical'}} value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} placeholder="Detalla el escenario de falla o mejora esperada..."></textarea>
                       </div>
                    </div>

                    {/* FINANCIAL INFO */}
                    <div style={{background: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #dbeafe'}}>
                       <div style={{marginBottom: '1rem'}}>
                          <h4 style={{fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0}}>Ítems de cotización</h4>
                          <p style={{fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0'}}>Agrega conceptos para el PDF y el envío comercial.</p>
                       </div>
                       <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem'}}>
                          {quoteItems.map((item, index) => (
                            <div key={`quote-item-${index}`} style={{display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '0.75rem'}}>
                              <input
                                style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', outline: 'none', fontSize: '0.875rem'}}
                                value={item.description}
                                onChange={(e) => setQuoteItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, description: e.target.value } : row))}
                                placeholder="Ej. Diagnóstico, refacción, mano de obra"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', outline: 'none', fontSize: '0.875rem'}}
                                value={item.amount}
                                onChange={(e) => setQuoteItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, amount: e.target.value } : row))}
                                placeholder="0.00"
                              />
                              <button
                                type="button"
                                onClick={() => setQuoteItems((current) => current.length === 1 ? [{ description: "", amount: "" }] : current.filter((_, rowIndex) => rowIndex !== index))}
                                className="sdmx-btn-ghost"
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                          <div>
                            <button type="button" className="sdmx-btn-ghost" onClick={() => setQuoteItems((current) => [...current, { description: "", amount: "" }])}>
                              Agregar ítem
                            </button>
                          </div>
                       </div>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem'}}>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.375rem'}}>SLA Prioridad</label>
                             <select style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', background: 'white', outline: 'none', fontSize: '0.875rem'}} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                                <option value="baja">Baja</option>
                                <option value="normal">Estándar</option>
                                <option value="alta">Prioritaria</option>
                                <option value="urgente">Crítica</option>
                             </select>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.375rem'}}>Presupuesto (MXN) *</label>
                             <input type="number" min="0" step="0.01" style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', outline: 'none', fontSize: '0.875rem', fontWeight: 'bold'}} value={form.quotedTotal} onChange={(e) => setForm({ ...form, quotedTotal: e.target.value })} />
                             {quoteItemsTotal > 0 && (
                               <span style={{fontSize: '0.75rem', color: '#2563eb', marginTop: '0.375rem'}}>Total sugerido por ítems: {formatMoney(quoteItemsTotal)}</span>
                             )}
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                             <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginBottom: '0.375rem'}}>Anticipo</label>
                             <input type="number" min="0" step="0.01" style={{padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #a7f3d0', background: '#ecfdf5', outline: 'none', fontSize: '0.875rem', color: '#059669', fontWeight: 'bold'}} value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
                          </div>
                       </div>
                    </div>

                 </div>

                 <div style={{paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="sdmx-btn-ghost">Cancelar</button>
                    <button type="submit" disabled={loading} className="sdmx-btn-primary">
                       {loading ? <IconCircleNotch width={16} height={16} style={{animation:'sdmx-spin 1s linear infinite'}} /> : <IconPaperPlane width={16} height={16} />}
                       Confirmar Alta
                    </button>
                 </div>
              </form>

           </div>
        </div>
      )}

    </div>
  );
}
