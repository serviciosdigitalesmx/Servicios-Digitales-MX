"use client";

import React, { useState, useEffect } from "react";
import "./portal.css";
import { 
  IconWrench, IconHashtag, IconWarning, IconShield, 
  IconCamera, IconMicrochip, IconUser, IconArrowLeft, 
  IconLaptop, IconWhatsApp, IconClose, IconCircleNotch 
} from "../../../components/ui/Icons";

const CONFIG = {
  BACKEND_URL: 'https://script.google.com/macros/s/AKfycbxH1zD8_14TvCajstFhtEpLNODwG9GZXkLoCXOb1IBNm0JIRmpCwS6SRsuGhZETK88z/exec',
  TIENDA_WHATSAPP: '528117006536',
  SUGGESTIONS_KEY: 'srfix_folios_historial'
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
  const [folio, setFolio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [equipo, setEquipo] = useState<any>(null);
  const [historial, setHistorial] = useState<string[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    // Cargar historial
    try {
      const raw = localStorage.getItem(CONFIG.SUGGESTIONS_KEY);
      if (raw) {
        setHistorial(JSON.parse(raw));
      }
    } catch(e) {}

    // Auto búsqueda por URL
    const urlParams = new URLSearchParams(window.location.search);
    const folioParam = urlParams.get('folio');
    if (folioParam) {
      setFolio(folioParam.toUpperCase());
      ejecutarBusqueda(folioParam.toUpperCase());
    }
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
    setError(false);

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}?action=equipo&folio=${encodeURIComponent(folioString.trim().toUpperCase())}&t=${Date.now()}`);
      const data = await res.json();
      if (data.error || !data.equipo) throw new Error('No encontrado');
      
      setEquipo(data.equipo);
      agregarHistorial(folioString);
    } catch (e) {
      setError(true);
      setEquipo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    ejecutarBusqueda(folio);
  };

  const renderizarFotos = (rawFotos: any) => {
    let fotos: string[] = [];
    if (Array.isArray(rawFotos)) {
      fotos = rawFotos.filter(v => typeof v === 'string' && (v.startsWith('data:image/') || /^https?:\/\//.test(v)));
    } else if (typeof rawFotos === 'string') {
      try {
        const parsed = JSON.parse(rawFotos);
        if (Array.isArray(parsed)) {
          fotos = parsed.filter(v => typeof v === 'string' && (v.startsWith('data:image/') || /^https?:\/\//.test(v)));
        }
      } catch(e) {}
    }

    if (!fotos.length) return null;

    return (
      <div className="portal-tech-card p-6 mt-6">
        <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-4">Galería Técnica</h3>
        <div className="grid grid-cols-2 gap-3" id="res-seguimiento-fotos">
          {fotos.map((src, idx) => (
            <button 
              key={idx} 
              type="button" 
              onClick={() => setLightboxImg(src)}
              className="aspect-square rounded-lg overflow-hidden border border-[#e2e8f0] hover:ring-2 ring-[#2563eb] transition-all"
            >
              <img src={src} alt={`Avance ${idx + 1}`} className="w-full h-full object-cover" />
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
          <div className="hidden sm:block text-xs font-bold text-[#64748b] bg-[#f1f5f9] px-3 py-1.5 rounded-full uppercase tracking-wider">
            {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 max-w-5xl mx-auto w-full">
        {!equipo ? (
          <div className="py-12 portal-animate-up">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-[#0f172a] mb-4 tracking-tight">Rastrea tu reparación</h2>
              <p className="text-[#64748b] font-medium max-w-md mx-auto">Consulta el estado técnico y avances de tu equipo en tiempo real.</p>
            </div>

            <form onSubmit={handleBuscar} className="portal-tech-card p-8 max-w-lg mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-2 block">Número de Folio</label>
                  <div className="relative">
                    <IconHashtag width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input 
                      type="text" 
                      value={folio}
                      onChange={(e) => setFolio(e.target.value.toUpperCase())}
                      placeholder="SF-24-XXXX" 
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
                {error && (
                  <p className="text-red-500 text-center text-sm font-bold py-2 bg-red-50 rounded-lg flex items-center justify-center gap-1 mt-4">
                    <IconWarning width={16} height={16} /> Folio no encontrado
                  </p>
                )}
              </div>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#f1f5f9]">
                  <IconShield width={20} height={20} className="text-[#2563eb]" />
                </div>
                <p className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">Garantía SRFIX</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#f1f5f9]">
                  <IconCamera width={20} height={20} className="text-[#2563eb]" />
                </div>
                <p className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">Fotos de avance</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#f1f5f9]">
                  <IconMicrochip width={20} height={20} className="text-[#2563eb]" />
                </div>
                <p className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">Refacciones OEM</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#f1f5f9]">
                  <IconUser width={20} height={20} className="text-[#2563eb]" />
                </div>
                <p className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">Soporte técnico</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6 portal-animate-up">
            <div className="flex items-center justify-between">
              <button onClick={() => setEquipo(null)} className="text-[#64748b] hover:text-[#2563eb] flex items-center gap-2 transition font-bold text-sm uppercase tracking-widest cursor-pointer bg-transparent border-none">
                <IconArrowLeft width={16} height={16} /> Nueva Búsqueda
              </button>
              <div className={`portal-status-badge portal-status-${(equipo.ESTADO || 'Recibido').replace(/ /g, '')}`}>
                {equipo.ESTADO || 'Recibido'}
              </div>
            </div>

            <div className="portal-tech-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#f8fafc] rounded-xl flex items-center justify-center text-[#2563eb] border border-[#f1f5f9]">
                  <IconLaptop width={24} height={24} />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest" style={{margin:0}}>Orden de Servicio</p>
                  <h2 className="text-3xl font-black text-[#0f172a] tracking-tighter" style={{margin:0}}>{equipo.FOLIO}</h2>
                </div>
              </div>
              <div className="text-left md:text-right flex flex-col">
                <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest" style={{margin:0}}>Fecha Promesa</p>
                <p className="text-xl font-extrabold text-[#FF6A2A]" style={{margin:0}}>{equipo.FECHA_PROMESA || 'Pendiente'}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="portal-tech-card p-6">
                  <div className="flex justify-between items-center mb-6 border-b border-[#f1f5f9] pb-4">
                    <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest" style={{margin:0}}>Detalles del Equipo</h3>
                    <button onClick={() => window.print()} className="text-[#0f172a] hover:text-[#2563eb] bg-transparent border-none cursor-pointer flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
                      Imprimir
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Dispositivo</p>
                      <p className="font-bold text-[#0f172a] m-0">{equipo.DISPOSITIVO || '---'}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Modelo/Serie</p>
                      <p className="font-bold text-[#0f172a] m-0">{equipo.MODELO || '---'}</p>
                    </div>
                    <div className="sm:col-span-2 flex flex-col">
                      <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Falla Reportada</p>
                      <p className="text-[#475569] leading-relaxed m-0">{equipo.FALLA_REPORTADA || 'Diagnóstico general solicitado.'}</p>
                    </div>
                  </div>
                  
                  {/* Tiempos */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#f1f5f9] text-left">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Ingreso</p>
                      <p className="text-[#0f172a] font-medium text-sm m-0">{formatDateYMD(equipo.FECHA_INGRESO)}</p>
                    </div>
                    {equipo.diasRestantes !== undefined && (
                      <div className="flex flex-col">
                        <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-widest mb-1 mt-0">Días Restantes</p>
                        <p className="text-[#0f172a] font-bold text-sm m-0">
                          {equipo.diasRestantes < 0 ? '⚠️ Vencido' : equipo.diasRestantes === 0 ? '¡Hoy!' : `${equipo.diasRestantes} días`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="portal-tech-card p-6 text-left">
                  <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-4 mt-0">Bitácora de Avance</h3>
                  <div className="text-sm text-[#475569] bg-[#f8fafc] p-4 rounded-xl border border-[#f1f5f9] whitespace-pre-line leading-relaxed">
                    {equipo.SEGUIMIENTO_CLIENTE || 'El técnico está trabajando en tu equipo. Pronto verás una actualización aquí.'}
                  </div>
                </div>
                
                {equipo.YOUTUBE_ID && (
                  <div className="portal-tech-card p-6">
                    <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-4">Cámara de Reparación en Vivo</h3>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                      <iframe src={`https://www.youtube.com/embed/${equipo.YOUTUBE_ID}?autoplay=1&mute=1&rel=0`} className="w-full h-full border-none" allow="autoplay; encrypted-media; fullscreen"></iframe>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="portal-tech-card p-6 flex flex-col items-center">
                  <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest mb-4 w-full text-left">Ayuda Directa</h3>
                  <a 
                    href={`https://wa.me/${CONFIG.TIENDA_WHATSAPP}?text=${encodeURIComponent(`Hola SrFix, consulto por mi folio ${equipo.FOLIO} (${equipo.DISPOSITIVO || 'equipo'}).`)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="portal-btn-wa"
                    style={{ textDecoration: 'none' }}
                  >
                    <IconWhatsApp width={20} height={20} /> WhatsApp
                  </a>
                  <p className="text-[10px] text-[#94a3b8] text-center font-medium mt-3">Horario: Lun-Sáb 10am-7pm</p>
                </div>
                {renderizarFotos(equipo.SEGUIMIENTO_FOTOS)}
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
