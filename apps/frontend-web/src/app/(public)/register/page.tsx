"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    tenantName: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Usamos la variable de entorno unificada
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5115";
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          planId: "free"
        })
      });

      if (!res.ok) throw new Error("Error en el registro del servidor");
      
      router.push("/login?registered=true");
    } catch (err) {
      alert("Error de conexión: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#111] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Crear Cuenta PRO</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <input placeholder="Nombre completo" className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-orange-600 outline-none" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
          <input placeholder="Nombre de tu taller" className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-orange-600 outline-none" onChange={e => setFormData({...formData, tenantName: e.target.value})} required />
          <input type="email" placeholder="Email profesional" className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-orange-600 outline-none" onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input type="password" placeholder="Contraseña" className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-orange-600 outline-none" onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-xl font-black uppercase transition-all shadow-lg shadow-orange-600/20">
            {loading ? "Iniciando Motores..." : "Registrar Taller"}
          </button>
        </form>
      </div>
    </div>
  );
}
