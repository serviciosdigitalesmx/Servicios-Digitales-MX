"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  IconStore, 
  IconDashboard, 
  IconLogOut, 
  IconMicrochip, 
  IconWallet, 
  IconCheckCircular 
} from "../../../components/ui/Icons";
import { AuthGuard, useAuth } from "../../../components/ui/AuthGuard";
import { OperativoNative } from "../../../components/ui/OperativoNative";
import { TecnicoNative } from "../../../components/ui/TecnicoNative";
import { StockNative } from "../../../components/ui/StockNative";
import { FinanzasNative } from "../../../components/ui/FinanzasNative";
import { supabase } from "../../../lib/supabase";

// ----------------------------------------------------------------------
// Sidebar Item Component
// ----------------------------------------------------------------------
function ModuleTab({ 
  id, 
  label, 
  active, 
  onClick, 
  icon: Icon 
}: { 
  id: string; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  icon: any;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-3 transition-all duration-300 font-tech text-[10px] uppercase tracking-widest ${
        active 
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon width={16} height={16} />
      {label}
    </button>
  );
}

// ----------------------------------------------------------------------
// Main Integrator Dashboard
// ----------------------------------------------------------------------
function HubIntegratorContent() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [activeModule, setActiveModule] = useState("recepcion");

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, router, session]);

  if (!session) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const modules = [
    { id: "recepcion", label: "Recepción", icon: IconMicrochip, subtitle: "Captura y seguimiento de equipos." },
    { id: "tecnico", label: "Taller técnico", icon: IconDashboard, subtitle: "Diagnóstico y reparaciones." },
    { id: "stock", label: "Stock / Inventario", icon: IconStore, subtitle: "Control de productos y refacciones." },
    { id: "finanzas", label: "Finanzas Pro", icon: IconWallet, subtitle: "Monitor de utilidad e ingresos." },
  ];

  const renderModuleContent = () => {
    switch (activeModule) {
      case "recepcion": return <OperativoNative tenantId={session.shop?.id || "default"} />;
      case "tecnico": return <TecnicoNative tenantId={session.shop?.id || "default"} />;
      case "stock": return <StockNative tenantId={session.shop?.id || "default"} />;
      case "finanzas": return <FinanzasNative tenantId={session.shop?.id || "default"} />;
      default: return <OperativoNative tenantId={session.shop?.id || "default"} />;
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-950 !bg-slate-950 flex flex-col md:flex-row overflow-hidden app-layout-master font-sans text-slate-200 z-[9999]">
      
      {/* SIDEBAR (Sr-Fix Master UI) */}
      <aside className="w-full md:w-[280px] bg-slate-950 !bg-slate-950 border-r border-white/5 p-6 flex flex-col shrink-0 z-[100] shadow-2xl relative">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-white p-1.5 rounded-xl">
             <div className="bg-blue-600 w-full h-full rounded-lg flex items-center justify-center text-white">
                <IconMicrochip width={16} height={16} />
             </div>
          </div>
          <div className="flex flex-col">
            <span className="font-tech text-white text-lg tracking-tight leading-none uppercase">SRFIX <span className="text-blue-500 text-[10px]">INT</span></span>
            <span className="text-[9px] text-slate-500 font-label font-bold uppercase tracking-widest mt-1">Internal Suite</span>
          </div>
        </div>

        <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-4 mb-8">
            <p className="text-[10px] text-blue-400 font-label font-black uppercase tracking-widest mb-1 items-center flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Centro de Operaciones
            </p>
            <p className="text-[9px] text-slate-500 font-label font-medium uppercase leading-relaxed tracking-wider">
                Control por sucursal y rol activo.
            </p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {modules.map((m) => (
            <ModuleTab 
              key={m.id} 
              id={m.id} 
              label={m.label} 
              icon={m.icon}
              active={activeModule === m.id} 
              onClick={() => setActiveModule(m.id)} 
            />
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-10 px-5 py-4 text-slate-500 hover:text-red-400 font-tech text-[10px] flex items-center gap-3 uppercase tracking-widest transition-colors"
        >
          <IconLogOut width={16} height={16} />
          Cerrar Sesión
        </button>
      </aside>

      {/* WORKSPACE AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 p-6 md:p-10">
        {/* Workspace Header */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl backdrop-blur-3xl relative overflow-hidden group min-h-[140px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] rounded-full group-hover:bg-blue-600/10 transition-all duration-700"></div>
          <div className="relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-tech text-white uppercase tracking-wider mb-2">
              {modules.find(m => m.id === activeModule)?.label}
            </h1>
            <p className="text-xs text-slate-400 font-label font-medium uppercase tracking-[0.2em]">
               {modules.find(m => m.id === activeModule)?.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4 relative z-10">
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] text-blue-500 font-tech uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-1">Root Admin</span>
                <span className="text-[11px] text-slate-500 font-label font-bold uppercase tracking-widest">{session.user?.fullName || "Administrador"}</span>
             </div>
             <div className="w-12 h-12 bg-slate-800 border border-white/10 rounded-2xl flex items-center justify-center text-slate-300">
                <IconCheckCircular width={20} height={20} />
             </div>
          </div>
        </div>

        {/* Content Shell */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
           {renderModuleContent()}
        </div>
      </main>

    </div>
  );
}

export default function HubPage() {
  return (
    <AuthGuard>
      <HubIntegratorContent />
    </AuthGuard>
  );
}
