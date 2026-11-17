import en from './en';
import id from './id';
import { SITE_URL } from '@/lib/site';
import type { Dictionary, Locale, SitePath } from '@/lib/types';

const dictionaries: Record<Locale, Dictionary> = { id, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** URL mutlak sebuah halaman. Satu URL untuk semua bahasa: bahasa mengikuti cookie/bahasa perangkat (i18n/server.ts). */
export function absoluteUrl(path: SitePath = '/'): string {
  return `${SITE_URL}${path}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'id' ? 'en' : 'id';
}

/** Isi placeholder {nama} pada teks kamus. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
