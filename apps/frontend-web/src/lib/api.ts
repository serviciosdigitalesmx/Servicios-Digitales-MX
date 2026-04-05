import { supabase } from "./supabase";

const MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES, delay = BASE_DELAY): Promise<Response> {
  try {
    const res = await fetch(url, options);
    
    // Only retry on transient server errors (500, 502, 503, 504)
    if (retries > 0 && res.status >= 500 && res.status <= 504) {
      console.warn(`⚠️ API Transient Error (${res.status}). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    
    return res;
  } catch (err) {
    // Retry on network/connectivity errors
    if (retries > 0) {
      console.warn(`📡 Network Error. Retrying in ${delay}ms... (${retries} attempts left)`, err);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
}

export async function apiFetch<T>(
  path: string, 
  options: RequestInit = {},
  schema?: { parse: (data: any) => T }
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = path.startsWith("http") ? path : `${baseUrl}${cleanPath}`;

  // Execute with Exponential Backoff
  const res = await fetchWithRetry(fullUrl, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();

  if (schema) {
    try {
      return schema.parse(data);
    } catch (err) {
      console.error("❌ API Schema Validation Failed:", err);
      throw new Error("El servidor devolvió un formato de datos inesperado.");
    }
  }

  return data as T;
}
