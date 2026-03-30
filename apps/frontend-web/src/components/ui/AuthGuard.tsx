"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { IconMicrochip } from "./Icons";

export type AuthMeResponse = {
  data: {
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    };
    shop: {
      id: string;
      name: string;
      slug: string;
    };
    subscription: {
      status: string;
      planCode: string;
      operationalAccess: boolean;
    };
  };
};

type AuthContextType = {
  session: AuthMeResponse["data"] | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthMeResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" && input.includes("/api/")) {
        let token = "";
        try {
          const localData = localStorage.getItem("sdmx_session");
          if (localData) {
            const parsed = JSON.parse(localData);
            token = parsed?.token || parsed?.accessToken || "";
          }
        } catch {}
        
        if (token) {
          init = init || {};
          init.headers = {
            ...init.headers,
            "Authorization": `Bearer ${token}`
          };
        }
      }
      return originalFetch(input, init);
    };

    async function verifySession() {
      try {
        const localData = localStorage.getItem("sdmx_session");
        if (!localData) {
          window.location.href = "/login";
          return;
        }

        let parsedToken;
        try {
          const parsed = JSON.parse(localData);
          parsedToken = parsed?.token || parsed?.accessToken;
          if (!parsedToken) throw new Error("Token vacío");
        } catch {
          window.location.href = "/login";
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";
        
        // Timeout para evitar que se quede colgado si el API local no responde
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          cache: "no-store",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${parsedToken}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        
        const json = await res.json();
        
        if (json.success && json.data) {
          setSession(json.data);
          setLoading(false);
        } else {
          throw new Error("Formato de sesión inválido");
        }
      } catch (err) {
        console.error("Fallo de hidratación de sesión, redirigiendo a login:", err);
        // Des-autenticamos proactivamente en caso de corrupción
        localStorage.removeItem("sdmx_session");
        window.location.href = "/login";
      }
    }

    verifySession();

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <IconMicrochip className="animate-pulse text-[#0066FF]" width={32} height={32}/>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
