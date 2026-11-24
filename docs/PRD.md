# PRD — SapaKerja

> Status: **DRAFT**. Dokumen ini terdiri dari dua bagian:
>
> - **Bagian A — Kondisi saat ini (v1)**: fitur yang sudah ada di kode. Disusun dari kode dan dokumen lama; tim produk perlu memverifikasi tujuan, target, dan prioritasnya.
> - **Bagian B — Pengembangan selanjutnya (v2, B2B multi-perusahaan)**: **rencana, belum diimplementasi**. Disusun dari brief PM, draft 23 Nov 2026. Sampai sebuah bagian v2 dikerjakan, kode, `docs/API.md`, dan `AGENTS.md` tetap mengikuti Bagian A. Jangan membuat endpoint/skema dari Bagian B tanpa menyepakati kontraknya lebih dulu.
>
> Penomoran "v1/v2" adalah versi **produk/PRD**, bukan versi aplikasi. Strategi pengirimannya ke versi aplikasi (1.0.4 / 1.0.5) ada di Bagian B, "Strategi rilis".

# Bagian A — Kondisi saat ini (v1)

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
- **Pembukaan pertama di sebuah build** (install baru, install ulang, atau update dari store): aplikasi mengecek OTA terbaru; bila ada, tampil
  layar "Menyiapkan pembaruan…", update diunduh, lalu aplikasi restart otomatis. Tanpa sinyal atau bila terlalu lama (6 dtk cek, 15 dtk unduh),
  aplikasi tetap terbuka dengan versi yang ada.
- **Pembukaan berikutnya**: aplikasi langsung terbuka tanpa menunggu; update diunduh di latar belakang dan aktif di pembukaan berikutnya.
- Pengguna baru dari store merasakan layar pembaruan di buka pertama hanya bila build store yang mereka pasang sudah memuat fitur ini.
  Detail teknis: ARCHITECTURE.md ("Update OTA").

### Rencana
Dipetakan ke Bagian B (v2); lihat bagian yang dirujuk untuk keputusan terbarunya.

- Absen pulang → **masuk v2** (B.8, checkout otomatis default aktif).
- Pengajuan izin / cuti dengan persetujuan HR → **masuk v2** (B.6.3, modul Perizinan, paket StartUp).
- Jadwal shift & toleransi keterlambatan per shift → v2 hanya **satu jadwal per perusahaan** dengan toleransi global (B.7); per karyawan/grup/shift ditunda.
- Beberapa lokasi kantor dengan radius geofence yang dikonfigurasi → v2: **satu profil perusahaan = satu lokasi**, titik kantor per perusahaan, radius default 200 m (B.6.1, B.8); radius yang bisa diatur ditunda.
- Ekspor rekap CSV/Excel → **masuk v2** sebagai Excel (B.8.1).
- Dark mode mobile → **ditunda**, di luar lingkup v2.

### Di luar lingkup (Bagian A)
Lembur dan integrasi mesin fingerprint (tetap di luar lingkup, juga di v2). Penggajian dan multi-perusahaan (multi-tenant) **masuk v2** (Bagian B).

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
  keamanan di atas; validasi di server adalah pekerjaan lanjutan (diwajibkan sebelum rilis B2B, lihat B.8).

## Metrik keberhasilan

- ≥ 95% karyawan aktif absen lewat aplikasi.
- Waktu rata-rata absen < 30 detik.
- Selisih rekap HR vs. data sistem mendekati nol.

## Pertanyaan terbuka

Pertanyaan v1 sudah dijawab di Bagian B:

- Lokasi kantor & radius → satu lokasi per profil perusahaan, radius default **200 m** (B.6.1, B.8).
- Aturan keterlambatan → **global per perusahaan**, toleransi default 15 menit (B.7.3).
- Absen pulang → **masuk v2**, checkout otomatis default aktif (B.8).
- Siapa yang boleh jadi admin → **lima peran** dua lapis: platform dan perusahaan (B.3).

---

# Bagian B — Pengembangan selanjutnya: SapaKerja v2 (B2B multi-perusahaan)

> Status: **DRAFT v2** — 23 Nov 2026. Disusun dari brief PM dan PRD v1.
> Menggantikan PRD v1 (absensi internal satu perusahaan) setelah dikerjakan. Bagian yang ditandai **❓** perlu diputuskan tim produk sebelum
> dikerjakan; daftar lengkapnya ada di "14. Pertanyaan terbuka".
>
> **Belum diimplementasi.** Penomoran bagian di bawah (1–15) dirujuk sebagai "B.n" dari Bagian A; rujukan "bagian n" / "lihat n.n" di dalam Bagian B merujuk ke Bagian B.

## Strategi rilis

Aplikasi mobile saat ini **1.0.4**. v2 dikirim bertahap, dan nomor versi aplikasi ditentukan oleh jenis perubahannya:

- **Hanya JavaScript/aset** (layar, logika, i18n, gambar) → dirilis lewat **OTA**; versi aplikasi **tetap 1.0.4**.
- **Perlu perubahan native** (library native baru, `app.json`/izin/plugin, `google-services.json`, sertifikat) → **build baru**; CI otomatis menaikkan versi patch menjadi **1.0.5** dan mengirim ke TestFlight / Play internal. Lihat "Update aplikasi lewat OTA" di Bagian A dan ARCHITECTURE.md ("Build native otomatis").
- **Pasti butuh build baru**: login Google & Apple (bagian 10). Perkiraan yang perlu diverifikasi (`npx expo config --type introspect`) saat dikerjakan: pemilih titik di peta, notifikasi aplikasi, ambil foto dari galeri (perizinan), WebView pembayaran, unduh/bagikan PDF slip gaji dan Excel. Perubahan native yang tidak ada di Expo Go perlu didiskusikan dulu (lihat AGENTS.md, bagian Mobile).
- **Backend dan dashboard** dideploy sendiri dan tidak terikat versi aplikasi. Karena build 1.0.4 yang sudah beredar tidak ikut berubah sampai penggunanya memperbarui, backend perlu **tetap melayani klien 1.0.4** (login dan absen v1) selama masa transisi. *(Catatan penyusunan dokumen, belum diputuskan tim produk.)*

## 1. Latar belakang

SapaKerja v1 dibangun sebagai sistem absensi internal untuk satu perusahaan. Di v2, SapaKerja menjadi **produk B2B
(SaaS)** yang dipakai banyak usaha — UMKM, startup, hingga perusahaan — untuk absensi dan administrasi karyawan mereka.

Konsekuensi utama perubahan ini:

- **Multi-perusahaan (multi-tenant)**: satu sistem melayani banyak perusahaan dengan data yang terisolasi. (Di v1 ini
  "di luar lingkup".)
- **Akun SapaKerja bersifat pribadi**, terpisah dari perusahaan. Satu orang punya satu akun, lalu bergabung ke
  perusahaan lewat undangan atau dibuatkan akun oleh perusahaannya.
- **Monetisasi**: paket berlangganan dengan tagihan pascabayar lewat Xendit.
- **Manajemen dari HP**: Owner/Admin bisa mengelola perusahaan dari aplikasi mobile, tidak hanya dari dashboard web.
- **Panel internal SapaKerja** (Mode Developer) untuk tim SapaKerja sendiri.

### Platform

| Platform      | Alamat / distribusi        | Pengguna                                              |
| ------------- | -------------------------- | ----------------------------------------------------- |
| Dashboard web | sapakerja.com              | Owner, Admin (Mode Manajemen); Super Admin & Operator (Mode Developer) |
| Aplikasi mobile | App Store & Play Store   | Semua peran (Mode Umum; Mode Manajemen untuk Owner/Admin) |

## 2. Tujuan

1. Usaha baru dapat mendaftar, membuat profil perusahaan, dan mengundang karyawan secara mandiri (self-service), tanpa
   bantuan tim SapaKerja.
2. Karyawan dapat absen masuk < 30 detik dari buka aplikasi (dipertahankan dari v1).
3. Owner/Admin melihat status kehadiran hari ini secara langsung dan mengelola karyawan dari web maupun HP.
4. Tagihan dihitung otomatis dari jumlah karyawan dan dibayar online; tagihan yang tidak dibayar ditegakkan otomatis.
5. Bukti absen (lokasi + foto) cukup untuk menekan kecurangan, dengan validasi **di server**.

## 3. Peran & hak akses

> Catatan: brief hari pertama menyebut peran Admin, HR, Karyawan. Brief hari kedua (yang dipakai di PRD ini)
> menggantinya menjadi lima peran. Pemetaannya: "Admin" lama → **Super Admin / Operator**; "HR" lama → **Owner /
> Admin**; "Karyawan" tetap.

Peran terbagi dua lapis:

- **Peran platform** — melekat pada akun, berlaku di seluruh SapaKerja: Super Admin, Operator.
- **Peran perusahaan** — melekat pada keanggotaan di satu perusahaan: Owner, Admin, Karyawan.

Kedua lapis ini **terpisah**. Peran platform tidak memberi akses ke data perusahaan mana pun. Seorang Super Admin
atau Operator bisa saja juga menjadi anggota sebuah perusahaan, tetapi lewat jalur yang sama dengan user lain, dan di
perusahaan itu ia hanya punya wewenang sesuai peran perusahaannya.

| Peran        | Lapis      | Siapa                                    | Ringkasan wewenang |
| ------------ | ---------- | ---------------------------------------- | ------------------ |
| Super Admin  | Platform   | CEO/COO/CTO SapaKerja                    | Semua wewenang Operator + kelola Operator dan Super Admin lain |
| Operator     | Platform   | Tim operasional SapaKerja                | Lihat jumlah & daftar user dan perusahaan (laporan & monitoring: versi selanjutnya) |
| Owner        | Perusahaan | Pembuat profil perusahaan (otomatis)     | Semua wewenang Admin + tentukan Admin, ganti paket, hapus & alihkan perusahaan; **tagihan dibebankan kepada Owner** |
| Admin        | Perusahaan | Karyawan yang ditunjuk Owner             | Kelola karyawan, absensi, jadwal kerja, perizinan, penggajian (sesuai paket) |
| Karyawan     | Perusahaan | Anggota perusahaan                       | Mode Umum: absen, riwayat pribadi, profil, pengajuan & slip gaji (sesuai paket) |

### 3.1 Super Admin & Operator

- Super Admin dapat **menambah, mengubah, menghapus, menonaktifkan peran, dan melihat** Operator. Menonaktifkan atau
  menghapus hanya mencabut **peran** Operator; akunnya tetap ada dan bisa login sebagai user biasa, tanpa akses Mode
  Developer.
- Super Admin dapat menetapkan user lain menjadi Super Admin atau Operator. **Operator tidak dapat** menetapkan
  Operator lain.
- Fitur yang bisa diakses Operator juga bisa diakses Super Admin; pengelolaan Operator hanya untuk Super Admin.
- Keduanya dapat:
  - melihat jumlah user dan daftar user SapaKerja (laporan & monitoring berupa diagram/laporan menyusul di versi
    selanjutnya);
  - membuat perusahaan (seperti user biasa, dan otomatis menjadi Owner perusahaan itu).
- **Keanggotaan di perusahaan pelanggan**: Super Admin/Operator **tidak bisa masuk ke perusahaan mana pun tanpa izin**.
  Karena sudah punya akun SapaKerja, mereka bergabung dengan **akun yang sama** lewat **undangan email atau tautan
  undangan** yang dibuat Owner/Admin perusahaan tersebut, sama seperti user lain yang sudah punya akun (lihat 5.3).
  Tidak ada akun terpisah untuk perusahaan: satu akun SapaKerja dipakai untuk login dan untuk semua keanggotaan
  perusahaan.
- Di perusahaan itu, perannya ditentukan Owner/Admin seperti anggota lain. Contoh: seorang Super Admin SapaKerja bisa
  berstatus **Karyawan** biasa di sebuah perusahaan.
- Sebagai anggota, ia diperlakukan sama dengan anggota lain, termasuk **dihitung dalam jumlah karyawan** untuk tagihan.
- Peran **Super Admin pertama** tidak dapat dihapus atau dinonaktifkan. Dengan begitu SapaKerja selalu punya minimal satu
  Super Admin.
- Peran Super Admin lainnya (**bukan Super Admin pertama**) dapat **dinonaktifkan atau dicabut** oleh sesama Super
  Admin. Akunnya tetap ada dan bisa login sebagai user biasa, tanpa akses Mode Developer.

### 3.2 Owner, Admin, Karyawan

- User pertama yang membuat profil perusahaan otomatis menjadi **Owner**.
- Owner dapat memasukkan orang ke perusahaan dengan tiga cara (lihat 5.3): undang via email, tautan undangan, atau
  buatkan akun.
- Owner menentukan karyawan mana yang menjadi **Admin**. Admin dapat mengakses dashboard dan Mode Manajemen, serta
  mengelola karyawan, absensi, jadwal kerja, penggajian, dan modul lain **sama seperti Owner**.
- Owner dan Admin juga karyawan: mereka bisa absen, melihat riwayat, dan mengajukan izin di Mode Umum.
- **Tagihan** penggunaan layanan SapaKerja di sebuah perusahaan **dibebankan kepada Owner** perusahaan tersebut.
- **Hanya Owner** yang dapat mengangkat dan mencabut Admin.
- Konsep Owner sama dengan **Super Admin pertama**, tetapi di tingkat perusahaan: Owner adalah orang yang pertama
  membuat profil perusahaan, dan **tidak dapat dicabut perannya atau dikeluarkan dari perusahaan oleh Admin**. Admin dapat
  dikelola oleh Owner, tetapi tidak sebaliknya.
- Paket perusahaan **dapat diganti** (naik atau turun); aturannya ada di 6.5.
- **Mengganti paket** dan **menghapus perusahaan** hanya dapat dilakukan **Owner**, dengan peringatan dan konfirmasi
  ketat berupa mengetik pernyataan:
  - Hapus perusahaan: *"Saya bersedia menghapus profil perusahaan saya di SapaKerja, dan mengerti tidak dapat
    memulihkan lagi data perusahaan saya di SapaKerja jika telah saya hapus."*
  - Ganti paket: *"Saya mengganti paket menjadi paket [nama paket] dan mengetahui akan dikenakan skema pembayaran yang
    baru, dengan tagihan yang lebih [murah/mahal] dari paket saya sebelumnya."* (bagian dalam kurung diisi otomatis
    oleh sistem)
- Saat perusahaan dihapus, tagihannya **tidak hilang**, tetapi **dialihkan menjadi tagihan pribadi** akun Owner
  (**Personal Invoice**). Ini mencakup tagihan perusahaan yang belum lunas, dan pemakaian bulan berjalan yang belum
  ditagihkan (hari-hari pemakaian sebelum perusahaan dihapus). Lihat 6.6.
- Akun yang memiliki **Personal Invoice belum lunas** **tidak dapat membuat profil perusahaan baru** sampai tagihan
  pribadinya dibayar lunas. Ini mencegah Owner menghapus perusahaan untuk menghindari tagihan lalu membuat perusahaan
  baru dengan 5 karyawan gratis lagi.
- **Owner hanya satu akun / satu orang** per perusahaan.
- **Alih kepemilikan**: Owner dapat memindahkan peran Owner ke akun lain yang sudah menjadi anggota perusahaan
  (Karyawan atau Admin). Karena tindakan ini tidak bisa dibatalkan sendiri oleh Owner lama, sistem menampilkan
  **peringatan dan konfirmasi ketat**, misalnya Owner harus mengetik ulang nama perusahaan atau pernyataan
  *"Saya bersedia memindahkan akses owner saya pada profil perusahaan saya di SapaKerja."*
- Setelah dialihkan, Owner lama **otomatis menjadi Admin**. Selanjutnya ia dikelola Owner baru seperti Admin lainnya.
- Owner baru yang dipilih Owner lama **langsung menjadi Owner tanpa verifikasi** atau persetujuan darinya.
- Sejak pengalihan, **penagihan langsung berpindah ke Owner baru**, termasuk semua **tagihan yang belum dibayar**, yang
  akan ditagihkan kepadanya.
- **Satu akun boleh punya atau menjadi anggota banyak perusahaan**: menjadi Owner di lebih dari satu perusahaan, dan/atau
  Admin atau Karyawan di perusahaan lain. Perpindahan antar perusahaan memakai **pemilih perusahaan** (company
  switcher), dengan referensi seperti perpindahan workspace di Jira (lihat 4.3).

### 3.3 Matriks akses ringkas

| Kemampuan                                   | Karyawan | Admin | Owner | Operator | Super Admin |
| ------------------------------------------- | :------: | :---: | :---: | :------: | :---------: |
| Absen, riwayat pribadi, profil              | ✓        | ✓     | ✓     |          |             |
| Pengajuan izin/cuti, slip gaji (StartUp)    | ✓        | ✓     | ✓     |          |             |
| Kelola karyawan, absensi, jadwal kerja      |          | ✓     | ✓     |          |             |
| Kelola perizinan & penggajian (StartUp)     |          | ✓     | ✓     |          |             |
| Angkat/cabut Admin                          |          |       | ✓     |          |             |
| Pilih/ganti paket, hapus perusahaan         |          |       | ✓     |          |             |
| Menanggung & membayar tagihan               |          |       | ✓     |          |             |
| Mode Developer: user & perusahaan          |          |       |       | ✓        | ✓           |
| Kelola Operator & Super Admin               |          |       |       |          | ✓           |

Kolom Operator dan Super Admin hanya menunjukkan wewenang **platform**. Bila Super Admin/Operator juga anggota sebuah
perusahaan, wewenangnya di perusahaan itu mengikuti kolom peran perusahaannya (Karyawan, Admin, atau Owner).

## 4. Mode tampilan

### 4.1 Aplikasi mobile

| Mode            | Untuk                    | Isi |
| --------------- | ------------------------ | --- |
| **Mode Umum**   | Semua anggota perusahaan | Absensi, riwayat absensi pribadi, kelola profil/akun; **Paket StartUp:** riwayat penggajian (slip gaji), pengajuan cuti, izin, sakit, terlambat |
| **Mode Manajemen** | Owner & Admin         | Kelola data karyawan, riwayat absensi seluruh karyawan, jadwal kerja; modul lain sesuai paket |

- Owner/Admin dapat berpindah antara Mode Umum dan Mode Manajemen. Karyawan hanya melihat Mode Umum.
- Fitur yang tampil di Mode Umum **hanya mengikuti paket perusahaan**. Semua fitur dalam paket yang dipilih Owner
  tampil untuk seluruh karyawan, terlepas dipakai atau tidak oleh perusahaan. Untuk saat ini, Owner/Admin **tidak
  dapat** mematikan fitur di Mode Umum, baik untuk seluruh perusahaan maupun untuk karyawan tertentu.
- **Semua fitur Mode Manajemen di dashboard web juga tersedia di Mode Manajemen mobile** (fitur setara).

### 4.2 Dashboard web (sapakerja.com)

| Mode               | Untuk                   | Isi |
| ------------------ | ----------------------- | --- |
| **Mode Manajemen** | Owner & Admin           | Fitur setara dengan Mode Manajemen mobile |
| **Mode Developer** | Super Admin & Operator  | Data & jumlah user, daftar perusahaan, hari libur nasional; kelola Operator (khusus Super Admin). Laporan & monitoring: versi selanjutnya |

- Dashboard saat ini (v1) hanya punya satu tampilan untuk pengelola perusahaan; tampilan itu menjadi dasar Mode
  Manajemen.
- Dashboard web **tidak punya Mode Umum**: hanya Mode Manajemen dan Mode Developer. Akun yang **bukan** Owner/Admin di
  perusahaan mana pun dan bukan Super Admin/Operator (yaitu user baru tanpa perusahaan, atau akun yang hanya berperan
  Karyawan) **tetap bisa login** ke web, tetapi **tidak bisa masuk ke Mode Manajemen** perusahaan mana pun. Di web ia
  hanya bisa **membuat perusahaan baru** atau **mengatur profil/akun** pribadinya (fitur karyawan seperti absen tetap
  di aplikasi mobile).
- **Membuat profil perusahaan** bebas dilakukan **dari web maupun mobile**. Setelah dibuat, user menjadi Owner dan
  langsung diarahkan ke Mode Manajemen perusahaan tersebut.

### 4.3 Pemilih perusahaan & alur setelah login

Referensi: perpindahan workspace di Jira. Perusahaan dan mode yang dipilih dapat diganti kapan saja tanpa logout.

**Aplikasi mobile**

1. User login, lalu **memilih perusahaan**.
2. Bila ia **Owner/Admin** di perusahaan itu → memilih **Mode Manajemen** atau **Mode Umum**.
3. Bila ia **Karyawan** di perusahaan itu → otomatis masuk **Mode Umum**.
- Pemilih perusahaan juga menyediakan **Buat perusahaan baru**. User yang belum punya perusahaan langsung melihat
  halaman ini.

**Dashboard web**

1. User login, lalu **memilih mode**: Mode Developer atau Mode Manajemen.
   - Pilihan Mode Developer hanya muncul untuk akun **Super Admin/Operator**. Akun biasa langsung ke langkah 2.
2. Bila memilih **Mode Manajemen** (atau akun biasa) → **memilih perusahaan**, lalu otomatis diarahkan ke dashboard
   Mode Manajemen perusahaan tersebut.
   - Daftar perusahaan hanya berisi perusahaan tempat ia menjadi **Owner/Admin** (dashboard web tidak punya Mode Umum).
   - Pemilih perusahaan juga menyediakan **Buat perusahaan baru** (lihat 4.2 untuk akun tanpa perusahaan yang bisa
     dikelola).

- Bila user hanya punya **satu pilihan** di sebuah langkah (mis. hanya satu perusahaan, hanya bisa Mode Umum, atau
  hanya bisa Mode Manajemen di web), langkah itu **dilewati** dan user **otomatis diarahkan** tanpa diberi pilihan.
- Pilihan perusahaan/mode **tidak diingat**. Bila user punya lebih dari satu pilihan, ia **harus memilih setiap kali
  masuk** ke aplikasi atau dashboard, termasuk saat masuk dengan sesi yang masih aktif.
- Sesi login **tetap tersimpan** di perangkat (lihat 5.6): user yang pernah login di perangkat itu bisa masuk tanpa
  login ulang, lalu langsung ke langkah memilih (atau otomatis diarahkan bila hanya satu pilihan).

## 5. Akun & autentikasi

### 5.1 Daftar & masuk

Cara masuk/daftar:

1. **Email + kata sandi**.
2. **Google** (OAuth).
3. **Apple** (Sign in with Apple).

Aturan identitas OAuth:

- Saat daftar via Google/Apple, sistem menyimpan data yang diberikan penyedia: nama, foto profil, email, dan nomor
  telepon bila tersedia, beserta **ID akun penyedia** (Google `sub`, Apple `sub`).
- Login OAuth berikutnya dicocokkan berdasarkan **ID akun penyedia**, **bukan email**.
- Bila user mendaftar via Google/Apple, email dari penyedia menjadi **email utama** akun.
- Nomor telepon dari Google memerlukan scope tambahan (People API) yang termasuk data sensitif dan perlu verifikasi
  aplikasi oleh Google; regulasinya sedang diurus. Sistem harus tetap berjalan bila nomor telepon tidak diberikan.
- Apple dapat memberikan **email relay** (`@privaterelay.appleid.com`) dan hanya mengirim nama pada login pertama.
  Sistem harus menyimpan nama pada login pertama dan menerima email relay sebagai email utama.
- Login Google/Apple **hanya mencocokkan ID akun penyedia** (`sub`), **terlepas dari emailnya**. Email akun Google/Apple
  tidak dipakai untuk mencari atau menggabungkan akun. Bila ID tersebut belum terhubung ke akun mana pun, login
  diperlakukan sebagai **pendaftaran akun baru**.
- **Email utama harus unik** di seluruh SapaKerja. Karena itu, **pendaftaran via Google/Apple ditolak** bila email
  akun Google/Apple tersebut sudah dipakai sebagai email utama akun SapaKerja lain, baik akun itu didaftarkan via email
  maupun via Google/Apple. User diarahkan untuk masuk ke akun tersebut lalu menghubungkan Google/Apple dari profil.
- Daftar dengan email + kata sandi **wajib verifikasi email** dengan kode verifikasi yang dikirim ke email tersebut.
  (Pengecualian untuk akun yang dibuatkan perusahaan dengan email `@[slug].sapakerja.com`, lihat 5.3.)

### 5.2 Hubungkan akun Google/Apple

- User yang mendaftar dengan email dapat **menghubungkan** Google dan/atau Apple dari halaman profil.
- Satu akun Google atau Apple hanya dapat terhubung ke **satu** akun SapaKerja.
- Akun Google/Apple **tidak dapat dihubungkan** bila emailnya sudah terdaftar sebagai **email utama akun SapaKerja
  lain**, baik akun itu didaftarkan via email maupun via Google/Apple. Menghubungkan Google/Apple yang emailnya sama
  dengan email utama akun sendiri tetap boleh.
- Email dari akun Google/Apple yang dihubungkan **disimpan**, tetapi **tidak menggantikan** email utama. (Pengecualian:
  akun dengan email utama `@[slug].sapakerja.com`, yang email utamanya otomatis diganti; lihat 5.3.)
  Contoh: akun didaftarkan dengan `achul@gmail.com`, lalu dihubungkan ke Google `nasrullah@gmail.com`. Email utama tetap
  `achul@gmail.com`.
- **Memutus (unlink) Google/Apple**:
  - Akun Google/Apple yang **dipakai untuk mendaftar** **tidak dapat diputus**. Akun yang daftar via Google tidak bisa
    unlink Google; akun yang daftar via Apple tidak bisa unlink Apple.
  - Akun Google/Apple yang **dihubungkan belakangan** (mis. akun daftar via email lalu menghubungkan Google atau Apple)
    **dapat diputus**. Ini juga berlaku untuk penyedia kedua, mis. akun daftar via Google lalu menghubungkan Apple:
    Apple dapat diputus, Google tidak.

### 5.3 Masuk ke perusahaan

Owner/Admin dapat memasukkan orang ke perusahaan dengan:

1. **Undangan via email** — orang yang diundang menerima email; bila belum punya akun, ia mendaftar dulu lalu
   otomatis bergabung.
2. **Tautan undangan** — dapat dibagikan ke WhatsApp, Instagram, atau kontak. Siapa pun yang membuka tautan
   **langsung bergabung** tanpa persetujuan Owner/Admin. Tautan **berlaku 1 hari** dan **tidak dapat dicabut**
   selama masa berlakunya.
3. **Buatkan akun** — Owner/Admin membuat akun SapaKerja untuk karyawan, yang langsung dapat dipakai login. Ini
   akun SapaKerja biasa (satu akun yang sama untuk login dan keanggotaan perusahaan), tanpa peran platform. Hanya
   untuk orang yang **belum punya akun**: bila email yang diisi sudah terdaftar, sistem mengirim **undangan** ke akun
   tersebut, bukan membuat akun baru.

   Owner/Admin memilih salah satu jenis email untuk akun yang dibuatkan:

   | Jenis email | Contoh | Verifikasi |
   | ----------- | ------ | ---------- |
   | **Email umum** | `achul@gmail.com` | **Wajib** kode verifikasi yang dikirim ke email tersebut |
   | **Email perusahaan SapaKerja** | `achul@bidtech.sapakerja.com` (format `@[slug].sapakerja.com`) | **Tanpa** kode verifikasi |

   `[slug]` adalah slug unik perusahaan (lihat 6.1).

Hal yang perlu ditetapkan:

- Tautan undangan: Owner/Admin **boleh membuat tautan baru** setelah tautan lama kedaluwarsa, dan **boleh ada beberapa
  tautan aktif sekaligus**.
- Karena siapa pun yang memegang tautan langsung bergabung (dan menambah tagihan), Owner/Admin menerima
  **notifikasi setiap ada anggota baru lewat tautan**, agar orang yang tidak dikenal bisa segera dikeluarkan.
- "Buatkan akun" dengan **email umum**: kode verifikasi dikirim ke email karyawan, dan yang **memasukkan kode adalah
  Owner/Admin** yang membuat akun, di layar pembuatan akun. Cara Owner/Admin mendapatkan kode dari karyawan (mis. lewat
  chat atau langsung) **di luar tanggung jawab sistem**.
- Kata sandi pertama akun email umum **dibuat Owner/Admin** saat pembuatan akun, dan **wajib diganti** karyawan saat
  login pertama.
- "Buatkan akun" dengan **email `@[slug].sapakerja.com`**:
  - Alamat ini **hanya pengenal login**, bukan kotak surat; SapaKerja tidak menyediakan fitur mail. Akibatnya akun ini
    **tidak bisa** menerima kode reset kata sandi, login dengan kode (5.4), maupun undangan via email.
  - **Reset kata sandi oleh Owner/Admin**: selama email utama akun masih `@[slug].sapakerja.com` **dan** akun belum
    menautkan Google/Apple, Owner/Admin **perusahaan asal** (pemilik `[slug]`) **dapat mereset kata sandi** akun ini.
  - Setelah email utama diganti ke email umum **atau** akun menautkan Google/Apple, Owner/Admin **tidak bisa lagi**
    mereset kata sandinya; reset kata sandi menjadi **personal** lewat email utama (5.4).
  - Karena itu, saat **login pertama dan login-login berikutnya**, karyawan **disarankan** (bukan diwajibkan) untuk
    **mengganti email utama** ke email pribadi (5.5) atau **menautkan Google/Apple**.
  - Khusus akun ini, **menautkan Google/Apple otomatis mengganti email utama** menjadi email akun Google/Apple
    tersebut (berbeda dengan aturan umum di 5.2). Aturan email utama unik tetap berlaku.
  - **Kata sandi pertama dibuat oleh Owner/Admin** saat membuat akun, dan **wajib diganti** karyawan saat login
    pertama.
  - Bila karyawan **keluar** perusahaan atau perusahaan **dihapus** sementara email utamanya masih
    `@[slug].sapakerja.com`, **akun tetap ada dan tetap bisa login**. Yang hilang hanya pilihan masuk ke Mode Manajemen
    atau Mode Umum perusahaan tersebut. Saran untuk mengganti email utama atau menautkan Google/Apple tetap muncul saat
    login.
  - Setelah keluar, Owner/Admin perusahaan itu **tidak lagi** dapat mereset kata sandi akun ini. Karena alamat
    `@[slug]` tidak menerima email, akun yang belum mengganti email atau menautkan Google/Apple **tidak punya cara
    reset kata sandi** bila lupa.
  - Akun yang email utamanya masih `@[slug].sapakerja.com` **boleh membuat perusahaan sendiri** dan **bergabung ke
    perusahaan lain**. Karena alamatnya tidak menerima email, bergabungnya lewat **tautan undangan** (bukan undangan
    via email).
  - Perusahaan lain tempat akun ini bergabung (termasuk perusahaan yang ia buat sendiri) **tidak dapat mengganti atau
    mereset kata sandinya**. Hanya Owner/Admin perusahaan asal (pemilik `[slug]`) yang bisa, selama syarat di atas
    terpenuhi.
- Akun **email umum** yang dibuatkan perusahaan **tetap menjadi milik pribadi karyawan** bila ia keluar. Keluar dari
  perusahaan hanya mengakhiri keanggotaan; akunnya tetap ada dan dapat dipakai di perusahaan lain.
- Owner/Admin **hanya dapat mengeluarkan** anggota dari perusahaan; **tidak ada** status aktif/nonaktif untuk anggota.
- Karyawan yang keluar / dikeluarkan: data absensi dan penggajiannya **tetap tersimpan** di perusahaan, dan ia tidak
  lagi dihitung dalam tagihan sejak tanggal keluar.

### 5.4 Lupa kata sandi & login dengan kode

- **Reset kata sandi**: sistem mengirim **kode verifikasi** ke email utama; setelah kode benar, user membuat kata sandi
  baru.
- **Login dengan kode**: user dapat masuk dengan **kode unik** yang dikirim ke email utama, tanpa kata sandi.
- Kode selalu dikirim ke **email utama**, bukan ke email akun Google/Apple yang terhubung (lihat contoh di 5.2).
- Akun dengan email utama `@[slug].sapakerja.com` **tidak dapat** memakai reset kata sandi atau login dengan kode,
  karena alamat itu tidak menerima email. Kata sandinya direset oleh Owner/Admin (lihat 5.3).
- Persyaratan keamanan kode: sekali pakai, kedaluwarsa (rekomendasi 10 menit), dibatasi jumlah percobaan dan
  permintaan ulang (rate limit), dan respons tidak membocorkan apakah sebuah email terdaftar.

### 5.5 Ubah email utama

- User yang sudah login dapat mengganti email utama.
- Sistem mengirim **kode verifikasi ke email tujuan**; perubahan baru berlaku setelah kode dikonfirmasi.
- Email tujuan harus belum dipakai sebagai email utama akun lain (email utama unik).
- Rekomendasi tambahan: kirim **pemberitahuan ke email lama** setelah perubahan, agar pengambilalihan akun bisa
  terdeteksi.
- Untuk akun yang daftar via Google/Apple, bila email utama diganti, **login Google/Apple tetap jalan**, karena yang
  dicocokkan adalah ID akun Google/Apple, bukan email (lihat 5.1).

### 5.6 Sesi

- Dipertahankan dari v1: JWT 30 hari, token mobile di secure store. User yang pernah login di sebuah perangkat dapat
  masuk lagi tanpa login ulang selama sesinya masih berlaku.
- Saat **kata sandi direset**, akun **otomatis keluar dari semua perangkat** (semua sesi dicabut), sehingga user perlu
  login ulang dengan kata sandi baru.
- Akun SapaKerja **tidak punya status dinonaktifkan atau terkunci**. Akun selalu bisa login; yang dibatasi hanya akses
  ke perusahaan tertentu (mis. keanggotaan yang dikunci karena tagihan, lihat 6.4).

## 6. Perusahaan, paket & tagihan

### 6.1 Profil perusahaan

- Setiap user dapat membuat profil perusahaan dan otomatis menjadi Owner.
- Saat membuat perusahaan, Owner **memilih paket**.
- Saat membuat profil perusahaan, Owner wajib membuat **slug perusahaan yang unik** di seluruh SapaKerja. Slug dipakai
  antara lain untuk email akun karyawan `@[slug].sapakerja.com` (lihat 5.3).
- Slug **tidak bisa diubah** setelah pertama kali dibuat, sehingga email `@[slug].sapakerja.com` tidak pernah berubah.
  Owner perlu diberi peringatan saat membuat slug bahwa slug bersifat permanen.
- **Kata yang dicadangkan** (tidak dapat dipakai sebagai slug): `www`, `web`, `mail`, `api`, `admin`, `dashboard`,
  `app`, `sapakerja-api`, `api-sapakerja`, `sapakerja`, `sk`, `operator`, `superadmin`, `karyawan`, `owner`.
- **Format slug**: huruf kecil (`a–z`), angka (`0–9`), dan satu-satunya karakter khusus yang diizinkan adalah tanda
  hubung `-`; panjang **3–30 karakter**. **Spasi** yang diketik otomatis diganti dengan `-` (mis. "Toko Maju" →
  `toko-maju`).
- `-` **tidak boleh** berada di **awal** atau **akhir** slug, dan **tidak boleh berurutan** (`--`).
- Slug bersifat **unik selamanya**: slug perusahaan yang sudah dihapus **tidak dapat dipakai lagi** oleh perusahaan lain
  (agar email `@[slug].sapakerja.com` akun lama tidak bentrok).
- **Data profil perusahaan** saat dibuat:
  - **Nama** perusahaan.
  - **Slug** perusahaan (unik, permanen; lihat di atas).
  - **Alamat**.
  - **Titik koordinat** kantor, dipilih lewat peta **Google Maps atau Apple Maps**. Titik ini menjadi titik pusat
    radius absen.
  - **Radius absen**: untuk saat ini default **200 m**.
  - **Zona waktu**: untuk saat ini default **WIB** (`Asia/Jakarta`).
  - **NPWP perusahaan** (**opsional**): bila diisi, dicantumkan di invoice dan slip gaji.
  - **Logo usaha** (**opsional**): dipakai di slip gaji; bila kosong, memakai logo SapaKerja.
  - **Ikut hari libur nasional** (SKB 3 Menteri): default **aktif**, bisa dimatikan (lihat 7.4).
- Radius absen dan zona waktu **bisa diubah per perusahaan di versi selanjutnya** (setelah v2). Di v2 keduanya tetap
  memakai nilai default.
- Satu user **boleh membuat lebih dari satu perusahaan** (dan menjadi Owner di masing-masing).

### 6.2 Paket

Model **hybrid**: gratis untuk 5 karyawan pertama, lalu bayar per karyawan per bulan.

| Paket         | Modul                                                         | Gratis        | Di atas kuota gratis                 |
| ------------- | ------------------------------------------------------------- | ------------- | ------------------------------------ |
| **UMKM**      | Karyawan, Absensi (termasuk Jadwal Kerja)                     | 5 karyawan    | Rp2.000 / karyawan / bulan           |
| **StartUp**   | Karyawan, Absensi (termasuk Jadwal Kerja), Perizinan, Penggajian | 5 karyawan | Rp5.000 / karyawan / bulan           |

- "Karyawan" yang dihitung **termasuk Owner dan Admin**.
- Untuk sementara baru dua paket; struktur data harus memungkinkan paket baru ditambahkan tanpa ubah kode.
- Untuk saat ini **tidak ada aturan masa simpan foto & data per paket**.
- Catatan untuk **versi selanjutnya** (belum diputuskan, di luar lingkup v2): kemitraan PT Piposmart Digital Indonesia
  (pelanggan Business/Pro mendapat SapaKerja gratis seumur hidup, batas belum diputuskan) kelak membutuhkan mekanisme
  paket khusus / kode promo / override harga per perusahaan.

### 6.3 Modul

| Modul        | Isi                                                                 | Paket        |
| ------------ | ------------------------------------------------------------------- | ------------ |
| Karyawan     | Data karyawan, undangan, peran, keluarkan dari perusahaan           | UMKM, StartUp |
| Absensi      | Absen di HP, riwayat absensi, **Pengelolaan Jadwal Kerja** (bagian 7) | UMKM, StartUp |
| Perizinan    | Pengajuan & persetujuan cuti, izin, sakit, terlambat                | StartUp      |
| Penggajian   | Data penggajian karyawan, riwayat/slip gaji di Mode Umum            | StartUp      |

- **Perizinan (sisi karyawan, Mode Umum)**:
  - Karyawan membuat pengajuan dengan memilih **jenis izin**: **Cuti**, **Tidak hadir**, **Terlambat**, **Sakit**, atau
    **Lainnya**.
  - Memilih **rentang hari** izin (tanggal mulai–selesai).
  - Melampirkan **foto** dari **kamera atau galeri** — **wajib**, sebagai bukti (deskripsi saja dianggap kurang
    kuat) — dan mengisi **deskripsi** izin.
  - Sebelum dikirim, karyawan harus melewati **konfirmasi ganda/ketat**. Pengajuan yang sudah dikirim **tidak dapat
    ditarik atau dibatalkan**.
  - Karyawan dapat melihat **riwayat perizinan** beserta **status pengajuannya**.
- **Status pengajuan**: **Menunggu**, **Disetujui**, **Ditolak**. Pengajuan diproses Owner/Admin di Mode Manajemen.
- **Efek ke status absensi** pada hari-hari yang diajukan:
  - Cuti → status absen **Cuti**.
  - Sakit → status absen **Sakit**.
  - Tidak hadir → status absen **Izin Tidak Hadir**.
  - Terlambat → pada hari itu, status **Terlambat** berubah menjadi **Izin Terlambat**.
  - Lainnya → status absen **Izin Lainnya**.
- **Kuota cuti tahunan**: catatan untuk **versi selanjutnya**.
- Status absen **hanya berubah setelah pengajuan Disetujui**. Selama Menunggu atau bila Ditolak, status absen tetap
  seperti hasil absen.

- **Penggajian** dirancang sederhana dan fleksibel agar cocok untuk banyak jenis usaha. Slip gaji terdiri dari dua
  bagian:
  - **Pendapatan**: daftar baris bebas, masing-masing berisi **nama** (mis. "Gaji pokok", "Tunjangan transport",
    "Bonus target"), **deskripsi** (opsional), dan **nominal**.
  - **Potongan**, dua jenis:
    - **Nominal**: **nama** (mis. "Denda keterlambatan"), **deskripsi** (opsional), dan **nominal** rupiah.
    - **Persentase**: **nama** (mis. "Pajak"), **deskripsi** (opsional), dan **nilai persen**, dihitung dari **total
      pendapatan**.
  - Gaji bersih = total pendapatan − total potongan.
- Slip gaji umumnya dibuat **per bulan** oleh **Owner/Admin** di Mode Manajemen.
- Susunan komponen (pendapatan & potongan) dapat **disimpan sebagai template**, lalu template itu dapat **dipakai
  untuk karyawan lain**, sehingga tidak perlu diisi ulang setiap bulan atau untuk setiap karyawan.
- Di v2 semua komponen **diisi manual**; tidak ada potongan otomatis dari data absensi (mis. denda keterlambatan
  diisi sendiri oleh Owner/Admin sebagai baris potongan).
- SapaKerja **hanya mencatat** gaji dan menerbitkan slip; **tidak mentransfer** gaji. **PPh 21 dan BPJS** diisi
  **manual** sebagai baris potongan.
- Karyawan melihat slip gajinya di **Riwayat penggajian** (Mode Umum di aplikasi mobile), dan dapat **mengunduh** setiap
  slip sebagai **PDF** dari sana.
- **Slip gaji** yang diterima karyawan memuat: **nama perusahaan**, **informasi pajak** perusahaan bila ada (NPWP),
  **informasi perusahaan** (alamat), **informasi karyawan**, dan **logo usaha** dari profil perusahaan, atau **logo
  SapaKerja** sebagai pengganti bila perusahaan belum mengunggah logo.

### 6.4 Penagihan

- **Penanggung tagihan**: tagihan dibebankan kepada **Owner** perusahaan.
- **Pascabayar**: tagihan (bill) diterbitkan sistem setiap **tanggal 1** untuk pemakaian bulan sebelumnya.
- **Jatuh tempo**: paling lambat **1 bulan** setelah tagihan diterbitkan.
- **Pembayaran** lewat payment gateway **Xendit** (hosted checkout; kanal QRIS, lihat di bawah). Status
  lunas diperbarui otomatis lewat webhook Xendit.
- **Tagihan tidak dibayar** melewati jatuh tempo → **keanggotaan** karyawan **di luar 5 karyawan pertama dikunci**. 5 karyawan
  pertama tetap bisa memakai layanan.

#### Perhitungan tagihan (prorata harian)

Tagihan dihitung **per hari**, sehingga hanya hari pemakaian yang ditagih.

```
harga per hari  = harga per karyawan per bulan (sesuai paket hari itu) ÷ jumlah hari di bulan tersebut
tagihan bulan   = Σ untuk setiap hari pemakaian: harga per hari × jumlah karyawan berbayar pada hari itu
```

- **Karyawan berbayar** = jumlah karyawan di luar 5 karyawan gratis.
- **Penagihan dimulai sejak hari** jumlah anggota perusahaan **melebihi 5 orang** (termasuk Owner, Admin, dan
  Karyawan). Hari itu ikut dihitung. Selama anggota 5 orang atau kurang, tidak ada yang ditagih.
- Contoh: perusahaan dibuat tanggal 20, lalu pada tanggal 27 anggotanya menjadi 6 orang, di bulan 30 hari → tanggal 1
  bulan berikutnya ditagih untuk 4 hari (27–30) × 1 karyawan berbayar.
- **Ganti paket di tengah bulan** ditagih sesuai paket yang berlaku di masing-masing hari (lihat contoh di 6.5).
- Jumlah karyawan berbayar **dihitung per hari** berdasarkan hari keanggotaan, sehingga karyawan yang masuk atau keluar
  di tengah bulan hanya ditagih untuk hari keanggotaannya.
- **Pembulatan**: perhitungan per hari memakai desimal, lalu total tagihan **dibulatkan sekali ke atas** ke rupiah
  terdekat. Selisihnya ditampilkan sebagai baris **"Biaya pembulatan"** di invoice. Contoh: subtotal Rp24.000,40 →
  biaya pembulatan Rp0,60 → total Rp24.001.

Aturan yang harus ditetapkan sebelum dibangun:

- **"5 karyawan pertama"** = akun **Owner** (yang sedang menjabat), ditambah **4 anggota paling awal** bergabung di
  antara anggota lainnya (Admin maupun Karyawan), berdasarkan urutan bergabung.
- Bila salah satu dari 4 anggota tersebut **keluar**, anggota paling awal berikutnya (urutan ke-5, ke-6, ke-7, dan
  seterusnya) **naik menggantikannya**.
- Karena Owner selalu termasuk, Owner baru setelah **alih kepemilikan** juga otomatis termasuk 5 karyawan pertama dan
  tidak ikut terkunci saat tagihan tidak dibayar.
- **Pengingat tagihan** dikirim pada **H-7, H-3, H-1**, **hari H jatuh tempo**, lalu **setiap hari** setelah melewati
  jatuh tempo sampai tagihan lunas.
- **Kanal pengingat**:
  - **Email** → ke **Owner**.
  - **Notifikasi aplikasi** SapaKerja → ke **Owner dan Admin**.
  - **Banner** di aplikasi SapaKerja pada perusahaan tersebut → tampil untuk **semua anggota** (Owner, Admin, dan
    Karyawan), baik di **Mode Manajemen** maupun **Mode Umum** (termasuk Mode Manajemen di dashboard web).
- Pemberitahuan juga dikirim saat tagihan **terbit** (tanggal 1).
- **Banner** tampil **terus-menerus** sejak tagihan terbit sampai tagihan dibayar lunas.
- **Notifikasi aplikasi** dikirim saat tagihan terbit, lalu pada **H-7, H-3, H-2, H-1, hari H**, dan **setiap hari**
  setelah jatuh tempo sampai tagihan lunas.
- Jadwal H-7, H-3, H-1, hari H, dan setiap hari setelah jatuh tempo (di atas) berlaku untuk **email** ke Owner.
- **Pembukaan kunci**: keanggotaan yang terkunci **otomatis terbuka segera** setelah pembayaran terkonfirmasi (webhook
  Xendit).
- **Saat terkunci karena tagihan**: karyawan **tetap bisa login** ke SapaKerja, tetapi **tidak bisa masuk ke perusahaan
  tersebut** (perusahaan itu tidak bisa dipilih di pemilih perusahaan, atau tampil terkunci). Perusahaan lain tempat
  ia menjadi anggota tidak terpengaruh.
- Selama ada keanggotaan yang terkunci, Owner/Admin **tetap bisa melihat data karyawan** (termasuk yang terkunci),
  tetapi **tidak dapat menambahkan karyawan baru** (undangan email, tautan undangan, maupun buatkan akun) sampai tagihan
  lunas. Tautan undangan yang masih berlaku juga tidak dapat dipakai untuk bergabung selama masa ini.
- Hari-hari saat keanggotaan **terkunci tidak ditagih**, karena karyawan tersebut tidak bisa memakai layanan.
- **Dokumen**: invoice dan kuitansi resmi yang bisa diunduh, diterbitkan atas nama **PT Solusi Bisnis Jalanin Aja
  Dulu** dengan:
  - NIB: **2503260016439**
  - NPWP: **1000000007573369**
  - Alamat: **King Business Centre, Blok A5 No.3, Kel. Belian, Kec. Batam Kota, Kota Batam, Kepulauan Riau 29464**
  - (Sumber: dokumen NIB OSS, terbit 25 Maret 2026.)
- Invoice juga mencantumkan **data pelanggan**: nama perusahaan, nama Owner, dan alamat perusahaan, serta **NPWP
  perusahaan pelanggan bila diisi** (kolom opsional di profil perusahaan, lihat 6.1). Untuk Personal Invoice (6.6),
  data pelanggan adalah akun Owner.
- **Pembayaran dari mobile**: Owner dapat membayar dari aplikasi mobile. Halaman pembayaran Xendit (hosted checkout)
  dibuka di **WebView** di dalam aplikasi.
- **Kanal pembayaran**: untuk saat ini **hanya QRIS**, untuk meminimalkan biaya transaksi. Kanal lain (VA, e-wallet,
  kartu) dapat ditambahkan di versi selanjutnya.
- Catatan risiko: pembayaran di dalam aplikasi tanpa in-app purchase perlu dipastikan lolos review App Store & Play
  Store (layanan B2B umumnya dikecualikan). Bila ditolak, alternatifnya membuka halaman pembayaran di browser.
- Perusahaan yang 5 karyawan atau kurang **tetap menerima invoice** setiap tanggal 1, dengan **total Rp0**. Invoice Rp0
  otomatis berstatus **Lunas** tanpa perlu dibayar (tidak dibuat invoice di Xendit) dan tidak memicu pengingat.

#### Rincian invoice

Invoice menampilkan rincian lengkap pemakaian dalam periode tagihan:

1. **Periode paket**: paket yang berlaku beserta rentang tanggalnya (mis. StartUp 1–10 Nov, UMKM 11–30 Nov).
2. **Daftar anggota** (dalam bentuk list), untuk setiap anggota:
   - **nama lengkap**;
   - rentang tanggal keanggotaan dalam periode tagihan (dari tanggal berapa sampai tanggal berapa);
   - paket yang berlaku pada rentang itu (satu anggota bisa punya beberapa baris bila paket berganti);
   - jumlah hari, harga per hari, dan subtotal.
3. **5 karyawan gratis** (Owner + 4 anggota paling awal) tetap tercantum dengan harga normal yang **dicoret** dan
   **diskon menjadi Rp0**.
4. Hari-hari saat keanggotaan terkunci ditandai dan bernilai Rp0 (tidak ditagih).
5. Subtotal, **biaya pembulatan**, dan **total**.

Contoh baris:

| Anggota | Peran | Periode | Paket | Hari | Harga/hari | Subtotal |
| ------- | ----- | ------- | ----- | ---: | ---------: | -------: |
| Rina Kartika | Owner (gratis) | 1–30 Nov | UMKM | 30 | ~~Rp66,67~~ | ~~Rp2.000~~ **Rp0** |
| Budi Santoso | Karyawan | 15–30 Nov | UMKM | 16 | Rp66,67 | Rp1.066,67 |

### 6.5 Ganti paket

- Paket dapat **dinaikkan** (UMKM → StartUp) atau **diturunkan** (StartUp → UMKM) kapan saja, **hanya oleh Owner**,
  dengan konfirmasi pernyataan (lihat 3.2).
- Saat paket **diturunkan**, akses ke modul dan fitur yang hanya ada di paket lebih tinggi (mis. Perizinan dan
  Penggajian) **otomatis ditutup**, dan data perusahaan di modul tersebut **diblokir** — tidak dapat dilihat atau diubah,
  baik di Mode Manajemen maupun di Mode Umum karyawan.
- Data yang diblokir **tetap disimpan** (tidak dihapus) dan **dibuka kembali** bila paket dinaikkan lagi. Untuk saat
  ini **belum ada batas waktu** penyimpanan.
- Pengajuan izin/cuti yang masih **menunggu persetujuan** saat paket diturunkan **tetap berstatus menunggu
  persetujuan** (tidak dibatalkan). Namun selama paket lebih rendah, Owner/Admin tidak dapat mengakses modul Perizinan
  di dashboard maupun Mode Manajemen mobile, sehingga pengajuan tersebut tidak bisa dilihat atau diproses. Pengajuan
  dapat diproses lagi setelah paket dinaikkan kembali.
- Perubahan berlaku **sejak hari diganti**, dan tagihan bulan itu dihitung per hari sesuai paket yang berlaku.

Contoh (bulan 30 hari, 8 karyawan berbayar setiap hari): 10 hari pertama StartUp, lalu diturunkan ke UMKM untuk 20
hari sisanya.

| Periode    | Paket   | Harga per hari         | Hari | Karyawan berbayar | Subtotal  |
| ---------- | ------- | ---------------------- | ---: | ----------------: | --------: |
| Hari 1–10  | StartUp | Rp5.000 ÷ 30 ≈ Rp166,67 | 10   | 8                 | Rp13.333  |
| Hari 11–30 | UMKM    | Rp2.000 ÷ 30 ≈ Rp66,67  | 20   | 8                 | Rp10.667  |
| **Total**  |         |                        |      |                   | **Rp24.000** |

Hari terjadinya pergantian paket ditagih dengan harga **paket baru**. (Pada contoh di atas, paket diganti pada hari ke-11,
sehingga hari ke-11 sudah ditagih sebagai UMKM.)

### 6.6 Jenis tagihan: Corporate Invoice & Personal Invoice

| Jenis                 | Milik                 | Kapan                                                                        |
| --------------------- | --------------------- | ---------------------------------------------------------------------------- |
| **Corporate Invoice** | Perusahaan (ditanggung Owner) | Tagihan normal, terbit tanggal 1 setiap bulan                        |
| **Personal Invoice**  | Akun pribadi (Owner yang menghapus perusahaan) | Saat perusahaan dihapus dengan tagihan belum lunas atau pemakaian yang belum ditagihkan |

- Saat perusahaan dihapus, Corporate Invoice yang belum lunas **diubah menjadi Personal Invoice** atas akun Owner.
  Invoice lama di Xendit dibatalkan (expire) dan dibuat invoice baru atas nama akun tersebut.
- Pemakaian bulan berjalan dihitung prorata harian sampai hari penghapusan dan dimasukkan ke Personal Invoice.
- Akun dengan Personal Invoice belum lunas **tidak dapat membuat profil perusahaan baru**.
- Personal Invoice dapat dilihat dan dibayar dari halaman akun/profil user (karena perusahaannya sudah tidak ada).
- Pemakaian bulan berjalan **ditagihkan saat penghapusan** (tidak menunggu tanggal 1), lengkap dengan **rincian invoice**
  yang sama seperti invoice biasa (periode paket, daftar anggota, 5 karyawan gratis dicoret Rp0, biaya pembulatan; lihat
  6.4).
- Personal Invoice **langsung jatuh tempo saat penghapusan** perusahaan.
- Penagihan Personal Invoice dilakukan lewat **notifikasi aplikasi**, **email**, dan **banner** di aplikasi SapaKerja
  pada **layar pemilihan perusahaan** dan **halaman profil** akun tersebut, setiap hari (mengikuti aturan "setiap hari
  setelah jatuh tempo") sampai lunas.
- Selain tidak bisa membuat perusahaan baru, akun tetap bisa login dan tetap bisa dipakai di perusahaan lain tempat ia
  menjadi anggota.

## 7. Pengelolaan Jadwal Kerja

Bagian dari **modul Absensi** (satu paket dengan absen di HP dan riwayat absensi). Diakses dari Mode Manajemen (web &
mobile). Pendekatannya **kalender**.

### 7.1 Atur Jadwal Banyak (bulk)

**Jadwal default**: setiap perusahaan baru otomatis memakai jam kerja **08.00–17.00**, hari kerja **Senin–Jumat**, dan
mengikuti hari libur nasional, sampai Owner/Admin mengubahnya.

Dalam satu sesi, Owner/Admin mengisi:

1. **Tanggal mulai** — default hari ini. Boleh memilih tanggal **di masa lalu**, dengan peringatan bahwa perubahan
   **dapat mengubah riwayat absensi karyawan yang sudah ada**.
2. **Berlaku sampai** — Owner/Admin memilih: **sampai tanggal tertentu**, atau **seterusnya** (hingga kedepannya).
   Setelah tanggal akhir lewat, jadwal **kembali ke jadwal default** (08.00–17.00, Senin–Jumat, ikut libur nasional).
3. **Jam masuk & jam pulang** — masing-masing dipilih dari 00.00–23.59 (zona waktu perusahaan, default WIB). Jam pulang
   boleh lebih kecil dari jam masuk untuk jadwal yang melewati tengah malam (lihat 7.3).
4. **Hari kerja** — pilih hari dalam seminggu (mis. Senin–Jumat).
5. **Ikuti hari libur nasional** — default **ya**; hari libur nasional otomatis menjadi hari libur.

Setelah disimpan, seluruh kalender jadwal kerja diperbarui sesuai pengaturan tersebut.

### 7.2 Ubah satu hari

- Owner/Admin memilih tanggal tertentu di kalender lalu mengubah jadwalnya (jam kerja, atau menjadikannya hari libur
  / hari kerja).
- Mengubah tanggal **di masa lalu** menampilkan peringatan yang sama.
- Saat "Atur Jadwal Banyak" dijalankan lagi, perubahan satu hari yang dibuat manual sebelumnya dalam rentang tanggal
  tersebut **ditimpa** oleh jadwal baru. Sebelum menyimpan, sistem menampilkan peringatan bahwa perubahan manual akan
  ditimpa.

### 7.3 Dampak ke absensi

- Status **Tepat Waktu / Terlambat** dihitung dari jam masuk jadwal hari tersebut.
- Perubahan jadwal di masa lalu **menghitung ulang** status absensi pada tanggal terkait. Peringatan sebaiknya
  menyebut **berapa absensi yang akan berubah** sebelum dikonfirmasi, dan perubahan dicatat di log audit.
- **Toleransi keterlambatan** diatur **global per perusahaan** (satu nilai untuk seluruh jadwal), oleh Owner/Admin.
  Absen masuk sampai jam masuk + toleransi masih berstatus Tepat Waktu.
- Nilai **default toleransi** untuk perusahaan baru: **15 menit**.
- **Absen di hari libur ditolak.** Bila hari libur itu kemudian **diubah menjadi hari kerja** (lewat ubah satu hari
  atau "Atur Jadwal Banyak"), hari itu menjadi hari kerja biasa: karyawan dapat absen, dan hari itu **dihitung dalam
  status & rekap absensi** (termasuk bila diubah untuk tanggal yang sudah lewat). Karyawan yang tidak absen pada hari
  itu tercatat **Tidak hadir**.
- **Jam kerja melewati tengah malam didukung**, mis. jam masuk **22.00** dan jam pulang **06.00** (hari berikutnya).
  Absen dihitung untuk **tanggal jam masuk** (absen 22.05 tanggal 10 tercatat sebagai absensi tanggal 10).
- Untuk saat ini jadwal berlaku untuk **seluruh perusahaan** (satu jadwal). Jadwal per karyawan / per grup / per shift
  menyusul di versi selanjutnya.

### 7.4 Hari libur nasional

- **Sumber data**: hari libur nasional & cuti bersama sesuai **SKB 3 Menteri**, diambil dari **API pihak ketiga**.
- Saat **membuat perusahaan**, Owner memilih preferensi **ikut hari libur nasional**; **default aktif**. Owner/Admin
  dapat memilih **tidak memakai** hari libur nasional pada jadwal (juga bisa diatur lewat "Atur Jadwal Banyak", 7.1).
- Data hari libur **dikelola di Mode Developer** (Super Admin/Operator): data di-**fetch dari API pihak ketiga**, lalu
  **disimpan di database SapaKerja**, dan dapat dikoreksi bila perlu (mis. perubahan cuti bersama mendadak). Data
  inilah yang **tampil di kalender jadwal kerja** Mode Manajemen setiap perusahaan yang mengikuti hari libur nasional.
- Perusahaan **bisa menambahkan libur perusahaan** sendiri dengan dua cara:
  - memilih **satu hari** di kalender lalu menjadikannya hari libur (7.2); atau
  - lewat **"Atur Jadwal Banyak"** (7.1), memilih hari libur mingguan (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu,
    Minggu), yaitu hari-hari yang tidak dipilih sebagai hari kerja.

## 8. Absensi (dipertahankan dari v1, disesuaikan multi-perusahaan)

- Absen masuk dengan selfie + koordinat GPS + jarak ke kantor; status Tepat Waktu / Terlambat berdasarkan jadwal kerja.
- Satu absen masuk (dan satu absen pulang) per karyawan per hari (per perusahaan).
- Mode offline: absen disimpan lokal lalu disinkronkan otomatis di latar belakang.
- Foto dikompres otomatis ke WebP (maks 1280×720, ≤ ~500 KB).
- Aturan lokasi v1 (radius 200 m, galat maks 100 m, tolak lokasi perkiraan & lokasi tiruan, pemanasan lokasi di
  Beranda) tetap berlaku, dengan perubahan:
  - **Titik kantor diatur per perusahaan** dari titik koordinat profil perusahaan (tidak lagi `DEFAULT_OFFICE` di
    kode); radius untuk saat ini default 200 m (lihat 6.1).
  - **Validasi radius dan waktu wajib di server** sebelum rilis B2B. Di v1 server hanya menyimpan `distanceMeters`
    kiriman klien; untuk produk yang dijual ke banyak perusahaan, ini celah kecurangan yang harus ditutup.
- **Absen pulang (check-out) masuk v2**, diatur lewat opsi **Checkout otomatis** di pengelolaan absensi (dashboard Mode
  Manajemen dan Mode Manajemen mobile):
  - **Default: aktif.** Sistem otomatis mencatat check-out karyawan; karyawan tidak perlu absen pulang.
  - Owner/Admin dapat **menonaktifkan** opsi ini. Bila nonaktif, karyawan **absen pulang sendiri** dengan cara yang sama
    seperti absen masuk: **selfie + GPS** (aturan lokasi & radius yang sama).
  - Checkout otomatis dicatat pada **jam pulang sesuai jadwal hari itu**.
  - Bila checkout otomatis nonaktif dan karyawan **tidak absen pulang sampai jadwal kerja berikutnya dimulai**, status
    check-out hari itu menjadi **"Tidak absen pulang"**.
  - Status "Tidak absen pulang" **tidak dapat dikoreksi** oleh Owner/Admin.
  - Status **Pulang cepat** (check-out sebelum jam pulang) menjadi catatan untuk **versi selanjutnya**.
- **Satu profil perusahaan untuk satu lokasi kantor.** Usaha dengan beberapa cabang/lokasi membuat profil perusahaan
  terpisah untuk setiap lokasi.

### 8.1 Ekspor rekap absensi (Excel)

- Owner/Admin dapat **mengekspor rekap absensi** ke **Excel (.xlsx)** dengan **format profesional**, dari Mode Manajemen
  (web & mobile). Termasuk paket UMKM dan StartUp (bagian dari modul Absensi).
- Usulan format (❓ perlu dikonfirmasi):
  - **Kop**: logo usaha (atau logo SapaKerja), nama perusahaan, alamat, periode rekap, tanggal ekspor.
  - **Sheet "Rekap"**: satu baris per karyawan — nama, peran, jumlah hari kerja, Tepat Waktu, Terlambat, Izin
    Terlambat, Cuti, Sakit, Izin Tidak Hadir, Izin Lainnya, Tidak hadir, Tidak absen pulang.
  - **Sheet "Detail"**: satu baris per karyawan per hari — tanggal, nama, jam masuk, status masuk, jam pulang, status
    pulang, jarak dari kantor.
  - Tampilan rapi: judul kolom tebal & berwarna, kolom dibekukan, lebar kolom menyesuaikan, format tanggal/jam
    Indonesia, warna status (mis. merah untuk Terlambat).
- ❓ Filter ekspor: rentang tanggal bebas atau per bulan? Bisa memilih karyawan tertentu? Foto selfie disertakan
  (sebagai tautan) atau tidak?

## 9. Mode Developer (panel internal SapaKerja)

Fitur minimum:

- **Kelola pengguna**: Mode Developer tetap memiliki pengelolaan pengguna untuk melihat **siapa saja pengguna
  SapaKerja** (jumlah & daftar user, detail akun, metode masuk yang terhubung).
- **Perusahaan**: daftar perusahaan (termasuk yang sudah dihapus), paket, jumlah karyawan, status tagihan (Belum
  Dibayar, Lunas, Jatuh Tempo); tagihan perusahaan yang dihapus tampil sebagai **Personal Invoice** milik akun Owner.
- **Batas data perusahaan**: Mode Developer hanya dapat melihat **perusahaan apa saja** yang ada beserta data ringkasnya
  (di atas). Super Admin/Operator **tidak boleh melihat siapa saja karyawannya** maupun data karyawan (daftar anggota,
  absensi, perizinan, penggajian). Karena itu, invoice yang tampil di Mode Developer hanya berisi **total & status**,
  tanpa rincian nama anggota (rincian lengkap hanya untuk Owner, lihat 6.4).
- **Detail user** di Kelola pengguna **boleh menampilkan perusahaan mana saja** tempat user tersebut terdaftar. Namun
  **detail perusahaan tidak menampilkan data karyawannya**. (Risiko yang diterima: daftar anggota suatu perusahaan
  secara teori bisa disusun dengan membuka detail user satu per satu; tindakan di Mode Developer tercatat di log audit.)
- **Laporan & monitoring** (diagram/laporan): **catatan untuk versi selanjutnya**, karena kebutuhan data analisis
  SapaKerja belum diputuskan. Tabel berikut disimpan sebagai **bahan usulan** saat fitur ini dirancang (semua angka
  agregat, tanpa membuka isi data perusahaan; ★ = usulan prioritas).

  | Kelompok | Metrik | Untuk apa |
  | -------- | ------ | --------- |
  | Pertumbuhan | ★ User baru & perusahaan baru (harian/mingguan) | Memantau hasil promosi & beta |
  | | ★ Perusahaan aktif (≥ 1 absen dalam 7 hari terakhir) | Metrik keberhasilan utama (bagian 13) |
  | | Sebaran paket (UMKM vs StartUp) & ganti paket naik/turun | Melihat paket mana yang diminati |
  | | ★ Perusahaan berbayar (anggota > 5) | Konversi gratis → berbayar |
  | | Perusahaan dihapus / tidak aktif 30 hari | Churn |
  | Pemakaian | ★ Jumlah absen masuk & pulang per hari | Beban sistem & adopsi |
  | | Waktu dari daftar sampai absen pertama | Kelancaran onboarding |
  | | Absen ditolak (di luar radius, lokasi tiruan, lokasi tidak presisi) | Sinyal kecurangan & masalah GPS |
  | Keuangan | ★ Tagihan terbit vs dibayar per bulan (pendapatan) | Arus kas |
  | | ★ Tagihan tertunggak & perusahaan dengan keanggotaan terkunci | Penagihan & risiko churn |
  | | Personal Invoice belum lunas | Piutang dari perusahaan yang dihapus |
  | Teknis | ★ Error rate & p95 waktu respons API (target < 500 ms) | Persyaratan non-fungsional |
  | | Kegagalan webhook Xendit & sinkronisasi absen offline | Data tagihan/absen yang hilang |
  | | Status terakhir fetch API hari libur | Mencegah salah hitung keterlambatan |
  | | Sebaran versi aplikasi & adopsi update OTA | Memastikan perbaikan sampai ke HP pengguna |
- **Operator** (khusus Super Admin): tambah, ubah, hapus, nonaktifkan peran, lihat; tetapkan Super Admin (akun tetap
  ada, hanya peran yang dicabut).
- **Hari libur nasional**: fetch dari API pihak ketiga, simpan ke database, kelola/koreksi data (lihat 7.4).
- **Log audit**: semua tindakan Super Admin/Operator di Mode Developer.
- Catatan untuk **versi selanjutnya**: kebutuhan operasional lain seperti ubah tagihan manual (diskon, penghapusan),
  buka kunci manual, serta kelola paket & harga dari Mode Developer.

## 10. Update aplikasi lewat OTA (dipertahankan dari v1)

Aturan OTA dari PRD v1 tetap berlaku tanpa perubahan: update JavaScript & aset lewat server SapaKerja sendiri
(`/updates/*`) dengan code signing; perubahan native lewat build baru; `runtimeVersion` (kebijakan `appVersion`) dan
channel `production`; rilis otomatis dari commit `loginrek-mobile/`; layar "Menyiapkan pembaruan…" di pembukaan pertama
sebuah build (6 dtk cek, 15 dtk unduh), unduh di latar belakang pada pembukaan berikutnya. Detail teknis:
ARCHITECTURE.md ("Update OTA"), kontrak di API.md.

Catatan v2: login Google & Apple membutuhkan library native dan perubahan `app.json` → wajib **build baru** di store,
tidak bisa lewat OTA.

## 11. Lingkup

### Masuk v2

- Multi-perusahaan & lima peran (bagian 3).
- Akun pribadi: daftar/masuk email, Google, Apple; hubungkan akun; reset kata sandi; login dengan kode; ubah email
  (bagian 5).
- Undangan & pembuatan akun karyawan (5.3).
- Paket UMKM & StartUp, tagihan pascabayar Xendit, penguncian otomatis (bagian 6).
- Modul Perizinan & Penggajian (paket StartUp).
- Pengelolaan Jadwal Kerja berbasis kalender (bagian 7).
- Mode Umum & Mode Manajemen di mobile; Mode Manajemen & Mode Developer di web (bagian 4).
- Validasi lokasi & waktu absen di server; titik kantor per perusahaan (bagian 8).
- Ekspor rekap absensi ke Excel (bagian 8.1).

### Di luar lingkup v2 — catatan untuk versi selanjutnya (sudah dikonfirmasi)

Semua fitur berikut **tidak dikerjakan di v2** dan menjadi catatan untuk versi selanjutnya:

- Lembur.
- Integrasi mesin fingerprint.
- Transfer gaji otomatis; perhitungan PPh 21 & BPJS otomatis.
- Modul KPI.
- API publik untuk pelanggan.
- Kunjungan lapangan.
- Dark mode mobile.
- Pengaturan radius absen & zona waktu per perusahaan.
- Jadwal per karyawan / grup / shift.
- Status Pulang cepat.
- Kuota cuti tahunan.
- Laporan & monitoring (diagram/laporan) di Mode Developer.
- Ubah tagihan manual, buka kunci manual, serta kelola paket & harga dari Mode Developer.
- Harga khusus mitra Piposmart.
- Kanal pembayaran selain QRIS.

## 12. Persyaratan non-fungsional

- **Isolasi data antar perusahaan**: setiap query data perusahaan wajib terikat ke perusahaan aktif user; diuji
  otomatis. Kebocoran data antar pelanggan adalah risiko terbesar produk B2B.
- **Keamanan**: kata sandi bcrypt; secret hanya di environment; token mobile di secure store; validasi geofence dan
  waktu **di server**; rate limit pada login, kode OTP, dan undangan; webhook Xendit diverifikasi (callback token).
- **Perlindungan data pribadi**: SapaKerja memproses data pribadi karyawan pelanggan (foto wajah, lokasi, nomor
  telepon, data gaji) sehingga perlu mengikuti **UU No. 27/2022 tentang Pelindungan Data Pribadi**. Diperlukan:
  kebijakan privasi & syarat layanan, persetujuan pengguna saat daftar, fitur **hapus akun** (juga diwajibkan App Store
  & Play Store untuk aplikasi yang punya pendaftaran akun), dan aturan masa simpan foto/data. ❓ Perlu ditinjau pihak
  legal.
- **Ketersediaan**: fallback lokal saat PostgreSQL/RustFS belum aktif hanya untuk development (dari v1).
- **Kinerja**: respons API p95 < 500 ms; foto ≤ ~500 KB setelah kompresi. ❓ Target beban perlu dinaikkan dari ~100
  pengguna bersamaan (asumsi v1) — misalnya untuk ~500 outlet mitra Piposmart × 3–10 karyawan yang absen di jam yang
  hampir sama.
- **Bahasa & zona waktu**: UI Indonesia; di v2 zona waktu **WIB** (`Asia/Jakarta`) untuk semua perusahaan. Zona waktu
  per perusahaan (untuk pelanggan WITA/WIT) menyusul di versi selanjutnya; struktur data sebaiknya sudah menyimpan zona
  waktu per perusahaan sejak v2 agar perubahan nanti tidak perlu migrasi besar.
- **Log audit**: perubahan peran, jadwal masa lalu, data absensi, penggajian, dan tindakan Super Admin/Operator di Mode Developer.

## 13. Metrik keberhasilan

- Jumlah perusahaan aktif (≥ 1 absen per minggu) dan pertumbuhannya per bulan.
- Konversi: % perusahaan yang melewati 5 karyawan (berbayar).
- % tagihan dibayar sebelum jatuh tempo; jumlah perusahaan dengan keanggotaan terkunci.
- Waktu dari daftar sampai karyawan pertama absen (onboarding) — target ❓ (mis. < 1 hari).
- ≥ 95% karyawan aktif di perusahaan pelanggan absen lewat aplikasi.
- Waktu rata-rata absen < 30 detik.

## 14. Pertanyaan terbuka

Dikumpulkan dari tanda ❓ di atas, diurutkan dari yang paling memblokir pengembangan.

**Penagihan (memblokir modul tagihan)**
1. Prorata harian & awal penagihan (sudah diputuskan: mulai hari anggota > 5). Jumlah karyawan dihitung per hari
   (sudah diputuskan). Pembulatan ke atas dengan baris biaya
   pembulatan; hari pergantian paket ditagih paket baru (sudah diputuskan).
2. Siapa "5 karyawan pertama" — **sudah diputuskan** (Owner + 4 anggota paling awal; anggota berikutnya naik bila
   ada yang keluar).
3. Keanggotaan terkunci — **sudah diputuskan**: tetap bisa login, tidak bisa masuk perusahaan; terbuka otomatis
   setelah bayar. Data tetap terlihat, tidak bisa tambah
   karyawan baru. Hari terkunci tidak ditagih.
4. Ganti paket (hanya Owner; data diblokir tetap disimpan — sudah diputuskan). Pengajuan menunggu tetap menunggu; hari
   pergantian ditagih paket baru.
5. Masa simpan foto & data per paket — **sudah diputuskan**: tidak ada untuk saat ini.
6. Mekanisme harga khusus mitra Piposmart — ditunda ke versi selanjutnya.
7. Pembayaran dari mobile — **sudah diputuskan**: Xendit di WebView, kanal QRIS saja.

**Peran & perusahaan**
8. Alih kepemilikan — **sudah diputuskan**: Owner baru langsung aktif tanpa verifikasi, tagihan (termasuk yang belum
   dibayar) berpindah ke Owner baru, Owner lama menjadi Admin.
9. Satu akun di beberapa perusahaan — **sudah diputuskan** (boleh; alur di 4.3).
10. Batas data perusahaan di Mode Developer — **sudah diputuskan** (hanya daftar perusahaan, tanpa data karyawan).
    Detail user boleh menampilkan perusahaannya.
11. Tautan undangan — **sudah diputuskan**: langsung bergabung, berlaku 1 hari, tidak bisa dicabut. Boleh membuat
    tautan baru dan beberapa tautan aktif. Owner/Admin mendapat notifikasi anggota baru.
12. Akun yang dibuatkan perusahaan — **sudah diputuskan** (verifikasi, kata sandi pertama, email
    `@[slug].sapakerja.com`, aturan slug).

**Akun**
13. Login Google/Apple mencocokkan `sub` saja; email utama unik — **sudah diputuskan**.
14. Verifikasi email saat daftar dan memutus tautan Google/Apple — **sudah diputuskan**.

**Jadwal & absensi**
15. Jadwal per perusahaan (versi selanjutnya: per karyawan/shift); shift lewat tengah malam didukung — **sudah
    diputuskan**.
16. Toleransi keterlambatan global per perusahaan, default 15 menit; absen di hari libur ditolak — **sudah
    diputuskan**.
17. Hari libur nasional — **sudah diputuskan** (API pihak ketiga, default aktif, bisa dimatikan). Libur perusahaan bisa
    ditambahkan; data dikelola di Mode Developer.
18. Absen pulang — **sudah diputuskan** (masuk v2, checkout otomatis default aktif). Checkout otomatis pada jam pulang
    jadwal. Lupa absen pulang → "Tidak absen pulang"
    (tidak dapat dikoreksi); pulang cepat di versi selanjutnya. Satu profil perusahaan = satu lokasi (sudah
    diputuskan).

**Modul StartUp**
19. Perizinan — sisi karyawan **sudah diputuskan** (jenis, foto, deskripsi, riwayat & status). Rentang hari, foto
    wajib, status, tidak bisa ditarik, efek ke absensi juga sudah diputuskan. Status berubah setelah disetujui;
    Lainnya → Izin Lainnya. Kuota cuti: versi selanjutnya.
20. Penggajian — struktur **sudah diputuskan** (pendapatan & potongan nominal/persentase, isi slip). Potongan persen dari
    total pendapatan. Slip per bulan oleh Owner/Admin; template bisa
    dipakai ulang. Semua komponen
    diisi manual. Hanya mencatat (tanpa transfer);
    PPh 21 & BPJS manual. Slip PDF diunduh dari Riwayat penggajian.
    **Selesai.**

**Lain-lain**
21. Cakupan Mode Manajemen mobile — **sudah diputuskan**: setara dengan dashboard web.
22. Laporan & monitoring Mode Developer — ditunda ke versi selanjutnya (usulan metrik tersimpan di bagian 9).
23. Tinjauan legal UU PDP, kebijakan privasi, dan syarat layanan.

**Ditambahkan saat penggabungan dokumen (belum dibahas tim produk)**
24. Migrasi data v1: karyawan, absensi, dan akun yang sudah ada (termasuk akun `@loginrek.com`) masuk ke perusahaan mana,
    siapa Owner-nya, dan paket apa? Perlu keputusan sebelum skema multi-perusahaan dimigrasikan.
25. Masa transisi klien 1.0.4: sampai berapa lama backend wajib melayani login/absen v1 untuk build yang belum
    diperbarui (lihat "Strategi rilis")?

## 15. Dampak ke kode & dokumen saat ini

*(Catatan penggabungan; ringkasan dokumen/aturan di repo yang akan berubah ketika v2 dikerjakan. Perbarui di PR yang sama dengan perubahannya.)*

- **Hak akses**: AGENTS.md ("Autentikasi & hak akses") mendefinisikan peran = `users.is_admin`, `RequireAuth` + `RequireAdmin`. v2 menggantinya dengan
  peran platform + keanggotaan perusahaan (bagian 3) dan isolasi data per perusahaan (bagian 12). Aturan larangan token palsu/offline, kata sandi cadangan, dan
  daftar akun di kode klien/server **tetap berlaku**.
- **Domain email akun**: identifier teknis `@loginrek.com` (AGENTS.md) berbeda dari email perusahaan v2 `@[slug].sapakerja.com`; nasib akun lama ada di pertanyaan 24.
- **Skema & API**: model baru (perusahaan, keanggotaan, paket, jadwal, perizinan, penggajian, invoice, hari libur, log audit) → perbarui `docs/ARCHITECTURE.md` (skema)
  dan `docs/API.md` (endpoint, respons `{ "data": ... }`, `camelCase`). Route baru didaftarkan di `internal/router/router.go` dan diuji di `router_test.go`.
- **Absensi**: `DEFAULT_OFFICE` (Bagian A, "Aturan lokasi absen") digantikan titik kantor per perusahaan; validasi radius & waktu pindah ke server.
- **Dashboard**: dashboard HR berbahasa Indonesia saja dan satu layout grup `app/(dashboard)/`; Mode Manajemen/Developer, pemilih perusahaan, dan rute baru perlu didaftarkan
  di `app/robots.ts`. Bila situs publik/kebijakan privasi berubah (login Google/Apple, pembayaran Xendit sebagai pihak ketiga), perbarui juga `i18n`, `public/llms*.txt`, dan bagian 7 Kebijakan Privasi.
- **Mobile**: teks UI lewat i18n (`id`/`en` sinkron); library native mengikuti aturan Expo di AGENTS.md; setelah menambah modul native, periksa izin akhir dengan `npx expo config --type introspect`.
