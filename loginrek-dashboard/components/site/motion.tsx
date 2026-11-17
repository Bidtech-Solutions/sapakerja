'use client';

import { Fragment, useEffect, useRef, type ReactNode, useState, useCallback } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import { MotionConfig, motion, useReducedMotion, useScroll, useSpring, useTransform, type HTMLMotionProps, type Variants, useInView } from 'motion/react';
import { LuCheck } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE } from '@/i18n/locale';
import type { Locale } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------- Akar animasi: scroll halus + progres scroll + kebijakan reduced-motion ---------- */

// Pengguna dengan "kurangi gerakan" mendapat scroll bawaan peramban.
function ReducedMotionGuard() {
  const lenis = useLenis();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce && lenis) lenis.destroy();
  }, [reduce, lenis]);
  return null;
}

/** Garis progres baca di tepi atas halaman. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  return <motion.div aria-hidden="true" style={{ scaleX }} className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-glow" />;
}

/** Akar animasi situs: scroll halus (Lenis; tautan #anchor ikut digulir halus), progres scroll, dan "kurangi gerakan". */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: 0.1, anchors: { offset: -16 } }}>
        <ReducedMotionGuard />
        <ScrollProgress />
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}

/* ---------- Reveal: muncul saat masuk viewport ---------- */

type RevealProps = HTMLMotionProps<'div'> & {
  /** Detik tunda sebelum animasi mulai. */
  delay?: number;
  /** Geser awal (px) pada sumbu x / y. */
  x?: number;
  y?: number;
};

/** Muncul (fade + geser) saat masuk viewport; hanya sekali. */
export function Reveal({ delay = 0, x = 0, y = 28, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Stagger: anak muncul berurutan ---------- */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** Anak-anaknya (StaggerItem) muncul berurutan saat masuk viewport. Pakai `as="ul"` untuk daftar. */
export function Stagger({ as = 'div', children, ...rest }: Omit<HTMLMotionProps<'div'>, 'variants'> & { as?: 'div' | 'ul' }) {
  const Tag = as === 'ul' ? motion.ul : motion.div;
  return (
    <Tag
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      {...(rest as object)}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({ as = 'div', children, ...rest }: Omit<HTMLMotionProps<'div'>, 'variants'> & { as?: 'div' | 'li' }) {
  const Tag = as === 'li' ? motion.li : motion.div;
  return (
    <Tag variants={item} {...(rest as object)}>
      {children}
    </Tag>
  );
}

/* ---------- Parallax ---------- */

/**
 * Menggeser anak secara vertikal mengikuti scroll untuk efek kedalaman.
 * - default: ±`distance` px selama elemen melintasi layar;
 * - `fromTop`: dimulai dari posisi desain (0) saat halaman di paling atas, lalu naik sejauh `distance` px (untuk hero).
 */
export function Parallax({
  distance = 40,
  fromTop = false,
  className,
  children,
}: {
  distance?: number;
  fromTop?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const element = useScroll({ target: ref, offset: ['start end', 'end start'] }).scrollYProgress;
  const page = useScroll().scrollY;
  const yElement = useTransform(element, [0, 1], [distance, -distance]);
  const yPage = useTransform(page, [0, 900], [0, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: fromTop ? yPage : yElement }}>{children}</motion.div>
    </div>
  );
}

/* ---------- RevealHeading ---------- */

/**
 * Judul yang terungkap kata demi kata (topeng naik). Teks tetap utuh di HTML untuk mesin pencari.
 * `text` berupa larik = satu baris per elemen (pemisah baris pasti, mis. ["Datang Tepat Waktu,", "Kantor Lebih Teratur"]).
 */
export function RevealHeading({ text, as = 'h1', className }: { text: string | string[]; as?: 'h1' | 'h2'; className?: string }) {
  const Tag = as === 'h1' ? motion.h1 : motion.h2;
  const lines = (Array.isArray(text) ? text : [text]).map((line) => line.split(' '));
  return (
    <Tag
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
    >
      {lines.map((words, li) => (
        <Fragment key={li}>
          {words.map((w, i) => (
            <Fragment key={i}>
              <span className="inline-block overflow-hidden pb-[0.08em] align-top">
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: { y: '110%' },
                    show: { y: 0, transition: { duration: 0.7, ease: EASE } },
                  }}
                >
                  {w}
                </motion.span>
              </span>
              {i < words.length - 1 ? ' ' : null}
            </Fragment>
          ))}
          {/* Spasi sebelum <br> menjaga teks judul tetap terbaca utuh ("Waktu, Kantor") oleh mesin pencari dan pembaca layar. */}
          {li < lines.length - 1 ? (
            <>
              {' '}
              <br />
            </>
          ) : null}
        </Fragment>
      ))}
    </Tag>
  );
}

/* ---------- Interaksi sentuh/hover ---------- */

/** Tautan dengan umpan balik sentuh: membesar sedikit saat disorot, menekan saat diketuk. */
export function TapLink({ children, ...rest }: HTMLMotionProps<'a'>) {
  return (
    <motion.a
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      {...rest}
    >
      {children}
    </motion.a>
  );
}

/** Pembungkus yang terangkat saat disorot (mis. ponsel mockup). */
export function HoverLift({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={{ y: -10, rotate: -1.2 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const ITEM = 280; // lebar satu item = lebar gambar ponsel (280px)
const GAP = 24;
const STRIDE = ITEM + GAP;
const INTERVAL = 3600; // jeda antar langkah (ms)

/**
 * Carousel mockup hero untuk tablet dan ponsel: bergeser otomatis SATU ITEM per langkah (berhenti di tiap item, bukan marquee
 * linear), berulang tanpa putus. Item aktif selalu di tengah; di tablet item di kiri-kanannya terlihat terpotong, di ponsel
 * lebar tampilan dibatasi satu item. Berhenti saat tidak terlihat / tab tersembunyi; dengan "kurangi gerakan" tidak otomatis
 * (daftar biasa yang bisa digeser).
 */
export function HeroCarousel({ items, label, className = '' }: { items: ReactNode[]; label: string; className?: string }) {
  const n = items.length;
  // Dibaca setelah mount (bukan useReducedMotion saat render): server selalu false, jadi membaca saat render membuat HTML klien
  // pengguna "kurangi gerakan" berbeda dari HTML server (hydration mismatch).
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  // Trek berisi tiga salinan item; mulai di salinan tengah. Setelah sampai awal salinan ketiga, lompat (tanpa animasi) ke
  // posisi yang sama di salinan tengah sehingga putarannya tak terlihat putus.
  const [t, setT] = useState(n);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => {
      if (!document.hidden) setT((v) => v + 1);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [reduce, inView]);

  useEffect(() => {
    if (!instant) return;
    const raf = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(raf);
  }, [instant]);

  if (reduce) {
    return (
      <div
        role="region"
        aria-label={label}
        data-lenis-prevent-wheel
        className={`flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {items.map((node, i) => (
          <div key={i} className="w-[280px] shrink-0 snap-center">
            {node}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      // Ponsel: lebar satu item, TANPA klip (bayangan ponsel tidak boleh terpotong); item selain yang aktif disembunyikan lewat
      // opasitas di bawah. Tablet (sm ke atas): melebar sampai tepi layar (membatalkan padding 24px hero) dan item di kiri-kanan
      // terpotong oleh layar (section hero overflow-hidden).
      className={`relative mx-auto w-[304px] sm:-mx-6 sm:w-[calc(100%+3rem)] ${className}`}
    >
      <motion.div
        className="flex gap-6"
        style={{ marginLeft: `calc(50% - ${ITEM / 2}px)` }}
        animate={{ x: -t * STRIDE }}
        transition={instant ? { duration: 0 } : { duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => {
          if (t >= 2 * n) {
            setInstant(true);
            setT(t - n);
          }
        }}
      >
        {[0, 1, 2].flatMap((copy) =>
          items.map((node, i) => {
            const k = copy * n + i;
            // Ponsel: hanya item aktif yang terlihat (transisi selaras dengan geseran); transisi dimatikan saat lompat balik
            // supaya pertukaran dua salinan identik tidak berkedip.
            const fade = instant ? '' : 'transition-opacity duration-700';
            return (
              <div key={`${copy}-${i}`} className={`w-[280px] shrink-0 ${fade} ${k === t ? 'opacity-100' : 'max-sm:opacity-0'}`} aria-hidden={copy !== 1 || undefined}>
                {node}
              </div>
            );
          }),
        )}
      </motion.div>
    </div>
  );
}

export type CarouselFeature = {
  id: string;
  tag: string;
  title: string;
  body: string;
  points: { h: string; t: string }[];
};

/**
 * Fitur untuk tablet dan ponsel: mockup disusun horizontal dan bisa digeser (scroll-snap, tanpa tombol sebelumnya/berikutnya
 * dan tanpa geser otomatis). Mockup berikutnya sengaja terpotong di tepi kanan sebagai petunjuk bisa digeser, tepi layar
 * diberi fade, indikator titik ada di bawah, dan teks fitur berganti mengikuti mockup yang sedang di depan.
 */
export function FeaturesCarousel({
  items,
  slides,
  label,
  dotLabel,
  className = '',
}: {
  items: CarouselFeature[];
  slides: ReactNode[];
  label: string;
  /** Mengandung {n} dan {total}. */
  dotLabel: string;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Item aktif = item yang paling dekat dengan tepi kiri area gulir (posisi snap).
  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) return setActive(kids.length - 1);
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    let best = 0;
    let dist = Infinity;
    kids.forEach((k, i) => {
      const d = Math.abs(k.offsetLeft - pad - el.scrollLeft);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setActive(best);
  }, []);

  const goTo = useCallback((i: number) => {
    const el = scroller.current;
    const kid = el?.children[i] as HTMLElement | undefined;
    if (!el || !kid) return;
    el.scrollTo({ left: kid.offsetLeft - (parseFloat(getComputedStyle(el).paddingLeft) || 0), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [measure]);

  // Tautan footer ke #fitur-... : di layar sempit bagian per-fitur disembunyikan, jadi gulir ke carousel dan item itu.
  useEffect(() => {
    const go = () => {
      const el = scroller.current;
      const i = items.findIndex((it) => `#${it.id}` === window.location.hash);
      if (i < 0 || !el || el.offsetParent === null) return;
      el.closest('section')?.scrollIntoView({ block: 'start' });
      goTo(i);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [items, goTo]);

  return (
    <section aria-roledescription="carousel" aria-label={label} className={`bg-white pb-14 pt-2 ${className}`}>
      <div
        ref={scroller}
        data-lenis-prevent-wheel
        className="relative flex snap-x snap-mandatory scroll-pl-6 gap-5 overflow-x-auto px-6 pb-8 pt-2 [mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%_-_56px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div key={items[i].id} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}`} className="shrink-0 snap-start">
            {slide}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2" role="group" aria-label={label}>
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            aria-label={dotLabel.replace('{n}', String(i + 1)).replace('{total}', String(items.length))}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => goTo(i)}
            className="group inline-flex size-6 cursor-pointer items-center justify-center"
          >
            <span className={`block h-2 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-teal' : 'w-2 bg-teal/25 group-hover:bg-teal/50'}`} />
          </button>
        ))}
      </div>

      {/* Semua teks fitur ditumpuk di satu sel grid supaya tingginya tetap (tidak melompat saat berganti); hanya yang aktif terlihat. */}
      <div className="mx-auto mt-6 grid max-w-[560px] px-6">
        {items.map((f, i) => (
          <div
            key={f.id}
            aria-hidden={i !== active}
            className={`col-start-1 row-start-1 flex flex-col gap-4 transition-[opacity,transform] duration-300 ${
              i === active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
            }`}
          >
            <span className="font-mono text-[13px] font-bold tracking-[0.08em] text-teal-dark">
              {String(i + 1).padStart(2, '0')} · {f.tag}
            </span>
            <h3 className="m-0 text-[clamp(26px,5.4vw,36px)] font-extrabold leading-[1.12] tracking-[-0.03em]">{f.title}</h3>
            <p className="m-0 text-base leading-[1.65] text-muted">{f.body}</p>
            <ul className="m-0 mt-1 flex list-none flex-col gap-3 p-0">
              {f.points.map((pt) => (
                <li key={pt.h} className="flex items-start gap-3 text-[15px] leading-[1.55]">
                  <span className="mt-px inline-flex size-6 flex-none items-center justify-center rounded-full bg-mint text-teal">
                    <LuCheck size={13} strokeWidth={3.2} />
                  </span>
                  <span>
                    <strong className="font-extrabold">{pt.h}</strong> {pt.t}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Sudut bidik kamera dekoratif ---------- */

type CornersProps = {
  /** Kelas warna border Tailwind, mis. "border-teal". */
  color: string;
  size?: number;
  inset?: number;
  radius?: number;
};

const CORNERS = [
  { key: 'tl', cls: 'border-t-[5px] border-l-[5px]', radiusProp: 'borderTopLeftRadius', pos: (i: number) => ({ top: i, left: i }), origin: '0% 0%' },
  { key: 'tr', cls: 'border-t-[5px] border-r-[5px]', radiusProp: 'borderTopRightRadius', pos: (i: number) => ({ top: i, right: i }), origin: '100% 0%' },
  { key: 'bl', cls: 'border-b-[5px] border-l-[5px]', radiusProp: 'borderBottomLeftRadius', pos: (i: number) => ({ bottom: i, left: i }), origin: '0% 100%' },
  { key: 'br', cls: 'border-b-[5px] border-r-[5px]', radiusProp: 'borderBottomRightRadius', pos: (i: number) => ({ bottom: i, right: i }), origin: '100% 100%' },
] as const;

/** Empat sudut bidik kamera yang "menutup" masuk saat terlihat di layar. Dekoratif. */
export function Corners({ color, size = 64, inset = 22, radius = 22 }: CornersProps) {
  return (
    <>
      {CORNERS.map((c) => (
        <motion.div
          key={c.key}
          aria-hidden="true"
          className={`pointer-events-none absolute ${c.cls} ${color}`}
          initial={{ opacity: 0, scale: 1.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: size, height: size, [c.radiusProp]: radius, transformOrigin: c.origin, ...c.pos(inset) }}
        />
      ))}
    </>
  );
}

/**
 * Tombol pengalih bahasa: menyimpan pilihan di cookie (mengalahkan bahasa perangkat) lalu memuat ulang halaman.
 * Teks dikirim dari server agar komponen klien ini tidak menarik kamus ke bundle.
 */
export function LanguageSwitch({
  locale,
  label,
  title,
  className,
}: {
  locale: Locale;
  label: string;
  title: string;
  className?: string;
}) {
  const router = useRouter();
  const other = locale === 'id' ? 'en' : 'id';
  return (
    <button
      type="button"
      lang={other}
      title={title}
      aria-label={title}
      className={className}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${other}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}


