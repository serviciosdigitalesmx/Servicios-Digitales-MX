"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
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

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      console.log("🔐 AuthGuard: Verificando sesión...");
      const { data: { session: authSession } } = await supabase.auth.getSession();

      if (authSession) {
        console.log("✅ AuthGuard: Sesión activa.");
        await hydrateProfile(authSession);
      } else {
        console.log("❌ AuthGuard: Sin sesión.");
        if (mounted) setLoading(false);
      }
    }

    async function hydrateProfile(authSession: any) {
      try {
        // 1. Fetch User Profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authSession.user.id)
          .limit(1) // Aseguramos que solo venga uno
          .maybeSingle(); // No tira error si hay cero, solo regresa null

        if (userError) throw userError;

        if (!userData) {
          console.warn("⚠️ AuthGuard: No se encontró perfil de usuario para ID:", authSession.user.id);
          // Redirigir a setup si el perfil no existe, pero hay sesión auth?
          if (mounted) setLoading(false);
          return;
        }

        // 2. Fetch Tenant and Subscription
        const [tenantRes, subRes] = await Promise.all([
          supabase.from('tenants').select('*').eq('id', userData.tenant_id).single(),
          supabase.from('subscriptions').select('*').eq('tenant_id', userData.tenant_id).single()
        ]);

        const sub = subRes.data;
        if (sub?.status === 'inactive' || sub?.status === 'past_due') {
           setSubscriptionError("⚠️ Tu suscripción requiere atención. Por favor, realiza tu pago.");
        } else {
           setSubscriptionError(null);
        }

        if (mounted) {
          setSession({
            user: {
              id: authSession.user.id,
              fullName: userData?.full_name || "Usuario",
              email: authSession.user.email || "",
              role: userData?.role || "admin",
              branchId: userData?.branch_id || ""
            },
            shop: {
              id: tenantRes.data?.id || "",
              name: tenantRes.data?.name || "Mi Negocio",
              slug: tenantRes.data?.slug || "mi-negocio"
            },
            subscription: {
              status: sub?.status || "active",
              planCode: sub?.plan_code || "starter",
              planName: sub?.plan_name || "Plan Inicial",
              priceMxn: Number(sub?.price_mxn || 350),
              billingInterval: sub?.billing_interval || "monthly",
              currentPeriodStart: sub?.current_period_start,
              currentPeriodEnd: sub?.current_period_end,
              graceUntil: sub?.grace_until,
              operationalAccess: sub?.status === 'active' || sub?.status === 'trialing'
            }
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ AuthGuard Critical Error:", err);
        if (mounted) setLoading(false);
      }
    }

    // Listener para cambios de estado (Login/Logout)
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        console.log(`🔄 AuthGuard Evento: ${event}`);
        if (event === "SIGNED_OUT") {
          setSession(null);
          setLoading(false);
          router.push("/login");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (authSession) await hydrateProfile(authSession);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      authListener.unsubscribe();
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
          <h2 className="text-white text-xl font-black uppercase tracking-[0.2em] opacity-80">Sincronizando Acceso</h2>
          <p className="text-[#0066FF] text-sm font-bold animate-pulse">Verificando credenciales de seguridad...</p>
        </div>
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
             Resolver Facturación
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

