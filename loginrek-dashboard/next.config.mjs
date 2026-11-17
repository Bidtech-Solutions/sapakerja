import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const here = path.dirname(fileURLToPath(import.meta.url));

// Satu file .env di root repo untuk semua produk (lihat AGENTS.md). Hanya NEXT_PUBLIC_* yang masuk ke bundle.
// Di Docker/CI folder induk tidak punya .env; nilai datang dari build-arg / environment.
nextEnv.loadEnvConfig(path.resolve(here, '..'), process.env.NODE_ENV !== 'production');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Node minimal untuk Docker (lihat Dockerfile).
  output: 'standalone',
  outputFileTracingRoot: here,
  poweredByHeader: false,
  reactStrictMode: true,

  async redirects() {
    return [
      // Dulu /en dan /en/privacy: sekarang satu URL per halaman, bahasa mengikuti perangkat/cookie (sementara, 307).
      { source: '/en', destination: '/', permanent: false },
      { source: '/en/privacy', destination: '/privacy', permanent: false },
      // Dashboard sempat berada di /dashboard/*: tautan lama diarahkan ke alamat sekarang (sementara, 307).
      { source: '/dashboard', destination: '/attendance', permanent: false },
      { source: '/dashboard/:path*', destination: '/:path*', permanent: false },
    ];
  },

  async headers() {
    return [
      {
        // Gambar (logo, mockup layar, OG) dipakai ulang di banyak halaman; nama berkasnya tidak memuat hash, jadi cache satu
        // hari + stale-while-revalidate (bukan "immutable") supaya penggantian gambar tetap sampai ke pengunjung.
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};

export default nextConfig;
