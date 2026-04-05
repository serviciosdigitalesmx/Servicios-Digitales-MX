"use client";

import React, { useState } from "react";
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
  const { session } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  if (!session) return null;
  const auth = session as AuthMeResponse;
  const subStatus = auth.subscription.status;
  const styles = getStatusStyle(subStatus);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        body: JSON.stringify({
          planCode: "profesional-650", // Upgrade sugerido
          tenantId: auth.shop.id,
          email: auth.user.email
        })
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con Mercado Pago");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="sdmx-dashboard-container min-h-screen">
      {/* Header Premium */}
      <header className="sdmx-glass-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0066FF] to-[#0044CC] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <IconMicrochip width={20} height={20} className="text-white" />
            </div>
            <span className="font-black text-white text-xl tracking-tight">Sr-Fix <span className="text-[#0066FF] italic text-sm">PRO</span></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">{auth.shop.name}</p>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-black">{auth.user.fullName}</p>
            </div>
            <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-all">
              <IconLogOut width={18} height={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white mb-3">Panel de Control</h1>
          <p className="text-slate-500 font-medium">Gestiona tu taller y domina el mercado con herramientas de élite.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subscription Status Card */}
          <div className={`sdmx-card-premium p-8 border ${styles.border} flex flex-col justify-between relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-blue-600/10 transition-all"></div>
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.bg}`}>
                  <IconCheckCircular width={24} height={24} className={styles.text} />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${styles.border} ${styles.text}`}>
                  {styles.label}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{auth.subscription.planCode}</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium">Suscripción SaaS Activa</p>
            </div>

            {subStatus === "trialing" && (
              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="mt-10 w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#0066FF] hover:text-white transition-all transform active:scale-95 shadow-xl shadow-blue-500/10 border-none flex items-center justify-center gap-2"
              >
                {upgrading ? "Conectando..." : "Mejorar a Profesional"}
                <IconStar width={16} height={16} />
              </button>
            )}
          </div>

          {/* Portal Widget */}
          <div className="sdmx-card-premium p-8 lg:col-span-2 flex flex-col justify-between border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <IconStore width={20} height={20} className="text-[#0066FF]" />
                </div>
                <h3 className="font-black text-white text-lg uppercase tracking-tight">Portal Público</h3>
              </div>
              <p className="text-slate-500 text-sm max-w-xl font-medium">
                Comparte este enlace a tus clientes. Podrán rastrear el estado de sus reparaciones en tiempo real usando su folio único.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                readOnly 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/portal?shop=${auth.shop.slug}`} 
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-4 text-slate-300 font-mono text-xs focus:border-[#0066FF] outline-none transition-all"
              />
              <button 
                onClick={() => window.open(`/portal?shop=${auth.shop.slug}`, '_blank')}
                className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
              >
                Abrir Portal
              </button>
            </div>
          </div>

          {/* Action Grid */}
          <div className="lg:col-span-3 grid md:grid-cols-2 gap-8 pt-8">
            <a href={`/interno?shop=${auth.shop.slug}`} className="group sdmx-card-premium p-10 hover:border-[#0066FF]/50 transition-all border-white/5">
              <div className="w-14 h-14 bg-gradient-to-br from-[#0066FF] to-[#0044CC] text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <IconDashboard width={28} height={28} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Sistema Central</h3>
              <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed">
                Panel Técnico completo: Inventarios, Folios automáticos, Finanzas y Control de Gastos. Tu taller en la palma de tu mano.
              </p>
            </a>

            <a href="/billing" className="group sdmx-card-premium p-10 hover:border-slate-500 transition-all border-white/5">
              <div className="w-14 h-14 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-slate-700 transition-all">
                <IconWallet width={28} height={28} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Facturación</h3>
              <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed">
                Historial de pagos, administración de tarjetas y cambio de planes. Transparencia total en tu suscripción SaaS.
              </p>
            </a>
          </div>
        </div>
      </main>

      <style jsx global>{`
        body { background-color: #0F172A; margin: 0; font-family: 'Inter', sans-serif; }
        .sdmx-dashboard-container {
          background-color: #0F172A;
          background-image: 
            radial-gradient(circle at 0% 0%, rgba(0, 102, 255, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 40%);
        }
        .sdmx-glass-header {
          background-color: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .sdmx-card-premium {
          background-color: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(24px);
          border-radius: 2.5rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sdmx-card-premium:hover {
          background-color: rgba(30, 41, 59, 0.8);
          transform: translateY(-4px);
        }
      `}</style>
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
