"use client";

import React, { use, useEffect, useState } from "react";
import { ChevronRight, Loader2, MessageCircle, Search, Smartphone, Wrench } from "lucide-react";
import { useShopBranding } from "../../hooks/useShopBranding";

interface ShopPageProps {
  params: Promise<{ shopSlug: string }>;
}

export function ShopPremiumBluePage({ params }: ShopPageProps) {
  const { shopSlug } = use(params);
  const { shopData, loading } = useShopBranding(shopSlug);
  const [view, setView] = useState<"landing" | "quote" | "track">("landing");
  const [folio, setFolio] = useState("");
  const [quoteForm, setQuoteForm] = useState({ device: "", issue: "" });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    if (shopData && shopData.is_microsite_enabled === false) setView("track");
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shopData]);

  const handleWhatsAppQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = shopData?.phone || "8123456789";
    const message = `Hola. Vengo de su sitio web.\n\nEquipo: ${quoteForm.device}\nFalla: ${quoteForm.issue}\n\n¿Me pueden apoyar con un presupuesto?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const shopName = shopData?.name || shopSlug.replace(/-/g, " ").toUpperCase();

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white font-sans selection:bg-blue-500/30">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#0E1527]/90 backdrop-blur-xl border-b border-white/5 py-4" : "bg-transparent py-8"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView("landing")}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-12 transition-transform">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="font-black italic uppercase tracking-tighter text-xl">{shopName}</span>
          </div>

          {shopData?.is_microsite_enabled !== false && (
            <div className="hidden md:flex items-center gap-8">
              {["landing", "quote", "track"].map((item) => (
                <button key={item} onClick={() => setView(item as any)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view === item ? "text-blue-400" : "text-gray-500 hover:text-white"}`}>
                  {item === "landing" ? "Inicio" : item === "quote" ? "Cotizar" : "Rastreo"}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="relative pt-48 pb-20 px-6 max-w-6xl mx-auto">
        {view === "landing" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.85] uppercase">
              RESCATE <br /> <span className="text-blue-500 not-italic">DIGITAL.</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-medium">
              {shopData?.tagline || "Servicios de micro-reparación avanzada con identidad azul premium."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <button onClick={() => setView("quote")} className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                SOLICITAR PRECIO
              </button>
              <button onClick={() => setView("track")} className="bg-white/5 border border-white/10 px-12 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                RASTREAR EQUIPO
              </button>
            </div>
          </div>
        )}

        {view === "quote" && (
          <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-[#161B2C] border border-blue-500/20 p-10 rounded-[3rem] shadow-3xl text-left space-y-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tight">Presupuesto <br /> <span className="text-blue-500">Express.</span></h2>
              <form onSubmit={handleWhatsAppQuote} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Modelo del dispositivo</label>
                  <input required value={quoteForm.device} onChange={(e) => setQuoteForm({ ...quoteForm, device: e.target.value })} placeholder="Ej: iPhone 15 o MacBook Pro" className="w-full bg-[#1E2538] border border-blue-500/20 rounded-2xl p-5 text-white outline-none focus:border-blue-500 transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Descripción de la falla</label>
                  <textarea required value={quoteForm.issue} onChange={(e) => setQuoteForm({ ...quoteForm, issue: e.target.value })} placeholder="Ej: No prende, pantalla rota..." className="w-full bg-[#1E2538] border border-blue-500/20 rounded-2xl p-5 text-white outline-none focus:border-blue-500 resize-none transition-all" rows={3} />
                </div>
                <button className="w-full bg-blue-600 py-6 rounded-2xl font-black text-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20">
                  ENVIAR A WHATSAPP <MessageCircle className="w-6 h-6" />
                </button>
              </form>
            </div>
          </div>
        )}

        {view === "track" && (
          <div className="space-y-16 animate-in slide-in-from-bottom-10 duration-700">
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter">TRACKING <br /><span className="text-blue-500 not-italic">ONLINE.</span></h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Introduce tu folio para ver el estatus real</p>
            </div>
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity" />
              <input type="text" value={folio} onChange={(e) => setFolio(e.target.value.toUpperCase())} placeholder="FOLIO-0000" className="relative w-full bg-[#161B2C] border-2 border-blue-500/20 rounded-[2.5rem] py-12 text-5xl md:text-6xl text-center font-black outline-none focus:border-blue-500 transition-all uppercase italic text-white" />
            </div>
            <button className="bg-blue-600 text-white px-20 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-500 transition-all transform hover:scale-105 active:scale-95 shadow-2xl inline-flex items-center gap-3">
              <Search className="w-5 h-5" />
              CONSULTAR AHORA
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
