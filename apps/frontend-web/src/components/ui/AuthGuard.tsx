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
      authListener.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <IconMicrochip className="animate-pulse text-[#0066FF]" width={32} height={32}/>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
        <div className="sdmx-card-premium max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <IconWarning width={32} height={32} />
           </div>
           <h2 className="text-xl font-bold text-[#1A202C]">Servicio Suspendido</h2>
           <p className="text-[#4A5568]">{subscriptionError}</p>
           <button 
             onClick={() => window.location.href = "/billing"}
             className="product-button is-primary w-full mt-4"
           >
             Ir a Facturación
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

