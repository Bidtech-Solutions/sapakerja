// Fakta tetap situs publik SapaKerja. Satu sumber untuk halaman, metadata, dan JSON-LD (public/llms*.txt ditulis tangan: ikut perbarui bila fakta di sini berubah).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sapakerja.com').replace(/\/+$/, '');

// Google Analytics 4 (G-XXXXXXXXXX) dan token verifikasi Google Search Console. Kosong = tidak dipasang.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
// Google Tag Manager (GTM-XXXXXXX). Bila diisi, GTM dipasang dan GA langsung (GA_ID) dilewati: pasang tag GA4 di dalam GTM
// agar kunjungan tidak terhitung dua kali. Kosong = tidak dipasang.
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
export const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION || '';

export const BRAND = {
  name: 'SapaKerja',
  // Produk dari Bidtech — wajib dikreditkan di halaman, metadata, dan JSON-LD.
  maker: 'Bidtech',
  makerUrl: 'https://bidtech.co.id',
  company: 'PT Solusi Bisnis Jalanin Aja Dulu',
} as const;

export const STORES = {
  ios: 'https://apps.apple.com/id/app/id6830986914',
  android: 'https://play.google.com/store/apps/details?id=id.co.bidtech.loginrek',
} as const;

export const CONTACT = {
  emailSapaKerja: 'cs@sapakerja.com',
  emailBidtech: 'cs@bidtech.co.id',
  phones: [
    { display: '+62 821-7601-455', e164: '+628217601455', wa: 'https://wa.me/628217601455' },
    { display: '+62 819-3018-9008', e164: '+6281930189008', wa: 'https://wa.me/6281930189008' },
  ],
} as const;

export const ADDRESS = {
  line: 'King Business Centre, Blok A5 No.3',
  village: 'Belian',
  district: 'Batam Kota',
  city: 'Batam',
  region: 'Kepulauan Riau',
  postalCode: '29464',
  country: 'ID',
  // Embed tanpa API key (pencarian nama tempat); tautan buka di Google Maps memakai query yang sama.
  mapsQuery: 'Bidtech: Software House Website & Application, King Business Centre, Batam Kota',
} as const;

export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS.mapsQuery)}&z=16&output=embed`;
export const MAPS_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS.mapsQuery)}`;

// Tanggal pembaruan konten (dipakai sitemap dan kebijakan privasi).
export const CONTENT_UPDATED = '2026-11-17';

/**
 * Tampilkan bagian FAQ di beranda? Sementara disembunyikan. Saat false, bagian FAQ, tautan menu "FAQ", dan data terstruktur
 * FAQPage ikut dimatikan (markup FAQ harus sama dengan konten yang terlihat pengunjung). Kamus i18n (`faq`) dan komponen
 * Faq.tsx tetap ada: ubah ke true untuk menampilkannya lagi.
 */
export const SHOW_FAQ = false;
