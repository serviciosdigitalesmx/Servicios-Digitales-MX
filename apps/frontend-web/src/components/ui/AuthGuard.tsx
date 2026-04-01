"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "../../lib/supabase";
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
  const [session, setSession] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    // Red de seguridad: si tarda más de 5 segundos
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, authSession) => {
        if (_event === "SIGNED_OUT") {
          setSession(null);
          setLoading(false);
          window.location.href = "/login";
          return;
        }

        if (authSession) {
          try {
            // 1. Fetch User Profile
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('auth_user_id', authSession.user.id)
              .single();

            if (userError) throw userError;

            // 2. Fetch Tenant and Subscription in parallel using tenant_id from user
            const [tenantRes, subRes] = await Promise.all([
              supabase.from('tenants').select('*').eq('id', userData.tenant_id).single(),
              supabase.from('subscriptions').select('*').eq('tenant_id', userData.tenant_id).single()
            ]);

            // Simple validation: if subscription is inactive and not in grace period
            const sub = subRes.data;
            const isInactive = sub?.status === 'inactive' || sub?.status === 'past_due';
            
            if (isInactive) {
               setSubscriptionError("⚠️ Tu suscripción ha vencido. Por favor, realiza tu pago para continuar.");
            } else {
               setSubscriptionError(null);
            }

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
          } catch (err) {
            console.error("Context hydration failed:", err);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
          if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
            window.location.href = "/login";
          }
        }
      }
    );

    return () => {
      clearTimeout(timer);
      authListener.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#0066FF] blur-[40px] opacity-20 animate-pulse"></div>
          <IconMicrochip className="relative animate-spin-slow text-[#0066FF]" width={64} height={64}/>
        </div>
        <div className="text-center">
          <p className="text-white font-black text-xl tracking-widest uppercase animate-pulse">Sincronizando</p>
          <p className="text-slate-500 text-xs mt-2 font-medium">Preparando tu entorno de trabajo...</p>
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

