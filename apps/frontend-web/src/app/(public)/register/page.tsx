"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "../../../lib/apiClient";
import { IconMicrochip, IconUser, IconArrowLeft, IconCheckCircular, IconStore, IconLock } from "../../../components/ui/Icons";

const PLAN_COPY: Record<string, { label: string; summary: string }> = {
  "esencial-350": {
    label: 'Plan Esencial: "Adiós al Papel"',
    summary: "Ideal para arrancar con recepción, control técnico y seguimiento digital sin depender de libretas."
  },
  "profesional-650": {
    label: 'Plan Pro: "El Dueño Ausente"',
    summary: "Pensado para delegar mejor, ordenar inventario y controlar gastos sin vivir pegado al mostrador."
  },
  "elite-1200": {
    label: 'Plan Business: "Control Total Multi-Sede"',
    summary: "Para operar varias sucursales con visión global, finanzas y auditoría de alto nivel."
  }
};

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");
  const [resolvedPlan, setResolvedPlan] = useState("");
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [autoRedirectHub, setAutoRedirectHub] = useState(false);

  // Capturar plan de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (planParam) setPlan(planParam);
    else setPlan("esencial-350");
  }, []);

  const [form, setForm] = useState({
    shopName: "",
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });

  const selectedPlanCopy = PLAN_COPY[plan] ?? PLAN_COPY["esencial-350"];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopName: form.shopName,
          shopSlug: form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          planCode: plan,
        }),

      });

      const payload = await response.json();

      if (!response.ok || !payload?.success || !payload?.data?.tenantId) {
        throw new Error(payload?.error?.message || "Error al crear la cuenta");
      }

      setResolvedPlan(plan);
      setConfirmationRequired(true);
      setAutoRedirectHub(false);
      setStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado en el servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRedirectHub || confirmationRequired || step !== 3) return;

    const timer = window.setTimeout(() => {
      window.location.href = "/hub";
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [autoRedirectHub, confirmationRequired, step]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative" style={{ backgroundColor: 'var(--sdmx-bg-deep)' }}>
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse" style={{ background: 'rgba(31, 126, 220, 0.12)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse delay-1000" style={{ background: 'rgba(255, 106, 42, 0.06)' }} />
      
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium z-50 cursor-pointer" style={{ fontFamily: 'var(--font-label)', letterSpacing: '1px', textTransform: 'uppercase' }}>
        <IconArrowLeft width={18} height={18} />
        <span className="hidden sm:inline">Terminal Principal</span>
      </Link>


      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <img
            src="/logo-sdmx-phone-transparent.png"
            alt="Servicios Digitales MX"
            className="mx-auto mb-4 object-contain drop-shadow-[0_4px_10px_rgba(31,126,220,0.1)]"
            style={{ width: '132px', maxWidth: '40vw', height: 'auto' }}
          />
          <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400" style={{ fontFamily: 'var(--font-label)' }}>
            Alta de cuenta
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase" style={{ fontFamily: 'var(--font-tech)' }}>
            CREA TU <span style={{ color: 'var(--sdmx-accent-orange)' }}>CUENTA EMPRESARIAL</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Configura tu negocio y define al administrador principal para comenzar a operar.
          </p>
        </div>

        <div className="flex gap-2 mb-8 px-2">
          <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-[#1F7EDC] shadow-[0_0_15px_rgba(31,126,220,0.6)]' : 'bg-slate-800'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-[#1F7EDC] shadow-[0_0_15px_rgba(31,126,220,0.6)]' : 'bg-slate-800'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${step === 3 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
        </div>

        <div className="sdmx-glass p-8 sm:p-12 rounded-[1.15rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border-white/5 relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(23,31,54,0.92) 0%, rgba(17,24,39,0.88) 100%)' }}>
          <form onSubmit={handleRegister} className="space-y-8">
            
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-tech)' }}>Módulo I: Identidad</h2>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest" style={{ fontFamily: 'var(--font-label)' }}>Datos básicos de tu negocio</p>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" style={{ fontFamily: 'var(--font-label)' }}>Nombre de tu negocio</label>
                    <input 
                      type="text" 
                      value={form.shopName}
                      onChange={(e) => setForm({...form, shopName: e.target.value})}
                      className="w-full rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-[rgba(255,106,42,0.55)] focus:shadow-[0_0_0_4px_rgba(255,106,42,0.10)]"
                      style={{
                        background: 'rgba(18, 26, 46, 0.92)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                      }}
                      placeholder="Ej. Servicio Técnico Villa"
                      required
                    />
                    <div className="mt-3 px-1">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-label)' }}>
                        Slug sugerido: <span style={{ color: 'var(--sdmx-accent-blue)' }}>sdmx.mx/{form.shopName ? form.shopName.toLowerCase().replace(/[^a-z0-9]/g, "-") : 'tu-negocio'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" style={{ fontFamily: 'var(--font-label)' }}>Plan seleccionado</label>
                    <div className="bg-black/30 border border-white/5 rounded-[1.15rem] p-6 flex items-center justify-between group-hover:border-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(18,26,46,0.9) 0%, rgba(14,20,36,0.86) 100%)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1F7EDC]/10 rounded-xl flex items-center justify-center border border-[#1F7EDC]/20">
                          <IconMicrochip width={24} height={24} className="text-[#1F7EDC]" />
                        </div>
                        <div>
                          <p className="font-black text-white uppercase text-base" style={{ fontFamily: 'var(--font-tech)', letterSpacing: '1px' }}>{selectedPlanCopy.label}</p>
                          <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-400">{selectedPlanCopy.summary}</p>
                        </div>
                      </div>
                      <IconCheckCircular width={34} height={34} className="text-[#FF8A3D] drop-shadow-[0_0_12px_rgba(255,138,61,0.3)]" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!form.shopName.trim()}
                  className={`w-full py-5 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] transition-all ${form.shopName.trim() ? 'shadow-[0_14px_30px_rgba(255,106,42,0.28)] hover:shadow-[0_18px_36px_rgba(255,106,42,0.38)] hover:-translate-y-0.5 hover:brightness-110' : 'bg-[rgba(255,255,255,0.03)] text-slate-400 shadow-none cursor-not-allowed'}`}
                  style={{
                    fontFamily: 'var(--font-tech)',
                    background: form.shopName.trim()
                      ? 'linear-gradient(180deg, #FF9B4A 0%, #FF7B2C 18%, #FF6A2A 55%, #E4571E 100%)'
                      : 'rgba(255,255,255,0.03)',
                    border: form.shopName.trim()
                      ? '1px solid rgba(255, 189, 138, 0.35)'
                      : '1px solid rgba(255,106,42,0.32)'
                  }}
                >
                  Siguiente Fase
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-tech)' }}>Módulo II: Administrador</h2>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest" style={{ fontFamily: 'var(--font-label)' }}>Datos de la persona que controlará la cuenta</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl text-[11px] font-bold uppercase tracking-wider animate-shake">
                    No pudimos crear tu cuenta. {error}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" style={{ fontFamily: 'var(--font-label)' }}>Nombre completo</label>
                    <div className="relative">
                      <IconUser width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input 
                        type="text" 
                        value={form.fullName}
                        onChange={(e) => setForm({...form, fullName: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pr-5 text-sm text-white placeholder-slate-700 outline-none focus:border-[#1F7EDC]/50 transition-all font-medium"
                        style={{ paddingLeft: '3.5rem' }}
                        placeholder="Nombre de la persona administradora"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" style={{ fontFamily: 'var(--font-label)' }}>Email Principal</label>
                      <input 
                        type="email" 
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder-slate-700 outline-none focus:border-[#1F7EDC]/50 transition-all"
                        placeholder="nexo@empresa.mx"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" style={{ fontFamily: 'var(--font-label)' }}>WhatsApp</label>
                      <input 
                        type="tel" 
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder-slate-700 outline-none focus:border-[#1F7EDC]/50 transition-all"
                        placeholder="+52 55..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" style={{ fontFamily: 'var(--font-label)' }}>Contraseña maestra</label>
                    <div className="relative">
                      <IconLock width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input 
                        type="password" 
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pr-5 text-sm text-white placeholder-slate-700 outline-none focus:border-[#1F7EDC]/50 transition-all"
                        style={{ paddingLeft: '3.5rem' }}
                        placeholder="••••••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button type="button" onClick={() => setStep(1)} className="px-10 py-4 rounded-xl font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-label)' }}>
                    Volver
                  </button>
                   <button 
                    type="submit" 
                    disabled={loading}
                    className={`flex-1 relative py-5 rounded-2xl bg-gradient-to-r from-[#1F7EDC] to-[#0044CC] text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(31,126,220,0.3)] hover:shadow-[0_20px_40px_rgba(31,126,220,0.5)] transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    <span className={loading ? 'opacity-0' : 'opacity-100'}>Crear mi cuenta</span>
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fadeIn text-center py-6">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] border border-emerald-500/20">
                  <IconCheckCircular width={48} height={48} />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest" style={{ fontFamily: 'var(--font-tech)' }}>CUENTA CREADA</h2>
                  <p className="text-slate-500 mt-3 text-[11px] font-bold uppercase tracking-widest leading-relaxed" style={{ fontFamily: 'var(--font-label)' }}>
                    {confirmationRequired
                      ? "Tu negocio ya quedó registrado. Ahora entra con tu correo principal para comenzar a operar."
                      : "Tu cuenta ya está activa. Redirigiendo al panel principal..."}
                  </p>
                </div>
                
                <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 text-left my-8">
                  <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.25em] mb-4" style={{ fontFamily: 'var(--font-tech)' }}>ENLACE PÚBLICO DE CONSULTA:</p>
                  <div className="flex items-center gap-3 p-4 bg-black/60 rounded-xl border border-white/5">
                    <IconStore width={18} height={18} className="text-[#1F7EDC] shrink-0" />
                    <span className="font-mono text-slate-400 text-[11px] truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/portal?shop=${form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : `/portal?shop=...`}
                    </span>
                  </div>
                </div>

                {confirmationRequired ? (
                  <a
                    href="/login"
                    className="block w-full py-5 rounded-2xl bg-gradient-to-r from-[#1F7EDC] to-[#0044CC] text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(31,126,220,0.3)] hover:shadow-[0_20px_40px_rgba(31,126,220,0.5)] transition-all"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    Identificarse ahora
                  </a>
                ) : (
                  <div className="space-y-4">
                    <button 
                      type="button" 
                      onClick={() => window.location.href = "/hub"}
                      className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#1F7EDC] to-[#0044CC] text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(31,126,220,0.3)] hover:shadow-[0_20px_40px_rgba(31,126,220,0.5)] transition-all"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      Entrar al panel
                    </button>
                    {autoRedirectHub && (
                      <p className="text-[9px] text-[#1F7EDC] uppercase tracking-[0.4em] font-black animate-pulse" style={{ fontFamily: 'var(--font-tech)' }}>
                        Redirigiendo...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          </form>
        </div>

        <div className="mt-12 pb-6 sm:pb-8 text-center">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-label)' }}>
            ¿Ya tienes cuenta? <a href="/login" className="text-white hover:text-[#1F7EDC] transition-colors ml-1 decoration-[#1F7EDC]/20 underline underline-offset-8 decoration-2">Iniciar sesión</a>
          </p>
        </div>
      </div>
    </div>
  );
}
