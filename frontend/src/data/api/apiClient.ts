import { useAuthStore } from '../../stores/authStore';

const BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await useAuthStore.getState().getIdToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    await useAuthStore.getState().signOut();
    throw new Error('認証エラー');
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'APIエラー');
  }

  return json.data;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
