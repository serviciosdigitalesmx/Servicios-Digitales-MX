#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
cd "$BASE"

mkdir -p ./src/components/hub

cat > ./src/components/hub/ReceptionForm.tsx <<'TSX'
"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Smartphone,
  Hash,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  Database,
  Power,
  MonitorSmartphone,
  Search,
  Copy,
  PlusCircle
} from "lucide-react";

export default function ReceptionForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [folio, setFolio] = useState("");
  const [formData, setFormData] = useState({
    clienteNombre: "",
    clienteTelefono: "",
    clienteEmail: "",
    equipoTipo: "",
    equipoModelo: "",
    equipoFalla: "",
    fechaPromesa: "",
    costo: "",
    checks: {
      cargador: false,
      pantalla: false,
      prende: false,
      respaldo: false,
    },
  });

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    setFormData((prev) => ({
      ...prev,
      fechaPromesa: today.toISOString().split("T")[0],
    }));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheckChange = (id: keyof typeof formData.checks) => {
    setFormData((prev) => ({
      ...prev,
      checks: { ...prev.checks, [id]: !prev.checks[id] },
    }));
  };

  const validateStep1 = () =>
    !!formData.clienteNombre && formData.clienteTelefono.length >= 10;

  const validateStep2 = () =>
    !!formData.equipoTipo &&
    !!formData.equipoModelo &&
    !!formData.equipoFalla &&
    !!formData.fechaPromesa;

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFolio("SR-" + Math.floor(Math.random() * 90000 + 10000));
    }, 1200);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto glass-card p-12 text-center bg-black/40 border-white/10">
        <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-2xl shadow-green-500/20">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-jakarta font-black text-white mb-2">¡ORDEN REGISTRADA!</h2>
        <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest mb-10">
          El equipo ha sido ingresado al sistema
        </p>

        <div className="bg-[var(--accent-orange)]/5 border border-[var(--accent-orange)]/20 rounded-[32px] p-10 max-w-sm mx-auto mb-10">
          <span className="block text-[10px] text-[var(--accent-orange)] font-black uppercase tracking-[0.4em] mb-4">
            Folio de Seguimiento
          </span>
          <span className="text-5xl font-black text-white tracking-widest font-mono">{folio}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <button className="btn-primary flex items-center justify-center gap-3">
            <Copy size={18} /> Copiar Folio
          </button>
          <button className="bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3">
            <Smartphone size={18} /> WhatsApp
          </button>
        </div>

        <button
          onClick={() => location.reload()}
          className="btn-accent flex items-center justify-center gap-3 mx-auto"
        >
          <PlusCircle size={18} /> Nueva Orden
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-center">
        <div className="bg-white/5 border border-white/5 px-6 py-3 rounded-full flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={[
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                  step === s
                    ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/20"
                    : step > s
                    ? "bg-green-500 text-white"
                    : "bg-white/5 text-[var(--text-secondary)] border border-white/5",
                ].join(" ")}
              >
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 3 && <div className="w-8 h-px bg-white/10" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="glass-card p-10 shadow-2xl relative overflow-hidden bg-black/40 border-white/10">
        {step === 1 && (
          <div className="space-y-8">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
              <label className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest flex items-center gap-2">
                <Hash size={14} /> Cargar desde Folio de Cotización
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: COT-00001"
                  className="flex-1 input-srf p-3 text-sm font-mono tracking-widest"
                />
                <button className="bg-[var(--accent-blue)] hover:bg-blue-600 p-3 rounded-xl transition-all text-white">
                  <Search size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <h3 className="text-xl font-jakarta font-extrabold text-white flex items-center gap-3">
                <User size={24} className="text-[var(--accent-blue)]" />
                Datos del Cliente
              </h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
                  Nombre Completo *
                </label>
                <input
                  id="clienteNombre"
                  value={formData.clienteNombre}
                  onChange={handleInputChange}
                  type="text"
                  className="w-full input-srf"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
                    WhatsApp *
                  </label>
                  <input
                    id="clienteTelefono"
                    value={formData.clienteTelefono}
                    onChange={handleInputChange}
                    type="tel"
                    maxLength={10}
                    className="w-full input-srf"
                    placeholder="8112345678"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
                    Email
                  </label>
                  <input
                    id="clienteEmail"
                    value={formData.clienteEmail}
                    onChange={handleInputChange}
                    type="email"
                    className="w-full input-srf"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!validateStep1()}
              className="w-full btn-accent flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all mt-10"
            >
              Continuar <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-jakarta font-extrabold text-white flex items-center gap-3">
                <Smartphone size={24} className="text-[var(--accent-blue)]" />
                Detalles del Equipo
              </h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
                    Dispositivo *
                  </label>
                  <select
                    id="equipoTipo"
                    value={formData.equipoTipo}
                    onChange={handleInputChange}
                    className="w-full input-srf appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Laptop">Laptop / Notebook</option>
                    <option value="MacBook">MacBook</option>
                    <option value="Smartphone">Smartphone</option>
                    <option value="Tablet">Tablet / iPad</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
                    Marca / Modelo *
                  </label>
                  <input
                    id="equipoModelo"
                    value={formData.equipoModelo}
                    onChange={handleInputChange}
                    type="text"
                    className="w-full input-srf"
                    placeholder="Ej: iPhone 15 Pro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
                  Falla Reportada *
                </label>
                <textarea
                  id="equipoFalla"
                  value={formData.equipoFalla}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full input-srf"
                  placeholder="Describe el problema..."
                />
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[var(--accent-blue)]" /> Checklist de Ingreso
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { id: "cargador", label: "Trae Cargador", icon: Power },
                  { id: "pantalla", label: "Pantalla OK", icon: MonitorSmartphone },
                  { id: "prende", label: "Enciende", icon: CheckCircle2 },
                  { id: "respaldo", label: "Con Respaldo", icon: Database },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={(formData.checks as any)[item.id]}
                        onChange={() => handleCheckChange(item.id as any)}
                        className="w-6 h-6 rounded-lg border-2 border-white/10 bg-transparent checked:bg-[var(--accent-blue)] checked:border-[var(--accent-blue)] transition-all appearance-none cursor-pointer"
                      />
                      {(formData.checks as any)[item.id] && (
                        <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white" />
                      )}
                    </div>
                    <span
                      className={[
                        "text-sm font-bold transition-colors",
                        (formData.checks as any)[item.id]
                          ? "text-white"
                          : "text-[var(--text-secondary)] group-hover:text-white/60",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--accent-orange)] uppercase tracking-[0.2em] px-1">
                  Fecha Promesa *
                </label>
                <input
                  id="fechaPromesa"
                  value={formData.fechaPromesa}
                  onChange={handleInputChange}
                  type="date"
                  className="w-full input-srf font-bold text-[var(--accent-orange)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
                  Costo Estimado $
                </label>
                <input
                  id="costo"
                  value={formData.costo}
                  onChange={handleInputChange}
                  type="number"
                  className="w-full input-srf font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                <ChevronLeft size={18} /> Atrás
              </button>

              <button
                onClick={handleNext}
                disabled={!validateStep2()}
                className="flex-[2] btn-accent flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
              >
                Revisar Orden <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-jakarta font-extrabold text-white flex items-center gap-3">
                <ShieldCheck size={24} className="text-[var(--accent-blue)]" />
                Confirmación de Datos
              </h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 space-y-4">
              {[
                { label: "Cliente", value: formData.clienteNombre },
                { label: "Teléfono", value: formData.clienteTelefono },
                { label: "Email", value: formData.clienteEmail || "No provisto" },
                { label: "Equipo", value: `${formData.equipoTipo} - ${formData.equipoModelo}` },
                { label: "Reporte", value: formData.equipoFalla, full: true },
                { label: "Entrega", value: formData.fechaPromesa, highlight: true },
                {
                  label: "Total Estimado",
                  value: `$${parseFloat(formData.costo || "0").toFixed(2)}`,
                  accent: true,
                },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className={[
                    "flex justify-between items-start py-1 border-b border-white/5 pb-3 last:border-0 last:pb-0",
                    row.full ? "flex-col gap-2" : "",
                  ].join(" ")}
                >
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    {row.label}
                  </span>
                  <span
                    className={[
                      "text-sm font-bold text-white",
                      row.highlight ? "text-[var(--accent-orange)] bg-[var(--accent-orange)]/10 px-3 py-1 rounded-lg" : "",
                      row.accent ? "text-xl underline decoration-[var(--accent-blue)] decoration-2 underline-offset-8" : "",
                    ].join(" ")}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                <ChevronLeft size={18} /> Atrás
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] btn-primary flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Registrar Orden"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
TSX

cat > ./src/components/hub/TechnicalPanel.tsx <<'TSX'
"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Screwdriver,
  Eye,
  X,
  FileText,
  MessageSquare,
  History,
  ClipboardCheck,
  Video,
  Smartphone
} from "lucide-react";

interface Equipment {
  id: string;
  folio: string;
  cliente: string;
  telefono: string;
  equipo: string;
  fechaPromesa: string;
  estado: string;
  costo: number;
  falla: string;
  tecnico?: string;
}

const MOCK_EQUIPOS: Equipment[] = [
  {
    id: "1",
    folio: "SR-4922",
    cliente: "Juan Pérez",
    telefono: "8112345678",
    equipo: "Laptop ASUS ROG",
    fechaPromesa: "2026-04-05",
    estado: "En Reparación",
    costo: 1500,
    falla: "No enciende, posible corto en tarjeta madre",
    tecnico: "Carlos T.",
  },
  {
    id: "2",
    folio: "SR-4890",
    cliente: "María García",
    telefono: "8119876543",
    equipo: "iPhone 15 Pro",
    fechaPromesa: "2026-04-04",
    estado: "En Diagnóstico",
    costo: 800,
    falla: "Pantalla estrellada y no da touch",
    tecnico: "Luis M.",
  },
  {
    id: "3",
    folio: "SR-4875",
    cliente: "Robert De Niro",
    telefono: "8110001112",
    equipo: "MacBook Air M2",
    fechaPromesa: "2026-04-10",
    estado: "Recibido",
    costo: 2200,
    falla: "Limpieza preventiva y cambio de pasta térmica",
  },
  {
    id: "4",
    folio: "SR-4860",
    cliente: "Elon Musk",
    telefono: "8180009000",
    equipo: "Tesla Tablet",
    fechaPromesa: "2026-04-03",
    estado: "Esperando Refacción",
    costo: 4500,
    falla: "Batería inflada",
  },
];

export default function TechnicalPanel() {
  const [items] = useState<Equipment[]>(MOCK_EQUIPOS);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [tab, setTab] = useState<"detalles" | "notas" | "checklist" | "historial">("detalles");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const getKPIs = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const critical = items.filter((i) => {
      const p = new Date(i.fechaPromesa + "T00:00:00");
      const diff = Math.ceil((p.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 1;
    }).length;

    const attention = items.filter((i) => {
      const p = new Date(i.fechaPromesa + "T00:00:00");
      const diff = Math.ceil((p.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 1 && diff <= 3;
    }).length;

    return {
      critical,
      attention,
      total: items.length,
      ready: items.filter((i) => i.estado === "Listo").length,
    };
  };

  const kpis = getKPIs();

  const filteredItems = items.filter(
    (i) =>
      i.folio.toLowerCase().includes(search.toLowerCase()) ||
      i.cliente.toLowerCase().includes(search.toLowerCase()) ||
      i.equipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-extrabold text-white">Taller Técnico Profesional</h1>
          <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mt-1">
            Gestión de diagnósticos y reparaciones
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Buscar orden..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[var(--accent-blue)] transition-all"
            />
          </div>

          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Urgentes / Vencidos", value: kpis.critical, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
          { label: "Atención Próxima", value: kpis.attention, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
          { label: "Listos p/ Entrega", value: kpis.ready, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
          { label: "Total en Taller", value: kpis.total, icon: Boxes, color: "text-[var(--accent-blue)]", bg: "bg-[var(--accent-blue)]/10", border: "border-[var(--accent-blue)]/20" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`border rounded-[32px] p-6 flex items-center justify-between shadow-2xl backdrop-blur-md ${stat.bg} ${stat.border}`}>
              <div>
                <div className="text-3xl font-jakarta font-black text-white mb-1">{loading ? "..." : stat.value}</div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${stat.color}`}>{stat.label}</div>
              </div>
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                <Icon size={28} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <EquipmentCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} />
        ))}
      </div>

      {loading && (
        <div className="py-20 text-center">
          <RotateCcw size={32} className="animate-spin mx-auto text-[var(--accent-blue)] opacity-50" />
          <p className="mt-4 text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest">
            Sincronizando taller...
          </p>
        </div>
      )}

      {selectedItem && (
        <TechnicalModal item={selectedItem} tab={tab} setTab={setTab} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

function EquipmentCard({ item, onOpen }: { item: Equipment; onOpen: () => void }) {
  const getStatusColor = () => {
    switch (item.estado) {
      case "Listo":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "En Reparación":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "En Diagnóstico":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Esperando Refacción":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-white/5 text-[var(--text-secondary)] border-white/10";
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-[32px] p-6 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[10px] font-black text-[var(--accent-blue)] uppercase tracking-widest mb-1">
            {item.folio}
          </div>
          <h3 className="text-lg font-jakarta font-extrabold text-white truncate max-w-[180px]">{item.equipo}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor()}`}>
          {item.estado}
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex justify-between text-xs py-1 border-b border-white/5">
          <span className="text-[var(--text-secondary)]">Cliente</span>
          <span className="text-white font-bold">{item.cliente}</span>
        </div>

        <div className="flex justify-between text-xs py-1 border-b border-white/5">
          <span className="text-[var(--text-secondary)]">Entrega</span>
          <span className="text-[var(--accent-orange)] font-bold font-mono">{item.fechaPromesa}</span>
        </div>

        <div className="pt-2">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-widest mb-2">
            Falla Reportada
          </p>
          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed bg-white/5 p-3 rounded-xl italic">
            "{item.falla}"
          </p>
        </div>
      </div>

      <button
        onClick={onOpen}
        className="w-full bg-white/5 hover:bg-[var(--accent-blue)] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <Eye size={18} /> Ver detalles
      </button>
    </div>
  );
}

function TechnicalModal({
  item,
  tab,
  setTab,
  onClose,
}: {
  item: Equipment;
  tab: "detalles" | "notas" | "checklist" | "historial";
  setTab: (tab: "detalles" | "notas" | "checklist" | "historial") => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-[#121214] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--accent-blue)]/10 rounded-2xl flex items-center justify-center text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 shadow-inner">
              <Screwdriver size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-jakarta font-black text-white">{item.folio}</h3>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em]">
                {item.equipo}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="px-8 pt-4 border-b border-white/5 flex gap-8 overflow-x-auto">
          {[
            { id: "detalles", label: "Detalles", icon: FileText },
            { id: "notas", label: "Notas e Informe", icon: MessageSquare },
            { id: "checklist", label: "Checklist", icon: ClipboardCheck },
            { id: "historial", label: "Cronología", icon: History },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={[
                  "pb-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all border-b-2",
                  tab === t.id
                    ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-white",
                ].join(" ")}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-gradient-to-b from-transparent to-black/20">
          {tab === "detalles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                  <p className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest px-1">
                    Información del Cliente
                  </p>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-bold text-white tracking-tight">{item.cliente}</span>
                    <span className="text-[var(--text-secondary)] flex items-center gap-2 text-sm">
                      <Smartphone size={14} /> {item.telefono}
                    </span>
                  </div>
                  <button className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-[#25D366]/10">
                    <Smartphone size={16} /> WhatsApp de Contacto
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">
                    Control de Estado
                  </p>
                  <select className="w-full input-srf bg-white/5 font-bold cursor-pointer transition-all">
                    <option>Recibido</option>
                    <option>En Diagnóstico</option>
                    <option>En Reparación</option>
                    <option>Esperando Refacción</option>
                    <option>Listo</option>
                    <option>Entregado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">
                    Detalles Técnicos
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-xs text-[var(--text-secondary)]">Fecha Promesa</span>
                      <span className="text-sm font-bold text-[var(--accent-orange)] bg-[var(--accent-orange)]/10 px-2 py-0.5 rounded-lg">
                        {item.fechaPromesa}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-xs text-[var(--text-secondary)]">Presupuesto</span>
                      <span className="text-sm font-bold text-white underline decoration-[var(--accent-blue)] decoration-2 underline-offset-4">
                        ${item.costo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Técnico Asignado</span>
                      <span className="text-sm font-bold text-white">{item.tecnico || "Sin asignar"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">
                    Cámara en Vivo (ID Youtube)
                  </p>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 input-srf p-3 text-sm font-mono" placeholder="v=..." />
                    <button className="bg-red-600/10 hover:bg-red-600/20 text-red-500 p-3 rounded-xl border border-red-500/10 transition-all">
                      <Video size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "notas" && (
            <div className="glass-card p-8 bg-black/30 border-white/10">
              <h4 className="text-xl font-jakarta font-bold text-white mb-4">Notas e Informe Técnico</h4>
              <textarea
                className="w-full input-srf min-h-[220px]"
                defaultValue={`Diagnóstico preliminar para ${item.equipo}.\n\n- Equipo recibido\n- Pendiente revisión profunda\n- Cliente notificado`}
              />
            </div>
          )}

          {tab === "checklist" && (
            <div className="glass-card p-8 bg-black/30 border-white/10">
              <h4 className="text-xl font-jakarta font-bold text-white mb-6">Checklist Técnico</h4>
              <div className="space-y-4">
                {["Revisión visual", "Prueba de encendido", "Diagnóstico de tarjeta", "Cotización emitida"].map((x) => (
                  <label key={x} className="flex items-center gap-3 text-white">
                    <input type="checkbox" className="w-5 h-5" />
                    <span>{x}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === "historial" && (
            <div className="glass-card p-8 bg-black/30 border-white/10">
              <h4 className="text-xl font-jakarta font-bold text-white mb-6">Cronología</h4>
              <div className="space-y-5">
                {[
                  "Orden creada en recepción",
                  "Equipo enviado a diagnóstico",
                  "Técnico asignado",
                  "Cliente pendiente de aprobación",
                ].map((x, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] mt-2" />
                    <div>
                      <p className="text-white">{x}</p>
                      <p className="text-[var(--text-secondary)] text-xs">Hace {i + 1} horas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
TSX

python3 - <<'PY'
from pathlib import Path
p = Path("src/app/(dashboard)/hub/page.tsx")
text = p.read_text()

text = text.replace('import Dashboard from "../../../components/hub/Dashboard";',
                    'import Dashboard from "../../../components/hub/Dashboard";\nimport ReceptionForm from "../../../components/hub/ReceptionForm";\nimport TechnicalPanel from "../../../components/hub/TechnicalPanel";')

text = text.replace('case "recepcion":\n        return <Placeholder title="Recepción" />;',
                    'case "recepcion":\n        return <ReceptionForm />;')

text = text.replace('case "taller":\n        return <Placeholder title="Taller Técnico" />;',
                    'case "taller":\n        return <TechnicalPanel />;')

p.write_text(text)
PY

echo "===== PAGE HUB ACTUALIZADA ====="
sed -n '1,120p' "./src/app/(dashboard)/hub/page.tsx"
echo

rm -rf .next
npm run dev
