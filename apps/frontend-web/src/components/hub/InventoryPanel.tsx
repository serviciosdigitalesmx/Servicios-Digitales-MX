"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Boxes,
  Plus,
  Wrench,
  BatteryCharging,
  Monitor,
  Cpu,
  MoreVertical
} from "lucide-react";

interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  sku: string;
  stock: number;
  minimo: number;
  costo: number;
  ubicacion: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", nombre: "Pantalla iPhone 13", categoria: "Pantallas", sku: "SCR-IP13", stock: 8, minimo: 3, costo: 950, ubicacion: "Estante A1" },
  { id: "2", nombre: "Batería Samsung S22", categoria: "Baterías", sku: "BAT-S22", stock: 2, minimo: 4, costo: 420, ubicacion: "Estante B2" },
  { id: "3", nombre: "Teclado MacBook Air", categoria: "Periféricos", sku: "KEY-MBA", stock: 6, minimo: 2, costo: 1350, ubicacion: "Estante C3" },
  { id: "4", nombre: "IC de carga Xiaomi", categoria: "Microcomponentes", sku: "IC-XM-44", stock: 15, minimo: 6, costo: 90, ubicacion: "Gaveta D1" },
];

function getCategoryIcon(category: string) {
  if (category === "Pantallas") return Monitor;
  if (category === "Baterías") return BatteryCharging;
  if (category === "Microcomponentes") return Cpu;
  return Wrench;
}

export default function InventoryPanel() {
  const [items] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const filtered = items.filter(
    (i) =>
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter((i) => i.stock <= i.minimo).length;
  const totalStock = items.reduce((acc, i) => acc + i.stock, 0);
  const totalValue = items.reduce((acc, i) => acc + i.stock * i.costo, 0);

  return (
    <div className="space-y-8 pb-12">
      <header className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 glass-card p-10 border-white/5 bg-[var(--accent-blue)]/5 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Inventario</h1>
            <p className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-[0.3em] mt-2">
              Control de refacciones y stock
            </p>
          </div>

          <button className="mt-10 btn-accent py-4 flex items-center justify-center gap-3 text-xs uppercase font-black tracking-widest">
            <Plus size={18} /> Nuevo Ítem
          </button>
        </div>

        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Piezas en stock", value: totalStock, icon: Boxes, color: "text-white" },
            { label: "Stock crítico", value: lowStock, icon: AlertTriangle, color: "text-red-500" },
            { label: "Valor inventario", value: `$${totalValue.toLocaleString()}`, icon: Package, color: "text-[var(--accent-blue)]" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-black/40 border border-white/5 rounded-[40px] p-8 flex items-center gap-8 shadow-2xl backdrop-blur-md">
                <div className={`p-4 rounded-3xl bg-white/5 ${s.color}`}>
                  <Icon size={32} />
                </div>
                <div>
                  <div className={`text-4xl font-jakarta font-black ${s.color}`}>{loading ? "..." : s.value}</div>
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none focus:border-[var(--accent-blue)] transition-all backdrop-blur-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[var(--text-secondary)] hover:text-white transition-all">
          <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => {
          const Icon = getCategoryIcon(item.categoria);
          const low = item.stock <= item.minimo;
          return (
            <div key={item.id} className="bg-black/40 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-2xl bg-white/5 ${low ? "text-red-500" : "text-[var(--accent-blue)]"}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-jakarta font-extrabold text-white">{item.nombre}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-1">
                      {item.sku}
                    </p>
                  </div>
                </div>

                <button className="text-[var(--text-secondary)] hover:text-white">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Categoría</p>
                  <p className="text-white font-bold">{item.categoria}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Ubicación</p>
                  <p className="text-white font-bold">{item.ubicacion}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Stock</p>
                  <p className={`font-black ${low ? "text-red-500" : "text-white"}`}>{item.stock}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2">Costo</p>
                  <p className="text-white font-black">${item.costo}</p>
                </div>
              </div>

              {low && (
                <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                  Stock bajo. Mínimo requerido: {item.minimo}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
