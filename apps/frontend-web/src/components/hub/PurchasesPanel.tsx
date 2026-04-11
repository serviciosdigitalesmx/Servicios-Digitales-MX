"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Filter, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  RotateCcw,
  Box,
  Send,
  MoreVertical,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface PurchaseOrderItem {
  id: string;
  sku: string;
  producto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  costoUnitario: number;
}

interface PurchaseOrder {
  folio: string;
  fecha: string;
  proveedor: string;
  referencia: string;
  estado: 'borrador' | 'enviada' | 'parcial' | 'recibida' | 'cancelada';
  total: number;
  items: PurchaseOrderItem[];
}

const MOCK_ORDERS: any[] = [];

export default function PurchasesPanel() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const stats = {
    total: orders.length,
    abiertas: orders.filter(o => ['borrador', 'enviada', 'parcial'].includes(o.estado)).length,
    recibidas: orders.filter(o => o.estado === 'recibida').length,
    comprometido: orders.filter(o => o.estado !== 'cancelada').reduce((acc, o) => acc + o.total, 0),
  };

  const filtered = orders.filter(o => 
    o.folio.toLowerCase().includes(search.toLowerCase()) || 
    o.proveedor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl gap-6">
        <div>
          <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Abastecimiento & Compras</h1>
          <p className="text-text-secondary text-sm font-bold uppercase tracking-[0.3em] mt-1">Gestión de cadena de suministro (Supply Chain)</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
           <div className="relative flex-1 min-w-[240px]">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
             <input 
               type="text" 
               placeholder="Buscar orden o proveedor..." 
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm font-medium outline-none focus:border-accent-blue transition-all backdrop-blur-3xl"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <button 
             onClick={() => { setSelected(null); setShowOrderModal(true); }}
             className="bg-accent-blue hover:bg-blue-600 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-3 text-xs uppercase tracking-widest"
           >
              <Plus size={18} /> Nueva OC
           </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Órdenes Totales', value: stats.total, icon: ShoppingCart, color: 'text-white' },
          { label: 'Pendientes / Abiertas', value: stats.abiertas, icon: Clock, color: 'text-accent-orange' },
          { label: 'Órdenes Recibidas', value: stats.recibidas, icon: Truck, color: 'text-green-500' },
          { label: 'Gasto Comprometido', value: `$${stats.comprometido.toLocaleString()}`, icon: DollarSign, color: 'text-accent-blue' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-6 border-white/5 flex items-center justify-between group overflow-hidden">
             <div>
                <div className={cn("text-2xl font-jakarta font-black mb-0.5 transition-all text-white")}>{loading ? '...' : s.value}</div>
                <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{s.label}</div>
             </div>
             <div className={cn("p-3 rounded-2xl bg-white/5 shadow-inner", s.color)}>
                <s.icon size={20} />
             </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-black/40 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-md shadow-2xl relative">
         <div className="overflow-x-auto">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-white/5 text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] text-left">
                     <th className="px-8 py-6">Orden / Fecha</th>
                     <th className="px-8 py-6">Proveedor</th>
                     <th className="px-8 py-6">Referencia</th>
                     <th className="px-8 py-6">Estado</th>
                     <th className="px-8 py-6 text-right">Inversión Total</th>
                     <th className="px-8 py-6">Gestionar</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filtered.map((o) => (
                     <tr key={o.folio} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black font-mono text-accent-blue bg-accent-blue/5 border border-accent-blue/10 px-2 py-0.5 rounded-lg w-fit mb-2">{o.folio}</span>
                              <span className="text-xs font-bold text-text-secondary">{o.fecha}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-sm font-black text-white group-hover:text-accent-blue transition-colors uppercase tracking-tight">{o.proveedor}</span>
                        </td>
                        <td className="px-8 py-6 text-xs text-text-secondary italic">
                           "{o.referencia}"
                        </td>
                        <td className="px-8 py-6">
                           <OCStatusBadge status={o.estado} />
                        </td>
                        <td className="px-8 py-6 text-right">
                           <span className="text-lg font-black text-white tracking-widest">${o.total.toLocaleString()}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => { setSelected(o); setShowOrderModal(true); }}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all shadow-inner"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => { setSelected(o); setShowReceiveModal(true); }}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-green-500 hover:bg-green-500/10 transition-all shadow-inner"
                              >
                                <Box size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modals */}
      {showOrderModal && (
        <OrderModal 
          order={selected} 
          onClose={() => setShowOrderModal(false)} 
        />
      )}

      {showReceiveModal && selected && (
        <ReceiveModal 
          order={selected} 
          onClose={() => setShowReceiveModal(false)} 
        />
      )}
    </div>
  );
}

function OCStatusBadge({ status }: { status: string }) {
  const styles: any = {
    borrador: "text-text-secondary bg-white/5 border-white/10",
    enviada: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
    parcial: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
    recibida: "text-green-500 bg-green-500/10 border-green-500/20",
    cancelada: "text-red-500 bg-red-500/10 border-red-500/20",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border", styles[status])}>
      {status === 'parcial' ? 'P. Recibida' : status}
    </span>
  );
}

function OrderModal({ order, onClose }: { order: PurchaseOrder | null, onClose: () => void }) {
  const [items, setItems] = useState<PurchaseOrderItem[]>(order?.items || [{ id: '1', sku: '', producto: '', cantidadPedida: 1, cantidadRecibida: 0, costoUnitario: 0 }]);

  const addItem = () => setItems([...items, { id: Date.now().toString(), sku: '', producto: '', cantidadPedida: 1, cantidadRecibida: 0, costoUnitario: 0 }]);
  
  const subtotal = items.reduce((acc, it) => acc + (it.cantidadPedida * it.costoUnitario), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#121214] border border-white/10 w-full max-w-6xl rounded-[50px] shadow-3xl overflow-hidden relative flex flex-col scale-in h-[90vh]">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-accent-blue/10 to-transparent">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue border border-accent-blue/20">
                 <ShoppingCart size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-jakarta font-black text-white">{order ? `Editar Orden ${order.folio}` : 'Nueva Orden de Compra'}</h3>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.4em] mt-1 italic">Sincronización con Inventario Global</p>
              </div>
           </div>
           <button onClick={onClose} className="p-4 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-all">
             <X size={28} />
           </button>
        </div>

        <div className="p-12 space-y-12 overflow-y-auto scrollbar-hide flex-1">
           {/* Top Info Grid */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Fecha</label>
                 <input type="date" className="w-full input-srf p-4 font-bold" defaultValue={order?.fecha || new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Proveedor</label>
                 <select className="w-full input-srf p-4" defaultValue={order?.proveedor}>
                    <option>Refas Global</option>
                    <option>Química Pro</option>
                    <option>ChinaDirect</option>
                    <option>Insumos Noroeste</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Referencia</label>
                 <input type="text" className="w-full input-srf p-4" placeholder="Ej: Pedido Stock Mayo" defaultValue={order?.referencia} />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Estado Operativo</label>
                 <select className="w-full input-srf p-4 uppercase font-black tracking-widest text-accent-orange" defaultValue={order?.estado || 'borrador'}>
                    <option value="borrador">BORRADOR</option>
                    <option value="enviada">ENVIADA</option>
                    <option value="parcial">PARCIAL</option>
                    <option value="recibida">RECIBIDA</option>
                    <option value="cancelada">CANCELADA</option>
                 </select>
              </div>
           </div>

           {/* Items Table Section */}
           <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">Lista de Materiales</h4>
                 <button onClick={addItem} className="text-accent-blue text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                    <Plus size={14} /> Agregar Producto
                 </button>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-[32px] overflow-hidden p-6 space-y-4 shadow-inner">
                 <div className="grid grid-cols-12 gap-6 px-4 text-[9px] font-black text-text-secondary uppercase tracking-widest border-b border-white/5 pb-4">
                    <div className="col-span-2">SKU / ID</div>
                    <div className="col-span-5">Producto / Descripción</div>
                    <div className="col-span-2 text-center">Cantidad</div>
                    <div className="col-span-2 text-right">Costo Unit.</div>
                    <div className="col-span-1"></div>
                 </div>

                 {items.map((it, idx) => (
                    <div key={it.id} className="grid grid-cols-12 gap-4 items-center group">
                       <div className="col-span-2">
                          <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white outline-none focus:border-accent-blue" placeholder="SKU-XXXX" defaultValue={it.sku} />
                       </div>
                       <div className="col-span-5">
                          <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-accent-blue" placeholder="Nombre completo del producto" defaultValue={it.producto} />
                       </div>
                       <div className="col-span-2">
                          <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center text-xs font-black text-white outline-none focus:border-accent-blue" defaultValue={it.cantidadPedida} />
                       </div>
                       <div className="col-span-2">
                          <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[10px] font-bold">$</span>
                             <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-8 text-right text-xs font-black text-white outline-none focus:border-accent-blue" defaultValue={it.costoUnitario} />
                          </div>
                       </div>
                       <div className="col-span-1 flex justify-end">
                          <button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Grand Total Footer */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-white/5 p-10 rounded-[40px] border border-white/5 space-y-6 flex flex-col justify-center">
                 <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] leading-relaxed">
                   Al aprobar esta orden, los productos marcados como "recibidos" incrementarán automáticamente el inventario global de la sucursal activa.
                 </p>
                 <div className="flex gap-4">
                    <button className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-text-secondary hover:text-white transition-all shadow-inner">
                       Imprimir OC PDF
                    </button>
                    <button className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-text-secondary hover:text-accent-blue transition-all shadow-inner">
                       Enviar por Email
                    </button>
                 </div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-[40px] p-10 space-y-6 shadow-2xl">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary font-bold uppercase tracking-widest">Subtotal Compra</span>
                    <span className="text-white font-black tracking-widest">${subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary font-bold uppercase tracking-widest">Impuestos (IVA 0%/16%)</span>
                    <span className="text-white font-black tracking-widest">$0.00</span>
                 </div>
                 <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                    <div>
                       <p className="text-[9px] font-black text-accent-blue uppercase tracking-[0.4em] mb-1">Inversión Final</p>
                       <p className="text-4xl font-jakarta font-black text-white tracking-tighter">${subtotal.toLocaleString()}</p>
                    </div>
                    <button className="btn-accent px-8 py-4 flex items-center gap-3">
                       <Send size={18} /> Procesar Orden
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ReceiveModal({ order, onClose }: { order: PurchaseOrder, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#121214] border border-white/10 w-full max-w-4xl rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col scale-in h-[80vh]">
         <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-xl font-jakarta font-black text-white">Recepción de Mercancía: {order.folio}</h3>
            <button onClick={onClose} className="p-3 text-text-secondary hover:text-white transition-all"><X size={24} /></button>
         </div>
         <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
            <div className="bg-accent-orange/5 border border-accent-orange/20 p-6 rounded-3xl flex items-center gap-6">
               <div className="p-3 bg-accent-orange text-white rounded-2xl shadow-lg">
                  <Box size={24} />
               </div>
               <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Paso Final de Logística</p>
                  <p className="text-[10px] text-text-secondary font-medium mt-1 leading-relaxed italic">
                    Confirma las cantidades exactas que llegaron físicamente al almacén. Solo estas cantidades afectarán el stock disponible.
                  </p>
               </div>
            </div>

            <div className="space-y-4">
               {order.items.map((it) => (
                 <div key={it.id} className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-[#1F7EDC]/30 transition-all">
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1">{it.sku}</p>
                       <p className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors">{it.producto}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[9px] font-bold text-text-secondary uppercase">Solicitadas</p>
                       <p className="text-xl font-black text-white">{it.cantidadPedida}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                       <p className="text-[9px] font-bold text-text-secondary uppercase">Recibidas Prev.</p>
                       <p className="text-xl font-black text-white/40">{it.cantidadRecibida}</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-accent-orange uppercase block text-center">Nuevas a Ingresar</label>
                       <input 
                         type="number" 
                         className="w-24 bg-black border border-[#FF6A2A]/40 rounded-xl p-3 text-center text-lg font-black text-white outline-none focus:border-accent-orange transition-all shadow-inner" 
                         placeholder="0"
                       />
                    </div>
                 </div>
               ))}
            </div>
         </div>
         <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
            <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 text-xs uppercase tracking-widest transition-all">Cancelar</button>
            <button className="flex-2 btn-accent py-4 flex items-center justify-center gap-3 shadow-lg shadow-accent-blue/10">
               <CheckCircle2 size={20} /> Finalizar Recepción
            </button>
         </div>
      </div>
    </div>
  );
}
