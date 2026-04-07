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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115'}/api/auth/register`, {
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
      alert("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Registro Servicios Digitales MX</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <input name="fullName" placeholder="Nombre completo" className="w-full border p-2" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
        <input name="tenantName" placeholder="Nombre de tu taller" className="w-full border p-2" onChange={e => setFormData({...formData, tenantName: e.target.value})} required />
        <input name="email" type="email" placeholder="Email" className="w-full border p-2" onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input name="password" type="password" placeholder="Contraseña" className="w-full border p-2" onChange={e => setFormData({...formData, password: e.target.value})} required />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded">
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>
    </div>
  );
}
