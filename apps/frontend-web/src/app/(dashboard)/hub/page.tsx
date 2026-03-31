"use client";

import React from "react";
import { 
  IconStore, 
  IconDashboard, 
  IconWallet, 
  IconLogOut, 
  IconMicrochip,
  IconCheckCircular
} from "../../../components/ui/Icons";
import { AuthGuard, useAuth, AuthMeResponse } from "../../../components/ui/AuthGuard";

function getStatusCopy(status: string) {
  switch (status) {
    case "active":
      return { label: "Activa", bg: "bg-[#00A389]/10", text: "text-[#00A389]", border: "border-[#00A389]/20" };
    case "trialing":
      return { label: "En prueba", bg: "bg-[#0066FF]/10", text: "text-[#0066FF]", border: "border-[#0066FF]/20" };
    case "past_due":
      return { label: "Pago vencido", bg: "bg-[#FF6A2A]/10", text: "text-[#FF6A2A]", border: "border-[#FF6A2A]/20" };
    case "suspended":
    case "cancelled":
      return { label: "Suspendida", bg: "bg-[#E53E3E]/10", text: "text-[#E53E3E]", border: "border-[#E53E3E]/20" };
    default:
      return { label: status, bg: "bg-[#E2E8F0]", text: "text-[#4A5568]", border: "border-transparent" };
  }
}

function HubDashboardContent() {
  const { session } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("sdmx_session");
    window.location.href = "/login";
  };

  if (!session) return null;

  const auth = session as AuthMeResponse;

  return (
    <div className="sdmx-dashboard-container">
      {/* Top Navbar */}
      <header className="sdmx-glass-header sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <IconMicrochip width={16} height={16} style={{ color: "white" }} />
            </div>
            <span className="font-bold text-white">Servicios Digitales MX</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{auth.shop.name}</p>
              <p className="text-xs text-slate-400">{auth.user.fullName}</p>
            </div>
            <button onClick={handleLogout} className="w-10 h-10 rounded-full sdmx-btn-nav flex items-center justify-center transition">
              <IconLogOut width={18} height={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Panel del Negocio</h1>
          <p className="text-slate-400">Gestiona tu suscripción y accede a las herramientas de tu taller.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Status Card */}
          <div className={`sdmx-card-premium p-6 border ${getStatusCopy(auth.subscription.status).border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusCopy(auth.subscription.status).bg}`}>
                <IconCheckCircular width={20} height={20} className={getStatusCopy(auth.subscription.status).text} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusCopy(auth.subscription.status).bg} ${getStatusCopy(auth.subscription.status).text}`}>
                {getStatusCopy(auth.subscription.status).label.toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white capitalize">{auth.subscription.planCode}</h3>
            <p className="text-slate-400 text-sm mt-1">Suscripción actual</p>
          </div>

          {/* Portal Link */}
          <div className="sdmx-card-premium p-6 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconStore width={20} height={20} className="text-[#0066FF]" />
                <h3 className="font-bold text-white">Portal Público del Taller</h3>
              </div>
              <p className="text-slate-400 text-sm">Este es el enlace que debes compartir con tus clientes para que revisen el estado de sus equipos usando su folio.</p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                readOnly 
                value={typeof window !== 'undefined' ? `${window.location.origin}/portal?shop=${auth.shop.slug}` : `/portal?shop=${auth.shop.slug}`} 
                className="flex-1 rounded-lg border border-[#E2E8F0] bg-[#F0F2F5] px-4 py-2 text-[#4A5568] font-mono text-sm"
              />
              <button 
                onClick={() => window.open(`/portal?shop=${auth.shop.slug}`, '_blank')}
                className="px-4 py-2 bg-[#0066FF] text-white rounded-lg font-bold hover:bg-[#0052CC] transition whitespace-nowrap"
              >
                Ver Portal Público
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-4">Plataforma</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          
          {auth.subscription.operationalAccess ? (
            <a href={`/interno?shop=${auth.shop.slug}`} className="group sdmx-card-premium p-6 hover:border-[#0066FF] transition flex flex-col justify-between" style={{ minHeight: "200px" }}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-[#0066FF]/10 text-[#0066FF] rounded-xl flex items-center justify-center mb-4">
                  <IconDashboard width={24} height={24} />
                </div>
                <div className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#A0AEC0] group-hover:bg-[#0066FF] group-hover:border-[#0066FF] group-hover:text-white transition">
                   →
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Operativo Interno</h3>
                <p className="text-slate-400 text-sm mt-1">Abre tu sistema central: Folios, Clientes, Compras, Stock, Inventario y Finanzas.</p>
              </div>
            </a>
          ) : (
            <div className="sdmx-card-premium p-6 border border-[#E53E3E]/30 bg-[#FFF5F5] flex flex-col justify-between" style={{ minHeight: "200px" }}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-[#E53E3E]/10 text-[#E53E3E] rounded-xl flex items-center justify-center mb-4">
                  🔒
                </div>
                <span className="text-xs font-bold bg-[#E53E3E]/10 text-[#E53E3E] px-2 py-1 rounded">
                  BLOQUEADO
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Operativo Interno</h3>
                <p className="text-[#E53E3E] text-sm mt-1">El acceso está temporalmente inhabilitado. Por favor resuelve tu situación de facturación.</p>
              </div>
            </div>
          )}

          {["owner", "admin"].includes(auth.user.role.toLowerCase()) && (
            <a href="/billing" className="group sdmx-card-premium p-6 hover:border-[#0066FF] transition flex flex-col justify-between" style={{ minHeight: "200px" }}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-[#A0AEC0]/10 text-[#4A5568] rounded-xl flex items-center justify-center mb-4">
                  <IconWallet width={24} height={24} />
                </div>
                <div className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#A0AEC0] group-hover:bg-[#0066FF] group-hover:border-[#0066FF] group-hover:text-white transition">
                   →
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Facturación y Planes</h3>
                <p className="text-slate-400 text-sm mt-1">Administra tu método de pago, visualiza tus facturas y ajusta tu suscripción.</p>
              </div>
            </a>
          )}

        </div>

      </main>

      <style jsx global>{`
        body { background-color: #0F172A !important; margin: 0; }
        .sdmx-dashboard-container {
          min-height: 100vh;
          background-color: #0F172A;
          background-image: 
            radial-gradient(circle at 0% 0%, rgba(0, 102, 255, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.1) 0%, transparent 40%);
          color: white;
        }
        .sdmx-glass-header {
          background-color: rgba(15, 23, 42, 0.6) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .sdmx-card-premium {
          background-color: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 1.5rem !important;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3) !important;
        }
        .sdmx-btn-nav {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .sdmx-btn-nav:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
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
