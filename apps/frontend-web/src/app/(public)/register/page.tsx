"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { IconMicrochip, IconUser, IconArrowLeft, IconCheckCircular, IconStore } from "../../../components/ui/Icons";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");
  const [resolvedPlan, setResolvedPlan] = useState("");

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      const userId = authData.user.id;

      // 2. Initialize Tenant, User profile, Branch and Subscription
      // a) Create Tenant
      const { data: tenantData, error: tenantError } = await supabase.from('tenants').insert({
        name: form.shopName,
        slug: slug,
        contact_name: form.fullName,
        contact_email: form.email,
        contact_phone: form.phone
      }).select().single();

      if (tenantError) throw tenantError;
      const tenantId = tenantData.id;

      // b) Create Default Branch
      const { data: branchData, error: branchError } = await supabase.from('branches').insert({
        tenant_id: tenantId,
        name: 'Matriz',
        code: 'MTZ'
      }).select().single();

      if (branchError) throw branchError;

      // c) Create User Profile linked to Tenant and Branch
      const { error: userError } = await supabase.from('users').insert({
        tenant_id: tenantId,
        branch_id: branchData.id,
        auth_user_id: userId,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        role: 'admin'
      });

      if (userError) throw userError;

      // d) Create Subscription
      const { error: subError } = await supabase.from('subscriptions').insert({
        tenant_id: tenantId,
        plan_code: plan,
        status: 'trialing',
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (subError) throw subError;

      setResolvedPlan(plan);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Error de registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
      <a href="/" className="absolute top-6 left-6 flex items-center gap-2 text-[#4A5568] hover:text-[#0066FF] transition font-medium">
        <IconArrowLeft width={18} height={18} />
        Volver al inicio
      </a>

      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A202C]">Crea tu cuenta empresarial</h1>
          <p className="text-[#4A5568] mt-2">Estás a unos pasos de digitalizar tu taller</p>
        </div>

        <div className="flex gap-2 mb-6">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-[#0066FF]' : 'bg-[#E2E8F0]'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-[#0066FF]' : 'bg-[#E2E8F0]'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-[#00A389]' : 'bg-[#E2E8F0]'}`} />
        </div>

        <form onSubmit={handleRegister} className="sdmx-card-premium p-8 space-y-6">
          
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-[#1A202C] flex items-center gap-2">
                <IconStore width={20} height={20} className="text-[#0066FF]" />
                Datos del Negocio
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">Nombre del Taller</label>
                  <input 
                    type="text" 
                    value={form.shopName}
                    onChange={(e) => setForm({...form, shopName: e.target.value})}
                    className="w-full rounded-xl border border-[#E2E8F0] py-3 px-4 text-[#1A202C] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition"
                    placeholder="Ej. ElectroFix GDL"
                    required
                  />
                  <p className="text-xs text-[#718096] mt-2">
                    Tu portal público será: <span className="font-mono text-[#0066FF]">sdmx.app/{form.shopName ? form.shopName.toLowerCase().replace(/[^a-z0-9]/g, "-") : 'taller'}</span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">Plan Seleccionado</label>
                  <div className="bg-[#F0F2F5] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#1A202C] capitalize">{plan}</p>
                      <p className="text-sm text-[#4A5568]">Prueba gratis por 14 días</p>
                    </div>
                    <IconCheckCircular width={24} height={24} className="text-[#00A389]" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#1A202C] text-white py-3 rounded-xl font-bold hover:bg-[#2D3748] transition shadow-sm">
                Siguiente Paso
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-[#1A202C] flex items-center gap-2">
                <IconUser width={20} height={20} className="text-[#0066FF]" />
                Datos de Acceso
              </h2>

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">Tu Nombre Completo</label>
                  <input 
                    type="text" 
                    value={form.fullName}
                    onChange={(e) => setForm({...form, fullName: e.target.value})}
                    className="w-full rounded-xl border border-[#E2E8F0] py-3 px-4 text-[#1A202C] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1A202C] mb-2">Email</label>
                    <input 
                      type="email" 
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className="w-full rounded-xl border border-[#E2E8F0] py-3 px-4 text-[#1A202C] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition"
                      placeholder="admin@empresa.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A202C] mb-2">Teléfono</label>
                    <input 
                      type="tel" 
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      className="w-full rounded-xl border border-[#E2E8F0] py-3 px-4 text-[#1A202C] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition"
                      placeholder="+52..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">Contraseña</label>
                  <input 
                    type="password" 
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    className="w-full rounded-xl border border-[#E2E8F0] py-3 px-4 text-[#1A202C] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-bold text-[#4A5568] hover:bg-[#F0F2F5] transition">
                  Atrás
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition shadow-sm ${loading ? 'bg-[#A0AEC0] cursor-not-allowed' : 'bg-[#0066FF] hover:bg-[#0052CC]'}`}
                >
                  {loading ? "Creando plataforma..." : "Crear mi cuenta"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fadeIn text-center py-4">
              <div className="w-16 h-16 bg-[#00A389]/10 text-[#00A389] rounded-full flex items-center justify-center mx-auto mb-6">
                <IconCheckCircular width={32} height={32} />
              </div>
              
              <h2 className="text-2xl font-bold text-[#1A202C]">¡Negocio Creado Exitosamente!</h2>
              <p className="text-[#4A5568]">
                Tu plataforma está lista. Tu panel está en el <span className="font-bold text-[#1A202C] capitalize">{resolvedPlan || plan}</span>.
              </p>
              
              <div className="bg-[#F0F2F5] p-4 rounded-xl border border-[#E2E8F0] text-left mt-6 mb-8">
                <p className="text-sm text-[#718096] mb-1">El portal público de tu empresa es:</p>
                <div className="flex items-center gap-2 mt-1">
                  <IconStore width={18} height={18} className="text-[#0066FF] flex-shrink-0" />
                  <span className="font-mono text-[#1A202C] font-semibold break-all text-sm">
                    {typeof window !== 'undefined' ? `${window.location.origin}/portal?shop=${form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : `/portal?shop=...`}
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => window.location.href = "/hub"}
                className="w-full bg-[#0066FF] text-white py-4 rounded-xl font-bold hover:bg-[#0052CC] transition shadow-md"
              >
                Entrar a mi Panel de Control
              </button>
            </div>
          )}

        </form>

        <p className="text-center text-[#4A5568] mt-8 text-sm">
          ¿Ya tienes cuenta? <a href="/login" className="text-[#0066FF] font-bold hover:underline">Inicia Sesión</a>
        </p>
      </div>
    </div>
  );
}
