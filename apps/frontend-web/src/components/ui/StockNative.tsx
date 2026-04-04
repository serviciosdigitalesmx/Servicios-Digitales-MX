"use client";

import React, { useState } from "react";
import { 
  IconStore, 
  IconCheckCircular, 
  IconDashboard, 
  IconMicrochip,
  IconWallet,
  IconChevronRight
} from "./Icons";

// ----------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------
const MOCK_STOCK = [
  { sku: "DISP-IP13-ORG", nombre: "Pantalla iPhone 13 OLED", categoria: "Displays", marca: "Apple", stock: 2, min: 5, precio: 2450, estatus: "Alerta" },
  { sku: "BATT-IP12-OEM", nombre: "Batería iPhone 12 OEM", categoria: "Baterías", marca: "Apple", stock: 0, min: 3, precio: 850, estatus: "Agotado" },
  { sku: "FLEX-CHR-S21", nombre: "Flex de Carga Samsung S21", categoria: "Flexores", marca: "Samsung", stock: 15, min: 5, precio: 320, estatus: "OK" },
];

export default function StockNative({ tenantId }: { tenantId: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const getStockBadge = (stock: number, min: number) => {
    if (stock === 0) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (stock <= min) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-green-500/10 text-green-500 border-green-500/20";
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      
      {/* KPIs DE INVENTARIO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card-srf p-6 border-blue-500/30 relative overflow-hidden">
          <p className="text-[10px] text-blue-500 font-tech uppercase tracking-widest mb-1">Productos</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">42</span>
            <span className="text-[9px] text-slate-500 font-label font-bold uppercase">CATÁLOGO</span>
          </div>
        </div>
        <div className="card-srf p-6 border-yellow-500/30 relative overflow-hidden">
          <p className="text-[10px] text-yellow-500 font-tech uppercase tracking-widest mb-1">Stock Bajo</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">08</span>
            <span className="text-[9px] text-slate-500 font-label font-bold uppercase">REORDENAR</span>
          </div>
        </div>
        <div className="card-srf p-6 border-red-500/30 relative overflow-hidden">
          <p className="text-[10px] text-red-500 font-tech uppercase tracking-widest mb-1">Agotados</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-tech text-white">03</span>
            <span className="text-[9px] text-slate-500 font-label font-bold uppercase">SIN PIEZAS</span>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIONES */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <input 
            type="text" 
            placeholder="Buscar por SKU, nombre o categoría..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-blue-500/20 rounded-2xl px-5 py-4 text-sm text-white focus:border-orange-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-slate-800 text-slate-300 font-tech text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl border border-white/5">
            Reporte
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none btn-naranja font-tech text-xs uppercase tracking-[0.15em] px-8 py-4 rounded-xl"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS (Master UI) */}
      <div className="card-srf overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] text-slate-500 uppercase font-black tracking-widest font-label">SKU</th>
                <th className="px-6 py-4 text-[10px] text-slate-500 uppercase font-black tracking-widest font-label">Producto</th>
                <th className="px-6 py-4 text-[10px] text-slate-500 uppercase font-black tracking-widest font-label">Estatus</th>
                <th className="px-6 py-4 text-[10px] text-slate-500 uppercase font-black tracking-widest font-label text-right">Existencia</th>
                <th className="px-6 py-4 text-[10px] text-slate-500 uppercase font-black tracking-widest font-label text-right">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_STOCK.map((item) => (
                <tr key={item.sku} className="hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="px-6 py-5 font-tech text-xs text-blue-500">{item.sku}</td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-white font-label font-bold">{item.nombre}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.categoria} · {item.marca}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[9px] px-3 py-1 rounded-full border uppercase font-black tracking-widest ${getStockBadge(item.stock, item.min)}`}>
                      {item.stock === 0 ? "Agotado" : item.stock <= item.min ? "Bajo" : "Disponible"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-tech text-sm text-slate-300">
                    {item.stock} <span className="text-slate-600 text-[10px]">/ {item.min}</span>
                  </td>
                  <td className="px-6 py-5 text-right font-tech text-sm text-orange-500">
                    ${item.precio.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO PRODUCTO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="card-srf w-full max-w-xl shadow-2xl p-8">
            <header className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-tech text-white uppercase tracking-wider flex items-center gap-3">
                  <IconStore width={20} height={20} className="text-blue-500" />
                  Registro de Producto
               </h3>
               <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                  <IconCheckCircular width={24} height={24} />
               </button>
            </header>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
               <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Nombre del Producto</label>
                  <input type="text" className="w-full input-srf rounded-xl p-4 text-sm" placeholder="Ej: Batería iPhone X" />
               </div>
               <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Código (SKU)</label>
                  <input type="text" className="w-full input-srf rounded-xl p-4 text-sm uppercase" placeholder="BATT-IPX" />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Costo Unitario</label>
                  <input type="number" className="w-full input-srf rounded-xl p-4 text-sm font-tech" placeholder="$0.00" />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Stock Mínimo</label>
                  <input type="number" className="w-full input-srf rounded-xl p-4 text-sm font-tech" placeholder="5" />
               </div>
            </div>

            <div className="flex gap-4">
               <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 text-slate-400 font-tech text-[10px] uppercase py-4 rounded-xl tracking-widest">
                  Cancelar
               </button>
               <button className="flex-[2] btn-naranja font-tech text-xs uppercase py-4 rounded-xl tracking-[0.15em]">
                  Guardar Producto
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
