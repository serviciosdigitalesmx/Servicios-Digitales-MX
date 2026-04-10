'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { useState } from 'react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { window.location.href = '/interno'; }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#161B2C] border border-blue-500/20 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-8 text-center italic">
          SERVICIOS <span className="text-blue-500">DIGITALES</span> MX
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Usuario / Email" className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white outline-none focus:border-blue-500" required />
          <input type="password" placeholder="Contraseña" className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white outline-none focus:border-blue-500" required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold uppercase transition-all shadow-lg shadow-blue-600/20">
            {loading ? "Sincronizando..." : "ENTRAR AL PANEL"}
          </button>
        </form>
      </div>
    </div>
  );
}
