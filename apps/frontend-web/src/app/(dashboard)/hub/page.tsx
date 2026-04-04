"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconStore,
  IconDashboard,
  IconWallet,
  IconLogOut,
  IconMicrochip,
  IconCheckCircular,
  IconStar
} from "../../../components/ui/Icons";
import { AuthGuard, useAuth, AuthMeResponse } from "../../../components/ui/AuthGuard";

function getStatusStyle(status: string) {
  switch (status) {
    case "active":
      return { label: "Activa", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
    case "trialing":
      return { label: "En Prueba", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" };
    case "past_due":
      return { label: "Acceso Limitado", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" };
    default:
      return { label: "Inactiva", bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" };
  }
}

function HubDashboardContent() {
  const { session, loading } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, router, session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-center">
        <div className="sdmx-hub-card max-w-md w-full p-10">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Redirigiendo al acceso</h2>
          <p className="text-slate-400 mt-3 font-medium">Necesitamos una sesión activa para entrar al panel.</p>
        </div>
      </div>
    );
  }
  const auth = session as AuthMeResponse;
  const subStatus = auth.subscription.status;
  const styles = getStatusStyle(subStatus);

  const handleLogout = () => {
    localStorage.removeItem("sdmx_session");
    window.location.href = "/login";
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planCode: "profesional-650", // Upgrade sugerido
          tenantId: auth.shop.id,
          email: auth.user.email,
          fullName: auth.user.fullName
        })
      });
      const data = await res.json();
      const checkoutUrl = data.checkoutUrl ?? data.init_point;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con Mercado Pago");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="sdmx-dashboard-container min-h-screen bg-slate-950">
      {/* Header Premium */}
      <header className="sticky top-0 z-40 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <IconMicrochip width={20} height={20} className="text-white" />
            </div>
            <span className="font-tech text-white text-xl tracking-tight uppercase">
              Sr-Fix <span className="text-blue-500 italic text-sm">PRO</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-none font-label uppercase tracking-wider">{auth.shop.name}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-label font-bold">{auth.user.fullName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <IconLogOut width={18} height={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-3 font-tech tracking-wider uppercase">
            Panel de Control
          </h1>
          <p className="text-slate-400 font-label font-medium uppercase tracking-widest text-sm">
            Gestión de élite para servicios tecnológicos.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subscription Status Card */}
          <div className="sdmx-glass p-8 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden group min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-blue-600/20 transition-all"></div>
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.bg} border ${styles.border}`}>
                  <IconCheckCircular width={24} height={24} className={styles.text} />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] border font-label ${styles.border} ${styles.text}`}>
                  {styles.label}
                </span>
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-wider font-tech">{auth.subscription.planCode}</h3>
              <p className="text-slate-500 text-sm mt-2 font-label font-bold uppercase tracking-widest">Suscripción SaaS Activa</p>
            </div>

            {subStatus === "trialing" && (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="mt-10 w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-tech text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 border border-blue-400/30"
              >
                {upgrading ? "Sincronizando..." : "Mejorar a Profesional"}
                <IconStar width={14} height={14} />
              </button>
            )}
          </div>

          {/* Portal Widget */}
          <div className="sdmx-glass p-8 rounded-[2.5rem] lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <IconStore width={20} height={20} className="text-blue-500" />
                </div>
                <h3 className="font-tech text-white text-lg uppercase tracking-wider">Portal Público de Clientes</h3>
              </div>
              <p className="text-slate-400 text-sm max-w-xl font-medium leading-relaxed">
                Tus clientes pueden consultar el estado de su equipo en tiempo real usando su folio único.
                Copia y pega este enlace en tus comunicaciones oficiales.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/portal?shop=${auth.shop.slug}`}
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-4 text-blue-400 font-mono text-[10px] focus:border-blue-500 outline-none transition-all shadow-inner"
              />
              <button
                onClick={() => window.open(`/portal?shop=${auth.shop.slug}`, '_blank')}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-white/5 rounded-2xl font-tech text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-lg"
              >
                Ver Mi Portal
              </button>
            </div>
          </div>

          {/* Action Grid */}
          <div className="lg:col-span-3 grid md:grid-cols-2 gap-8 pt-4">
            <a href={`/interno?shop=${auth.shop.slug}`} className="group sdmx-glass p-10 rounded-[2.5rem] transition-all block border-white/5 hover:border-blue-500/30">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <IconDashboard width={28} height={28} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider font-tech">Sistema Central</h3>
              <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">
                Control total de tu taller: Inventarios, Folios automáticos, Finanzas y control de stock en tiempo real.
              </p>
            </a>

            <a href="/billing" className="group sdmx-glass p-10 rounded-[2.5rem] transition-all block border-white/5 hover:border-slate-500/30">
              <div className="w-14 h-14 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-slate-700 transition-all">
                <IconWallet width={28} height={28} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider font-tech">Facturación y Plan</h3>
              <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">
                Administra tus métodos de pago, historial de facturas y escala tu suscripción conforme crezca tu negocio.
              </p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HubPage() {
  return (
    <AuthGuard>
      <HubDashboardContent />
    </AuthGuard>
  );
}
