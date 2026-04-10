"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Cpu, 
  Inbox, 
  Archive, 
  Users, 
  Package, 
  Receipt, 
  ShoppingCart, 
  BarChart3, 
  DollarSign, 
  ShieldCheck, 
  Power,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navGroups = [
  {
    label: "General",
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: "Operaciones",
    items: [
      { id: 'recepcion', label: 'Recepción', icon: ClipboardList },
      { id: 'taller', label: 'Taller Técnico', icon: Cpu },
      { id: 'solicitudes', label: 'Solicitudes', icon: Inbox },
      { id: 'archivo', label: 'Archivo Histórico', icon: Archive },
    ]
  },
  {
    label: "Administración",
    items: [
      { id: 'clientes', label: 'Clientes', icon: Users },
      { id: 'inventario', label: 'Inventario', icon: Package },
      { id: 'gastos', label: 'Gastos & Pagos', icon: Receipt },
      { id: 'compras', label: 'Compras', icon: ShoppingCart },
    ]
  },
  {
    label: "Analítica & Sistema",
    items: [
      { id: 'reportes', label: 'Reportes Hub', icon: BarChart3 },
      { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
      { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
    ]
  }
];

export default function Sidebar({ activeTab, onTabChange, user }: any) {
  return (
    <aside className="w-64 bg-black/60 border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-40 backdrop-blur-3xl">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-accent-blue/10 border border-accent-blue/20 rounded-xl flex items-center justify-center text-accent-blue shadow-lg shadow-blue-500/10">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="font-jakarta font-extrabold text-xl tracking-tight text-white">
          SrFix<span className="text-accent-blue">Hub</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    activeTab === item.id 
                      ? "bg-accent-blue text-white shadow-lg shadow-blue-500/20" 
                      : "text-text-secondary hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={18} className={cn(activeTab === item.id ? "text-white" : "text-text-secondary group-hover:text-white")} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-blue flex items-center justify-center font-bold text-xs shadow-inner">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate text-white">{user?.name || 'Admin'}</div>
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{user?.role || 'Moderador'}</div>
          </div>
          <button className="text-text-secondary hover:text-red-500 transition-colors">
            <Power size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
