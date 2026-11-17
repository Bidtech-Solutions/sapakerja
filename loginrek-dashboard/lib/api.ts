// Origin backend. Kosongkan NEXT_PUBLIC_API_URL ("") agar request relatif ke host yang sama (reverse proxy).
// Nilai dibakar ke bundle saat build (variabel berprefix NEXT_PUBLIC_).
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
export const API_BASE = `${API_ORIGIN}/api/v1`;

// Dipicu bila server menolak token (401/403) agar App kembali ke halaman login.
export const AUTH_EXPIRED_EVENT = 'loginrek:auth-expired';

const SESSION_KEYS = [
  'admin_token',
  'admin_user',
  'admin_profile',
  'loginrek_employees_cache',
  'loginrek_attendance_cache',
];

export function clearSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

/**
 * fetch ke REST API dengan header Authorization otomatis.
 * Path relatif terhadap API_BASE, mis. apiFetch('/employees').
 * Respons 401/403 menghapus sesi dan memicu AUTH_EXPIRED_EVENT.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401 || res.status === 403) {
    clearSession();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  return res;
}
