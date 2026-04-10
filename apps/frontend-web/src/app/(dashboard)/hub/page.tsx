'use client';
import { useState } from 'react';
import { 
  LayoutDashboard, ClipboardList, Wrench, MessageSquare, Archive, 
  Users, CheckSquare, Package, Truck, ShoppingCart, 
  Receipt, DollarSign, BarChart3, Building2, ShieldCheck 
} from 'lucide-react';

// Importación de los Módulos Reales Migrados (Rescatados de SrFix-Modern)
import ModernDashboard from '@/components/hub/ModernDashboard';
import ReceptionForm from '@/components/hub/ReceptionForm';
import TechnicalPanel from '@/components/hub/TechnicalPanel';
import InventoryPanel from '@/components/hub/InventoryPanel';
import FinancePanel from '@/components/hub/FinancePanel';
import CustomersPanel from '@/components/hub/CustomersPanel';
import ExpensesPanel from '@/components/hub/ExpensesPanel';
import ReportsPanel from '@/components/hub/ReportsPanel';

export default function DashboardHub() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'recepcion', label: 'Recepción', icon: ClipboardList },
    { id: 'tecnico', label: 'Taller / Técnico', icon: Wrench },
    { id: 'solicitudes', label: 'Solicitudes', icon: MessageSquare },
    { id: 'archivo', label: 'Archivo', icon: Archive },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare },
    { id: 'stock', label: 'Inventario', icon: Package },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
    { id: 'gastos', label: 'Gastos', icon: Receipt },
    { id: 'finanzas', label: 'Caja / Finanzas', icon: DollarSign },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'sucursales', label: 'Sucursales', icon: Building2 },
    { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-[#0A0F1C] text-white overflow-hidden font-sans">
      {/* Sidebar Integrador Estilo Foto */}
      <aside className="w-64 bg-[#111625] border-r border-white/5 flex flex-col shadow-2xl">
        <div className="p-6">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1">SRFIX Internal Suite</h2>
          <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">SRFIX <span className="text-blue-500">Integrador</span></h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-hide py-4">
          <p className="text-[9px] font-bold text-gray-500 uppercase px-3 mb-4 tracking-[0.2em] flex items-center gap-2">
            Centro de control <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
          </p>
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

        <div className="p-4 border-t border-white/5 bg-black/20">
           <button className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-inner">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Área de Trabajo */}
      <main className="flex-1 overflow-y-auto bg-[#0A0F1C] p-10">
        <header className="flex justify-between items-end mb-10 border-b border-white/5 pb-8">
           <div className="space-y-1">
             <div className="flex items-center gap-2 text-blue-500 mb-2">
                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Módulo de Gestión</span>
             </div>
             <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                {menuItems.find(i => i.id === activeTab)?.label}
             </h2>
           </div>
           <div className="flex items-center gap-3">
              <div className="bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest">USER: JESUS_VILLA</div>
              <div className="bg-blue-600 px-4 py-2.5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-600/20">ADMIN_SRFIX</div>
           </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'dashboard' && <ModernDashboard />}
          {activeTab === 'recepcion' && <ReceptionForm />}
          {activeTab === 'tecnico' && <TechnicalPanel />}
          {activeTab === 'stock' && <InventoryPanel />}
          {activeTab === 'finanzas' && <FinancePanel />}
          {activeTab === 'clientes' && <CustomersPanel />}
          {activeTab === 'gastos' && <ExpensesPanel />}
          {activeTab === 'reportes' && <ReportsPanel />}
          
          {/* Sincronización Automática para módulos vacíos */}
          {!['dashboard', 'recepcion', 'tecnico', 'stock', 'finanzas', 'clientes', 'gastos', 'reportes'].includes(activeTab) && (
            <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[50px] bg-white/[0.01]">
               <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 mb-6 animate-bounce">
                  <Wrench size={40} />
               </div>
               <p className="font-black text-white uppercase tracking-[0.4em] text-sm">Módulo en Sincronización</p>
               <p className="text-[10px] text-gray-600 uppercase font-bold mt-2 tracking-widest">Conectando con Supabase Engine...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
