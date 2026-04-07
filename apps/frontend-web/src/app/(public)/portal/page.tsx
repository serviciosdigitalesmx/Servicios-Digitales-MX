"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, Printer, Search, Ticket } from "lucide-react";
import { useOrderTracking } from "../../../hooks/useOrderTracking";

const STATUS_STEPS = ["recibido", "diagnostico", "reparacion", "listo"] as const;

function formatStatus(status: string) {
  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date: string | undefined) {
  if (!date) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<{
    name: string;
    id: string;
    slug?: string;
    legalName?: string | null;
    address?: string | null;
    phone?: string | null;
    supportEmail?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [folioInput, setFolioInput] = useState(searchParams.get("folio") || searchParams.get("f") || "");
  const [folioToLookup, setFolioToLookup] = useState(searchParams.get("folio") || searchParams.get("f"));
  const slug = searchParams.get("s") || "demo";
  const { order, loading: orderLoading, error } = useOrderTracking(folioToLookup);

  const currentStatusIndex = useMemo(() => {
    if (!order?.status) return -1;
    return STATUS_STEPS.indexOf(order.status.toLowerCase() as typeof STATUS_STEPS[number]);
  }, [order?.status]);

  useEffect(() => {
    async function loadShop() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5115";
        const res = await fetch(`${baseUrl}/api/portal/shop/${slug}`);
        const json = await res.json();
        if (json.success) {
          setShop(json.data);
        }
      } catch (err) {
        console.error("Error cargando tienda:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [slug]);

  function handleLookup() {
    const normalized = folioInput.trim().toUpperCase();
    if (!normalized) return;
    setFolioToLookup(normalized);

    const next = new URLSearchParams(searchParams.toString());
    next.set("folio", normalized);
    router.replace(`/portal?${next.toString()}`);
  }

  const whatsappMessage = order
    ? `Hola, pregunto por mi folio ${order.folio}. ¿Me ayudan con el estatus de mi equipo?`
    : `Hola, necesito apoyo para rastrear mi equipo en ${shop?.name || "Servicios Digitales MX"}.`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  const brandName = shop?.legalName || shop?.name || "Portal de Cliente";
  const primaryColor = shop?.primaryColor || "#2563EB";
  const secondaryColor = shop?.secondaryColor || "#0F172A";

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <div
      className="min-h-screen text-white font-sans"
      style={{ background: `linear-gradient(180deg, ${secondaryColor}, #020617 70%)` }}
    >
      <nav className="border-b border-white/5 p-6 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
              style={{ backgroundColor: primaryColor, boxShadow: `${primaryColor}40 0px 10px 30px -12px` }}
            >
              {shop?.logoUrl ? (
                <img src={shop.logoUrl} alt={brandName} className="w-full h-full object-cover" />
              ) : (
                <Ticket size={20} />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase">{brandName}</h1>
              {(shop?.address || shop?.phone) && (
                <p className="text-xs text-slate-400 mt-1">
                  {[shop?.address, shop?.phone].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 py-20 text-center">
        <h2 className="text-5xl font-black mb-6 tracking-tight">Rastrea tu equipo</h2>
        <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
          Ingresa el folio de tu orden de servicio para conocer el estatus actual de tu reparación en tiempo real.
        </p>
        
        <div className="relative max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="Ej: ORD-000123"
            value={folioInput}
            onChange={(event) => setFolioInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleLookup();
              }
            }}
            className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-6 text-xl outline-none transition-all text-center font-bold tracking-widest"
          />
          <button
            onClick={handleLookup}
            className="mt-8 w-full md:w-auto md:absolute md:right-3 md:top-3 md:mt-0 px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all inline-flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Search size={16} />
            Consultar Estatus
          </button>
        </div>

        {(orderLoading || error || order) && (
          <section className="mt-16 text-left bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl shadow-blue-950/10">
            {orderLoading && (
              <div className="flex items-center justify-center gap-3 text-slate-300 py-8">
                <Loader2 className="animate-spin text-blue-500" size={22} />
                <span>Consultando el estado actual de tu equipo...</span>
              </div>
            )}

            {!orderLoading && error && (
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                <p className="text-xl font-bold text-white mb-2">No encontramos ese folio</p>
                <p className="text-slate-300">
                  Revisa que el folio esté bien escrito o contáctanos por WhatsApp para ayudarte a rastrearlo.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl transition-all"
                  >
                    <MessageCircle size={18} />
                    Pedir ayuda por WhatsApp
                  </a>
                </div>
              </div>
            )}

            {!orderLoading && order && (
              <div className="space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/20 px-4 py-2 text-sm font-semibold text-blue-200 uppercase tracking-widest">
                      <Ticket size={15} />
                      Folio {order.folio}
                    </span>
                    <h3 className="text-3xl font-black mt-4">{formatStatus(order.status)}</h3>
                    <p className="text-slate-400 mt-2 max-w-2xl">
                      {brandName} está trabajando en tu equipo. Aquí puedes ver el avance más reciente y la fecha estimada de entrega.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 lg:min-w-[320px]">
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Equipo</p>
                      <p className="font-bold text-white">{order.deviceType}</p>
                      <p className="text-slate-400 text-sm">
                        {[order.deviceBrand, order.deviceModel].filter(Boolean).join(" · ") || "Modelo no especificado"}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Fecha promesa</p>
                      <p className="font-bold text-white">{formatDate(order.promisedDate)}</p>
                      <p className="text-slate-400 text-sm">Última actualización: {formatDate(order.updatedAt || order.promisedDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">Seguimiento del servicio</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {STATUS_STEPS.map((step, index) => {
                      const active = index <= currentStatusIndex;
                      const current = index === currentStatusIndex;
                      return (
                        <div
                          key={step}
                          className={`rounded-3xl border p-4 transition-all ${
                            active
                              ? "border-blue-400/30 bg-blue-500/10"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black uppercase tracking-wider">
                              {formatStatus(step)}
                            </span>
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                                current
                                  ? "text-white"
                                  : active
                                  ? "bg-blue-500/20 text-blue-200"
                                  : "bg-white/10 text-slate-400"
                              }`}
                              style={current ? { backgroundColor: primaryColor } : undefined}
                            >
                              {index + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">Detalle del caso</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Falla reportada</p>
                        <p className="text-white font-semibold">{order.reportedIssue || "Sin detalle de falla"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Resolución técnica</p>
                        <p className="text-white font-semibold">
                          {order.resolution || "Tu técnico sigue trabajando en el diagnóstico y actualización del caso."}
                        </p>
                      </div>
                    </div>
                  </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">Acciones rápidas</p>
                  <div className="flex flex-col gap-3">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl transition-all"
                      >
                        <MessageCircle size={18} />
                        Preguntar por WhatsApp
                      </a>
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-2xl transition-all"
                      >
                        <Printer size={18} />
                        Imprimir seguimiento
                      </button>
                      {(shop?.supportEmail || shop?.phone) && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                          <p className="font-semibold text-white mb-1">Contacto del taller</p>
                          {shop?.phone && <p>Tel: {shop.phone}</p>}
                          {shop?.supportEmail && <p>Email: {shop.supportEmail}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">Evidencias</p>
                  {order.progressPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.progressPhotos.map((photo, index) => (
                        <img
                          key={`${photo}-${index}`}
                          src={photo}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-48 object-cover rounded-3xl border border-white/10"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-400">
                      Aún no hay fotos de avance cargadas para este equipo.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default function PortalPublico() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
