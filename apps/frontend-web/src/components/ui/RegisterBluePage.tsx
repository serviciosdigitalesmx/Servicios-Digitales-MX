"use client";

import { useState } from "react";

export function RegisterBluePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      window.location.href = "/interno";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#161B2C] border border-blue-500/20 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-8 text-center italic">
          CREAR CUENTA <span className="text-blue-500">PRO</span>
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Nombre completo"
            className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white outline-none focus:border-blue-500"
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Correo"
            className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white outline-none focus:border-blue-500"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white outline-none focus:border-blue-500"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold uppercase transition-all active:scale-95"
          >
            {loading ? "Sincronizando..." : "Activar Acceso"}
          </button>
        </form>
      </div>
    </div>
  );
}
