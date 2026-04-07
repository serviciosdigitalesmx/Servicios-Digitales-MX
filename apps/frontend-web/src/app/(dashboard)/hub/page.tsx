"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { AuthGuard, useAuth } from "../../../components/ui/AuthGuard";
import { supabase } from "../../../lib/supabase";
import Sidebar from "../../../components/hub/Sidebar";
import Dashboard from "../../../components/hub/Dashboard";
import ReceptionForm from "../../../components/hub/ReceptionForm";
import TechnicalPanel from "../../../components/hub/TechnicalPanel";
import CustomersPanel from "../../../components/hub/CustomersPanel";
import ArchivePanel from "../../../components/hub/ArchivePanel";
import FinancePanel from "../../../components/hub/FinancePanel";
import InventoryPanel from "../../../components/hub/InventoryPanel";
import ExpensesPanel from "../../../components/hub/ExpensesPanel";
import PurchasesPanel from "../../../components/hub/PurchasesPanel";
import ReportsPanel from "../../../components/hub/ReportsPanel";
import SecurityPanel from "../../../components/hub/SecurityPanel";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="glass-card p-8 md:p-12 text-center bg-black/40 border-white/5 shadow-2xl backdrop-blur-3xl min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center rounded-3xl">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-3xl flex items-center justify-center text-[var(--accent-blue)] mb-6 md:mb-8 shadow-inner">
        <span className="text-2xl md:text-3xl">•</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-jakarta font-black text-white mb-4">{title}</h2>
      <p className="max-w-md text-[var(--text-secondary)] font-medium tracking-tight leading-relaxed text-sm md:text-base">
        Este módulo se va a conectar después con Supabase y Render, pero el shell visual ya quedó montado y responsivo.
      </p>
    </div>
  );
}

function HubContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { session } = useAuth();

  // Mapeamos la sesión real inyectada por el AuthGuard
  const user = session?.user 
    ? { name: session.user.fullName, role: session.user.role } 
    : { name: "Cargando...", role: "..." };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "recepcion": return <ReceptionForm />;
      case "taller": return <TechnicalPanel />;
      case "solicitudes": return <Placeholder title="Solicitudes" />;
      case "archivo": return <ArchivePanel />;
      case "clientes": return <CustomersPanel />;
      case "inventario": return <InventoryPanel />;
      case "gastos": return <ExpensesPanel />;
      case "compras": return <PurchasesPanel />;
      case "reportes": return <Placeholder title="Reportes Hub" />;
      case "finanzas": return <FinancePanel />;
      case "seguridad": return <SecurityPanel />;
      default: return <Placeholder title="Módulo" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#060608] text-white overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        user={user} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 transition-all duration-300 md:ml-64 min-h-screen flex flex-col h-screen overflow-y-auto">
        {/* Header Móvil */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/60 backdrop-blur-3xl sticky top-0 z-30">
          <div className="font-jakarta font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-lg flex items-center justify-center text-[var(--accent-blue)]">
              <span className="text-lg">⚡</span>
            </div>
            SrFix<span className="text-[var(--accent-blue)]">Hub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors">
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 md:p-8 flex-1">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Overlay oscuro para cerrar menú en móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function HubPage() {
  return (
    <AuthGuard>
      <HubContent />
    </AuthGuard>
  );
}
