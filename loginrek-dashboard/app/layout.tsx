import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { getLocale } from '@/i18n/server';
import '@/styles/globals.css';

// Font di-host sendiri saat build (tanpa request ke Google dari peramban pengunjung). Variabel CSS-nya dipakai styles/globals.css (@theme)
// dan styles/dashboard.css.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '700'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = { icons: { icon: '/images/favicon.svg' } };
export const viewport: Viewport = { themeColor: '#0B7F78' };

/**
 * Satu-satunya root layout: situs publik (app/page.tsx, app/privacy) dan dashboard HR (grup app/(dashboard)) berbagi <html>/<body>.
 * Bahasa (<html lang>) mengikuti pilihan/bahasa perangkat pengunjung, jadi seluruh halaman dirender per permintaan.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
