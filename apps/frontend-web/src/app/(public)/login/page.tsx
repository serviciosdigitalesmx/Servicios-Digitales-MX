"use client";

import React, { useState } from "react";
import { API_BASE_URL, saveStoredSession } from "../../../lib/apiClient";
import { IconLock, IconUser, IconArrowLeft } from "../../../components/ui/Icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success || !payload?.data?.accessToken) {
        throw new Error(payload?.error?.message || "Error al iniciar sesión");
      }

      saveStoredSession({
        accessToken: payload.data.accessToken,
        user: payload.data.user,
        shop: payload.data.shop,
        subscription: payload.data.subscription,
      });

      window.location.href = "/hub";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative" style={{ backgroundColor: 'var(--sdmx-bg-deep)' }}>
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(31, 126, 220, 0.15)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse delay-700" style={{ background: 'rgba(255, 106, 42, 0.08)' }} />
      
      <a href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium z-10" style={{ fontFamily: 'var(--font-label)', letterSpacing: '1px', textTransform: 'uppercase' }}>
        <IconArrowLeft width={18} height={18} />
        <span className="hidden sm:inline">Portal Principal</span>
      </a>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center mb-10">
          <img
            src="/logo-sdmx-phone-transparent.png"
            alt="Servicios Digitales MX"
            className="mb-4 object-contain drop-shadow-[0_4px_10px_rgba(31,126,220,0.1)]"
            style={{ width: '140px', maxWidth: '42vw', height: 'auto' }}
          />
          <div className="mb-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400" style={{ fontFamily: 'var(--font-label)' }}>
            Acceso seguro
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest text-center" style={{ fontFamily: 'var(--font-tech)', lineHeight: '1.08' }}>
            <span className="text-white">ENTRA A TU </span>
            <span
              style={{
                color: 'transparent',
                WebkitTextStroke: '1.4px var(--sdmx-accent-orange)',
                textShadow: '0 0 18px rgba(255,106,42,0.12)'
              }}
            >
              CENTRO DE MANDO
            </span>
          </h1>
          <p className="mt-3 max-w-sm text-center text-sm text-slate-400">
            Inicia sesión para continuar con la operación, revisar el estado del negocio y entrar a tus módulos.
          </p>
        </div>

        <div
          className="sdmx-glass p-8 sm:p-10 space-y-8 rounded-[1.15rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] animate-fadeIn"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(23,31,54,0.92) 0%, rgba(17,24,39,0.88) 100%)'
          }}
        >
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white text-center" style={{ fontFamily: 'var(--font-tech)', letterSpacing: '1px' }}>Iniciar sesión</h2>
            <p className="text-slate-500 text-[11px] text-center uppercase tracking-widest" style={{ fontFamily: 'var(--font-label)' }}>Usa tu correo principal y tu contraseña maestra</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl text-xs flex items-start gap-3 animate-shake font-medium">
                <IconLock width={16} height={16} className="shrink-0 mt-0.5 text-red-500" />
                <span>No pudimos iniciar tu sesión. {error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" style={{ fontFamily: 'var(--font-label)' }}>Usuario / Email</label>
                <div className="relative">
                  <IconUser width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1F7EDC] transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl py-3.5 pr-4 text-xs text-white placeholder:text-slate-500 outline-none transition-all focus:border-[rgba(255,106,42,0.55)] focus:shadow-[0_0_0_4px_rgba(255,106,42,0.10)]"
                    style={{
                      paddingLeft: '3rem',
                      background: 'rgba(18, 26, 46, 0.92)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                    }}
                    placeholder="tuempresa@correo.com"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <div className="mb-2 ml-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500" style={{ fontFamily: 'var(--font-label)' }}>Clave de Acceso</label>
                </div>
                <div className="relative">
                  <IconLock width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1F7EDC] transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl py-3.5 pr-4 text-xs text-white placeholder:text-slate-500 outline-none transition-all focus:border-[rgba(255,106,42,0.55)] focus:shadow-[0_0_0_4px_rgba(255,106,42,0.10)]"
                    style={{
                      paddingLeft: '3rem',
                      background: 'rgba(18, 26, 46, 0.92)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                    }}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
                <div className="mt-3 pr-1 text-right">
                  <a href="/recovery" className="text-[10px] text-[#FF8A3D] hover:text-white font-bold transition-colors uppercase tracking-[0.16em] no-underline hover:underline underline-offset-4 decoration-[#FF8A3D]/50" style={{ fontFamily: 'var(--font-label)' }}>Recuperar</a>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative overflow-hidden py-4 rounded-xl text-white text-xs uppercase tracking-[0.2em] shadow-[0_14px_30px_rgba(255,106,42,0.28)] hover:shadow-[0_18px_36px_rgba(255,106,42,0.38)] hover:-translate-y-0.5 hover:brightness-110 transition-all disabled:opacity-50"
              style={{
                fontFamily: 'var(--font-tech)',
                fontWeight: 700,
                background: 'linear-gradient(180deg, #FF9B4A 0%, #FF7B2C 18%, #FF6A2A 55%, #E4571E 100%)',
                border: '1px solid rgba(255, 189, 138, 0.35)'
              }}
            >
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/35 opacity-70" />
              <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                Entrar al panel
              </span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-label)' }}>
              ¿Aún no tienes cuenta? <a href="/register" className="text-white hover:text-[#FF6A2A] transition-colors ml-1 decoration-[#FF6A2A]/20 underline underline-offset-4 decoration-2">Crear nueva cuenta</a>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-600/70 text-[8px] uppercase font-black tracking-[0.24em]" style={{ fontFamily: 'var(--font-tech)' }}>
          Servicios Digitales MX &copy; 2026
        </div>
      </div>
    </div>
  );
}
