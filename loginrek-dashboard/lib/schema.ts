// Data terstruktur schema.org (JSON-LD) untuk mesin pencari dan mesin jawaban AI (SEO / AEO / GEO).
import { ADDRESS, BRAND, CONTACT, SITE_URL, STORES } from './site';
import { absoluteUrl, getDictionary } from '@/i18n';
import type { Locale, SitePath } from '@/lib/types';

const ORG_ID = `${BRAND.makerUrl}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#app`;

/** Bidtech: pembuat dan penerbit SapaKerja. */
export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BRAND.maker,
    legalName: BRAND.company,
    url: BRAND.makerUrl,
    email: CONTACT.emailBidtech,
    telephone: CONTACT.phones[0].e164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${ADDRESS.line}, Kel. ${ADDRESS.village}, Kec. ${ADDRESS.district}`,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.region,
      postalCode: ADDRESS.postalCode,
      addressCountry: ADDRESS.country,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT.emailSapaKerja,
        telephone: CONTACT.phones[0].e164,
        availableLanguage: ['id', 'en'],
      },
    ],
  };
}

export function websiteSchema(locale: Locale) {
  const t = getDictionary(locale);
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: BRAND.name,
    description: t.meta.description,
    inLanguage: ['id', 'en'],
    publisher: { '@id': ORG_ID },
  };
}

export function applicationSchema(locale: Locale) {
  const t = getDictionary(locale);
  return {
    '@type': 'MobileApplication',
    '@id': APP_ID,
    name: BRAND.name,
    description: t.meta.description,
    url: absoluteUrl('/'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS, Android',
    inLanguage: locale,
    installUrl: [STORES.ios, STORES.android],
    downloadUrl: STORES.android,
    publisher: { '@id': ORG_ID },
    creator: { '@id': ORG_ID },
    featureList: t.features.items.map((f) => f.title),
  };
}

export function faqSchema(locale: Locale) {
  const t = getDictionary(locale);
  return {
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: t.faq.items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function webPageSchema(locale: Locale, path: SitePath, name: string, description: string) {
  return {
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: locale,
    isPartOf: { '@id': SITE_ID },
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbSchema(locale: Locale, items: { name: string; path: SitePath }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
