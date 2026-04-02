import { supabase } from "./supabase";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sr-fix-backend.onrender.com';

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined" || !supabase) return null;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export async function clearSessionAndRedirect() {
  if (typeof window !== "undefined") {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined" && !endpoint.includes("/api/auth/login")) {
    await clearSessionAndRedirect();
    throw new Error("Sesión expirada o no autorizada");
  }

  return response;
}
