import type { Locale } from '@/lib/types';

// Penentuan bahasa situs publik. Berkas ini sengaja tanpa impor kamus agar aman dipakai komponen klien (LanguageSwitch).

/** Cookie pilihan bahasa manual (diisi pengalih bahasa). Mengalahkan bahasa perangkat. */
export const LOCALE_COOKIE = 'loginrek.lang';

/**
 * Bahasa dari header Accept-Language (bahasa perangkat): Indonesia bila pilihan teratas "id", selain itu English.
 * Tanpa header (crawler/mesin pencari, tautan pratinjau) -> Indonesia, bahasa bawaan situs.
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return 'id';
  const top = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = Number(params.map((p) => p.trim()).find((p) => p.startsWith('q='))?.slice(2));
      return { tag: tag.toLowerCase(), q: Number.isNaN(q) ? 1 : q, index };
    })
    .filter((p) => p.tag && p.tag !== '*' && p.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)[0];
  if (!top) return 'id';
  const primary = top.tag.split('-')[0];
  return primary === 'id' || primary === 'in' ? 'id' : 'en';
}
