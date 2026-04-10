"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconLock, IconMicrochip, IconUser } from "./Icons";

export function LoginBluePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5115";
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "No se pudo iniciar sesión");
      }

      router.push("/hub");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white flex items-center justify-center p-6">
      <a href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
        <IconArrowLeft width={18} height={18} />
        <span>Volver al inicio</span>
      </a>

      <div className="w-full max-w-md bg-[#161B2C] border border-blue-500/20 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <IconMicrochip width={28} height={28} style={{ color: "white" }} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tight">
            SERVICIOS <span className="text-blue-500">DIGITALES</span> MX
          </h1>
          <p className="text-slate-300 mt-3">Acceso seguro al ecosistema azul premium</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex items-center gap-3">
              <IconLock width={16} height={16} />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="relative">
            <IconUser width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1E2538] border border-blue-500/20 p-4 pl-12 rounded-xl text-white outline-none focus:border-blue-500"
              placeholder="ejemplo@taller.com"
              required
            />
          </div>

          <div className="relative">
            <IconLock width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1E2538] border border-blue-500/20 p-4 pl-12 rounded-xl text-white outline-none focus:border-blue-500"
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold uppercase transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            {loading ? "Sincronizando..." : "Entrar al Panel"}
          </button>
        </form>

        <p className="text-slate-300 text-sm text-center mt-6">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-blue-300 underline underline-offset-4 hover:text-white">
            Regístrate ahora
          </a>
        </p>
      </div>
    </div>
  );
}
