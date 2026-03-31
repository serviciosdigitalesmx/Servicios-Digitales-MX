"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "../../lib/supabase";
import { IconMicrochip, IconWarning } from "./Icons";

export type AuthMeResponse = {
  user: { id: string; fullName: string; email: string; role: string; branchId: string; };
  shop: { id: string; name: string; slug: string; };
  subscription: { status: string; planCode: string; operationalAccess: boolean; };
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
      async (event, authSession) => {
        if (event === "SIGNED_OUT") {
          setSession(null);
          setLoading(false);
          window.location.href = "/login";
          return;
        }

        if (authSession) {
          try {
            // Fetch profile and subscription details from Supabase
            // This replaces the /api/auth/me call
            const [userRes, tenantRes, subRes] = await Promise.all([
              supabase.from('users').select('*').eq('auth_user_id', authSession.user.id).single(),
              // We need the tenant_id from the user to fetch the tenant
              supabase.from('users').select('tenant_id').eq('auth_user_id', authSession.user.id).single()
                .then((r: any) => r.data ? supabase.from('tenants').select('*').eq('id', r.data.tenant_id).single() : { data: null, error: r.error }),
              supabase.from('subscriptions').select('*').eq('tenant_id', 
                (await supabase.from('users').select('tenant_id').eq('auth_user_id', authSession.user.id).single()).data?.tenant_id
              ).single()
            ]);

            if (userRes.error || tenantRes.error) {
              console.error("Error fetching user context:", userRes.error, tenantRes.error);
            }

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
                fullName: userRes.data?.full_name || "Usuario",
                email: authSession.user.email || "",
                role: userRes.data?.role || "admin",
                branchId: userRes.data?.branch_id || ""
              },
              shop: {
                id: tenantRes.data?.id || "",
                name: tenantRes.data?.name || "Mi Negocio",
                slug: tenantRes.data?.slug || "mi-negocio"
              },
              subscription: {
                status: sub?.status || "active",
                planCode: sub?.plan_code || "starter",
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

