"use client";

import React, { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { IconMicrochip, IconLock, IconUser, IconArrowLeft } from "../../../components/ui/Icons";

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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      window.location.href = "/hub";
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sdmx-gradient-bg min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(0, 102, 255, 0.1)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" style={{ background: 'rgba(99, 102, 241, 0.1)' }} />
      
      <a href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium z-10">
        <IconArrowLeft width={18} height={18} />
        <span className="hidden sm:inline">Volver al inicio</span>
      </a>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0066FF] to-[#0052CC] rounded-[24px] flex items-center justify-center shadow-[0_8px_30px_rgb(0,102,255,0.4)] mb-6 transform hover:rotate-3 transition-transform duration-500">
            <IconMicrochip width={40} height={40} style={{ color: "white" }} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight text-center">
            SR. <span className="text-[#0066FF]">FIX</span>
          </h1>
          <p className="text-slate-400 mt-3 font-medium">Acceso seguro al ecosistema</p>
        </div>

        <div className="sdmx-auth-card space-y-8 animate-fadeIn">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white text-center">Bienvenido de nuevo</h2>
            <p className="text-slate-500 text-sm text-center">Ingresa tus credenciales para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl text-sm flex items-start gap-3 animate-shake">
                <IconLock width={18} height={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <IconUser width={20} height={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-[#0066FF] transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sdmx-input"
                    style={{ paddingLeft: '3rem' }}
                    placeholder="ejemplo@taller.com"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Contraseña</label>
                  <a href="/recovery" className="text-xs text-[#0066FF] hover:text-[#3385FF] font-bold transition-colors">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <IconLock width={20} height={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-[#0066FF] transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="sdmx-input"
                    style={{ paddingLeft: '3rem' }}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="sdmx-btn-premium"
            >
              <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                Entrar al Panel
              </span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-slate-500 text-sm">
              ¿No tienes cuenta? <a href="/register" className="text-white font-bold hover:text-[#0066FF] transition-colors decoration-[#0066FF]/30 underline underline-offset-4 decoration-2">Regístrate ahora</a>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
          Powered by Servicios Digitales MX &copy; 2026
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
      `}</style>
    </div>
  );
}
