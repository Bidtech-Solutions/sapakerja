import type { ReactNode } from 'react';
import { BRAND, CONTACT } from '@/lib/site';
import Image from 'next/image';
import { getDictionary } from '@/i18n';
import { LanguageSwitch } from '@/components/site/motion';
import SiteShell, { JsonLd } from '@/components/site/SiteShell';
import { breadcrumbSchema, graph, organizationSchema, webPageSchema } from '@/lib/schema';
import { LuMail } from 'react-icons/lu';
import type { Metadata } from 'next';
import { getLocale } from '@/i18n/server';
import { pageMetadata } from '@/lib/metadata';
import type { Locale } from '@/lib/types';

type Opts = { linkClassName?: string; strongClassName?: string };

/** Teks kamus dengan penanda {company}, {email}, dan **tebal** -> node React. */
function RichText({ text, linkClassName = 'font-bold text-teal-dark underline underline-offset-2', strongClassName = 'font-extrabold' }: { text: string } & Opts) {
  const out: ReactNode[] = [];
  const re = /\{company\}|\{email\}|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[0] === '{company}') out.push(BRAND.company);
    else if (m[0] === '{email}')
      out.push(
        <a key={i++} className={linkClassName} href={`mailto:${CONTACT.emailBidtech}`}>
          {CONTACT.emailBidtech}
        </a>,
      );
    else
      out.push(
        <strong key={i++} className={strongClassName}>
          {m[1]}
        </strong>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

const link = 'font-semibold text-[#107268] [overflow-wrap:anywhere] hover:underline';

/** Kebijakan Privasi (URL publik untuk App Store Connect / Google Play). Server-rendered, tanpa JS. */
function PrivacyPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const p = t.privacy;
  return (
    <SiteShell className="flex min-h-screen flex-col bg-[#f7faf9]">
      <JsonLd
        data={graph(
          organizationSchema(),
          webPageSchema(locale, '/privacy', t.meta.privacyTitle, t.meta.privacyDescription),
          breadcrumbSchema(locale, [
            { name: BRAND.name, path: '/' },
            { name: t.meta.privacyTitle, path: '/privacy' },
          ]),
        )}
      />
      <header className="bg-gradient-to-br from-[#072e2a] to-[#0f5e56] text-white">
        <div className="mx-auto flex max-w-[820px] items-center justify-between gap-3 px-6 py-5 max-[600px]:px-4">
          <a href="/" aria-label={p.homeLink} className="flex items-center gap-3 no-underline">
            <span className="flex size-10 items-center justify-center rounded-[10px] bg-teal">
              <Image src="/images/sapakerja-simbol-putih.svg" alt="" width={22} height={22} />
            </span>
            <span className="flex flex-col leading-[1.2]">
              <span className="text-[1.05rem] font-bold text-white">{BRAND.name}</span>
              <span className="text-[0.7rem] uppercase tracking-[1px] text-[#92c7bf]">{p.brandSub}</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            {/* Di ponsel tanggal dipindah ke bawah judul agar header tetap satu baris. */}
            <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#ccfbf1] sm:inline-flex">
              {p.updatedLabel} {p.updatedDate}
            </span>
            <LanguageSwitch
              locale={locale}
              label={t.switchShort}
              title={t.switchTo}
              className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-white/40 px-3 text-xs font-bold text-white hover:bg-white/10"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] flex-1 px-6 pb-6 pt-9 max-[600px]:px-4">
        <h1 className="mb-2 text-[1.85rem] font-bold tracking-[-0.3px] text-[#0f172a] max-[600px]:text-2xl">{p.title}</h1>
        <p className="mb-3 text-xs font-medium text-[#0d4a46] sm:hidden">
          {p.updatedLabel} {p.updatedDate}
        </p>
        <p className="mb-6 text-[0.95rem] text-[#475569]">{p.lead}</p>

        {p.sections.map((s, si) => (
          <section
            key={s.title}
            id={s.id}
            className="mb-4 rounded-2xl border border-[#edf2f7] bg-white px-7 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] max-[600px]:px-4 max-[600px]:py-[18px]"
          >
            <h2 className="mb-2.5 text-[1.05rem] font-bold text-[#0d4a46]">{s.title}</h2>
            {s.blocks.map((b, bi) => {
              if (b.type === 'ul')
                return (
                  <ul key={bi} className="mb-3 ml-5 flex list-disc flex-col gap-1.5 last:mb-0">
                    {b.items.map((it) => (
                      <li key={it} className="text-[0.92rem] leading-[1.65] text-[#334155]">
                        <RichText text={it} linkClassName={link} />
                      </li>
                    ))}
                  </ul>
                );
              if (b.type === 'label')
                return (
                  <p key={bi} lang={b.lang} className="mb-1 mt-4 text-xs font-bold uppercase tracking-[1px] text-[#0f5e56]">
                    {b.text}
                  </p>
                );
              return (
                <p key={bi} lang={b.lang} className="mb-2.5 text-[0.92rem] leading-[1.7] text-[#334155] last:mb-0">
                  <RichText text={b.text} linkClassName={link} />
                </p>
              );
            })}
            {si === p.sections.length - 1 && (
              <a
                href={`mailto:${CONTACT.emailBidtech}`}
                className="mt-2 inline-flex items-center gap-2 rounded-[10px] border border-[#ccfbf1] bg-[#f0fdfa] px-4 py-2.5 text-[0.9rem] font-semibold text-[#0f5e56] [overflow-wrap:anywhere]"
              >
                <LuMail size={16} strokeWidth={2.2} />
                {CONTACT.emailBidtech}
              </a>
            )}
          </section>
        ))}
      </main>

      <footer className="mx-auto flex w-full max-w-[820px] flex-wrap justify-between gap-2 px-6 pb-8 pt-4 text-[0.78rem] text-[#64748b] max-[600px]:px-4">
        <span>
          &copy; {BRAND.company} · {BRAND.name} ·{' '}
          <a href={BRAND.makerUrl} rel="noopener" className={link}>
            {BRAND.maker}
          </a>
        </span>
        <span className="flex gap-4">
          <a href="/" className={link}>
            {p.homeLink}
          </a>
          <a href="/login" rel="nofollow" className={link}>
            {p.footerLink}
          </a>
        </span>
      </footer>
    </SiteShell>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getLocale(), '/privacy');
}

export default async function Page() {
  return <PrivacyPage locale={await getLocale()} />;
}
