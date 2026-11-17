import type { Metadata } from 'next';
import { BRAND, GSC_VERIFICATION, SITE_URL } from './site';
import { absoluteUrl, getDictionary, otherLocale } from '@/i18n';
import type { Locale, SitePath } from '@/lib/types';

/** Metadata dasar situs pada satu bahasa (dasar bagi pageMetadata; tidak dipakai langsung oleh halaman). */
function siteMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: BRAND.name,
    authors: [{ name: BRAND.maker, url: BRAND.makerUrl }],
    creator: BRAND.maker,
    publisher: BRAND.maker,
    keywords: t.meta.keywords,
    category: 'business',
    formatDetection: { telephone: false },
    // Verifikasi Google Search Console lewat meta tag (opsional; bisa juga lewat DNS/Analytics).
    verification: GSC_VERIFICATION ? { google: GSC_VERIFICATION } : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
  };
}

/**
 * Isi <head> sebuah halaman untuk mesin pencari dan pratinjau tautan: judul, deskripsi, canonical, robots, Open Graph, kartu Twitter.
 * Dipanggil dari generateMetadata() tiap halaman publik: pageMetadata(await getLocale(), '/').
 */
export function pageMetadata(locale: Locale, page: SitePath): Metadata {
  const base = siteMetadata(locale);
  const t = getDictionary(locale);
  const title = page === '/' ? t.meta.title : `${t.meta.privacyTitle} · ${BRAND.name}`;
  const description = page === '/' ? t.meta.description : t.meta.privacyDescription;
  const url = absoluteUrl(page);
  // Gambar pratinjau tautan: berkas statis public/images/og-{id,en}.png (1200×630).
  const image = { url: `/images/og-${locale}.png`, width: 1200, height: 630, alt: t.meta.title };
  return {
    ...base,
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: BRAND.name,
      title,
      description,
      url,
      locale: t.ogLocale,
      alternateLocale: [getDictionary(otherLocale(locale)).ogLocale],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}
