import Image from 'next/image';
import { STORES, SHOW_FAQ, BRAND, CONTACT, MAPS_EMBED_URL, MAPS_OPEN_URL, ADDRESS } from '@/lib/site';
import { getDictionary, fill } from '@/i18n';
import appStore from '@/public/images/badge-app-store.png';
import googlePlay from '@/public/images/badge-google-play.png';
import { TapLink, Reveal, HeroCarousel, HoverLift, Parallax, RevealHeading, Stagger, StaggerItem, FeaturesCarousel, MotionRoot, Corners, LanguageSwitch } from '@/components/site/motion';
import { LuArrowUpRight, LuCheck, LuMail, LuMapPin } from 'react-icons/lu';
import { RiWhatsappLine } from 'react-icons/ri';
import { applicationSchema, faqSchema, graph, organizationSchema, webPageSchema, websiteSchema } from '@/lib/schema';
import SiteShell, { JsonLd } from '@/components/site/SiteShell';
import type { Metadata } from 'next';
import { getLocale } from '@/i18n/server';
import { pageMetadata } from '@/lib/metadata';
import type { Locale } from '@/lib/types';

// w/h = ukuran bawaan gambar; img = kelas ukuran tampilan; gap = jarak antar tombol.
// "responsive": kecil dan tetap horizontal di ponsel (dua tombol muat satu baris), lalu ukuran "md" mulai layar sm.
const SIZES = {
  sm: { h: 42, w: 145, r: 'rounded-[10px]', img: 'h-[42px] w-[145px]', gap: 'flex-wrap gap-3' },
  md: { h: 52, w: 180, r: 'rounded-xl', img: 'h-[52px] w-[180px]', gap: 'flex-wrap gap-3' },
  lg: { h: 56, w: 194, r: 'rounded-xl', img: 'h-[56px] w-[194px]', gap: 'flex-wrap gap-3' },
  responsive: { h: 52, w: 180, r: 'rounded-[10px] sm:rounded-xl', img: 'h-10 w-[138px] sm:h-[52px] sm:w-[180px]', gap: 'flex-nowrap gap-2 sm:flex-wrap sm:gap-3' },
} as const;

/** Tombol unduh App Store & Google Play (tautan resmi aplikasi). */
function StoreBadges({ locale, size = 'md', className = '' }: { locale: Locale; size?: keyof typeof SIZES; className?: string }) {
  const t = getDictionary(locale).hero;
  const s = SIZES[size];
  return (
    <div className={`flex ${s.gap} ${className}`}>
      <TapLink href={STORES.ios} target="_blank" rel="noopener" className={`inline-flex ${s.r}`}>
        <Image src={appStore} alt={t.appStoreAlt} width={s.w} height={s.h} className={`block ${s.img}`} />
      </TapLink>
      <TapLink href={STORES.android} target="_blank" rel="noopener" className={`inline-flex ${s.r}`}>
        <Image src={googlePlay} alt={t.playStoreAlt} width={s.w} height={s.h} className={`block ${s.img}`} />
      </TapLink>
    </div>
  );
}

/** Header hero: logo, navigasi, pengalih bahasa, dan tombol kontak. */
function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const links = [
    { href: '#fitur', label: t.nav.features },
    ...(SHOW_FAQ ? [{ href: '#faq', label: t.nav.faq }] : []),
    { href: '#kontak', label: t.nav.contact },
    { href: '#unduh', label: t.nav.download },
  ];
  return (
    <Reveal y={-16} className="mx-auto max-w-[1240px]">
      <header className="flex flex-wrap items-center justify-between gap-3 py-4 min-[340px]:flex-nowrap sm:gap-6 sm:py-[22px]">
        <a href="#top" aria-label={t.a11y.home} className="flex min-h-11 items-center">
          <Image src="/images/sapakerja-logo-putih.svg" alt="SapaKerja" width={178} height={40} priority unoptimized className="h-[26px] w-[116px] sm:h-10 sm:w-[178px]" />
        </a>
        <nav aria-label={t.a11y.mainNav} className="hidden items-center gap-8 text-[15px] font-semibold nav:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex min-h-11 items-center text-white hover:underline hover:underline-offset-[6px]">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <LanguageSwitch
            locale={locale}
            label={t.switchShort}
            title={t.switchTo}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] border-white/55 px-3 text-[13px] font-bold text-white hover:bg-white/10 sm:px-4 sm:text-sm"
          />
          <TapLink
            href="#kontak"
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-white px-4 text-sm font-bold text-ink hover:bg-mint sm:px-5 sm:text-[15px]"
          >
            {t.nav.cta}
          </TapLink>
        </div>
      </header>
    </Reveal>
  );
}

const PHONES = [
  { n: '1', key: 'beranda', y: 40, speed: 70 },
  { n: '2', key: 'presensi', y: 0, speed: 30 },
  { n: '3', key: 'konfirmasi', y: -20, speed: 50 },
  { n: '4', key: 'riwayat', y: 20, speed: 90 },
] as const;

// Ukuran judul mengikuti panjang baris terpanjang tiap bahasa supaya tiap baris tetap muat (Inggris lebih panjang dari Indonesia).
const TITLE_SIZE: Record<Locale, string> = {
  id: 'text-[clamp(28px,8.2vw,104px)]',
  en: 'text-[clamp(30px,6.2vw,88px)]',
};

function Hero({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  // Satu item mockup: nomor + judul layar di atas, ponsel di bawah. Dipakai versi desktop dan carousel.
  const figure = (p: (typeof PHONES)[number]) => {
    const label = t.hero.phones[p.key];
    return (
      <figure className="m-0 flex flex-col gap-4">
        <figcaption className="flex items-center gap-2.5 text-[15px] font-bold">
          <span className="inline-flex size-7 flex-none items-center justify-center rounded-full bg-white font-mono text-[13px] text-teal">{p.n}</span>
          {label}
        </figcaption>
        <Phone locale={locale} screen={p.key} label={t.a11y.phoneOf.replace('{screen}', label)} />
      </figure>
    );
  };

  return (
    <section id="top" className="overflow-hidden bg-teal px-6 text-white">
      <Header locale={locale} />

      <div className="mx-auto flex max-w-[1240px] flex-col gap-[clamp(24px,3vw,36px)] pt-[clamp(32px,5vw,64px)]">
        <RevealHeading text={t.hero.title} className={`m-0 ${TITLE_SIZE[locale]} font-extrabold leading-[1.02] tracking-[-0.045em]`} />
        <Stagger>
          <StaggerItem>
            <StoreBadges locale={locale} size="responsive" />
          </StaggerItem>
        </Stagger>
      </div>

      <div className="mx-auto -mb-[150px] mt-[clamp(48px,6vw,72px)] max-w-[1240px]">
        {/* Desktop lebar (>= 1280px): empat ponsel muat sejajar (4 x 280px + 3 jarak 36px = 1228px + padding). Di bawah itu, termasuk
            iPad Pro 13 potret (1032px), ponsel ke-4 akan turun baris, jadi dipakai carousel. */}
        <div className="hidden flex-wrap justify-center gap-9 min-[1280px]:flex">
          {PHONES.map((p, i) => (
            <div key={p.key} style={{ transform: `translateY(${p.y}px)` }}>
              <Reveal y={70} delay={0.25 + i * 0.12}>
                <Parallax fromTop distance={p.speed}>
                  <HoverLift>{figure(p)}</HoverLift>
                </Parallax>
              </Reveal>
            </div>
          ))}
        </div>

        {/* Tablet & ponsel: carousel bergeser satu item per langkah. */}
        <Reveal y={70} delay={0.25} className="min-[1280px]:hidden">
          <HeroCarousel label={t.a11y.heroCarousel} items={PHONES.map((p) => figure(p))} />
        </Reveal>
      </div>
    </section>
  );
}

function Features({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <>
      <section id="fitur" className="bg-white px-6 pb-10 pt-[105px] min-[1280px]:pt-[210px]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 text-center">
          <Reveal>
            <p className="m-0 font-mono text-[13px] font-bold tracking-[0.08em] text-teal-dark">{t.features.eyebrow}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="m-0 max-w-[760px] text-[clamp(34px,4.2vw,52px)] font-extrabold leading-[1.08] tracking-[-0.03em]">{t.features.title}</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="m-0 max-w-[600px] text-[17px] leading-[1.6] text-muted">{t.features.lead}</p>
          </Reveal>
        </div>
      </section>

      {/* Tablet & ponsel (< wide): fitur dalam carousel yang bisa digeser; teks berganti mengikuti mockup di depan. */}
      <FeaturesCarousel
        className="wide:hidden"
        label={t.a11y.featuresCarousel}
        dotLabel={t.a11y.featureDot}
        items={t.features.items.map(({ id, tag, title, body, points }) => ({ id, tag, title, body, points }))}
        slides={t.features.items.map((f) => (
          <Phone key={f.id} soft locale={locale} screen={f.screen as ScreenKey} label={t.a11y.phoneOf.replace('{screen}', f.tag.toLowerCase())} />
        ))}
      />

      {/* Desktop (>= wide): satu bagian per fitur, teks dan mockup berdampingan bergantian. */}
      {t.features.items.map((f, i) => {
        const flip = i % 2 === 1;
        return (
          <section
            key={f.id}
            id={f.id}
            className={['hidden px-6 py-[clamp(56px,7vw,96px)] wide:block', flip ? 'bg-surface' : 'bg-white'].join(' ')}
          >
            <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(40px,6vw,88px)]">
              <Reveal x={flip ? 48 : -48} y={0} className={['flex max-w-[520px] flex-col gap-[18px]', flip ? 'wide:order-2' : ''].join(' ')}>
                <span className="font-mono text-[13px] font-bold tracking-[0.08em] text-teal-dark">
                  {String(i + 1).padStart(2, '0')} · {f.tag}
                </span>
                <h3 className="m-0 text-[clamp(30px,3.4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em]">{f.title}</h3>
                <p className="m-0 text-[17px] leading-[1.65] text-muted">{f.body}</p>
                <Stagger as="ul" className="m-0 mt-2 flex list-none flex-col gap-3.5 p-0">
                  {f.points.map((pt) => (
                    <StaggerItem as="li" key={pt.h} className="flex items-start gap-3 text-base leading-[1.55]">
                      <span className="mt-px inline-flex size-6 flex-none items-center justify-center rounded-full bg-mint text-teal">
                        <LuCheck size={13} strokeWidth={3.2} />
                      </span>
                      <span>
                        <strong className="font-extrabold">{pt.h}</strong> {pt.t}
                      </span>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Reveal>

              <Reveal x={flip ? -48 : 48} y={0} delay={0.1} className={['flex justify-center', flip ? 'wide:order-1' : ''].join(' ')}>
                <div
                  className={[
                    'relative flex aspect-[1/1.25] w-full max-w-[480px] items-center justify-center rounded-[36px]',
                    flip ? 'bg-white' : 'bg-panel',
                  ].join(' ')}
                >
                  <Corners color="border-teal" />
                  <Parallax distance={24}>
                    <HoverLift>
                      <Phone soft locale={locale} screen={f.screen as ScreenKey} label={t.a11y.phoneOf.replace('{screen}', f.tag.toLowerCase())} />
                    </HoverLift>
                  </Parallax>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}
    </>
  );
}

/** FAQ: <details> asli (tanpa JS) dan semua jawaban ada di HTML, sehingga terbaca mesin pencari dan AI. */
function Faq({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <section id="faq" className="bg-surface px-6 py-[clamp(56px,7vw,96px)]">
      <div className="mx-auto flex max-w-[860px] flex-col gap-4">
        <Reveal>
          <p className="m-0 font-mono text-[13px] font-bold tracking-[0.08em] text-teal-dark">{t.faq.eyebrow}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="m-0 text-[clamp(34px,4.2vw,52px)] font-extrabold leading-[1.08] tracking-[-0.03em]">{t.faq.title}</h2>
        </Reveal>
        <Stagger className="mt-4 flex flex-col gap-3">
          {t.faq.items.map((item) => (
            <StaggerItem key={item.q}>
              <details className="group rounded-[20px] border border-line bg-white">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-[22px] py-[18px] text-[17px] font-bold leading-[1.4] [&::-webkit-details-marker]:hidden">
                  <h3 className="m-0 text-[17px] font-bold leading-[1.4]">{item.q}</h3>
                  <span
                    aria-hidden="true"
                    className="inline-flex size-7 flex-none items-center justify-center rounded-full bg-mint-soft text-xl leading-none text-teal-dark transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="m-0 px-[22px] pb-5 text-base leading-[1.65] text-muted">{item.a}</p>
              </details>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal>
          <p className="m-0 mt-2 text-[15px] font-bold">
            <a href="/privacy" className="text-teal-dark underline underline-offset-4">
              {t.faq.privacyLink} →
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function LinkRow({ href, label, value, external }: { href: string; label: string; value: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
      className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface px-3.5 text-[15px] font-bold text-ink no-underline transition-colors hover:bg-mint-soft"
    >
      <span className="flex flex-col py-1.5">
        <small className="text-[11px] font-semibold text-muted">{label}</small>
        {value}
      </span>
      <LuArrowUpRight size={16} strokeWidth={2.4} className="text-teal" />
    </a>
  );
}

function Contact({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).contact;
  const dict = getDictionary(locale);
  return (
    <section id="kontak" className="bg-white px-6 py-[clamp(72px,8vw,112px)]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-5">
        <Reveal className="relative box-border flex min-h-[460px] flex-col gap-[22px] overflow-hidden rounded-[32px] bg-ink p-[clamp(36px,5vw,56px)] text-white">
          <Corners color="border-[#1f5a54]" size={72} radius={24} />
          <p className="relative m-0 font-mono text-[13px] font-bold tracking-[0.08em] text-glow">{t.eyebrow}</p>
          <h2 className="relative m-0 text-[clamp(34px,4vw,50px)] font-extrabold leading-[1.06] tracking-[-0.03em]">{t.title}</h2>
          <p className="relative m-0 max-w-[440px] text-[17px] leading-[1.6] text-foot">{t.lead}</p>
          <div className="relative mt-auto flex flex-wrap gap-3">
            <TapLink
              href={CONTACT.phones[0].wa}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[54px] items-center gap-2.5 rounded-2xl bg-glow px-[22px] text-base font-extrabold text-ink hover:bg-[#8aeed7]"
            >
              <RiWhatsappLine size={20} />
              {t.whatsapp}
            </TapLink>
            <TapLink
              href={`mailto:${CONTACT.emailSapaKerja}`}
              className="inline-flex min-h-[54px] items-center gap-2.5 rounded-2xl border-2 border-[#3e6b66] px-[22px] text-base font-extrabold text-white hover:border-glow"
            >
              <LuMail size={20} strokeWidth={2.2} />
              {t.email}
            </TapLink>
          </div>
        </Reveal>

        <Stagger className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-5">
          <StaggerItem className="flex flex-col gap-3.5 rounded-[28px] border border-line bg-white p-6">
            <span className="inline-flex size-12 flex-none items-center justify-center rounded-[14px] bg-mint-soft text-teal">
              <LuMail size={22} strokeWidth={2} />
            </span>
            <h3 className="m-0 text-lg font-extrabold">{t.emailCard}</h3>
            <LinkRow href={`mailto:${CONTACT.emailSapaKerja}`} label={BRAND.name} value={CONTACT.emailSapaKerja} />
            <LinkRow href={`mailto:${CONTACT.emailBidtech}`} label={BRAND.maker} value={CONTACT.emailBidtech} />
          </StaggerItem>

          <StaggerItem className="flex flex-col gap-3.5 rounded-[28px] border border-line bg-white p-6">
            <span className="inline-flex size-12 flex-none items-center justify-center rounded-[14px] bg-mint-soft text-teal">
              <RiWhatsappLine size={22} />
            </span>
            <h3 className="m-0 text-lg font-extrabold">{t.phoneCard}</h3>
            {CONTACT.phones.map((p, i) => (
              <LinkRow key={p.e164} href={p.wa} external label={fill(t.phoneLabel, { n: i + 1 })} value={p.display} />
            ))}
          </StaggerItem>

          <StaggerItem className="col-span-full grid min-h-[260px] grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] overflow-hidden rounded-[28px] bg-panel">
            <div className="flex flex-col justify-center gap-2.5 p-6">
              <span className="inline-flex size-12 flex-none items-center justify-center rounded-[14px] bg-white text-teal">
                <LuMapPin size={22} strokeWidth={2} />
              </span>
              <h3 className="m-0 text-lg font-extrabold">{t.officeTitle}</h3>
              <address className="m-0 text-[15px] not-italic leading-[1.55] text-muted">{t.officeAddress}</address>
              <a href={MAPS_OPEN_URL} target="_blank" rel="noopener" className="text-sm font-extrabold text-teal-dark">
                {t.openMaps}
              </a>
            </div>
            <div className="relative min-h-[260px] bg-[#d3ece4]">
              <iframe
                title={dict.a11y.mapTitle}
                src={MAPS_EMBED_URL}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

function Download({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <section id="unduh" className="bg-white px-6 pb-[clamp(72px,8vw,112px)]">
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center overflow-hidden rounded-[36px] bg-teal text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-[120px] -top-40 size-[520px] rounded-full bg-[#13918a]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-[140px] -left-[90px] size-[300px] rounded-full bg-[#0a736d]" />

        <Stagger className="relative flex flex-col gap-[22px] p-[clamp(40px,6vw,72px)]">
          <StaggerItem>
            <h2 className="m-0 text-[clamp(36px,4.8vw,60px)] font-extrabold leading-[1.02] tracking-[-0.035em]">{t.download.title}</h2>
          </StaggerItem>
          <StaggerItem>
            <p className="m-0 max-w-[460px] text-lg leading-[1.6] text-hero-sub">{t.download.lead}</p>
          </StaggerItem>
          <StaggerItem>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {t.download.chips.map((chip) => (
                <li key={chip} className="inline-flex items-center gap-1.5 rounded-full bg-[#0a6e68] px-3 py-2 text-[13px] font-bold">
                  <LuCheck size={14} stroke="#6be3c8" strokeWidth={3} />
                  {chip}
                </li>
              ))}
            </ul>
          </StaggerItem>
          <StaggerItem className="mt-1.5">
            <StoreBadges locale={locale} size="lg" />
          </StaggerItem>
        </Stagger>

        <Reveal y={80} className="relative flex h-[520px] items-start justify-center self-end overflow-hidden pt-12">
          <div className="absolute left-1/2 top-6 h-[520px] w-[380px] -translate-x-1/2 max-sm:hidden">
            <Corners color="border-glow" inset={0} />
          </div>
          <HoverLift className="relative">
            <Phone locale={locale} screen="konfirmasi" width={300} label={t.a11y.phoneOf.replace('{screen}', t.features.items[1].tag.toLowerCase())} />
          </HoverLift>
        </Reveal>
      </div>
    </section>
  );
}

const colLink = 'inline-flex min-h-8 items-center text-foot no-underline hover:text-white hover:underline';

function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const f = t.footer;
  return (
    <footer className="bg-ink px-6 pb-8 pt-[clamp(56px,7vw,88px)] text-foot">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-14">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="flex max-w-[380px] flex-[1_1_320px] flex-col gap-5">
            <Image src="/images/sapakerja-logo-putih.svg" alt="SapaKerja" width={196} height={44} unoptimized className="h-11 w-[196px]" />
            <p className="m-0 text-[15px] leading-[1.65]">{f.about}</p>
            <StoreBadges locale={locale} size="sm" className="!gap-2.5" />
          </div>

          <div className="flex flex-wrap gap-[clamp(32px,5vw,72px)]">
            <nav aria-label={t.a11y.footerFeatures} className="flex flex-col gap-1 text-[15px]">
              <h2 className="m-0 mb-2 font-mono text-xs font-medium tracking-[0.08em] text-glow">{f.featuresTitle}</h2>
              {f.featureLinks.map((l) => (
                <a key={l.href} href={l.href} className={colLink}>
                  {l.label}
                </a>
              ))}
            </nav>
            <nav aria-label={t.a11y.footerCompany} className="flex flex-col gap-1 text-[15px]">
              <h2 className="m-0 mb-2 font-mono text-xs font-medium tracking-[0.08em] text-glow">{f.companyTitle}</h2>
              <a href={BRAND.makerUrl} rel="noopener" className={colLink}>
                {f.bidtech}
              </a>
              <a href="#kontak" className={colLink}>
                {f.contact}
              </a>
              <a href="#unduh" className={colLink}>
                {f.download}
              </a>
              <a href="/privacy" className={colLink}>
                {f.privacy}
              </a>
              <a href="/login" rel="nofollow" className={colLink}>
                {f.hrDashboard}
              </a>
            </nav>
            <div className="flex max-w-60 flex-col gap-1 text-[15px]">
              <h2 className="m-0 mb-2 font-mono text-xs font-medium tracking-[0.08em] text-glow">{f.reach}</h2>
              <a href={`mailto:${CONTACT.emailSapaKerja}`} className={colLink}>
                {CONTACT.emailSapaKerja}
              </a>
              {CONTACT.phones.map((p) => (
                <a key={p.e164} href={p.wa} target="_blank" rel="noopener" className={colLink}>
                  {p.display}
                </a>
              ))}
              <address className="mt-2 leading-[1.55] not-italic text-foot-dim">{ADDRESS.line}, {ADDRESS.district}</address>
            </div>
          </div>
        </div>

        <Reveal className="border-y border-[#1f4a44] py-[clamp(28px,4vw,44px)]">
          <p className="m-0 text-[clamp(30px,5.4vw,72px)] font-extrabold leading-none tracking-[-0.04em] text-white">
            {f.tagline[0]}
            <br />
            <span className="text-glow">{f.tagline[1]}</span>
          </p>
        </Reveal>

        <div className="flex flex-wrap justify-between gap-3 text-[13px] text-foot-dim">
          <span>{f.copyright}</span>
          <span>
            {f.madeBy.split('Bidtech')[0]}
            <a href={BRAND.makerUrl} rel="noopener" className="font-bold text-white">
              Bidtech
            </a>
            {f.madeBy.split('Bidtech').slice(1).join('Bidtech')}
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Halaman beranda (landing) untuk satu bahasa. */
function Landing({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteShell>
      <MotionRoot>
        {/* Elemen reveal mulai bergeser ke samping; overflow-x-clip di sini (bukan di body) mencegah halaman melebar/bisa digeser di ponsel. */}
        <div className="overflow-x-clip">
          <JsonLd
            data={graph(
              organizationSchema(),
              websiteSchema(locale),
              webPageSchema(locale, '/', t.meta.title, t.meta.description),
              applicationSchema(locale),
              ...(SHOW_FAQ ? [faqSchema(locale)] : []),
            )}
          />
          <a
            href="#konten"
            className="absolute -top-20 left-4 z-50 rounded-xl bg-white px-[18px] py-3 font-bold text-ink focus:top-3"
          >
            {t.a11y.skip}
          </a>
          <Hero locale={locale} />
          <main id="konten">
            <Features locale={locale} />
            {SHOW_FAQ ? <Faq locale={locale} /> : null}
            <Contact locale={locale} />
            <Download locale={locale} />
          </main>
          <Footer locale={locale} />
        </div>
      </MotionRoot>
    </SiteShell>
  );
}

type ScreenKey = 'beranda' | 'presensi' | 'konfirmasi' | 'riwayat' | 'profil';

/**
 * Mockup layar aplikasi: gambar WEBP 2x (bingkai ponsel sudah termasuk), dipotret dari aplikasi per bahasa di
 * public/images/screen-<layar>-{id,en}.webp. Ganti berkasnya bila tampilan aplikasi berubah. Bayangan dibuat CSS (drop-shadow) karena
 * sudut gambar transparan.
 */
function Phone({ locale, screen, label, soft = false, width = 280 }: { locale: Locale; screen: ScreenKey; label: string; soft?: boolean; width?: number }) {
  return (
    <Image
      src={`/images/screen-${screen}-${locale}.webp`}
      alt={label}
      width={560}
      height={1160}
      unoptimized
      style={{ width, height: 'auto' }}
      className={`shrink-0 ${soft ? 'drop-shadow-[0_30px_26px_rgba(16,48,46,0.32)]' : 'drop-shadow-[0_30px_26px_rgba(0,0,0,0.38)]'}`}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getLocale(), '/');
}

export default async function Page() {
  return <Landing locale={await getLocale()} />;
}
