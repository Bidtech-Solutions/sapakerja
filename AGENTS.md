# AGENTS.md — loginrek

Panduan untuk AI coding agent (dan developer) di monorepo ini. Dokumentasi lengkap ada di
`docs/`: `PRD.md`, `ARCHITECTURE.md`, `API.md`, `DESIGN.md`. Baca yang relevan sebelum mengubah kode,
dan perbarui di PR yang sama bila perilaku berubah.

## Apa ini

Sistem absensi & HR internal. Karyawan absen (GPS + selfie) lewat **mobile**; admin/HR memantau
lewat **dashboard** web; keduanya memakai **backend** REST API.

| Folder | Stack | Port |
| ------ | ----- | ---- |
| `loginrek-backend/` | Go + Gin, GORM, PostgreSQL (fallback SQLite), RustFS/S3 | 3333 |
| `loginrek-dashboard/` | Next.js 16 (App Router) + Tailwind CSS v4: situs publik SapaKerja (landing, i18n id/en) + dashboard HR | 5173 |
| `loginrek-mobile/` | React Native + Expo SDK 57, Expo Router, TypeScript | 8081 |

Kontrak API: `docs/API.md`. Bila endpoint belum ada, sebutkan — jangan mengarang bentuk respons.

**Nama produk: SapaKerja** (sebelumnya prototipe "loginrek"). Teks yang dilihat pengguna memakai SapaKerja. Identifier teknis **sengaja tetap `loginrek`**
dan jangan diganti tanpa persetujuan: nama folder `loginrek-*`, slug/projectId EAS, `bundleIdentifier`/`package` `id.co.bidtech.loginrek`, `scheme`, go module,
image Docker, kunci penyimpanan (`loginrek.*`), dan domain email akun `@loginrek.com`. Domain: dashboard `sapakerja.com`, API `api.sapakerja.com`;
domain lama (`loginrek.bidtech.co.id`, `loginrek-api.bidtech.co.id`) tetap dilayani langsung tanpa redirect (lihat `docs/ARCHITECTURE.md`).

## Env

Satu file `.env` di **root** untuk semua produk (salin dari `.env.example`); jangan membuat
`.env` / `.env.example` per folder. Dibaca oleh docker compose, backend (`../.env`), dashboard
(Next.js; `next.config.mjs` memuat `.env` root, hanya `NEXT_PUBLIC_*`), dan mobile (`npm run dev`, hanya `EXPO_PUBLIC_*`). Variabel baru
wajib ditambahkan ke `.env.example` root. `.gitignore` juga hanya satu, di root.

## Perintah

```bash
# Infra lokal (PostgreSQL + RustFS) — opsional, backend fallback ke SQLite/disk
docker compose up -d

# Backend
cd loginrek-backend && go mod tidy && go run ./cmd/api
go vet ./... && go test ./...

# Dashboard
cd loginrek-dashboard && npm install && npm run dev      # lint: npm run lint

# Mobile
cd loginrek-mobile && npm install && npm run dev         # Expo Go
npm run lint && npm run typecheck && npm run doctor
npx expo install <pkg>                                   # SELALU untuk menambah library RN/Expo
```

## Autentikasi & hak akses (berlaku untuk semua produk)

- Satu-satunya kredensial adalah JWT dari `POST /auth/login`. **Dilarang** menambah token palsu/offline
  (mis. `token-usr-*`), kata sandi cadangan, alias akun, atau daftar akun di kode klien maupun server.
- Peran = `users.is_admin` (HR). Endpoint dashboard wajib `RequireAuth` + `RequireAdmin`; endpoint karyawan
  cukup `RequireAuth`. Route baru didaftarkan di `internal/router/router.go` dan diuji di `router_test.go`.
- Jangan menyimpan kata sandi (plaintext) di localStorage/SecureStore, dan jangan menjadikan teks `role`
  (jabatan) sebagai dasar otorisasi.
- Akun awal dibuat seeder dari env (`SEED_*`), hanya saat tabel `users` kosong.

## Backend (`loginrek-backend`)

- Go module bernama `loginrek-backend`. Lapisan: `handler` → `domain` (model + DTO) → `storage`/`database`.
- Konfigurasi hanya lewat environment (`internal/config`); template di `.env.example` (root). Jangan hardcode secret.
- Respons sukses `{ "data": ... }`. Field JSON `camelCase`.
- Perubahan model GORM → perbarui bagian skema di `docs/ARCHITECTURE.md`.

## Situs publik & Dashboard HR (`loginrek-dashboard`)

Next.js berubah cepat — jangan percaya ingatan: baca dokumentasi versi terpasang di `loginrek-dashboard/node_modules/next/dist/docs/`.
(`next dev` membuat `loginrek-dashboard/AGENTS.md` otomatis; berkas itu di-ignore, aturan proyek hanya di AGENTS.md root.)

Satu aplikasi Next.js, **tanpa folder `src/`**: `app/`, `i18n/`, `lib/`, `components/`, `styles/`, `public/`. **Satu root layout** (`app/layout.tsx`: `<html lang>`,
`<body>`, font, `styles/globals.css`); situs publik dan dashboard HR berbagi root itu:

- Situs publik: `app/page.tsx` (beranda) dan `app/privacy/page.tsx`; 404 di `app/not-found.tsx`. Semuanya dirender per permintaan karena
  bahasa dibaca dari cookie/header. Styling **Tailwind CSS v4** (semua gaya ada di folder `styles/`: `styles/globals.css` = Tailwind (tema, utilitas, token) + gaya dasar; reset-nya `styles/preflight.css`
  hanya berlaku di dalam pembungkus `.site`, lihat `SiteShell`), animasi **Motion** (`motion/react`) + scroll **Lenis**.
  Seluruh bagian beranda (Header, Hero, Features, Faq, Contact, Download, Footer) ada **di `app/page.tsx`** karena hanya dipakai satu halaman.
  Kode yang butuh `'use client'` (animasi, `HeroCarousel`, `FeaturesCarousel`, `Corners`) dikumpulkan di satu berkas klien, `components/site/motion.tsx`
  (batas klien Next.js mewajibkan berkas terpisah). Di bawah `wide` (1020px) mockup hero dan fitur berbentuk carousel (hero otomatis per langkah,
  fitur digeser manual).
- **`lib/`**: hanya berkas yang dipakai lintas halaman. **Satu berkas tipe** untuk seluruh `lib/` (`lib/types.ts`: i18n + dashboard) dan satu `lib/api.ts`
  (klien REST + URL API); tipe tidak didefinisikan di berkas lain. Tidak ada berkas pembantu terpisah per rute: helper yang hanya dipakai satu
  halaman ditaruh di halaman itu; helper yang dipakai dua halaman dashboard (mis. `buildRecordsForDate`) ditaruh di `components/dashboard/AdminProvider.tsx`,
  karena `page.tsx` tidak boleh mengekspor selain halamannya. Font (`next/font`) dideklarasikan langsung di `app/layout.tsx`.
- **Ikon**: pakai paket `react-icons` (set `react-icons/lu`, gaya Lucide) langsung di halaman yang memerlukannya; jangan membuat berkas ikon SVG sendiri.
- **Aturan `components/`**: sebuah komponen hanya boleh ada di `components/` bila dipakai **dua halaman atau lebih** (mis. `SiteShell`, `AdminProvider`). Komponen kecil yang berkerabat digabung dalam satu berkas: `SiteShell.tsx` memuat `SiteShell` + `JsonLd`,
  `site/motion.tsx` memuat semua kode klien situs publik (animasi, carousel, `LanguageSwitch`), `dashboard/Session.tsx` memuat `SessionCheck` + `Redirect`,
  dan `DashboardShell.tsx` memuat kerangka dashboard + `Sidebar`.
  Kode yang hanya dipakai satu halaman tinggal di berkas halaman itu, bukan dipecah ke `components/` atau folder lain. Jangan membuat komponen
  `Button` dan sejenisnya: cukup styling. Tiap halaman dashboard (`app/(dashboard)/**/page.tsx`) membawa seluruh UI-nya sendiri.
- **Mockup layar aplikasi di beranda adalah gambar WEBP** (`public/images/screen-<layar>-{id,en}.webp`, 2x, bingkai ponsel sudah termasuk), bukan HTML.
  Ganti berkasnya bila tampilan aplikasi berubah (idealnya tangkapan layar aplikasi sungguhan, per bahasa).
- **Semua gambar** ada di `public/images/` (datar, tanpa subfolder): logo, favicon, badge toko, mockup layar, gambar OG, `default-avatar.webp`.
- Dashboard HR: grup `app/(dashboard)/` (nama grup tidak muncul di URL): `/login`, `/attendance`, `/attendance/[id]`, `/employees`,
  `/employees/new`, `/employees/[id]/edit`, `/settings`. Satu layout grup (`AdminProvider` + `DashboardShell` yang menjaga sesi dan memasang
  sidebar kecuali di `/login`), TypeScript, `noindex`. Seluruh CSS-nya (`styles/dashboard.css`, tanpa Tailwind; hanya diimpor layout dashboard) dibungkus di bawah kelas
  `.dash`; **jangan** menulis selektor global di sana dan jangan memakai utilitas Tailwind di komponen dashboard. Filter daftar (tanggal, pencarian,
  jenis karyawan) hidup di `AdminProvider` agar tidak hilang saat berpindah rute. Halaman detail/ubah menunggu `dataReady` sebelum mengalihkan.
  Rute dashboard baru: tambahkan di `app/(dashboard)/` dan daftarkan alamatnya di `app/robots.ts`. Tautan lama `/dashboard/*` dialihkan 307.
- **i18n**: `i18n/{index,id,en}.ts`; `en` wajib punya kunci yang sama dengan `id` (dicek `npm run typecheck`). Jangan hardcode teks
  situs publik di komponen. Dashboard HR hanya berbahasa Indonesia.
  **Bahasa situs mengikuti perangkat**: satu URL per halaman (tanpa `/en`); `i18n/server.ts` memilih cookie `loginrek.lang` (diisi tombol
  bahasa), lalu `Accept-Language` (Indonesia bila pilihan teratas `id`, selain itu English), tanpa header (crawler) = Indonesia.
- **SEO / AEO / GEO**: `lib/metadata.ts` (isi `<head>`: judul, OG, canonical) dan `lib/schema.ts` (JSON-LD), `app/robots.ts`, `app/sitemap.ts`, `public/llms.txt`,
  `public/llms-full.txt`, `public/.well-known/security.txt` (hanya lokasi resmi RFC 9116; tanpa `/security.txt`; **perbarui `Expires` sebelum 2027-10-31**, maks. ~1 tahun ke depan), `public/images/og-{id,en}.png`
  (gambar pratinjau tautan 1200×630, **statis**, dirujuk dari `pageMetadata`: ganti berkasnya bila slogan/tampilan berubah). `public/llms*.txt` adalah berkas statis tulisan tangan (Indonesia dulu, lalu English; URL produksi `https://sapakerja.com`), **tidak**
  otomatis mengikuti kamus: ubah bersama kamus i18n bila fitur/FAQ/kebijakan privasi berubah. Halaman publik
  baru: tambahkan ke `SitePath` (`i18n/index.ts`), `app/sitemap.ts`, dan folder route di `app/`; bungkus isinya dengan `SiteShell`.
- Fakta tetap (URL App Store/Play, kontak, alamat, GA/GSC) ada di `lib/site.ts`. Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GSC_VERIFICATION` (semua publik, dibakar saat build; tambahkan ke `.env.example` root).
- Base URL API dibaca dari `NEXT_PUBLIC_API_URL` (`API_ORIGIN`/`API_BASE` di `lib/api.ts`); jangan menulis `http://localhost:3333` langsung.
- Google Tag Manager (atau GA langsung bila GTM kosong) **hanya** di situs publik (`components/site/SiteShell.tsx`); jangan dipasang di dashboard HR. Menambah pihak ketiga
  di situs publik berarti memperbarui bagian 7 Kebijakan Privasi (`i18n/id.ts` dan `en.ts`).
- SapaKerja adalah produk Bidtech: kredit Bidtech (footer, kontak, kebijakan privasi, JSON-LD, metadata) jangan dihapus; hero sengaja tanpa kredit. Bagian FAQ disembunyikan lewat
  `SHOW_FAQ` di `lib/site.ts` (komponen dan kamus tetap ada).
- Token warna & pola UI: `docs/DESIGN.md`.

## Mobile (`loginrek-mobile`)

### Versi SDK: ikuti Expo Go di App Store
Expo Go di App Store hanya mendukung **satu SDK** dan biasanya tertinggal dari rilis terbaru.
**Jangan upgrade SDK** sebelum Expo Go mendukungnya, kecuali tim sudah memakai development build.
Saat upgrade: `npx expo install expo@^<sdk> && npx expo install --fix`, lalu `npm run doctor`.

### Expo cepat berubah — jangan percaya ingatan
Cek versi major `expo` di `package.json`, lalu buka dokumentasi versi itu
(`https://docs.expo.dev/versions/v57.0.0/`; topik lain mulai dari https://docs.expo.dev/llms.txt).

### Konvensi
1. Navigasi hanya dengan Expo Router. Kode non-route tidak boleh ada di `src/app/`.
2. Semua request lewat `src/lib/api.ts`; jangan `fetch` langsung di komponen
   (pengecualian: cek `/health` di layar placeholder).
3. Token **hanya** di `expo-secure-store` (`src/lib/session.ts`), bukan AsyncStorage.
4. Warna/spasi/font dari `src/lib/theme.ts` (`colors`, `spacing`, dan `Text`/`TextInput` bawaan berfont Plus Jakarta Sans — jangan pakai `Text`/`TextInput` langsung dari `react-native`) — jangan hardcode hex di komponen.
5. Env publik berprefix `EXPO_PUBLIC_` masuk ke bundle — **tidak boleh berisi secret**.
6. Teks UI lewat i18n (`react-i18next`, kamus `src/i18n/id.ts` dan `en.ts`; `en` harus punya kunci yang sama dengan `id`, dicek
   typecheck). Bahasa mengikuti bahasa perangkat: Indonesia untuk `id`, selain itu Inggris. Jangan hardcode teks UI di komponen; tanggal/jam
   lewat `src/lib/attendance-format.ts`. Nama kode bahasa Inggris. Import pakai alias `@/...`.
7. Utamakan modul Expo (`expo-camera`, `expo-location`, ...) — tersedia di Expo Go.
8. Permission dikonfigurasi lewat plugin/`infoPlist` `app.json`, diminta tepat sebelum dipakai. Alur izin (App Store 5.1.1(iv)) lewat
   `usePermissionGate` (di `attendance.tsx`): status `undetermined` langsung memanggil dialog sistem tanpa layar/tombol Pengaturan; `denied` +
   `canAskAgain` memakai tombol "Lanjutkan"; hanya `denied` tanpa `canAskAgain` (atau GPS mati) yang boleh menawarkan `Linking.openSettings()`.
   Lokasi hanya foreground (When In Use), jangan minta background. Plugin config setiap modul Expo terpasang aktif OTOMATIS (SDK 58) dan menambah izin/background mode sendiri (mikrofon, gerak, `fetch`/`processing`, dll.), jadi isi `app.json` bukan daftar lengkapnya: setelah menambah/menghapus modul native, periksa hasil akhirnya dengan `npx expo config --type introspect` dan matikan yang tidak dipakai lewat opsi plugin di `app.json` (mis. `microphonePermission: false`).
9. OTA (expo-updates ke server sendiri; gate/loading saat startup HANYA di pembukaan pertama sebuah build native lewat `src/lib/startup-update.ts`; pembukaan berikutnya update diunduh di latar belakang tanpa menunggu — jangan tambah gate di jalur itu): commit JS/aset di `loginrek-mobile/` dirilis otomatis oleh job `publish-ota`
   (`.github/workflows/loginrek.yml`); perubahan native/`app.json`/`google-services.json`/sertifikat tidak lewat OTA: CI otomatis menjalankan `eas build --local` +
   `eas submit` (TestFlight/Play internal) dan menaikkan `version` patch — jangan commit perubahan native ke `main` tanpa persetujuan; `[skip build]`
   di pesan commit melewati build. Jangan commit `keys/`. Detail: `docs/ARCHITECTURE.md` ("Update OTA", "Build native otomatis").

### Jangan
- Membuat/mengedit `ios/` atau `android/` manual (di-generate, di-ignore git). Ubah lewat `app.json` / config plugin.
- Menambah library native yang tidak ada di Expo Go tanpa diskusi (mewajibkan development build + Apple Developer).
- `npm install <pkg>` langsung untuk library RN/Expo.
- Mengubah `bundleIdentifier`/`package` (`id.co.bidtech.loginrek`) tanpa persetujuan — memutus update di store.

## Definition of done

- Backend: `go vet ./... && go test ./...` lulus.
- Dashboard / situs publik: `npm run lint && npm run typecheck && npm run build` lulus.
- Mobile: `npm run lint && npm run typecheck` lulus, `npm run doctor` tanpa error,
  dicoba di Expo Go (minimal satu perangkat).
