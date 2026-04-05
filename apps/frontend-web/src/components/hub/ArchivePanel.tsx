"use client";

import React, { useEffect, useState } from "react";
import {
  Archive,
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  Smartphone,
  RotateCcw,
  MoreVertical,
  Download
} from "lucide-react";

interface ArchiveItem {
  id: string;
  tipo: "solicitud" | "cotizacion" | "entrega";
  fecha: string;
  folio: string;
  cliente: string;
  telefono: string;
  detalle: string;
  total: number;
}

const MOCK_ARCHIVE: ArchiveItem[] = [
  { id: "1", tipo: "entrega", fecha: "2026-03-30", folio: "SR-4812", cliente: "Eduardo Torres", telefono: "8115556677", detalle: "iPhone 13 Pro - Batería Original", total: 1540 },
  { id: "2", tipo: "entrega", fecha: "2026-03-29", folio: "SR-4811", cliente: "Brenda Luna", telefono: "8184443322", detalle: "MacBook Air M1 - Limpieza Interna", total: 850 },
  { id: "3", tipo: "cotizacion", fecha: "2026-03-28", folio: "COT-7712", cliente: "Marcos Ruiz", telefono: "8121110099", detalle: "iPad Air 5 - Pantalla Estrellada", total: 4200 },
  { id: "4", tipo: "solicitud", fecha: "2026-03-27", folio: "WEB-9912", cliente: "Ricardo Salinas", telefono: "8100000000", detalle: "Solicitud Web Reparación Laptop", total: 0 },
  { id: "5", tipo: "entrega", fecha: "2026-03-25", folio: "SR-4805", cliente: "Sofia Garcia", telefono: "8199998877", detalle: "Samsung S22 - Centro de Carga", total: 1200 },
];

export default function ArchivePanel() {
  const [items] = useState<ArchiveItem[]>(MOCK_ARCHIVE);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = items.filter((it) => {
    const matchesSearch =
      it.cliente.toLowerCase().includes(search.toLowerCase()) ||
      it.folio.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || it.tipo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[var(--accent-blue)]/10 rounded-[28px] flex items-center justify-center text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 shadow-lg shadow-blue-500/10">
            <Archive size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Archivo Histórico</h1>
            <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              Bitácora universal de movimientos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 px-4 border-r border-white/10 text-white font-bold text-xs">
              <Calendar size={16} className="text-[var(--accent-blue)]" />
              <span>2026-03-01 - 2026-03-31</span>
            </div>
            <button className="px-4 text-[10px] font-black text-[var(--accent-blue)] uppercase tracking-widest hover:underline">
              Cambiar Rango
            </button>
          </div>

          <button className="bg-white/5 hover:bg-white/10 text-white font-bold p-4 rounded-2xl border border-white/10 transition-all shadow-inner">
            <Download size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Localizar por folio, cliente o detalle técnico..."
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-sm font-medium outline-none focus:border-[var(--accent-blue)] transition-all backdrop-blur-3xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          {["all", "solicitud", "cotizacion", "entrega"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={[
                "px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all",
                filterType === t
                  ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-lg shadow-blue-500/20"
                  : "bg-white/5 text-[var(--text-secondary)] border-white/10 hover:text-white",
              ].join(" ")}
            >
              {t === "all"
                ? "Ver Todo"
                : t.replace("solicitud", "Solicitudes").replace("cotizacion", "Cotizaciones").replace("entrega", "Entregados")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-md shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] text-left">
                <th className="px-8 py-6">Evento / Tipo</th>
                <th className="px-8 py-6">Fecha</th>
                <th className="px-8 py-6">Folio / Referencia</th>
                <th className="px-8 py-6">Vinculación</th>
                <th className="px-8 py-6">Concepto / Detalle</th>
                <th className="px-8 py-6 text-right">Inversión</th>
                <th className="px-8 py-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 relative">
              {filtered.map((it) => (
                <tr key={it.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <ArchiveTypeBadge type={it.tipo} />
                  </td>

                  <td className="px-8 py-6 text-xs font-bold text-[var(--text-secondary)]">
                    {it.fecha}
                  </td>

                  <td className="px-8 py-6">
                    <span className="text-xs font-mono font-black text-[var(--accent-blue)] bg-[var(--accent-blue)]/5 px-2 py-1 rounded-lg border border-[var(--accent-blue)]/10">
                      {it.folio}
                    </span>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-[var(--accent-blue)] transition-colors">{it.cliente}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1 italic flex items-center gap-1">
                        <Smartphone size={10} /> {it.telefono}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-6 max-w-xs">
                    <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed italic line-clamp-1 group-hover:text-white transition-colors">
                      "{it.detalle}"
                    </p>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-black text-white tracking-widest">
                      {it.total > 0 ? `$${it.total.toLocaleString()}` : "---"}
                    </span>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white transition-all shadow-inner opacity-0 group-hover:opacity-100">
                        <FileText size={16} />
                      </button>
                      <button className="p-1 rounded-full text-[var(--text-secondary)] hover:text-white transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <RotateCcw size={32} className="animate-spin text-[var(--accent-blue)]" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="text-[var(--text-secondary)] opacity-30 flex justify-center">
              <Archive size={64} />
            </div>
            <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs">
              Sin registros encontrados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ArchiveTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    solicitud: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    cotizacion: "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/20",
    entrega: "text-green-500 bg-green-500/10 border-green-500/20",
  };

  const icons: Record<string, React.ReactNode> = {
    solicitud: <Smartphone size={10} />,
    cotizacion: <FileText size={10} />,
    entrega: <CheckCircle2 size={10} />,
  };

  return (
    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 ${styles[type]}`}>
      {icons[type]} {type}
    </div>
  );
}
