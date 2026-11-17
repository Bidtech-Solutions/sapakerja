import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, pickLocale } from './locale';
import type { Locale } from '@/lib/types';

/**
 * Bahasa permintaan ini: pilihan manual (cookie) dulu, lalu bahasa perangkat (Accept-Language), bawaan Indonesia.
 * Membaca cookie/header membuat halaman dirender per permintaan (tidak statis). Di-cache per permintaan.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (saved === 'id' || saved === 'en') return saved;
  return pickLocale((await headers()).get('accept-language'));
});
