"use client";

import React, { useState, useEffect } from "react";
import { 
  IconCheckCircular, 
  IconChevronRight, 
  IconChevronLeft, 
  IconStore, 
  IconDashboard, 
  IconMicrochip,
  IconWallet,
  IconUser
} from "./Icons";

// ----------------------------------------------------------------------
// Props y Estados
// ----------------------------------------------------------------------
interface OperativoNativeProps {
  tenantId: string;
  onSuccess?: (folio: string) => void;
}

export default function OperativoNative({ tenantId, onSuccess }: OperativoNativeProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [folioGenerado, setFolioGenerado] = useState("");
  
  // Form Data
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    equipoTipo: "Smartphone",
    equipoModelo: "",
    falla: "",
    checklist: {
      cargador: false,
      pantalla: true,
      prende: true,
      respaldo: false
    },
    fechaPromesa: "",
    costo: 0,
    notas: ""
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateChecklist = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [field]: value }
    }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    // Simulación de guardado (AQUÍ IRÁ EL FETCH A RENDER POSTERIORMENTE)
    setTimeout(() => {
      const nuevoFolio = "SRF-" + Math.floor(Math.random() * 90000 + 10000);
      setFolioGenerado(nuevoFolio);
      setLoading(false);
      setStep(4);
      if (onSuccess) onSuccess(nuevoFolio);
    }, 1500);
  };

  const resetForm = () => {
    setStep(1);
    setFolioGenerado("");
    setFormData({
      nombre: "",
      telefono: "",
      email: "",
      equipoTipo: "Smartphone",
      equipoModelo: "",
      falla: "",
      checklist: { cargador: false, pantalla: true, prende: true, respaldo: false },
      fechaPromesa: "",
      costo: 0,
      notas: ""
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto operativo-shell-next">
      {/* HEADER DINÁMICO */}
      <header className="mb-8 flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <IconMicrochip width={24} height={24} />
          </div>
          <div>
            <h2 className="text-xl font-tech text-white uppercase tracking-wider">Nueva Orden</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-label font-bold">Recepción Profesional</p>
          </div>
        </div>
      </header>

      {/* INDICADOR DE PASOS (Look Sr-Fix Master) */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-tech text-sm transition-all duration-300 ${step >= 1 ? 'step-active' : 'step-inactive'}`}>1</div>
          <div className={`w-12 h-0.5 transition-all duration-500 ${step >= 2 ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-tech text-sm transition-all duration-300 ${step >= 2 ? 'step-active' : 'step-inactive'}`}>2</div>
          <div className={`w-12 h-0.5 transition-all duration-500 ${step >= 3 ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-tech text-sm transition-all duration-300 ${step >= 3 ? 'step-active' : 'step-inactive'}`}>3</div>
        </div>
      </div>

      {step === 1 && (
        <div className="card-srf p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
          <h3 className="text-lg font-tech text-blue-500 mb-6 uppercase tracking-wider flex items-center gap-2">
            <IconUser width={18} height={18} /> Datos del Cliente
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Nombre Completo *</label>
              <input 
                type="text" 
                value={formData.nombre}
                onChange={e => updateField("nombre", e.target.value)}
                placeholder="Ej: Juan Pérez" 
                className="w-full input-srf rounded-xl p-4 text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">WhatsApp * (10 dígitos)</label>
              <input 
                type="tel" 
                value={formData.telefono}
                onChange={e => updateField("telefono", e.target.value)}
                placeholder="5512345678" 
                className="w-full input-srf rounded-xl p-4 text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Email (Opcional)</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => updateField("email", e.target.value)}
                placeholder="cliente@email.com" 
                className="w-full input-srf rounded-xl p-4 text-sm" 
              />
            </div>
          </div>
          <button 
            disabled={!formData.nombre || !formData.telefono}
            onClick={nextStep} 
            className="btn-naranja w-full font-tech text-xs uppercase tracking-[0.2em] py-4 rounded-xl mt-8 flex items-center justify-center gap-2 disabled:opacity-30"
          >
            Siguiente <IconChevronRight width={14} height={14} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card-srf p-8 animate-in fade-in slide-in-from-right-4 duration-500 shadow-2xl">
          <h3 className="text-lg font-tech text-blue-500 mb-6 uppercase tracking-wider flex items-center gap-2">
            <IconStore width={18} height={18} /> Detalles del Equipo
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Tipo *</label>
                <select 
                  value={formData.equipoTipo}
                  onChange={e => updateField("equipoTipo", e.target.value)}
                  className="w-full input-srf rounded-xl p-4 text-sm outline-none"
                >
                  <option value="Smartphone">Smartphone</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">PC</option>
                  <option value="GPU">GPU</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Marca/Modelo *</label>
                <input 
                  type="text" 
                  value={formData.equipoModelo}
                  onChange={e => updateField("equipoModelo", e.target.value)}
                  placeholder="iPhone 13, Surface..." 
                  className="w-full input-srf rounded-xl p-4 text-sm" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 font-label">Falla Reportada *</label>
              <textarea 
                value={formData.falla}
                onChange={e => updateField("falla", e.target.value)}
                rows={3}
                placeholder="Describe el problema..." 
                className="w-full input-srf rounded-xl p-4 text-sm" 
              />
            </div>
            
            {/* Checklist */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-blue-500/10 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.checklist.cargador} onChange={e => updateChecklist("cargador", e.target.checked)} className="w-5 h-5 rounded border-blue-500 bg-slate-800 accent-orange-500" />
                <span className="text-xs text-slate-400 font-label group-hover:text-white transition-colors">Trae Cargador</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.checklist.pantalla} onChange={e => updateChecklist("pantalla", e.target.checked)} className="w-5 h-5 rounded border-blue-500 bg-slate-800 accent-orange-500" />
                <span className="text-xs text-slate-400 font-label group-hover:text-white transition-colors">Pantalla OK</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={prevStep} className="flex-1 bg-slate-800 text-slate-300 font-tech text-[10px] uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 border border-white/5">
              <IconChevronLeft width={14} height={14} /> Atrás
            </button>
            <button 
              disabled={!formData.equipoModelo || !formData.falla}
              onClick={nextStep} 
              className="flex-[2] btn-naranja font-tech text-xs uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30"
            >
              Confirmar <IconChevronRight width={14} height={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card-srf p-8 animate-in zoom-in-95 duration-500 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-[60px] rounded-full"></div>
          <h3 className="text-lg font-tech text-orange-500 mb-6 uppercase tracking-wider flex items-center gap-2">
            <IconCheckCircular width={18} height={18} /> Resumen Final
          </h3>
          
          <div className="space-y-3 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-white/5 relative z-10">
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label">Cliente:</span>
              <span className="text-sm font-bold text-white font-label">{formData.nombre}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label">Equipo:</span>
              <span className="text-sm font-bold text-white font-label">{formData.equipoModelo} ({formData.equipoTipo})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-label">WhatsApp:</span>
              <span className="text-sm font-bold text-orange-500 font-tech">{formData.telefono}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={prevStep} className="flex-1 bg-slate-800 text-slate-300 font-tech text-[10px] uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 border border-white/5">
              Editar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex-[2] btn-azul font-tech text-xs uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? "Registrando..." : "Crear Orden de Servicio"}
              {!loading && <IconCheckCircular width={14} height={14} />}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <IconCheckCircular width={48} height={48} />
          </div>
          <h2 className="text-3xl font-tech text-white uppercase tracking-wider mb-2">¡Orden Existosa!</h2>
          <p className="text-slate-500 font-label text-sm uppercase tracking-widest mb-8">El equipo ha sido ingresado al sistema</p>
          
          <div className="card-srf p-8 border-orange-500/50 border-2 max-w-sm mx-auto mb-10 shadow-2xl shadow-orange-500/10">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3 font-label">Folio Generado</p>
            <span className="text-4xl font-tech text-white tracking-widest">{folioGenerado}</span>
          </div>

          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <button onClick={resetForm} className="btn-naranja font-tech text-xs uppercase tracking-[0.2em] py-4 rounded-xl">
              Nueva Orden
            </button>
            <button onClick={() => window.open(`https://wa.me/52${formData.telefono}?text=Hola+${formData.nombre.split(' ')[0]},+tu+equipo+${formData.equipoModelo}+ha+sido+recibido.+Folio:+${folioGenerado}`, "_blank")} className="bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 font-tech text-[10px] uppercase tracking-widest py-4 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
              Enviar WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
