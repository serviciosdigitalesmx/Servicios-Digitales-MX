"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5115";
        const res = await fetch(`${apiUrl}/api/auth/me`);
        
        if (res.status === 401 || res.status === 404) {
          router.push("/login");
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  if (!authorized) return <div className="p-10 text-center">Cargando sesión segura...</div>;

  return <>{children}</>;
}
