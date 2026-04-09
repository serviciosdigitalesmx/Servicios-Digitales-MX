"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconMicrochip, IconLock, IconUser, IconArrowLeft } from "../../../components/ui/Icons";

export default function LoginPage() {
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
        body: JSON.stringify({
          email,
          password
        })
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "No se pudo iniciar sesión");
      }

      router.push("/interno");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sdmx-public-container">
      {/* Animated Background Elements */}
      <div className="sdmx-pulse-bg top-left" />
      <div className="sdmx-pulse-bg bottom-right" />
      
      <a href="/" className="sdmx-back-link">
        <IconArrowLeft width={18} height={18} />
        <span>Volver al inicio</span>
      </a>

      <div className="sdmx-auth-header">
        <div className="sdmx-logo-box">
          <IconMicrochip width={40} height={40} style={{ color: "white" }} />
        </div>
        <h1 className="sdmx-h1">
          SR. <span style={{ color: '#0066FF' }}>FIX</span>
        </h1>
        <p className="sdmx-text-slate" style={{ marginTop: '0.75rem', fontWeight: 500 }}>Acceso seguro al ecosistema</p>
      </div>

      <div className="sdmx-auth-card">
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 className="sdmx-h2">Bienvenido de nuevo</h2>
          <p className="sdmx-text-slate" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Ingresa tus credenciales para continuar</p>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && (
            <div className="sdmx-error-box" style={{ marginBottom: '1.5rem' }}>
              <IconLock width={18} height={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <div className="sdmx-input-group">
            <label className="sdmx-input-label">Correo Electrónico</label>
            <div className="sdmx-input-wrapper">
              <IconUser width={20} height={20} className="sdmx-input-icon" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sdmx-input"
                placeholder="ejemplo@taller.com"
                required
              />
            </div>
          </div>

          <div className="sdmx-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="sdmx-input-label" style={{ marginBottom: 0 }}>Contraseña</label>
              <a href="/recovery" className="sdmx-text-link" style={{ fontSize: '0.75rem' }}>¿Olvidaste tu contraseña?</a>
            </div>
            <div className="sdmx-input-wrapper">
              <IconLock width={20} height={20} className="sdmx-input-icon" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="sdmx-input"
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="sdmx-btn-premium"
            style={{ marginTop: '1rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0 : 1 }}>
              Entrar al Panel
            </span>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="sdmx-spinner" />
              </div>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p className="sdmx-text-slate" style={{ fontSize: '0.875rem' }}>
            ¿No tienes cuenta? <a href="/register" className="sdmx-text-link" style={{ color: 'white', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Regístrate ahora</a>
          </p>
        </div>
      </div>

      <div className="sdmx-footer-note">
        Powered by Servicios Digitales MX &copy; 2026
      </div>
    </div>
  );
}
