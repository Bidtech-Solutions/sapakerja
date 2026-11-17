# SapaKerja

> Nama produk: **SapaKerja** (sebelumnya prototipe "loginrek"). Nama folder, slug EAS, bundle id `id.co.bidtech.loginrek`, go module, image Docker, dan domain email akun sengaja tetap memakai `loginrek`.

Sistem absensi & HR internal. Karyawan absen (GPS + selfie) lewat aplikasi mobile; admin/HR
memantau dan mengelola data lewat dashboard web; keduanya memakai satu REST API.

| Folder | Isi | Stack |
| ------ | --- | ----- |
| `loginrek-backend/` | REST API (`/api/v1`, port 3333) | Go + Gin, GORM, PostgreSQL / SQLite fallback, RustFS/S3 |
| `loginrek-dashboard/` | Situs publik SapaKerja + Web Dashboard HR (port 5173) | Next.js 16 (App Router), Tailwind CSS v4, Motion, Lenis |
| `loginrek-mobile/` | Aplikasi Karyawan (iOS & Android) | React Native + Expo SDK (Expo Router, EAS Build) |

```
.
├── .github/workflows/loginrek.yml   # CI/CD: check → build image → deploy VPS
├── loginrek-backend/
├── loginrek-dashboard/
├── loginrek-mobile/
├── docs/                            # PRD, API, DESIGN, ARCHITECTURE
├── .env.example                     # SATU template env semua produk (+ docker compose)
├── docker-compose.yml               # infra dev: PostgreSQL + RustFS
├── docker-compose.prod.yml          # stack production (VPS)
├── AGENTS.md / CLAUDE.md            # panduan untuk AI agent & developer
└── README.md                        # satu-satunya README
```

## Dokumentasi

- [`docs/PRD.md`](docs/PRD.md) — kebutuhan produk
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arsitektur, skema database, mobile, deploy
- [`docs/API.md`](docs/API.md) — kontrak REST API (daftar endpoint ada di sini)
- [`docs/DESIGN.md`](docs/DESIGN.md) — token warna & pola UI

---

## Menjalankan di lokal

Persyaratan: Go ≥ 1.22, Node ≥ 22, (opsional) Docker.

Siapkan env (satu file untuk semua produk), lalu infra opsional — tanpa ini backend
otomatis memakai SQLite dan disk lokal:
```bash
cp .env.example .env          # isi CHANGE_ME (JWT_SECRET min. 32 karakter: openssl rand -hex 32)
docker compose up -d
```

Jalankan tiap sistem di terminal masing-masing:

1. **Backend** — `http://localhost:3333`
   ```bash
   cd loginrek-backend
   go run ./cmd/api
   ```
   Saat database masih kosong, server membuat akun dari `.env`: **HR/admin** (`SEED_ADMIN_*`, bisa login
   dashboard dan mobile) dan **karyawan uji** (`SEED_EMPLOYEE_*`, hanya mobile). Tes: `go test ./...`.
2. **Dashboard** — `http://localhost:5173`
   ```bash
   cd loginrek-dashboard
   npm install
   npm run dev
   ```
   Situs publik di `http://localhost:5173`, dashboard HR di `http://localhost:5173/login`.
   Alamat API diatur lewat `NEXT_PUBLIC_API_URL` (default `http://localhost:3333`).
3. **Mobile** — port 8081, scan QR dengan Expo Go
   ```bash
   cd loginrek-mobile
   npm install
   npm run dev
   ```
   Build APK uji internal: `npx eas-cli@latest build --profile preview --platform android`.


### Semua lewat Docker + APK di HP Android (satu Wi-Fi)

1. **Jalankan backend + dashboard** (PostgreSQL, RustFS, backend, dashboard):
   ```bash
   docker compose up -d --build
   docker compose ps                      # semua "running"/"healthy"
   docker compose logs -f backend         # akun seed dibuat saat database masih kosong
   ```
   Dashboard `http://localhost:5173` (login dengan `SEED_ADMIN_*`), API `http://localhost:3333/health`.
   `NEXT_PUBLIC_*` dibakar saat build — ubah di `.env` lalu `docker compose up -d --build dashboard`.
2. **Izinkan HP mengakses PC.** Port 3333 sudah terbuka ke semua interface, tetapi Windows Firewall
   memblokir koneksi masuk di jaringan bertipe *Public*. Di PowerShell **sebagai Administrator**:
   ```powershell
   Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
   New-NetFirewallRule -DisplayName "loginrek-api 3333" -Direction Inbound -Protocol TCP -LocalPort 3333 -Action Allow -Profile Private
   ```
   Uji dari browser HP: `http://<IP-PC>:3333/health` harus menjawab `{"status":"ok",...}`.
   IP PC: `ipconfig` → IPv4 adapter Wi-Fi. Bila gagal padahal firewall benar, matikan *AP/Client Isolation* di router.
3. **Arahkan APK ke IP itu.** Di [loginrek-mobile/eas.json](loginrek-mobile/eas.json) profil `preview`:
   `"EXPO_PUBLIC_API_URL": "http://<IP-PC>:3333/api/v1"`. Nilai ini ikut terbakar di APK (file `.env` tidak
   dibaca EAS), jadi build ulang bila IP PC berubah — sebaiknya kunci IP PC lewat DHCP reservation di router.
4. **Bangun APK di cloud EAS** (butuh akun Expo; EAS Build lokal tidak tersedia di Windows):
   ```bash
   cd loginrek-mobile
   npm install && npm run doctor
   npx eas-cli@latest login
   npx eas-cli@latest build --platform android --profile preview
   ```
   Selesai (±10–20 menit) EAS memberi tautan/QR unduh `.apk`. Buka di HP, izinkan *install dari sumber
   tidak dikenal*, lalu login dengan akun karyawan (`SEED_EMPLOYEE_*` atau yang dibuat HR di dashboard).
   Lalu lintas HTTP (bukan HTTPS) sudah diizinkan lewat `usesCleartextTraffic` di `app.json`.

---

## Backend (`loginrek-backend`)

Backend berkinerja tinggi: **Go + Gin + GORM + PostgreSQL + RustFS / S3**.

- **REST API** — [Gin](https://github.com/gin-gonic/gin), port default `3333`. Endpoint: lihat [`docs/API.md`](docs/API.md).
- **Keamanan** — JWT (`golang-jwt/jwt/v5`, klaim user ID & email) dan hashing kata sandi bcrypt.
- **Database** — GORM + PostgreSQL. Bila PostgreSQL belum menyala, otomatis fallback ke **SQLite lokal**
  (`tmp/db.sqlite3`) tanpa error. AutoMigrate tabel `users`, `attendances`, `access_tokens`, dan seeder
  akun uji (lihat `internal/database/postgres.go`).
- **Object storage** — RustFS / MinIO / S3 lewat [minio-go/v7](https://github.com/minio/minio-go);
  fallback ke disk lokal (`public/uploads/`) bila RustFS belum aktif.
- **Kompresi gambar otomatis** — foto selfie dan avatar di-resize proporsional (maks 1280×720 atau 720×1280,
  tanpa crop), orientasi EXIF diperbaiki, lalu di-encode ke **WebP** (hemat 80–90% dibanding JPEG/PNG).

```
loginrek-backend/
├── cmd/api/main.go                  # entrypoint: config → database → storage → router
├── internal/
│   ├── config/config.go             # pembaca environment (.env)
│   ├── database/postgres.go         # koneksi GORM + SQLite fallback + seeder
│   ├── domain/models.go             # model GORM, relasi, DTO & transformer respons
│   ├── router/router.go             # semua route + proteksi (publik / login / HR-admin)
│   ├── handler/
│   │   ├── attendance_handler.go    # check-in selfie, status hari ini, riwayat
│   │   ├── auth_handler.go          # login, profil (me), update profil & avatar
│   │   └── employee_handler.go      # CRUD karyawan (list, tambah, ubah, hapus cascade)
│   ├── middleware/
│   │   ├── auth_middleware.go       # verifikasi Bearer JWT (RequireAuth) + RequireAdmin
│   │   └── cors_middleware.go       # CORS hanya untuk origin di CORS_ORIGINS
│   └── storage/
│       ├── image_processor.go       # decode base64, resize Lanczos, WebP
│       └── rustfs.go                # klien RustFS S3 + fallback disk lokal
├── public/uploads/                  # upload gambar lokal
├── Dockerfile
└── go.mod
```

---

## Situs publik & Dashboard (`loginrek-dashboard`)

Satu aplikasi **Next.js 16 (App Router)** berisi dua hal:

**1. Situs publik SapaKerja** (landing page, dua bahasa mengikuti bahasa perangkat) — Tailwind CSS v4, animasi Motion, scroll halus Lenis.

| URL | Halaman |
| --- | ------- |
| `/` | beranda (Indonesia atau English menurut perangkat/pilihan pengunjung), kontak + Google Maps, tombol App Store/Google Play |
| `/privacy` | Kebijakan Privasi (URL untuk App Store Connect / Google Play) |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, `/.well-known/security.txt` | SEO, AEO, GEO, keamanan |

SEO: metadata menurut bahasa permintaan, canonical, Open Graph (gambar statis `public/images/og-{id,en}.png`), JSON-LD (Organization/Bidtech, WebSite,
MobileApplication, FAQPage), Google Tag Manager / Google Analytics 4 dan verifikasi Search Console lewat env (lihat `.env.example`).

**2. Dashboard HR** (wajib login, `noindex`) — memakai REST API `loginrek-backend` lewat `NEXT_PUBLIC_API_URL`.

| URL | Halaman |
| --- | ------- |
| `/login` | login admin |
| `/attendance`, `/attendance/:id` | riwayat absensi, detail presensi (peta Google Maps tersemat) |
| `/employees`, `/employees/new`, `/employees/:id/edit` | daftar, tambah, ubah karyawan |
| `/settings` | pengaturan akun |

Tautan lama `/dashboard/...` dialihkan ke alamat di atas.

```bash
npm run dev         # dev server (5173)
npm run build       # build produksi (.next/, mode standalone)
npm run start       # jalankan hasil build
npm run lint && npm run typecheck
```

```
loginrek-dashboard/            # tanpa folder src/
├── app/
│   ├── layout.tsx             # SATU root layout (<html lang> dari cookie/bahasa perangkat)
│   ├── page.tsx               # beranda (landing): semua bagiannya di satu berkas
│   ├── privacy/page.tsx       # kebijakan privasi
│   ├── (dashboard)/           # dashboard HR: layout, login, attendance[/[id]], employees[/new|/[id]/edit], settings
│   ├── not-found.tsx
│   └── robots.ts, sitemap.ts
├── styles/                    # globals.css (Tailwind v4 + gaya dasar situs), preflight.css (reset terbatas .site), dashboard.css (dashboard, di bawah .dash)
├── i18n/                      # index.ts, id.ts, en.ts (kamus), locale.ts + server.ts (pilih bahasa menurut cookie/perangkat)
├── lib/
│   ├── metadata.ts, schema.ts # SEO: isi <head> (judul, OG, canonical) dan JSON-LD
│   ├── api.ts                 # klien REST dashboard (+ URL API)
│   ├── types.ts               # SATU-SATUNYA berkas tipe lib/ (i18n + dashboard)
│   └── site.ts                # URL toko, kontak, alamat, GA/GSC
├── components/
│   ├── site/                  # SiteShell.tsx (SiteShell + JsonLd), motion.tsx (semua kode 'use client' situs publik: animasi, carousel, LanguageSwitch)
│   └── dashboard/             # AdminProvider.tsx, DashboardShell.tsx (kerangka + Sidebar), Session.tsx (SessionCheck + Redirect)
├── public/                    # images/ (SEMUA gambar, datar: logo, favicon, badge, mockup layar .webp, OG, default-avatar.webp), health.json (healthcheck Docker), llms.txt, llms-full.txt, .well-known/security.txt
├── next.config.mjs, postcss.config.mjs, tsconfig.json
└── Dockerfile
```

---

## Mobile (`loginrek-mobile`)

Aplikasi karyawan: login, absen masuk (GPS + selfie), riwayat, mode offline-sync.
**React Native + Expo SDK 57**, Expo Router, TypeScript. Aturan pengembangan lengkap ada di
[`AGENTS.md`](AGENTS.md); arsitektur dan build EAS di [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```bash
npm run dev          # Expo Go (LAN)
npm run dev:tunnel   # bila HP & laptop beda jaringan
npm run lint && npm run typecheck && npm test
```

---

## Deploy

Push ke `main` menjalankan `.github/workflows/loginrek.yml`: lint/build → image GHCR
(`loginrek-backend`, `loginrek-dashboard`) → `docker compose -f docker-compose.prod.yml up -d`
di VPS di belakang Traefik:

| URL | Service |
| --- | ------- |
| https://sapakerja.com | dashboard HR |
| https://api.sapakerja.com | REST API + foto `/uploads/*` + update OTA (dipakai mobile & dashboard) |
| https://loginrek.bidtech.co.id | domain lama dashboard — tetap dilayani langsung (bukan redirect) |
| https://loginrek-api.bidtech.co.id | domain lama API — tetap dilayani langsung; dipakai HP dengan build lama, jangan di-redirect (merusak POST + header `Authorization`) |

Secrets dan variabel server: lihat komentar di workflow dan `.env.example`.
