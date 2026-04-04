export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://sdmx-backend-api.onrender.com";
const SESSION_STORAGE_KEY = "sdmx_session";

type StoredSession = {
  accessToken: string;
  user?: unknown;
  shop?: unknown;
  subscription?: unknown;
};

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSession;
    return typeof parsed?.accessToken === "string" && parsed.accessToken.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function getAuthToken(): Promise<string | null> {
  return getStoredSession()?.accessToken ?? null;
}

export async function clearSessionAndRedirect() {
  if (typeof window !== "undefined") {
    clearStoredSession();
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
