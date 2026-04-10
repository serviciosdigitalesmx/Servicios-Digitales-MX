'use client';
import { useState } from 'react';
import { LayoutDashboard, Wrench, Package, DollarSign, Users } from 'lucide-react';
import ModernDashboard from '@/components/hub/ModernDashboard';
import FinancePanelPro from '@/components/hub/FinancePanelPro';
import StockNative from '@/components/ui/StockNative';
import TecnicoNative from '@/components/ui/TecnicoNative';
import ClientesNative from '@/components/ui/ClientesNative';

export default function DashboardHub() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const menuItems = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'tecnico', label: 'Taller / Técnico', icon: Wrench },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'finanzas', label: 'Caja / Finanzas', icon: DollarSign },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-[#0A0F1C] text-white">
      <aside className="w-64 bg-[#161B2C] border-r border-blue-500/10 p-6 flex flex-col">
        <h2 className="text-xl font-black text-blue-500 mb-10 tracking-tighter italic uppercase">SDMX Pro</h2>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-[#1E2538]'}`}>
              <item.icon size={18} /><span className="font-bold text-xs uppercase">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center border-b border-blue-500/10 pb-6">
          <h1 className="text-3xl font-black uppercase text-white">{menuItems.find(i => i.id === activeTab)?.label}</h1>
        </header>
        <div>
          {activeTab === 'dashboard' && <ModernDashboard />}
          {activeTab === 'finanzas' && <FinancePanelPro />}
          {activeTab === 'tecnico' && <TecnicoNative />}
          {activeTab === 'inventario' && <StockNative />}
          {activeTab === 'clientes' && <ClientesNative />}
        </div>
      </main>
    </div>
  );
}
