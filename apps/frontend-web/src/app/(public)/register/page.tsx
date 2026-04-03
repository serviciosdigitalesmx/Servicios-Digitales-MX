"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { IconMicrochip, IconUser, IconArrowLeft, IconCheckCircular, IconStore, IconLock } from "../../../components/ui/Icons";

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
    else setPlan("esencial");
  }, []);

  const [form, setForm] = useState({
    shopName: "",
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const slug = form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // 1. Sign up user
      let userId = "";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          }
        }
      });

      if (authError) {
        // Si el error es que ya existe, intentamos recuperar el ID si es posible o damos un error claro
        if (authError.message.includes("already registered") || authError.status === 422) {
          // Nota: En un flujo ideal, aquí pediríamos login. 
          // Por ahora, lanzamos un error que pida usar otro correo para no dejar huérfana la cuenta.
          throw new Error("Este correo ya está registrado. Por favor, usa uno diferente o inicia sesión.");
        }
        throw authError;
      }

      if (authData.user) {
        userId = authData.user.id;
      } else {
        throw new Error("No se pudo obtener el ID del usuario.");
      }

      // 2. Initialize Tenant
      const { data: tenantData, error: tenantError } = await supabase.from('tenants').insert({
        name: form.shopName,
        slug: slug,
        contact_name: form.fullName,
        contact_email: form.email,
        contact_phone: form.phone
      }).select().single();

      if (tenantError) {
        throw new Error(`Error creando empresa: ${tenantError.message}`);
      }
      
      const tenantId = tenantData.id;

      // 3. Create Branch
      const { data: branchData, error: branchError } = await supabase.from('branches').insert({
        tenant_id: tenantId,
        name: 'Matriz',
        code: 'MTZ'
      }).select().single();

      if (branchError) {
        throw new Error(`Error creando sucursal: ${branchError.message}`);
      }

      // 4. Create User Profile
      const { error: userError } = await supabase.from('users').insert({
        tenant_id: tenantId,
        branch_id: branchData.id,
        auth_user_id: userId,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        role: 'admin'
      });

      if (userError) {
        throw new Error(`Error creando perfil: ${userError.message}`);
      }

      // 5. Create Subscription
      const { error: subError } = await supabase.from('subscriptions').insert({
        tenant_id: tenantId,
        plan_code: plan,
        status: 'trialing',
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (subError) {
        throw new Error(`Error activando prueba: ${subError.message}`);
      }

      setResolvedPlan(plan);
      setConfirmationRequired(!authData.session);
      setAutoRedirectHub(!!authData.session);
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
    <div className="sdmx-gradient-bg min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse" style={{ background: 'rgba(0, 102, 255, 0.1)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse delay-1000" style={{ background: 'rgba(99, 102, 241, 0.1)' }} />
      
      <a href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium z-10">
        <IconArrowLeft width={18} height={18} />
        <span className="hidden sm:inline">Volver al inicio</span>
      </a>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Crea tu cuenta empresarial</h1>
          <p className="text-slate-400 mt-3 font-medium">Digitaliza tu taller con tecnología de punta</p>
        </div>

        <div className="flex gap-3 mb-8 px-2">
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-[#0066FF] shadow-[0_0_10px_rgb(0,102,255,0.5)]' : 'bg-slate-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[#0066FF] shadow-[0_0_10px_rgb(0,102,255,0.5)]' : 'bg-slate-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step === 3 ? 'bg-emerald-500 shadow-[0_0_10px_rgb(16,185,129,0.5)]' : 'bg-slate-800'}`} />
        </div>

        <div className="sdmx-auth-card relative overflow-hidden">
          
          <form onSubmit={handleRegister} className="space-y-8">
            
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <IconStore width={24} height={24} className="text-[#0066FF]" />
                    </div>
                    Configuración Inicial
                  </h2>
                  <p className="text-slate-500 text-sm">Empecemos con la identidad de tu negocio</p>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Nombre Comercial</label>
                    <input 
                      type="text" 
                      value={form.shopName}
                      onChange={(e) => setForm({...form, shopName: e.target.value})}
                      className="sdmx-input"
                      placeholder="Ej. ElectroFix Pro"
                      required
                    />
                    <div className="mt-3 px-1">
                      <p className="text-[11px] text-slate-500 font-medium">
                        URL personalizada: <span className="text-[#0066FF]">sdmx.app/{form.shopName ? form.shopName.toLowerCase().replace(/[^a-z0-9]/g, "-") : 'tu-taller'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Plan de Lanzamiento</label>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between group-hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0066FF]/20 rounded-xl flex items-center justify-center">
                          <IconMicrochip width={20} height={20} className="text-[#0066FF]" />
                        </div>
                        <div>
                          <p className="font-bold text-white capitalize text-lg">{plan}</p>
                          <p className="text-xs text-slate-500">Prueba gratuita activa (14 días)</p>
                        </div>
                      </div>
                      <IconCheckCircular width={24} height={24} className="text-emerald-500" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="sdmx-btn-premium">
                  Continuar al Acceso
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <IconUser width={24} height={24} className="text-[#0066FF]" />
                    </div>
                    Información del Administrador
                  </h2>
                  <p className="text-slate-500 text-sm">Define quién tendrá el control total</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl text-sm animate-shake">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Nombre Completo</label>
                    <div className="relative">
                      <IconUser width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        value={form.fullName}
                        onChange={(e) => setForm({...form, fullName: e.target.value})}
                        className="sdmx-input"
                        style={{ paddingLeft: '3rem' }}
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Email</label>
                      <input 
                        type="email" 
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className="sdmx-input"
                        placeholder="admin@empresa.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">WhatsApp</label>
                      <input 
                        type="tel" 
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                        className="sdmx-input"
                        placeholder="+52..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Contraseña Maestra</label>
                    <div className="relative">
                      <IconLock width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="password" 
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        className="sdmx-input"
                        style={{ paddingLeft: '3rem' }}
                        placeholder="••••••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button type="button" onClick={() => setStep(1)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                    Atrás
                  </button>
                   <button 
                    type="submit" 
                    disabled={loading}
                    className={`sdmx-btn-premium flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgb(16,185,129,0.2)]">
                  <IconCheckCircular width={48} height={48} />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-white">¡Bienvenido a bordo!</h2>
                  <p className="text-slate-400 mt-2">
                    {confirmationRequired
                      ? "Tu cuenta fue creada. Verifica tu correo electrónico para activar el acceso."
                      : `Tu infraestructura digital está lista para operar. Te llevamos al panel de ${resolvedPlan || "lanzamiento"} en un momento.`}
                  </p>
                </div>
                
                <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 text-left my-8">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-3">Portal público de tracking:</p>
                  <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-white/5">
                    <IconStore width={18} height={18} className="text-[#0066FF] shrink-0" />
                    <span className="font-mono text-slate-300 text-sm truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/portal?shop=${form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : `/portal?shop=...`}
                    </span>
                  </div>
                </div>

                {confirmationRequired ? (
                  <a
                    href="/login"
                    className="block w-full bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white py-5 rounded-2xl font-bold hover:shadow-[0_0_30px_rgb(0,102,255,0.4)] transition-all transform active:scale-95"
                  >
                    Ir a Iniciar Sesión
                  </a>
                ) : (
                  <div className="space-y-3">
                    <button 
                      type="button" 
                      onClick={() => window.location.href = "/hub"}
                      className="w-full bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white py-5 rounded-2xl font-bold hover:shadow-[0_0_30px_rgb(0,102,255,0.4)] transition-all transform active:scale-95"
                    >
                      Ir al Panel de Control
                    </button>
                    {autoRedirectHub && (
                      <p className="text-xs text-slate-500 uppercase tracking-[0.25em] font-bold animate-pulse">
                        Abriendo panel automáticamente...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          </form>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm">
            ¿Ya tienes una empresa registrada? <a href="/login" className="text-white font-bold hover:text-[#0066FF] transition-colors underline underline-offset-4">Inicia Sesión</a>
          </p>
        </div>
      </div>

      <style jsx global>{`
        body { background-color: #0F172A !important; margin: 0; }
        .sdmx-gradient-bg {
          background-color: #0F172A;
          background-image: 
            radial-gradient(circle at 0% 0%, rgba(0, 102, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.15) 0%, transparent 50%);
        }
        .sdmx-auth-card {
          background-color: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2.5rem;
          border-radius: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
        }
        .sdmx-input {
          width: 100%;
          background-color: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          color: white;
          outline: none;
        }
        .sdmx-btn-premium {
          width: 100%;
          padding: 1.25rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #0066FF, #0044CC);
          color: white;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
