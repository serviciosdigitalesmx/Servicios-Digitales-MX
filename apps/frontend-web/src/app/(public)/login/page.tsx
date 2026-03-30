"use client";

import React, { useState } from "react";
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
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5111';
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Credenciales inválidas");
      }
      
      localStorage.setItem("sdmx_session", JSON.stringify({
        role: data.data.user.Role,
        slug: data.data.shop.Slug,
        name: data.data.shop.Name,
        plan: data.data.subscription?.PlanCode || "profesional",
        token: data.data.accessToken
      }));
      window.location.href = "/hub";
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
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

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-[#0066FF] rounded-xl flex items-center justify-center shadow-lg mb-4">
            <IconMicrochip width={32} height={32} style={{ color: "white" }} />
          </div>
          <h1 className="text-3xl font-bold text-[#1A202C]">
            Servicios Digitales <span className="text-[#0066FF] italic">MX</span>
          </h1>
          <p className="text-[#4A5568] mt-2">Acceso seguro al panel de tu negocio</p>
        </div>

        <form onSubmit={handleLogin} className="sdmx-card-premium p-8 space-y-6">
          <h2 className="text-xl font-bold text-[#1A202C]">Iniciar Sesión</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm flex items-start gap-2">
              <IconLock width={18} height={18} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1A202C] mb-2">Correo Electrónico</label>
              <div className="relative">
                <IconUser width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] py-3 pl-12 pr-4 text-[#1A202C] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition"
                  placeholder="admin@taller.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-[#1A202C]">Contraseña</label>
                <a href="/recovery" className="text-sm text-[#0066FF] hover:underline font-medium">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <IconLock width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] py-3 pl-12 pr-4 text-[#1A202C] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition shadow-sm ${loading ? 'bg-[#A0AEC0] cursor-not-allowed' : 'bg-[#0066FF] hover:bg-[#0052CC]'}`}
          >
            {loading ? "Verificando..." : "Entrar al Panel"}
          </button>
        </form>

        <p className="text-center text-[#4A5568] mt-8 text-sm">
          ¿Aún no tienes cuenta? <a href="/register" className="text-[#0066FF] font-bold hover:underline">Registra tu Taller</a>
        </p>
      </div>
    </div>
  );
}
