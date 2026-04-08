"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  ExternalLink,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Truck,
  Users,
  Wrench,
  X,
  Zap
} from "lucide-react";
import { fetchPublic } from "../../lib/apiClient";
import { useOrderTracking } from "../../hooks/useOrderTracking";

type ShopMicrositeProps = {
  shopSlug: string;
};

type ShopPublicBranding = {
  id: string;
  name: string;
  slug?: string;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  supportEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

const STATUS_STEPS = ["recibido", "diagnostico", "reparacion", "listo"] as const;

const formatStatus = (status: string) =>
  status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date?: string) => {
  if (!date) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(date));
  } catch {
    return date;
  }
};

export function ShopMicrosite({ shopSlug }: ShopMicrositeProps) {
  const [view, setView] = useState<"landing" | "quote" | "track">("landing");
  const [folio, setFolio] = useState("");
  const [folioToLookup, setFolioToLookup] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [shopData, setShopData] = useState<ShopPublicBranding | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState({
    device: "",
    issue: "",
    phone: ""
  });
  const { order, loading: trackingLoading, error: trackingError } = useOrderTracking(folioToLookup);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadShop() {
      setShopLoading(true);
      const response = await fetchPublic<ShopPublicBranding>(`/api/portal/shop/${shopSlug}`);
      if (mounted && response.success && response.data) {
        setShopData(response.data);
      }
      if (mounted) setShopLoading(false);
    }
    void loadShop();
    return () => {
      mounted = false;
    };
  }, [shopSlug]);

  const brandName = shopData?.legalName || shopData?.name || shopSlug.replace(/-/g, " ").toUpperCase();
  const primaryColor = shopData?.primaryColor || "#EA580C";
  const secondaryColor = shopData?.secondaryColor || "#0A0A0A";
  const phone = shopData?.phone || "528123456789";
  const supportEmail = shopData?.supportEmail || "soporte@taller.com";
  const address = shopData?.address || "Dirección pendiente de configurar";

  const specialties = useMemo(
    () => [
      {
        id: 1,
        name: "Dispositivos Móviles",
        icon: <Smartphone className="w-8 h-8" />,
        desc: "Pantallas OLED, centros de carga, baterías de alta densidad y biométricos.",
        color: "from-blue-600 to-cyan-500",
        price: "Desde $499"
      },
      {
        id: 2,
        name: "Cómputo & Laptops",
        icon: <Cpu className="w-8 h-8" />,
        desc: "Mantenimiento, bisagras, recuperación de datos y reparación de placas.",
        color: "from-purple-600 to-pink-500",
        price: "Desde $799"
      },
      {
        id: 3,
        name: "Electrónica Nivel 3",
        icon: <Wrench className="w-8 h-8" />,
        desc: "Micro-soldadura, diagnóstico de board, reballing y reparación avanzada.",
        color: "from-orange-600 to-red-500",
        price: "Diagnóstico $299"
      }
    ],
    []
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Carlos M.",
        text: "Recuperaron mi laptop cuando ya me la habían dado por perdida. El rastreo en línea inspira mucha confianza."
      },
      {
        name: "Ana P.",
        text: "Me cotizaron por WhatsApp rapidísimo y pude seguir todo el proceso desde el portal."
      }
    ],
    []
  );

  const currentStatusIndex = useMemo(() => {
    if (!order?.status) return -1;
    return STATUS_STEPS.indexOf(order.status.toLowerCase() as (typeof STATUS_STEPS)[number]);
  }, [order?.status]);

  const handleQuoteChange = (field: keyof typeof quoteForm, value: string) => {
    setQuoteForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const text = [
      `Hola, quiero una cotización en ${brandName}.`,
      `Equipo: ${quoteForm.device}`,
      `Falla: ${quoteForm.issue}`,
      `WhatsApp de contacto: ${quoteForm.phone}`
    ].join("\n");

    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      setIsSubmitting(false);
      setView("landing");
    }, 500);
  };

  const handleTrackSubmit = () => {
    const normalized = folio.trim().toUpperCase();
    if (!normalized) return;
    setFolioToLookup(normalized);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <div
        className="fixed pointer-events-none inset-0 z-0 transition-opacity duration-300 opacity-40 md:opacity-100"
        style={{
          background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, ${primaryColor}12, transparent 80%)`
        }}
      />

      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled ? "bg-black/80 backdrop-blur-2xl border-b border-white/10 py-4 shadow-2xl" : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView("landing")}>
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to right, ${primaryColor}, #ef4444)` }} />
              <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-all duration-500 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, #ef4444)` }}>
                {shopData?.logoUrl ? <img src={shopData.logoUrl} alt={brandName} className="w-full h-full object-cover" /> : <Wrench className="w-6 h-6 text-white" />}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-xl leading-none uppercase italic bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {brandName}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
                Laboratorio Autorizado
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-xl rounded-full p-1.5 border border-white/10">
            {[
              { id: "landing", label: "Inicio" },
              { id: "quote", label: "Cotizar" },
              { id: "track", label: "Rastreo" }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id as "landing" | "quote" | "track")}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                  view === v.id ? "text-white shadow-xl scale-105" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={view === v.id ? { background: `linear-gradient(to right, ${primaryColor}, #ef4444)` } : undefined}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}`}
              className="hidden md:flex relative group overflow-hidden bg-white text-black px-8 py-3.5 rounded-2xl items-center gap-3 transition-all duration-500 hover:text-white hover:scale-105 active:scale-95 shadow-xl"
              style={{ ["--hover-bg" as string]: primaryColor }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">WhatsApp Directo</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-3xl border-b border-white/10 transition-all duration-500 ${
            mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"
          }`}
        >
          <div className="p-8 space-y-4">
            {["landing", "quote", "track"].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v as "landing" | "quote" | "track");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-4 text-2xl font-black uppercase italic tracking-tighter border-b border-white/5 flex justify-between items-center ${
                  view === v ? "" : "text-white"
                }`}
                style={view === v ? { color: primaryColor } : undefined}
              >
                {v === "landing" ? "Inicio" : v === "quote" ? "Cotizar Reparación" : "Rastrear Folio"}
                <ChevronRight className={view === v ? "" : "text-gray-700"} style={view === v ? { color: primaryColor } : undefined} />
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {view === "landing" && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <section className="relative pt-48 pb-24 px-6 text-center space-y-12">
              <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10">
                <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Certificación Técnica Nivel 3</span>
              </div>

              <h1 className="text-7xl md:text-[140px] font-black tracking-tighter leading-[0.8] uppercase italic">
                Rescate <br />
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent not-italic">Digital.</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto font-medium">
                Ingeniería de precisión en micro-reparación. Tu taller, tu marca y un portal que sí proyecta profesionalismo frente al cliente.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
                <button
                  onClick={() => setView("quote")}
                  className="group relative overflow-hidden px-12 py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: primaryColor, boxShadow: `${primaryColor}66 0px 24px 60px -20px` }}
                >
                  <span className="relative flex items-center justify-center gap-3 text-white">
                    COTIZAR AHORA
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button
                  onClick={() => setView("track")}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 px-12 py-6 rounded-[2rem] font-bold text-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Search className="w-6 h-6" />
                  RASTREAR ORDEN
                </button>
              </div>

              <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 opacity-60">
                <div className="text-center space-y-1">
                  <p className="text-2xl font-black text-white">+12,400</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Éxitos</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-black text-white">98%</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Felicidad</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-black text-white">4.9★</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Opiniones</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-black text-white">90 días</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Garantía</p>
                </div>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 mb-32">
              <div className="relative rounded-[4rem] overflow-hidden border border-white/10 bg-[#111] p-2 shadow-3xl group">
                <div
                  className="aspect-[21/9] relative overflow-hidden rounded-[3.8rem]"
                  style={{ background: `linear-gradient(135deg, ${secondaryColor}, #111827 55%, ${primaryColor}22)` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                  <div className="absolute bottom-12 left-12 right-12 flex flex-wrap justify-between items-end gap-8">
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2 mb-2" style={{ color: primaryColor }}>
                        <Award className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Tecnología Grado Industrial</span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-tight">
                        Laboratorio <br /> Profesional.
                      </h2>
                      <p className="text-slate-300 max-w-lg">
                        {shopLoading ? "Cargando identidad del taller..." : `${brandName} conecta atención comercial, rastreo y seguimiento con presencia de marca propia.`}
                      </p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5" style={{ color: primaryColor }} />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Contacto del taller</p>
                      </div>
                      <p className="text-3xl font-black text-white">{phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">
              {specialties.map((s) => (
                <div key={s.id} className="group relative h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                  <div className="relative h-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between hover:border-orange-500/40 transition-all duration-500 hover:-translate-y-3">
                    <div className="space-y-8">
                      <div className={`w-20 h-20 rounded-[2.2rem] bg-gradient-to-br ${s.color} p-0.5 transform group-hover:rotate-12 transition-transform duration-500 shadow-2xl`}>
                        <div className="w-full h-full bg-[#0A0A0A] rounded-[2rem] flex items-center justify-center text-white">{s.icon}</div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{s.name}</h3>
                        <p className="text-gray-400 leading-relaxed font-medium">{s.desc}</p>
                      </div>
                    </div>
                    <div className="pt-8 flex items-center justify-between border-t border-white/5 mt-8">
                      <span className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                        {s.price}
                      </span>
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shadow-lg">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-8">
              {testimonials.map((item, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10">
                  <div className="flex items-center gap-1 mb-5" style={{ color: primaryColor }}>
                    {[...Array(5)].map((_, star) => (
                      <Award key={star} className="w-4 h-4" />
                    ))}
                  </div>
                  <p className="text-lg text-slate-200 leading-relaxed">“{item.text}”</p>
                  <p className="mt-6 text-sm font-black uppercase tracking-widest text-gray-500">{item.name}</p>
                </div>
              ))}
            </section>
          </div>
        )}

        {view === "quote" && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in zoom-in-95 duration-700">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-10">
                <div className="inline-flex text-white px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] italic shadow-lg" style={{ backgroundColor: primaryColor }}>
                  Express Quote System
                </div>
                <h2 className="text-7xl lg:text-8xl font-black italic uppercase leading-[0.8] tracking-tighter">
                  TU EQUIPO <br />
                  <span style={{ color: primaryColor }} className="not-italic">
                    MERECE VOLVER.
                  </span>
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed font-medium">
                  Nuestro equipo analiza tu caso y te responde por WhatsApp con una propuesta clara, rápida y con la marca de tu taller al frente.
                </p>
                <div className="space-y-6 pt-4 text-left">
                  {[
                    { icon: <ShieldCheck className="text-green-500" />, title: "Seguridad ESD", text: "Protocolos electrostáticos y manejo profesional en cada intervención." },
                    { icon: <Zap className="w-5 h-5" style={{ color: primaryColor }} />, title: "Respuesta Ágil", text: "Diagnóstico inicial sin compromiso para acelerar decisiones." },
                    { icon: <CheckCircle2 className="text-blue-500" />, title: "Garantía Total", text: "Respaldo claro en mano de obra y refacciones críticas." }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg shrink-0">{item.icon}</div>
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-widest text-white">{item.title}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter leading-tight">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[4rem] blur-3xl opacity-30" style={{ background: `linear-gradient(to right, ${primaryColor}33, #ef444433)` }} />
                <div className="relative bg-[#111] border border-white/10 p-12 rounded-[3.5rem] shadow-3xl backdrop-blur-3xl">
                  <form className="space-y-8" onSubmit={handleQuoteSubmit}>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4">Modelo del Dispositivo</label>
                      <div className="relative">
                        <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                        <input
                          required
                          type="text"
                          value={quoteForm.device}
                          onChange={(event) => handleQuoteChange("device", event.target.value)}
                          placeholder="Ej: iPhone 15 Pro Max / MacBook Pro"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-5 focus:outline-none transition-all placeholder:text-white/5 font-black text-lg"
                          style={{ borderColor: "rgba(255,255,255,0.1)" }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4">¿Qué falla presenta?</label>
                      <textarea
                        required
                        value={quoteForm.issue}
                        onChange={(event) => handleQuoteChange("issue", event.target.value)}
                        placeholder="Explícanos brevemente qué sucede..."
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none transition-all resize-none placeholder:text-white/5 font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4">WhatsApp de Contacto</label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                        <input
                          required
                          type="tel"
                          value={quoteForm.phone}
                          onChange={(event) => handleQuoteChange("phone", event.target.value)}
                          placeholder="Tu número a 10 dígitos"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-5 focus:outline-none transition-all placeholder:text-white/5 font-black text-lg"
                        />
                      </div>
                    </div>
                    <button
                      disabled={isSubmitting}
                      className="w-full relative group overflow-hidden text-white py-6 rounded-2xl font-black text-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-2xl"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className="relative flex items-center justify-center gap-4">
                        {isSubmitting ? "ENVIANDO DATOS..." : "SOLICITAR PRESUPUESTO"}
                        {!isSubmitting && <Send className="w-6 h-6 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />}
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "track" && (
          <div className="max-w-5xl mx-auto px-6 py-32 text-center space-y-16 animate-in slide-in-from-bottom-10 duration-1000">
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="p-6 rounded-[2.5rem] border shadow-2xl" style={{ backgroundColor: `${primaryColor}12`, borderColor: `${primaryColor}33`, boxShadow: `${primaryColor}20 0px 20px 60px -30px` }}>
                  <Truck className="w-14 h-14" style={{ color: primaryColor }} />
                </div>
              </div>
              <h2 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none">
                TRACKING <br />
                <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent not-italic">ONLINE.</span>
              </h2>
              <p className="text-gray-400 text-lg md:text-xl font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto leading-relaxed">
                Transparencia absoluta. Consulta el estatus de tu reparación directamente en el sistema del taller.
              </p>
            </div>

            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 rounded-[3.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: `linear-gradient(to right, ${primaryColor}, #ef4444)` }} />
              <div className="relative">
                <input
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleTrackSubmit();
                    }
                  }}
                  placeholder="FOLIO-0000"
                  className="w-full bg-black/60 backdrop-blur-3xl border-2 border-white/10 rounded-[3.5rem] px-10 py-10 md:py-12 text-3xl md:text-6xl font-black text-center tracking-[0.2em] focus:outline-none transition-all placeholder:text-white/5 uppercase italic"
                />
                <Search className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-700 w-8 h-8 md:w-12 md:h-12 group-hover:transition-colors" style={{ color: primaryColor }} />
              </div>
            </div>

            <div className="space-y-10">
              <button
                onClick={handleTrackSubmit}
                className="group relative overflow-hidden bg-white text-black px-16 md:px-24 py-6 md:py-8 rounded-[2.5rem] font-black text-xl md:text-2xl shadow-3xl hover:text-white transition-all transform hover:scale-105 active:scale-95"
                style={{ ["--brand-primary" as string]: primaryColor }}
              >
                <span className="relative uppercase tracking-widest italic">Consultar Status</span>
              </button>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
                Consulta tu ticket físico o mensaje de WhatsApp para obtener el folio.
              </p>
            </div>

            {(trackingLoading || trackingError || order) && (
              <section className="mt-4 text-left bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl shadow-blue-950/10">
                {trackingLoading && (
                  <div className="flex items-center justify-center gap-3 text-slate-300 py-8">
                    <Loader2 className="animate-spin" size={22} style={{ color: primaryColor }} />
                    <span>Consultando el estado actual de tu equipo...</span>
                  </div>
                )}

                {!trackingLoading && trackingError && (
                  <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                    <p className="text-xl font-bold text-white mb-2">No encontramos ese folio</p>
                    <p className="text-slate-300">Revisa que el folio esté bien escrito o contáctanos por WhatsApp para ayudarte a rastrearlo.</p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, necesito ayuda para rastrear mi equipo en ${brandName}.` )}`}
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

                {!trackingLoading && order && (
                  <div className="space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div>
                        <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-widest border" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}55`, color: "#dbeafe" }}>
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
                            <div key={step} className={`rounded-3xl border p-4 transition-all ${active ? "border-blue-400/30 bg-blue-500/10" : "border-white/10 bg-white/5"}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-black uppercase tracking-wider">{formatStatus(step)}</span>
                                <span
                                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                                    current ? "text-white" : active ? "bg-blue-500/20 text-blue-200" : "bg-white/10 text-slate-400"
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
                            href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, pregunto por mi folio ${order.folio}. ¿Me ayudan con el estatus de mi equipo?`)}`}
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
                            <ExternalLink size={18} />
                            Imprimir seguimiento
                          </button>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            <p className="font-semibold text-white mb-1">Contacto del taller</p>
                            <p>Tel: {phone}</p>
                            <p>Email: {supportEmail}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="relative border-t border-white/5 py-32 bg-[#050505] overflow-hidden mt-20">
        <div className="absolute top-0 left-0 w-full h-px" style={{ background: `linear-gradient(to right, transparent, ${primaryColor}55, transparent)` }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-3 gap-24 text-left">
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, #ef4444)` }}>
                  {shopData?.logoUrl ? <img src={shopData.logoUrl} alt={brandName} className="w-full h-full object-cover" /> : <Wrench className="w-7 h-7 text-white" />}
                </div>
                <span className="font-black text-3xl tracking-tighter uppercase italic">{brandName}</span>
              </div>
              <p className="text-gray-500 text-lg leading-relaxed italic font-medium">
                “Llevamos la reparación electrónica al siguiente nivel. Precisión de laboratorio aplicada a la experiencia de tu cliente.”
              </p>
              <div className="flex gap-4">
                <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center hover:border-orange-500 transition-colors shadow-lg">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                </a>
                <button onClick={() => setView("track")} className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center hover:border-orange-500 transition-colors shadow-lg">
                  <Search className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="space-y-10">
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em]" style={{ color: primaryColor }}>
                Laboratorio Central
              </h4>
              <ul className="space-y-10">
                <li className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Dirección</p>
                    <p className="text-sm font-bold text-gray-300">{address}</p>
                  </div>
                </li>
                <li className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Contacto</p>
                    <p className="text-sm font-bold text-gray-300">{phone}</p>
                  </div>
                </li>
                <li className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Soporte</p>
                    <p className="text-sm font-bold text-gray-300">{supportEmail}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="md:text-right flex flex-col md:items-end justify-center space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] text-gray-700 uppercase tracking-[0.4em] font-black">White label powered by</p>
                <p className="font-black italic text-gray-600 text-5xl tracking-tighter leading-none">SDMX</p>
                <p className="text-xs text-gray-700 font-bold uppercase tracking-widest">Digital Platform</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-800 font-bold tracking-widest uppercase">© 2026 {brandName}</p>
                <p className="text-[9px] text-gray-900 font-bold uppercase tracking-[0.2em]">Systems online & encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
