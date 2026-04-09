"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type AuthMeResponse = {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    branchId?: string | null;
  };
  shop: {
    id: string;
    name: string;
    slug: string;
    legalName?: string | null;
    address?: string | null;
    phone?: string | null;
    supportEmail?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  };
  subscription: {
    status: string;
    planCode: string;
    planName: string;
    priceMxn: number;
    billingInterval: string;
    operationalAccess: boolean;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    graceUntil?: string;
  };
  lastPayment?: any;
};

type AuthEnvelope =
  | AuthMeResponse
  | {
      success?: boolean;
      data?: AuthMeResponse;
      error?: {
        code?: string;
        message?: string;
      };
    };

type AuthContextType = {
  session: AuthMeResponse | null;
  user: AuthMeResponse["user"] | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

function extractSession(payload: AuthEnvelope): AuthMeResponse | null {
  if (!payload || typeof payload !== "object") return null;

  // Shape nuevo: { success, data }
  if ("data" in payload && payload.data?.user && payload.data?.shop && payload.data?.subscription) {
    return payload.data;
  }

  // Shape legado: sesión directa
  if ("user" in payload && "shop" in payload && "subscription" in payload) {
    return payload as AuthMeResponse;
  }

  return null;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5115";
        const res = await fetch(`${apiUrl}/api/auth/me`);

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const payload: AuthEnvelope = await res.json();
        const parsedSession = extractSession(payload);

        if (parsedSession) {
          setSession(parsedSession);
        } else {
          console.error("Auth payload inválido:", payload);
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const value = {
    session,
    user: session?.user ?? null,
    loading
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Iniciando sesión segura...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {session ? children : null}
    </AuthContext.Provider>
  );
}
