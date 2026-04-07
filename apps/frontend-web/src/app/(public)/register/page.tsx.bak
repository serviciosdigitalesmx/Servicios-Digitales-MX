"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { IconMicrochip, IconUser, IconArrowLeft, IconCheckCircular, IconStore, IconLock } from "../../../components/ui/Icons";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");

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

      if (authError) {
        if (authError.message.includes("already registered") || authError.status === 422) {
          throw new Error("Este correo ya está registrado. Por favor, usa uno diferente o inicia sesión.");
        }
        throw authError;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("No se pudo obtener el ID del usuario.");

      // 2. LLAMADA ATÓMICA AL SISTEMA (RPC)
      const { error: rpcError } = await supabase.rpc('initialize_new_setup', {
        p_user_id: userId,
        p_email: form.email,
        p_full_name: form.fullName,
        p_shop_name: form.shopName,
        p_slug: slug,
        p_phone: form.phone,
        p_plan_code: plan
      });

      if (rpcError) throw new Error(`Error en el servidor: ${rpcError.message}`);

      // 3. LOGIN INMEDIATO
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError || !signInData.session) {
        router.push("/login?registered=true");
        return;
      }

      setStep(3); // Mostrar éxito antes de redirigir si se desea, o redirigir directo
      setTimeout(() => router.push("/hub"), 2000);

    } catch (err: any) {
      setError(err.message || "Error inesperado en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sdmx-public-container">
      {/* Animated Background Elements */}
      <div className="sdmx-pulse-bg top-left" style={{ width: '50%', height: '50%', filter: 'blur(140px)' }} />
      <div className="sdmx-pulse-bg bottom-right" style={{ width: '50%', height: '50%', filter: 'blur(140px)', animationDelay: '1s' }} />
      
      <a href="/" className="sdmx-back-link">
        <IconArrowLeft width={18} height={18} />
        <span>Volver al inicio</span>
      </a>

      <div style={{ width: '100%', maxWidth: '36rem', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="sdmx-h1" style={{ fontSize: '2.5rem' }}>Crea tu cuenta empresarial</h1>
          <p className="sdmx-text-slate" style={{ marginTop: '0.75rem', fontWeight: 500 }}>Digitaliza tu taller con tecnología de punta</p>
        </div>

        <div className="sdmx-step-bar">
          <div className={`sdmx-step-item ${step >= 1 ? 'is-active' : ''}`} />
          <div className={`sdmx-step-item ${step >= 2 ? 'is-active' : ''}`} />
          <div className={`sdmx-step-item ${step === 3 ? 'is-success' : ''}`} />
        </div>

        <div className="sdmx-auth-card" style={{ maxWidth: 'none' }}>
          <form onSubmit={handleRegister}>
            
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className="sdmx-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="sdmx-icon-wrap">
                      <IconStore width={24} height={24} />
                    </div>
                    Configuración Inicial
                  </h2>
                  <p className="sdmx-text-slate" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Empecemos con la identidad de tu negocio</p>
                </div>

                <div className="sdmx-input-group">
                  <label className="sdmx-input-label">Nombre Comercial</label>
                  <input 
                    type="text" 
                    value={form.shopName}
                    onChange={(e) => setForm({...form, shopName: e.target.value})}
                    className="sdmx-input"
                    style={{ paddingLeft: '1.25rem' }}
                    placeholder="Ej. ElectroFix Pro"
                    required
                  />
                  <div style={{ marginTop: '0.75rem', padding: '0 0.25rem' }}>
                    <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                      URL personalizada: <span style={{ color: '#0066FF' }}>sdmx.app/{form.shopName ? form.shopName.toLowerCase().replace(/[^a-z0-9]/g, "-") : 'tu-taller'}</span>
                    </p>
                  </div>
                </div>
                
                <div className="sdmx-input-group">
                  <label className="sdmx-input-label">Plan de Lanzamiento</label>
                  <div className="sdmx-selection-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="sdmx-icon-wrap">
                        <IconMicrochip width={20} height={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: 'white', textTransform: 'capitalize', fontSize: '1.125rem' }}>{plan}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Prueba gratuita activa (14 días)</p>
                      </div>
                    </div>
                    <IconCheckCircular width={24} height={24} style={{ color: '#10b981' }} />
                  </div>
                </div>

                <button type="submit" className="sdmx-btn-premium" style={{ marginTop: '1rem' }}>
                  Continuar al Acceso
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className="sdmx-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="sdmx-icon-wrap">
                      <IconUser width={24} height={24} />
                    </div>
                    Información del Administrador
                  </h2>
                  <p className="sdmx-text-slate" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Define quién tendrá el control total</p>
                </div>

                {error && (
                  <div className="sdmx-error-box" style={{ marginBottom: '1.5rem' }}>
                    <span>{error}</span>
                  </div>
                )}

                <div className="sdmx-input-group">
                  <label className="sdmx-input-label">Nombre Completo</label>
                  <div className="sdmx-input-wrapper">
                    <IconUser width={18} height={18} className="sdmx-input-icon" />
                    <input 
                      type="text" 
                      value={form.fullName}
                      onChange={(e) => setForm({...form, fullName: e.target.value})}
                      className="sdmx-input"
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="sdmx-input-label">Email</label>
                    <input 
                      type="email" 
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className="sdmx-input"
                      style={{ paddingLeft: '1.25rem' }}
                      placeholder="admin@empresa.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="sdmx-input-label">WhatsApp</label>
                    <input 
                      type="tel" 
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      className="sdmx-input"
                      style={{ paddingLeft: '1.25rem' }}
                      placeholder="+52..."
                      required
                    />
                  </div>
                </div>

                <div className="sdmx-input-group">
                  <label className="sdmx-input-label">Contraseña Maestra</label>
                  <div className="sdmx-input-wrapper">
                    <IconLock width={18} height={18} className="sdmx-input-icon" />
                    <input 
                      type="password" 
                      value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      className="sdmx-input"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ padding: '1rem 2rem', borderRadius: '1rem', fontWeight: 700, color: '#94a3b8', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    Atrás
                  </button>
                   <button 
                    type="submit" 
                    disabled={loading}
                    className="sdmx-btn-premium"
                    style={{ flex: 1 }}
                  >
                    <span style={{ opacity: loading ? 0 : 1 }}>Crear mi cuenta</span>
                    {loading && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="sdmx-spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', animation: 'fadeIn 0.5s ease-out' }}>
                <div className="sdmx-success-badge">
                  <IconCheckCircular width={48} height={48} />
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className="sdmx-h2" style={{ fontSize: '1.875rem' }}>¡Bienvenido a bordo!</h2>
                  <p className="sdmx-text-slate" style={{ marginTop: '0.5rem' }}>Tu infraestructura digital está lista para operar</p>
                </div>
                
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--glass-border)', textAlign: 'left', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Portal público de tracking:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#020617', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <IconStore width={18} height={18} style={{ color: '#0066FF', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof window !== 'undefined' ? `${window.location.origin}/portal?shop=${form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : `/portal?shop=...`}
                    </span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => window.location.href = "/hub"}
                  className="sdmx-btn-premium"
                  style={{ padding: '1.25rem' }}
                >
                  Ir al Panel de Control
                </button>
              </div>
            )}

          </form>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p className="sdmx-text-slate" style={{ fontSize: '0.875rem' }}>
            ¿Ya tienes una empresa registrada? <a href="/login" className="sdmx-text-link" style={{ color: 'white', textUnderlineOffset: '4px', textDecoration: 'underline' }}>Inicia Sesión</a>
          </p>
        </div>
      </div>

      <div className="sdmx-footer-note">
        Powered by Servicios Digitales MX &copy; 2026
      </div>
    </div>
  );
}
