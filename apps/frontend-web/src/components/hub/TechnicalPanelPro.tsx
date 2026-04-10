$(cat << 'INNER_EOF'
"use client";
import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Clock, AlertCircle, CheckCircle2, Boxes, Screwdriver, Eye, X, FileText, Save, MessageSquare, History, ClipboardCheck, Video, Smartphone, ChevronRight } from 'lucide-react';

const MOCK_EQUIPOS = [
  { id: '1', folio: 'SR-4922', cliente: 'Juan Pérez', equipo: 'Laptop ASUS ROG', fechaPromesa: '2026-04-05', estado: 'En Reparación', costo: 1500, falla: 'No enciende, posible corto en tarjeta madre' },
  { id: '2', folio: 'SR-4890', cliente: 'María García', equipo: 'iPhone 15 Pro', fechaPromesa: '2026-04-04', estado: 'En Diagnóstico', costo: 800, falla: 'Pantalla estrellada y no da touch' },
];

export default function TechnicalPanelPro() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[{ label: "Urgentes", value: 3, icon: AlertCircle, color: "text-red-500" },
          { label: "Próximos", value: 5, icon: Clock, color: "text-orange-500" },
          { label: "Listos", value: 8, icon: CheckCircle2, color: "text-green-500" },
          { label: "Total", value: 16, icon: Boxes, color: "text-blue-500" }].map((s, i) => (
          <div key={i} className="bg-[#161B2C]/60 border border-white/5 p-6 rounded-[32px] flex justify-between items-center backdrop-blur-md">
            <div><div className="text-3xl font-black text-white">{s.value}</div><div className={`text-[10px] font-bold uppercase ${s.color}`}>{s.label}</div></div>
            <s.icon size={24} className={s.color} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EQUIPOS.map((item) => (
          <div key={item.id} className="bg-[#161B2C]/40 border border-white/5 p-6 rounded-[32px] hover:scale-[1.02] transition-all group">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-black text-blue-500">{item.folio}</span>
              <span className="text-[10px] font-black text-gray-500 uppercase">{item.estado}</span>
            </div>
            <h3 className="text-lg font-black text-white mb-4">{item.equipo}</h3>
            <p className="text-xs text-gray-400 bg-white/5 p-3 rounded-xl italic mb-6">"{item.falla}"</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all">Ver Detalles</button>
          </div>
        ))}
      </div>
    </div>
  );
}
INNER_EOF
)
