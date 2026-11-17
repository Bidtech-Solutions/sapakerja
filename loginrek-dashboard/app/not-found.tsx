import { getDictionary } from '@/i18n';
import SiteShell from '@/components/site/SiteShell';
import type { Metadata } from 'next';
import { getLocale } from '@/i18n/server';
import type { Locale } from '@/lib/types';

function NotFoundPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).notFound;
  return (
    <SiteShell>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-teal p-6 text-center text-white">
        <p className="m-0 font-mono text-sm font-bold tracking-[0.08em] text-hero-eyebrow">404</p>
        <h1 className="m-0 text-[clamp(36px,6vw,64px)] font-extrabold tracking-[-0.03em]">{t.title}</h1>
        <p className="m-0 text-lg text-hero-sub">{t.body}</p>
        <a href="/" className="mt-2 inline-flex min-h-11 items-center rounded-full bg-white px-6 font-bold text-ink hover:bg-mint">
          {t.back}
        </a>
      </main>
    </SiteShell>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale()).meta.notFoundTitle };
}

// Semua URL yang tidak dikenal menampilkan halaman 404 yang bertema (bukan 404 bawaan Next).
export default async function NotFound() {
  return <NotFoundPage locale={await getLocale()} />;
}
