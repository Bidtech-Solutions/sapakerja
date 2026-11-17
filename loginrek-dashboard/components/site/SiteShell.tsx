import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { GA_ID, GTM_ID } from '@/lib/site';

/** Menyisipkan data terstruktur JSON-LD. "<" di-escape agar string dari kamus tidak bisa menutup tag script. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

/**
 * Pembungkus semua halaman situs publik (beranda, kebijakan privasi, 404): kelas `.site` membatasi reset Tailwind
 * (preflight.css) ke situs publik saja, dan pelacakan Google hanya dipasang di sini (bukan di dashboard HR): Tag Manager bila
 * NEXT_PUBLIC_GTM_ID diisi, kalau tidak Google Analytics langsung bila NEXT_PUBLIC_GA_ID diisi (tidak keduanya, agar tidak
 * terhitung dua kali).
 */
export default function SiteShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className ? `site ${className}` : 'site'}>
      {children}
      {GTM_ID ? <GoogleTagManager gtmId={GTM_ID} /> : GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </div>
  );
}
