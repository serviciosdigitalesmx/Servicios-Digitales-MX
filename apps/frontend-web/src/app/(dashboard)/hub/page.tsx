'use client';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  DollarSign, 
  Users, 
  FileText 
} from 'lucide-react';

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
          <div className="flex items-center gap-4">
            <div className="bg-[#1E2538] px-4 py-2 rounded-full border border-blue-500/20 text-[10px] font-black text-blue-400 tracking-widest uppercase">
              Sesión: Jesús Chávez
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#161B2C] p-8 rounded-3xl border border-blue-500/10 hover:border-blue-500/30 transition-all cursor-default group">
                <p className="text-blue-500 text-xs font-black uppercase mb-3 tracking-widest">Equipos en Taller</p>
                <h3 className="text-5xl font-black group-hover:scale-105 transition-transform">12</h3>
              </div>
              <div className="bg-[#161B2C] p-8 rounded-3xl border border-blue-500/10 hover:border-blue-500/30 transition-all cursor-default group">
                <p className="text-blue-500 text-xs font-black uppercase mb-3 tracking-widest">Caja Hoy</p>
                <h3 className="text-5xl font-black text-green-400 group-hover:scale-105 transition-transform">$4,500</h3>
              </div>
              <div className="bg-[#161B2C] p-8 rounded-3xl border border-blue-500/10 hover:border-blue-500/30 transition-all cursor-default group">
                <p className="text-blue-500 text-xs font-black uppercase mb-3 tracking-widest">Alertas Stock</p>
                <h3 className="text-5xl font-black text-red-500 group-hover:scale-105 transition-transform">03</h3>
              </div>
            </div>
          )}

          {activeTab === 'tecnico' && <TecnicoNative />}
          {activeTab === 'inventario' && <StockNative />}
          {activeTab === 'finanzas' && <FinanzasNative />}
          {activeTab === 'clientes' && <ClientesNative />}
        </div>
      </main>
    </div>
  );
}
