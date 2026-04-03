const DEFAULT_BACKEND_API_BASE_URL = "http://localhost:5111";

export type BackendApiResolution = {
  baseUrl: string | null;
  mode: "local-dev" | "explicit-server" | "production-public" | "production-missing";
  source: "API_BASE_URL" | "NEXT_PUBLIC_API_BASE_URL" | "default-local" | "missing-production-config";
  configured: boolean;
};

export function getBackendApiResolution(): BackendApiResolution {
  if (process.env.API_BASE_URL) {
    return {
      baseUrl: process.env.API_BASE_URL.replace(/\/+$/, ""),
      mode: "explicit-server",
      source: "API_BASE_URL",
      configured: true
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      baseUrl: DEFAULT_BACKEND_API_BASE_URL,
      mode: "local-dev",
      source: "default-local",
      configured: true
    };
  }

  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    return {
      baseUrl: null,
      mode: "production-missing",
      source: "missing-production-config",
      configured: false
    };
  }

  return {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, ""),
    mode: "production-public",
    source: "NEXT_PUBLIC_API_BASE_URL",
    configured: true
  };
}

export function getBackendApiBaseUrl() {
  const resolution = getBackendApiResolution();
  if (!resolution.baseUrl) {
    throw new Error("BACKEND_API_URL_NOT_CONFIGURED");
  }

  return resolution.baseUrl;
}

export async function proxyBackendJson(path: string, init?: RequestInit) {
  const resolution = getBackendApiResolution();
  if (!resolution.baseUrl) {
    return {
      ok: false,
      status: 503,
      body: {
        success: false,
        error: {
          code: "BACKEND_API_URL_NOT_CONFIGURED",
          message: "El frontend no tiene configurada la URL del backend para este entorno."
        }
      },
      resolution
    };
  }

  const response = await fetch(`${resolution.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  const rawText = await response.text();
  let parsedBody: any = null;

  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = { raw: rawText };
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsedBody,
    resolution
  };
}
