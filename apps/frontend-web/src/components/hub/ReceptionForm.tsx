"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Smartphone, 
  Hash, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Camera, 
  ShieldCheck, 
  Database, 
  Power, 
  Smartphone as ScreenIcon,
  Search,
  RotateCcw,
  FileText,
  Save,
  Copy,
  PlusCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ReceptionForm({ onComplete }: { onComplete?: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [folio, setFolio] = useState('');
  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    equipoTipo: '',
    equipoModelo: '',
    equipoFalla: '',
    fechaPromesa: '',
    costo: '',
    notasExtra: '',
    checks: {
      cargador: false,
      pantalla: false,
      prende: false,
      respaldo: false
    }
  });

  useEffect(() => {
    // Default date (today + 3 days)
    const today = new Date();
    today.setDate(today.getDate() + 3);
    setFormData(prev => ({ ...prev, fechaPromesa: today.toISOString().split('T')[0] }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckChange = (id: keyof typeof formData.checks) => {
    setFormData(prev => ({
      ...prev,
      checks: { ...prev.checks, [id]: !prev.checks[id] }
    }));
  };

  const validateStep1 = () => {
    if (!formData.clienteNombre || formData.clienteTelefono.length < 10) return false;
    return true;
  };

  const validateStep2 = () => {
    if (!formData.equipoTipo || !formData.equipoModelo || !formData.equipoFalla || !formData.fechaPromesa) return false;
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call to Supabase or GAS
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFolio('SR-' + Math.floor(Math.random() * 90000 + 10000));
    }, 1500);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto glass-card p-12 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-2xl shadow-green-500/20">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-jakarata font-black text-white mb-2">¡ORDEN REGISTRADA!</h2>
        <p className="text-text-secondary text-sm font-bold uppercase tracking-widest mb-10">El equipo ha sido ingresado al sistema</p>
        
        <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-[32px] p-10 max-w-sm mx-auto mb-10 group transition-all hover:bg-accent-orange/10">
          <span className="block text-[10px] text-accent-orange font-black uppercase tracking-[0.4em] mb-4">Folio de Seguimiento</span>
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

        <button onClick={() => location.reload()} className="btn-accent flex items-center justify-center gap-3 mx-auto">
          <PlusCircle size={18} /> Nueva Orden
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Step Indicator */}
      <div className="flex justify-center">
        <div className="bg-white/5 border border-white/5 px-6 py-3 rounded-full flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                  step === s ? "bg-accent-blue text-white shadow-lg shadow-blue-500/20" : 
                  step > s ? "bg-green-500 text-white" : "bg-white/5 text-text-secondary border border-white/5"
                )}
              >
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 3 && <div className="w-8 h-px bg-white/10" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="glass-card p-10 shadow-2xl relative overflow-hidden">
        {/* Step 1: Customer Info */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
               <label className="text-[10px] font-bold text-accent-blue uppercase tracking-widest flex items-center gap-2">
                 <Hash size={14} /> Cargar desde Folio de Cotización
               </label>
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ej: COT-00001" 
                    className="flex-1 input-srf p-3 text-sm font-mono tracking-widest"
                  />
                  <button className="bg-accent-blue hover:bg-blue-600 p-3 rounded-xl transition-all text-white">
                    <Search size={20} />
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-4">
              <h3 className="text-xl font-jakarta font-extrabold text-white flex items-center gap-3">
                <User size={24} className="text-accent-blue" />
                Datos del Cliente
              </h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Nombre Completo *</label>
                <input id="clienteNombre" value={formData.clienteNombre} onChange={handleInputChange} type="text" className="w-full input-srf" placeholder="Juan Pérez" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">WhatsApp *</label>
                  <input id="clienteTelefono" value={formData.clienteTelefono} onChange={handleInputChange} type="tel" maxLength={10} className="w-full input-srf" placeholder="8112345678" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Email</label>
                  <input id="clienteEmail" value={formData.clienteEmail} onChange={handleInputChange} type="email" className="w-full input-srf" placeholder="cliente@ejemplo.com" />
                </div>
              </div>
            </div>

            <button onClick={handleNext} disabled={!validateStep1()} className="w-full btn-accent flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all mt-10">
              Continuar <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Equipment Info */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
              <h3 className="text-xl font-jakarta font-extrabold text-white flex items-center gap-3">
                <Smartphone size={24} className="text-accent-blue" />
                Detalles del Equipo
              </h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Dispositivo *</label>
                  <select id="equipoTipo" value={formData.equipoTipo} onChange={handleInputChange} className="w-full input-srf appearance-none cursor-pointer">
                    <option value="">Selecciona...</option>
                    <option value="Laptop">Laptop / Notebook</option>
                    <option value="MacBook">MacBook</option>
                    <option value="Surface">Surface</option>
                    <option value="Smartphone">Smartphone</option>
                    <option value="Tablet">Tablet / iPad</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Marca / Modelo *</label>
                  <input id="equipoModelo" value={formData.equipoModelo} onChange={handleInputChange} type="text" className="w-full input-srf" placeholder="Ej: iPhone 15 Pro" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Falla Reportada *</label>
                <textarea id="equipoFalla" value={formData.equipoFalla} onChange={handleInputChange} rows={3} className="w-full input-srf" placeholder="Describe el problema..." />
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent-blue" /> Checklist de Ingreso
              </p>
              <div className="grid grid-cols-2 gap-6">
                 {[
                   { id: 'cargador', label: 'Trae Cargador', icon: Power, color: 'text-amber-500' },
                   { id: 'pantalla', label: 'Pantalla OK', icon: ScreenIcon, color: 'text-blue-500' },
                   { id: 'prende', label: 'Enciende', icon: CheckCircle2, color: 'text-green-500' },
                   { id: 'respaldo', label: 'Con Respaldo', icon: Database, color: 'text-purple-500' }
                 ].map((item) => (
                   <label key={item.id} className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={(formData.checks as any)[item.id]} 
                          onChange={() => handleCheckChange(item.id as any)}
                          className="w-6 h-6 rounded-lg border-2 border-white/10 bg-transparent checked:bg-accent-blue checked:border-accent-blue transition-all appearance-none cursor-pointer" 
                        />
                        {(formData.checks as any)[item.id] && <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white" />}
                      </div>
                      <span className={cn("text-sm font-bold transition-colors", (formData.checks as any)[item.id] ? "text-white" : "text-text-secondary group-hover:text-white/60")}>
                        {item.label}
                      </span>
                   </label>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-accent-orange uppercase tracking-[0.2em] px-1">Fecha Promesa *</label>
                <input id="fechaPromesa" value={formData.fechaPromesa} onChange={handleInputChange} type="date" className="w-full input-srf font-bold text-accent-orange" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Costo Estimado $</label>
                <input id="costo" value={formData.costo} onChange={handleInputChange} type="number" className="w-full input-srf font-bold" placeholder="0.00" />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5">
                <ChevronLeft size={18} /> Atrás
              </button>
              <button onClick={handleNext} disabled={!validateStep2()} className="flex-[2] btn-accent flex items-center justify-center gap-3 disabled:opacity-50 transition-all">
                Revisar Orden <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
              <h3 className="text-xl font-jakarta font-extrabold text-white flex items-center gap-3">
                <ShieldCheck size={24} className="text-accent-blue" />
                Confirmación de Datos
              </h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 space-y-4">
               {[
                 { label: 'Cliente', value: formData.clienteNombre },
                 { label: 'Teléfono', value: formData.clienteTelefono },
                 { label: 'Email', value: formData.clienteEmail || 'No provisto' },
                 { label: 'Equipo', value: `${formData.equipoTipo} - ${formData.equipoModelo}` },
                 { label: 'Reporte', value: formData.equipoFalla, full: true },
                 { label: 'Entrega', value: formData.fechaPromesa, highlight: true },
                 { label: 'Total Estimado', value: `$${parseFloat(formData.costo || '0').toFixed(2)}`, accent: true }
               ].map((row, idx) => (
                 <div key={idx} className={cn("flex justify-between items-start py-1 border-b border-white/5 pb-3 last:border-0 last:pb-0", row.full && "flex-col gap-2")}>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{row.label}</span>
                    <span className={cn(
                      "text-sm font-bold text-white", 
                      row.highlight && "text-accent-orange bg-accent-orange/10 px-3 py-1 rounded-lg",
                      row.accent && "text-xl underline decoration-accent-blue decoration-2 underline-offset-8"
                    )}>
                      {row.value}
                    </span>
                 </div>
               ))}
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="w-full btn-accent py-5 text-sm uppercase tracking-widest flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {loading ? <RotateCcw size={20} className="animate-spin" /> : <><Save size={20} /> Registrar Orden de Servicio</>}
              </button>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setStep(2)} className="bg-white/5 border border-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                    <Hash size={14} /> Corregir
                 </button>
                 <button className="bg-white/5 border border-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                    <FileText size={14} /> Borrador PDF
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
