/**
 * Base URL REST API (Go, prefix /api/v1).
 *
 * EXPO_PUBLIC_API_URL (di-set lewat .env di root repo untuk dev atau eas.json untuk build)
 * bila ada, jika tidak memakai API production. Untuk dev lokal, isi EXPO_PUBLIC_API_URL
 * dengan alamat API yang bisa dijangkau perangkat (IP laptop, atau 10.0.2.2 di emulator Android).
 */
const PROD_API_URL = 'https://api.sapakerja.com/api/v1';

const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const env = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'preview'),
  apiUrl: explicitUrl || PROD_API_URL,
  requestTimeoutMs: 15000,
} as const;

/**
 * Ubah path media relatif (misal '/uploads/avatars/...') menjadi URL HTTP lengkap
 * agar dapat di-load oleh React Native Image di HP fisik maupun web.
 */
export function getMediaUrl(mediaPath?: string | null): string | null {
  if (!mediaPath) return null;
  if (
    mediaPath.startsWith('http://') ||
    mediaPath.startsWith('https://') ||
    mediaPath.startsWith('data:') ||
    mediaPath.startsWith('file://')
  ) {
    return mediaPath;
  }
  const base = env.apiUrl.replace(/\/api\/v1\/?$/, '');
  const cleanPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
  return `${base}${cleanPath}`;
}
