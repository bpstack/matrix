declare global {
  interface Window {
    matrix: {
      apiBase: string;
      platform: string;
      onThemeChange?: (callback: (theme: string) => void) => void;
    };
  }
}

const API_BASE = window.matrix?.apiBase ?? 'http://localhost:3939';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
