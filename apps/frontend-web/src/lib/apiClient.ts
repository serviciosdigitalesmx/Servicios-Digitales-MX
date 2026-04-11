/**
 * apiClient.ts
 * Unified HTTP client for the Servicios-Digitales-MX frontend.
 * Handles base URL, auth headers, and common error responses.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5115';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

export type ApiFetchLikeResponse<T> = ApiResponse<T> & {
  ok: boolean;
  status: number;
  json: () => Promise<ApiResponse<T>>;
};

function toFetchLikeResponse<T>(payload: ApiResponse<T>, status: number): ApiFetchLikeResponse<T> {
  return {
    ...payload,
    ok: status >= 200 && status < 300 && !!payload.success,
    status,
    json: async () => payload,
  };
}

/**
 * Core fetch wrapper that handles auth tokens and 401 redirects.
 */
export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiFetchLikeResponse<T>> {
  // 1. Get token from localStorage (sdmx_session is our convention)
  const sessionRaw = typeof window !== 'undefined' ? localStorage.getItem('sdmx_session') : null;
  let token = null;
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw);
      token = session.accessToken;
    } catch (e) {
      console.warn("Failed to parse sdmx_session", e);
    }
  }

  // 2. Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 3. Perform fetch
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 4. Handle 401 Unauthorized
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sdmx_session');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    const result = await response.json().catch(() => ({
      success: response.ok,
      data: undefined,
      error: response.ok
        ? undefined
        : {
            code: "INVALID_JSON",
            message: "La respuesta del servidor no se pudo interpretar.",
          },
    }));

    return toFetchLikeResponse(result as ApiResponse<T>, response.status);
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    return toFetchLikeResponse({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Error de conexión con el servidor',
      },
    }, 500);
  }
}

/**
 * Public fetch (no auth required, no 401 redirect to login)
 */
export async function fetchPublic<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiFetchLikeResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({
      success: response.ok,
      data: undefined,
      error: response.ok
        ? undefined
        : {
            code: "INVALID_JSON",
            message: "La respuesta del servidor no se pudo interpretar.",
          },
    }));

    return toFetchLikeResponse(result as ApiResponse<T>, response.status);
  } catch (error: any) {
    return toFetchLikeResponse({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Servicio no disponible',
      },
    }, 500);
  }
}

/**
 * REST Method Helpers
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    fetchWithAuth<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    fetchWithAuth<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body ? JSON.stringify(body) : undefined 
    }),
    
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    fetchWithAuth<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body ? JSON.stringify(body) : undefined 
    }),
    
  put: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    fetchWithAuth<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body ? JSON.stringify(body) : undefined 
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' }),
};
