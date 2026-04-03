const DEFAULT_BACKEND_API_BASE_URL = "http://localhost:5111";

export type BackendApiResolution = {
  baseUrl: string | null;
  mode: "local-dev" | "explicit-server" | "production-public" | "production-missing";
  source: "API_BASE_URL" | "NEXT_PUBLIC_API_BASE_URL" | "default-local" | "missing-production-config";
  configured: boolean;
};

export type ParsedBackendBody = Record<string, unknown> | { raw: string } | null;

export type BackendProxyResult = {
  ok: boolean;
  status: number;
  body: ParsedBackendBody;
  resolution: BackendApiResolution;
};

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getProxyHeaders(resolution: BackendApiResolution) {
  return {
    "x-sdmx-billing-source": "backend-dotnet-via-next-proxy",
    "x-sdmx-backend-mode": resolution.mode,
    "x-sdmx-backend-source": resolution.source,
    "x-sdmx-backend-configured": String(resolution.configured)
  };
}

async function parseBackendBody(response: Response): Promise<ParsedBackendBody> {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return { raw: rawText };
  }
}

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

export async function proxyBackendJson(path: string, init?: RequestInit): Promise<BackendProxyResult> {
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

  return {
    ok: response.ok,
    status: response.status,
    body: await parseBackendBody(response),
    resolution
  };
}
