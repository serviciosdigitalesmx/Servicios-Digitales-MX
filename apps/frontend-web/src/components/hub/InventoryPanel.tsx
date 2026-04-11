"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  History as HistoryIcon, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  ShoppingCart, 
  ChevronRight,
  ChevronDown,
  Filter,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Product {
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  stockActual: number;
  stockMinimo: number;
  costo: number;
  precio: number;
  estatus: 'activo' | 'inactivo';
  proveedor?: string;
  alertaNivel?: 'agotado' | 'critico' | 'bajo' | 'normal';
}

const MOCK_PRODUCTS: any[] = [];

export default function InventoryPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const stats = {
    total: products.length,
    alerts: products.filter(p => (p.alertaNivel || 'normal') !== 'normal').length,
    out: products.filter(p => p.stockActual <= 0).length,
    value: products.reduce((acc, p) => acc + (p.stockActual * p.costo), 0)
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-extrabold text-white">Gestión de Inventario</h1>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mt-1">Control de stock y suministros global</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           <div className="relative flex-1 min-w-[200px]">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
             <input 
               type="text" 
               placeholder="Buscar por SKU o nombre..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-accent-blue transition-all"
             />
           </div>
           <button 
             onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
             className="bg-accent-blue hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm"
           >
              <Plus size={18} /> Nuevo Producto
           </button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Productos en Stock", value: stats.total, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Alertas Activas", value: stats.alerts, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Agotados (0)", value: stats.out, icon: X, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Valor Inventario", value: `$${stats.value.toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-black/40 border border-white/10 rounded-[32px] p-6 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md">
            <div className={cn("p-3 rounded-xl w-fit mb-4", stat.bg, stat.color)}>
              <stat.icon size={20} />
            </div>
            <div className="text-2xl font-jakarta font-black text-white mb-1">{loading ? '...' : stat.value}</div>
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Sidebar Alerts */}
        <div className="xl:col-span-1 space-y-6">
           <div className="glass-card p-6 border-white/5 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={16} className="text-accent-orange" /> Stock Crítico
              </h3>
              <div className="space-y-4">
                 {products.filter(p => p.stockActual <= p.stockMinimo).slice(0, 4).map(p => (
                   <div key={p.sku} className="group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-orange/30 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-mono text-accent-orange">{p.sku}</span>
                         <span className={cn(
                           "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                           p.stockActual === 0 ? "bg-red-500 text-white" : "bg-orange-500/20 text-orange-500"
                         )}>
                           {p.stockActual === 0 ? 'Agotado' : 'Crítico'}
                         </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate mb-2">{p.nombre}</p>
                      <div className="flex justify-between items-center text-[10px] text-text-secondary">
                         <span>Actual: {p.stockActual}</span>
                         <span>Mín: {p.stockMinimo}</span>
                      </div>
                   </div>
                 ))}
              </div>
              <button className="w-full text-center text-[10px] font-black text-accent-blue uppercase tracking-widest pt-2 hover:underline">Ver todas las alertas</button>
           </div>
        </div>

        {/* Table View */}
        <div className="xl:col-span-3 space-y-6">
           <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] text-left">
                      <th className="px-6 py-4">SKU / Producto</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4 text-right">Precio</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((p) => (
                      <tr key={p.sku} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-accent-blue">{p.sku}</span>
                            <span className="text-sm font-bold text-white mt-1 group-hover:text-accent-blue transition-colors">{p.nombre}</span>
                            <span className="text-[10px] text-text-secondary font-medium tracking-tight">{p.marca}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-xs font-bold text-text-secondary bg-white/5 px-3 py-1 rounded-full">{p.categoria}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center">
                             <span className={cn("text-sm font-black", p.stockActual <= p.stockMinimo ? "text-accent-orange" : "text-white")}>
                               {p.stockActual}
                             </span>
                             <span className="text-[8px] text-text-secondary uppercase font-bold tracking-widest">Min: {p.stockMinimo}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex flex-col items-end">
                             <span className="text-sm font-bold text-white">${p.precio.toLocaleString()}</span>
                             <span className="text-[10px] text-text-secondary">Costo: ${p.costo}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <StatusBadge level={p.alertaNivel || 'normal'} />
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-text-secondary hover:text-accent-blue hover:bg-accent-blue/10 transition-all shadow-inner">
                               <ArrowRightLeft size={16} />
                             </button>
                             <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 transition-all shadow-inner">
                               <HistoryIcon size={16} />
                             </button>
                             <button 
                               onClick={() => { setSelectedProduct(p); setShowProductModal(true); }}
                               className="p-2 rounded-lg bg-white/5 border border-white/5 text-text-secondary hover:text-accent-orange hover:bg-accent-orange/10 transition-all shadow-inner"
                              >
                               <Edit3 size={16} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
           
           <div className="flex justify-center">
              <button className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2 hover:text-white transition-all py-4">
                Mostrar más productos <ChevronDown size={14} />
              </button>
           </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setShowProductModal(false)} 
        />
      )}
    </div>
  );
}

function StatusBadge({ level }: { level: string }) {
  const config: any = {
    agotado: { label: 'Agotado', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
    critico: { label: 'Crítico', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    bajo: { label: 'Stock Bajo', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    normal: { label: 'Activo', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  };

  const style = config[level] || config.normal;

  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", style.color)}>
      {style.label}
    </span>
  );
}

function ProductModal({ product, onClose }: { product: Product | null, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-[#121214] border border-white/10 w-full max-w-2xl rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col scale-in">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue">
                 <Package size={24} />
              </div>
              <h3 className="text-2xl font-jakarta font-black text-white">
                {product ? `Editar ${product.sku}` : 'Nuevo Producto'}
              </h3>
           </div>
           <button onClick={onClose} className="text-text-secondary hover:text-white transition-all">
             <X size={24} />
           </button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] scrollbar-hide">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">SKU / Identificador</label>
                <input type="text" defaultValue={product?.sku} className="w-full input-srf p-3 font-mono font-bold text-accent-blue" placeholder="Ej: DIS-001" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Nombre Comercial</label>
                <input type="text" defaultValue={product?.nombre} className="w-full input-srf p-3" placeholder="Pantalla iPhone..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Categoría</label>
                <select className="w-full input-srf p-3 appearance-none cursor-pointer">
                  <option>Refacciones</option>
                  <option>Accesorios</option>
                  <option>Baterías</option>
                  <option>Cargadores</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Marca</label>
                <input type="text" defaultValue={product?.marca} className="w-full input-srf p-3" placeholder="Ej: Apple" />
              </div>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-white/5 p-8 rounded-3xl border border-white/5">
              <div className="space-y-2">
                <label className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Stock Act.</label>
                <input type="number" defaultValue={product?.stockActual} className="w-full bg-transparent border-b border-white/10 text-xl font-bold text-white p-1 outline-none focus:border-accent-blue" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Stock Mín.</label>
                <input type="number" defaultValue={product?.stockMinimo} className="w-full bg-transparent border-b border-white/10 text-xl font-bold text-white p-1 outline-none focus:border-accent-blue" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Costo $</label>
                <input type="number" defaultValue={product?.costo} className="w-full bg-transparent border-b border-white/10 text-xl font-bold text-white p-1 outline-none focus:border-accent-blue" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Precio $</label>
                <input type="number" defaultValue={product?.precio} className="w-full bg-transparent border-b border-white/10 text-xl font-bold text-accent-blue p-1 outline-none focus:border-accent-blue" />
              </div>
           </div>
        </div>

        <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
           <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/5 text-xs uppercase tracking-widest">
             Descartar
           </button>
           <button className="flex-2 btn-accent py-4 flex items-center justify-center gap-3">
             <Save size={20} /> Guardar Cambios
           </button>
        </div>
      </div>
    </div>
  );
}
