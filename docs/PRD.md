# PRD — SapaKerja

> Status: **DRAFT** — disusun dari fitur yang sudah ada di kode dan dokumen lama.
> Tim produk perlu memverifikasi tujuan, target, dan prioritas di bawah.

## Latar belakang & tujuan

Pencatatan kehadiran karyawan secara manual rawan salah dan sulit dipantau. **SapaKerja**
adalah sistem absensi & HR internal: karyawan absen dari HP dengan bukti lokasi dan
selfie; admin/HR memantau dan mengelola data dari dashboard web.

Tujuan:
1. Karyawan dapat absen masuk < 30 detik dari buka aplikasi.
2. HR melihat status kehadiran hari ini secara langsung, tanpa rekap manual.
3. Bukti absen (lokasi + foto) cukup untuk menekan kecurangan.

## Pengguna

| Peran | Platform | Kebutuhan utama |
| ----- | -------- | --------------- |
| Karyawan | Mobile (iOS & Android) | login, absen masuk, lihat riwayat, ubah profil |
| Admin / HR | Dashboard web | pantau absensi, kelola karyawan, lihat peta & foto bukti |

## Lingkup

### Sudah ada
- Login (email / nama) dengan JWT, 30 hari.
- Absen masuk dengan selfie + koordinat GPS + jarak ke kantor; status Tepat Waktu / Terlambat.
- Satu absen per karyawan per hari.
- Mode offline: absen disimpan lokal lalu disinkronkan otomatis di latar belakang.
- Foto dikompres otomatis ke WebP (maks 1280×720).
- Dashboard: daftar & detail kehadiran (peta Leaflet), CRUD karyawan, halaman pengaturan.
- Ubah profil, kata sandi, dan avatar.

<!-- DIUBAH (OTA): subbagian baru. Detail teknis ada di ARCHITECTURE.md ("Update OTA"), kontrak di API.md. -->
### Update aplikasi lewat OTA dari server sendiri
Perbaikan aplikasi bisa sampai ke HP karyawan tanpa menunggu App Store / Play Store. Update dilayani
backend SapaKerja sendiri (`/updates/*`), bukan server EAS, dan ditandatangani (code signing).

Aturan:
- **Lewat OTA**: kode JavaScript dan aset yang dirujuk dari JavaScript (gambar, font).
- **Tetap lewat build baru (`eas build`)**: perubahan native — library native, `app.json` (izin, plugin, ikon, splash,
  ikon/suara notifikasi), `google-services.json`, dan sertifikat code signing. Versi aplikasi (`version`) dinaikkan.
- **OTA dilewati otomatis** bila terdeteksi perubahan native; CI lalu membangun versi baru (versi patch naik otomatis) dan mengirimnya ke TestFlight + Play internal.
- Update hanya diterima oleh build yang `runtimeVersion`-nya sama (kebijakan `appVersion`) dan channel `production`.
- Rilis otomatis saat ada commit di `loginrek-mobile/` (selain `.md`); rollback = rilis update baru dari commit yang sehat.
- Update terpasang setelah aplikasi dibuka-tutup dua kali (unduh di buka pertama, aktif di buka kedua).

### Rencana
- Absen pulang.
- Pengajuan izin / cuti dengan persetujuan HR.
- Jadwal shift & toleransi keterlambatan per shift.
- Beberapa lokasi kantor dengan radius geofence yang dikonfigurasi.
- Ekspor rekap CSV/Excel.
- Dark mode mobile.

### Di luar lingkup (saat ini)
Penggajian, lembur, integrasi mesin fingerprint, multi-perusahaan (multi-tenant).

## Persyaratan non-fungsional

- **Keamanan**: kata sandi bcrypt; secret hanya di environment; token mobile di secure store;
  validasi geofence dan waktu **di server**, bukan di klien.
- **Ketersediaan data**: backend tetap hidup bila PostgreSQL/RustFS belum aktif (fallback lokal) — hanya untuk development.
- **Kinerja**: respons API p95 < 500 ms; foto ≤ ~500 KB setelah kompresi.
- **Bahasa & zona waktu**: UI Indonesia, `Asia/Jakarta` (WIB).

## Aturan lokasi absen (mobile, sementara)

- Radius absen **200 m** dari titik kantor (`DEFAULT_OFFICE` di `src/lib/location-store.ts`).
- Lokasi harus presisi: galat posisi maksimal **100 m** (`MAX_ACCURACY_METERS`). Izin lokasi "perkiraan" (iOS Precise Location mati / Android hanya COARSE)
  ditolak, dengan arahan mengaktifkan Lokasi Presisi.
- Lokasi tiruan (`mocked`, Android), lokasi yang gagal dibaca, dan bacaan tidak valid **menolak** absen. Titik kantor hanya jadi pengganti di web dan mode dev.
- Lokasi dibaca dengan akurasi `Balanced` (±100 m). Agar absen cepat, Beranda **memanaskan** lokasi (`locationStore.warmUp`) hanya bila izin lokasi
  sudah diberikan; pemanasan tidak pernah meminta izin. Pengguna baru tetap diminta izin di layar presensi.
- Pemeriksaan ini masih di **klien**. Server belum memvalidasi radius (hanya menyimpan `distanceMeters` kiriman klien), sehingga belum memenuhi persyaratan
  keamanan di atas; validasi di server adalah pekerjaan lanjutan.

## Metrik keberhasilan

- ≥ 95% karyawan aktif absen lewat aplikasi.
- Waktu rata-rata absen < 30 detik.
- Selisih rekap HR vs. data sistem mendekati nol.

## Pertanyaan terbuka

- Berapa lokasi kantor dan radius geofence yang berlaku? (Sementara: satu kantor, radius **200 m** dari titik kantor; lihat "Aturan lokasi absen".)
- Aturan keterlambatan: jam masuk & toleransi per shift atau global?
- Apakah absen pulang wajib dan bagaimana menghitung jam kerja?
- Siapa yang boleh jadi admin, dan perlu peran bertingkat (HR vs. super admin)?
