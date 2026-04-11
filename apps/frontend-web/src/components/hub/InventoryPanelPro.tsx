$(cat << 'INNER_EOF'
"use client";
import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, DollarSign, AlertTriangle, X } from 'lucide-react';

const MOCK_PRODUCTS = [];

export default function InventoryPanelPro() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 700); }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[{ label: "Productos", value: 145, icon: Package, color: "text-blue-500" },
          { label: "Alertas", value: 12, icon: AlertTriangle, color: "text-orange-500" },
          { label: "Agotados", value: 4, icon: X, color: "text-red-500" },
          { label: "Valor", value: "$42K", icon: DollarSign, color: "text-green-500" }].map((s, i) => (
          <div key={i} className="bg-[#161B2C]/60 border border-white/5 p-6 rounded-[32px] flex justify-between items-center backdrop-blur-md">
            <div><div className="text-3xl font-black text-white">{s.value}</div><div className={`text-[10px] font-bold uppercase ${s.color}`}>{s.label}</div></div>
            <s.icon size={24} className={s.color} />
          </div>
        ))}
      </div>
      <div className="bg-[#161B2C]/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Precio</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MOCK_PRODUCTS.map((p) => (
              <tr key={p.sku} className="group hover:bg-white/[0.02]">
                <td className="px-6 py-4"><span className="text-xs font-mono text-blue-500">{p.sku}</span><br/><span className="text-sm font-bold text-white">{p.nombre}</span></td>
                <td className="px-6 py-4 text-white font-bold">{p.stock}</td>
                <td className="px-6 py-4 text-white font-black">${p.precio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
INNER_EOF
)
