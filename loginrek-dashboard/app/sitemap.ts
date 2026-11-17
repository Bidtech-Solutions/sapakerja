import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/i18n';
import { CONTENT_UPDATED } from '@/lib/site';
import type { SitePath } from '@/lib/types';

const PAGES: { path: SitePath; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/privacy', priority: 0.4 },
];

// Satu URL per halaman: bahasa mengikuti perangkat pengunjung, jadi tidak ada alternates hreflang.
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({
    url: absoluteUrl(path),
    lastModified: CONTENT_UPDATED,
    changeFrequency: path === '/' ? ('monthly' as const) : ('yearly' as const),
    priority,
  }));
}
