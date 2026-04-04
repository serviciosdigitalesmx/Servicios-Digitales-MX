"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { getBackendApiBaseUrl } from "../../lib/backendApi";
import { clearStoredSession, getStoredSession } from "../../lib/apiClient";
import { IconMicrochip, IconWarning } from "./Icons";

export type AuthMeResponse = {
  user: { id: string; fullName: string; email: string; role: string; branchId: string; };
  shop: { id: string; name: string; slug: string; };
  subscription: { 
    status: string; 
    planCode: string; 
    planName: string;
    priceMxn: number;
    billingInterval: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    graceUntil?: string;
    operationalAccess: boolean; 
  };
  lastPayment?: {
    id: string;
    provider: string;
    providerPaymentId: string;
    providerPaymentStatus: string;
    amount?: number;
    paidAt: string;
    payerEmail?: string;
  } | null;
};

type AuthContextType = {
  session: AuthMeResponse | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });
const SUBSCRIPTION_ATTENTION_STATUSES = new Set(["inactive", "past_due"]);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (mounted) {
        setLoading(true);
      }

      const storedSession = getStoredSession();
      if (storedSession?.accessToken) {
        await hydrateProfile(storedSession.accessToken);
      } else {
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    }

    async function hydrateProfile(accessToken: string) {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const baseUrl = getBackendApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error al obtener perfil: ${response.status}`);
        }

        const { data } = await response.json();
        
        if (mounted) {
          setSession(data);
          
          if (SUBSCRIPTION_ATTENTION_STATUSES.has(data.subscription?.status ?? "")) {
            setSubscriptionError("⚠️ Tu suscripción requiere atención. Por favor, realiza tu pago.");
          } else {
            setSubscriptionError(null);
          }
          
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          clearStoredSession();
          setSession(null);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Red de seguridad si se queda pegado
    const timer = setTimeout(() => {
      if (mounted) setShowRetry(true);
    }, 7000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-8 p-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-[#0066FF]/20 blur-[60px] rounded-full animate-pulse"></div>
          <IconMicrochip className="relative animate-spin-slow text-[#0066FF] shadow-[0_0_30px_rgba(0,102,255,0.3)]" width={80} height={80}/>
        </div>
        
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-white text-xl font-black uppercase tracking-[0.2em] opacity-80">Cargando tu panel</h2>
          <p className="text-[#0066FF] text-sm font-bold animate-pulse">Estamos validando tu sesión y preparando tu contexto de trabajo...</p>
        </div>

        {showRetry && (
          <div className="mt-8 animate-fadeIn delay-700">
            <p className="text-slate-500 text-xs mb-4 max-w-xs mx-auto">Si esto tarda demasiado, refresca la vista para volver a sincronizar tu acceso.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all hover:border-[#0066FF]/50"
            >
              Reintentar carga
            </button>
          </div>
        )}
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="sdmx-card-premium max-w-md w-full p-10 text-center flex flex-col items-center gap-6 border-red-500/20 bg-red-500/5">
           <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <IconWarning width={40} height={40} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tight">Acceso Restringido</h2>
             <p className="text-slate-400 mt-2 font-medium">{subscriptionError}</p>
           </div>
           <button 
             onClick={() => window.location.href = "/billing"}
             className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
           >
             Ir a facturación
           </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
