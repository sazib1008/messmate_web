/**
 * API Client for MessMate Spring Boot Backend
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface ApiError {
  status: number;
  message: string;
  error?: string;
}

// Determine API endpoint with seamless fallback for Vercel production deployment
const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    if (envUrl.startsWith('http')) {
      return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
    }
    return envUrl;
  }
  // Default to live Render backend in production (e.g. Vercel deployment)
  if (import.meta.env.PROD) {
    return 'https://messmate-backend-nn3j.onrender.com/api';
  }
  return '/api';
};

const BASE_URL = resolveBaseUrl();

export const getAuthToken = (): string | null => {
  return localStorage.getItem('messmate_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('messmate_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('messmate_token');
  localStorage.removeItem('messmate_user');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    // Dispatch custom event so app can react to unauthenticated state
    window.dispatchEvent(new Event('messmate_unauthorized'));
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || 'An unexpected error occurred' };
    }
    const error: ApiError = {
      status: response.status,
      message: errorData.message || errorData.error || 'Server error',
      error: errorData.error,
    };
    throw error;
  }

  // Handle empty bodies (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
