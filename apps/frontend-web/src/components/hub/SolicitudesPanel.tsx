"use client";

import React, { useState, useEffect } from "react";
import { Inbox, Clock, AlertCircle, Phone } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function SolicitudesPanel() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5111";
        const res = await fetch(`${baseUrl}/api/service-requests?pageSize=50`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setSolicitudes(json.data || []);
        }
      } catch (err) {
        console.error("Error cargando solicitudes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitudes();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[var(--text-secondary)] font-medium text-sm animate-pulse">Sincronizando bandeja...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-white/5 border border-white/10 p-8 rounded-[32px] flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Inbox className="text-[var(--accent-blue)]" size={32} />
            Bandeja de Solicitudes
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">Cotizaciones y prospectos entrantes</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-3 rounded-2xl font-black text-xl">
          {solicitudes.length} <span className="text-xs uppercase tracking-widest opacity-80">Total</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solicitudes.map((s) => (
          <div key={s.id} className="bg-black/40 border border-white/5 p-6 rounded-[24px] hover:bg-white/[0.02] hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                {s.folio}
              </span>
              <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1 ${s.urgency === 'urgente' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {s.urgency === 'urgente' ? <AlertCircle size={10} /> : <Clock size={10} />}
                {s.urgency || 'Normal'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{s.customerName}</h3>
            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2 mb-4">
              <Phone size={14} /> {s.customerPhone || "Sin teléfono"}
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{s.deviceType} {s.deviceModel}</p>
              <p className="text-sm text-white line-clamp-2 leading-relaxed">{s.issueDescription}</p>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Hace {Math.max(0, Math.floor((new Date().getTime() - new Date(s.createdAt).getTime()) / (1000 * 3600 * 24)))} días
              </span>
              <span className="text-sm font-black text-green-400">
                ${s.quotedTotal?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        ))}

        {solicitudes.length === 0 && (
          <div className="col-span-full bg-white/5 border border-white/5 border-dashed rounded-[32px] p-12 text-center">
            <Inbox className="mx-auto text-white/20 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">Bandeja Vacía</h3>
            <p className="text-[var(--text-secondary)] text-sm">No hay solicitudes pendientes por revisar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
