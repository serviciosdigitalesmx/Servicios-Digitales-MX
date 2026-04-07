"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Ticket } from "lucide-react";

function PortalContent() {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<{name: string, id: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const slug = searchParams.get("s") || "demo";

  useEffect(() => {
    async function loadShop() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5111";
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

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="border-b border-white/5 p-6 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Ticket size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">
              {shop?.name || "Portal de Cliente"}
            </h1>
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
            className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-6 text-xl outline-none focus:border-blue-500 transition-all text-center font-bold tracking-widest"
          />
          <button className="mt-8 w-full md:w-auto md:absolute md:right-3 md:top-3 md:mt-0 bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all">
            Consultar Estatus
          </button>
        </div>
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
