'use client';
import { useState } from 'react';
import { 
  LayoutDashboard, ClipboardList, Wrench, MessageSquare, Archive, 
  Users, CheckSquare, Package, Truck, ShoppingCart, 
  Receipt, DollarSign, BarChart3, Building2, ShieldCheck 
} from 'lucide-react';

// Importación de Módulos Reales (Rescatados del Escritorio)
import ModernDashboard from '@/components/hub/ModernDashboard';
import ReceptionForm from '@/components/hub/ReceptionForm';
import TechnicalPanel from '@/components/hub/TechnicalPanel';
import InboxPanel from '@/components/hub/InboxPanel';
import ArchivePanel from '@/components/hub/ArchivePanel';
import CustomersPanel from '@/components/hub/CustomersPanel';
import InventoryPanel from '@/components/hub/InventoryPanel';
import PurchasesPanel from '@/components/hub/PurchasesPanel';
import ExpensesPanel from '@/components/hub/ExpensesPanel';
import FinancePanel from '@/components/hub/FinancePanel';
import ReportsPanel from '@/components/hub/ReportsPanel';
import SecurityPanel from '@/components/hub/SecurityPanel';

export default function DashboardHub() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'recepcion', label: 'Recepción', icon: ClipboardList },
    { id: 'tecnico', label: 'Técnico', icon: Wrench },
    { id: 'solicitudes', label: 'Solicitudes', icon: MessageSquare },
    { id: 'archivo', label: 'Archivo', icon: Archive },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
    { id: 'gastos', label: 'Gastos', icon: Receipt },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-[#0A0F1C] text-white overflow-hidden font-sans">
      <aside className="w-64 bg-[#111625] border-r border-white/5 flex flex-col shadow-2xl">
        <div className="p-6">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1">SRFIX Internal Suite</h2>
          <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">SRFIX <span className="text-blue-500">Integrador</span></h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-hide py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-[11px] uppercase tracking-widest ${
                activeTab === item.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 translate-x-1' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={16} strokeWidth={activeTab === item.id ? 3 : 2} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#0A0F1C] p-10">
        <header className="flex justify-between items-end mb-10 border-b border-white/5 pb-8">
           <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              {menuItems.find(i => i.id === activeTab)?.label}
           </h2>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'dashboard' && <ModernDashboard />}
          {activeTab === 'recepcion' && <ReceptionForm />}
          {activeTab === 'tecnico' && <TechnicalPanel />}
          {activeTab === 'solicitudes' && <InboxPanel />}
          {activeTab === 'archivo' && <ArchivePanel />}
          {activeTab === 'clientes' && <CustomersPanel />}
          {activeTab === 'stock' && <InventoryPanel />}
          {activeTab === 'compras' && <PurchasesPanel />}
          {activeTab === 'gastos' && <ExpensesPanel />}
          {activeTab === 'finanzas' && <FinancePanel />}
          {activeTab === 'reportes' && <ReportsPanel />}
          {activeTab === 'seguridad' && <SecurityPanel />}
          
          {/* Si faltara algún módulo por mapear */}
          {!menuItems.some(i => i.id === activeTab) && (
            <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[50px] bg-white/[0.01]">
               <Wrench size={40} className="text-blue-500 mb-6 animate-bounce" />
               <p className="font-black text-white uppercase tracking-[0.4em] text-sm">Sincronizando Módulo...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
