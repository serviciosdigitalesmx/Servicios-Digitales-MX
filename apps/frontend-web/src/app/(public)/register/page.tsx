'use client';
import { useState } from 'react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-6">
      <div className="w-full max-auto max-w-md bg-[#161B2C] border border-blue-500/20 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-8 text-center tracking-tighter italic">
          CREAR CUENTA <span className="text-blue-500">PRO</span>
        </h1>
        
        <form className="space-y-4">
          <input name="fullName" placeholder="Nombre completo" className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white focus:border-blue-500 outline-none transition-all" required />
          <input name="email" type="email" placeholder="Correo electrónico" className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white focus:border-blue-500 outline-none transition-all" required />
          <input name="password" type="password" placeholder="Contraseña segura" className="w-full bg-[#1E2538] border border-blue-500/20 p-4 rounded-xl text-white focus:border-blue-500 outline-none transition-all" required />
          
          <button type="button" className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
            {loading ? "Sincronizando..." : "Activar Acceso"}
          </button>
        </form>
      </div>
    </div>
  );
}
