"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterBluePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5115";
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "No se pudo completar el registro.");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al crear tu cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#161B2C] border border-blue-500/20 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-8 text-center italic">
          CREAR CUENTA <span className="text-blue-500">PRO</span>
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          <input
            name="fullName"
            placeholder="Nombre completo"
            className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white outline-none focus:border-blue-500"
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Correo"
            className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white outline-none focus:border-blue-500"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            name="password"
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
