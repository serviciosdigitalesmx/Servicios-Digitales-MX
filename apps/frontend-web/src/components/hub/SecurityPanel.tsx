"use client";

import React, { useState } from "react";
import {
  Shield,
  Users,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";

export default function SecurityPanel() {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-10 pb-12">
      <header className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
        <h1 className="text-3xl font-black text-white">Seguridad & Accesos</h1>
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-2">
          Control de usuarios y permisos
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-black/40 border border-white/10 rounded-[32px] p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Users size={18} /> Usuarios del sistema
          </h3>

          <div className="space-y-4">
            {["Admin", "Técnico", "Recepción"].map((role, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <span className="text-white font-bold">{role}</span>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Activo
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-[32px] p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Key size={18} /> Credenciales
          </h3>

          <div className="space-y-4">
            <input
              type="text"
              value="usuario@ejemplo.com"
              readOnly
              className="w-full input-srf"
            />

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value="**********"
                readOnly
                className="w-full input-srf pr-12"
              />
              <button
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button className="btn-accent w-full flex items-center justify-center gap-2">
              <Lock size={16} /> Cambiar contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
