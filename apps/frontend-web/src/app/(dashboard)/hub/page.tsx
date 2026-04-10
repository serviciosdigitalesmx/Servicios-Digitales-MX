'use client';
import { useState } from 'react';
import { LayoutDashboard, Wrench, Package, DollarSign, Users } from 'lucide-react';
import ModernDashboard from '@/components/hub/ModernDashboard';
import FinanzasNative from '@/components/ui/FinanzasNative';
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
        <h2 className="text-xl font-black text-blue-500 mb-10 tracking-tighter italic uppercase">
          SDMX <span className="text-white font-light tracking-normal">Pro</span>
        </h2>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' 
                : 'text-gray-400 hover:bg-[#1E2538] hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center border-b border-blue-500/10 pb-6">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="bg-[#1E2538] px-4 py-2 rounded-full border border-blue-500/20 text-[10px] font-black text-blue-400 tracking-widest uppercase">
            Sesión: Jesús Chávez
          </div>
        </header>

        <div>
          {activeTab === 'dashboard' && <ModernDashboard />}
          {activeTab === 'tecnico' && <TecnicoNative />}
          {activeTab === 'inventario' && <StockNative />}
          {activeTab === 'finanzas' && <FinanzasNative />}
          {activeTab === 'clientes' && <ClientesNative />}
        </div>
      </main>
    </div>
  );
}
