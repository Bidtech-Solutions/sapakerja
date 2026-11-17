// Kamus bahasa Indonesia (bahasa utama, dilayani di "/"). Bahasa Inggris (en.ts) wajib punya kunci yang sama:
// dicek `npm run typecheck`. Teks bertanda {company}/{email}/{time} diisi saat render.

import type { PrivacySection } from '@/lib/types';

const id = {
  ogLocale: 'id_ID',
  name: 'Indonesia',
  switchTo: 'Switch to English',
  switchShort: 'EN',

  meta: {
    title: 'SapaKerja: Aplikasi Absensi Selfie & GPS untuk Kantor',
    description:
      'SapaKerja adalah aplikasi absensi karyawan dengan selfie dan lokasi GPS dari HP. Karyawan absen dalam hitungan detik, HR memantau kehadiran lewat dashboard web. Produk dari Bidtech, tersedia di iPhone dan Android.',
    keywords: [
      'aplikasi absensi',
      'absensi karyawan',
      'absensi selfie',
      'absensi GPS',
      'presensi online',
      'aplikasi HR',
      'dashboard HR',
      'SapaKerja',
      'Bidtech',
    ],
    privacyTitle: 'Kebijakan Privasi',
    privacyDescription:
      'Kebijakan Privasi aplikasi absensi SapaKerja: data apa yang dikumpulkan, tujuan penggunaan, izin perangkat, penyimpanan, dan hak karyawan.',
    notFoundTitle: 'Halaman tidak ditemukan',
  },

  a11y: {
    skip: 'Lewati ke konten utama',
    mainNav: 'Navigasi utama',
    home: 'SapaKerja, ke atas',
    phoneOf: 'Tampilan layar {screen} aplikasi SapaKerja',
    mapTitle: 'Peta lokasi kantor Bidtech di Batam Kota',
    footerFeatures: 'Fitur',
    footerCompany: 'Perusahaan',
    heroCarousel: 'Tampilan layar aplikasi SapaKerja, bergantian otomatis',
    featuresCarousel: 'Fitur aplikasi SapaKerja, geser ke samping untuk melihat fitur lainnya',
    featureDot: 'Lihat fitur {n} dari {total}',
  },

  nav: {
    features: 'Fitur',
    faq: 'FAQ',
    contact: 'Kontak',
    download: 'Unduh',
    cta: 'Hubungi Kami',
  },

  hero: {
    // Judul hero: satu tulisan besar, dua baris (tanpa teks kecil).
    title: ['Datang Tepat Waktu,', 'Kantor Lebih Teratur'],
    appStoreAlt: 'Unduh SapaKerja di App Store',
    playStoreAlt: 'Dapatkan SapaKerja di Google Play',
    phones: {
      beranda: 'Lihat status hari ini',
      presensi: 'Sapa kamera',
      konfirmasi: 'Kirim presensi',
      riwayat: 'Cek riwayat',
    },
  },

  features: {
    eyebrow: 'FITUR SAPAKERJA',
    title: 'Semua yang dibutuhkan untuk absen setiap pagi.',
    lead: 'Dari selfie di depan kamera sampai rekap bulanan, berikut fitur yang sudah bisa dipakai di aplikasi SapaKerja hari ini.',
    items: [
      {
        id: 'fitur-presensi',
        screen: 'presensi',
        tag: 'PRESENSI SELFIE',
        title: 'Absen cukup dengan sapa kamera.',
        body: 'Karyawan absen dari HP-nya sendiri. Wajah dan lokasi dicek saat itu juga, jadi tidak perlu antre di mesin fingerprint dan tidak bisa dititipkan.',
        points: [
          { h: 'Bingkai wajah di kamera.', t: 'Membantu karyawan memposisikan selfie dengan benar.' },
          { h: 'Lokasi dicek otomatis.', t: 'Terlihat apakah karyawan berada di area kantor, lengkap dengan jaraknya dalam meter.' },
          { h: 'Jam berjalan langsung di layar.', t: 'Karyawan tahu persis pukul berapa ia absen, dalam WIB.' },
          { h: 'Pengingat pencahayaan.', t: 'Supaya wajah di foto absen selalu terlihat jelas.' },
        ],
      },
      {
        id: 'fitur-konfirmasi',
        screen: 'konfirmasi',
        tag: 'KONFIRMASI & STATUS',
        title: 'Cek dulu, kirim, langsung tercatat.',
        body: 'Sebelum dikirim, karyawan bisa melihat fotonya sendiri. Setelah dikirim, jam masuk dan status kehadiran tercatat tanpa perlu dihitung manual.',
        points: [
          { h: 'Pratinjau foto.', t: 'Kurang jelas? Tinggal ketuk Foto Ulang.' },
          { h: 'Waktu absen tercatat di server.', t: 'Jam masuk ditampilkan jelas setelah presensi terkirim.' },
          { h: 'Status otomatis.', t: 'Tepat Waktu atau Terlambat ditentukan dari jam kerja kantor.' },
          { h: 'Langsung sampai ke HR.', t: 'Foto dan lokasi GPS tampil di Web Dashboard HR begitu presensi dikirim.' },
        ],
      },
      {
        id: 'fitur-beranda',
        screen: 'beranda',
        tag: 'BERANDA',
        title: 'Status hari ini, sekali lihat.',
        body: 'Begitu aplikasi dibuka, karyawan langsung tahu apakah ia sudah absen hari ini dan bagaimana kehadirannya bulan ini.',
        points: [
          { h: 'Kartu status harian.', t: 'Belum Absen, Tepat Waktu, atau Terlambat, dengan warna yang mudah dibedakan.' },
          { h: 'Jam kerja dan waktu masuk.', t: 'Jam kerja kantor ditampilkan berdampingan dengan jam masuk karyawan.' },
          { h: 'Rekap bulan ini.', t: 'Jumlah hari tepat waktu dan terlambat, beserta total durasi keterlambatan.' },
          { h: 'Presensi 5 hari terakhir.', t: 'Catatan jam masuk hari-hari kerja sebelumnya.' },
        ],
      },
      {
        id: 'fitur-riwayat',
        screen: 'riwayat',
        tag: 'RIWAYAT PRESENSI',
        title: 'Riwayat kehadiran yang rapi.',
        body: 'Karyawan bisa membuka catatan kehadirannya sendiri kapan saja, tanpa harus bertanya ke HR.',
        points: [
          { h: 'Pilih bulan.', t: 'Geser ke bulan sebelumnya untuk melihat catatan lama.' },
          { h: 'Ringkasan bulanan.', t: 'Jumlah hadir, terlambat, dan tidak hadir dalam satu baris.' },
          { h: 'Aktivitas harian.', t: 'Setiap hari kerja tercatat dengan jam masuk dan statusnya.' },
        ],
      },
      {
        id: 'fitur-profil',
        screen: 'profil',
        tag: 'PROFIL & AKUN',
        title: 'Akun diurus karyawan sendiri.',
        body: 'Hal-hal kecil soal akun tidak perlu lagi lewat HR atau tim IT.',
        points: [
          { h: 'Ubah foto profil.', t: 'Langsung dari kamera atau galeri.' },
          { h: 'Nama terkunci.', t: 'Nama lengkap mengikuti data dari HR, jadi tidak bisa diubah sembarangan.' },
          { h: 'Ganti kata sandi sendiri.', t: 'Cukup masukkan kata sandi lama dan yang baru, minimal 8 karakter.' },
          { h: 'Keluar dari akun.', t: 'Aman saat berganti HP.' },
        ],
      },
    ],
  },

  faq: {
    eyebrow: 'PERTANYAAN UMUM',
    title: 'Pertanyaan yang sering diajukan.',
    items: [
      {
        q: 'Apa itu SapaKerja?',
        a: 'SapaKerja adalah aplikasi absensi untuk kantor. Karyawan mencatat kehadiran lewat selfie dan lokasi GPS dari HP (iPhone atau Android), sedangkan HR memantau kehadiran lewat dashboard web. SapaKerja adalah produk dari Bidtech.',
      },
      {
        q: 'Bagaimana cara karyawan absen di SapaKerja?',
        a: 'Karyawan membuka aplikasi, menekan tombol Presensi, mengambil selfie dengan bingkai wajah, lalu mengirimnya. Lokasi dicek otomatis dan jaraknya ke kantor ditampilkan dalam meter. Setelah terkirim, jam masuk dan status kehadiran langsung tercatat.',
      },
      {
        q: 'Bagaimana status Tepat Waktu atau Terlambat ditentukan?',
        a: 'Statusnya ditentukan otomatis dari jam kerja kantor dan waktu absen yang tercatat di server, sehingga HR tidak perlu menghitungnya secara manual.',
      },
      {
        q: 'Apa yang bisa dilihat HR dari absensi karyawan?',
        a: 'Begitu presensi dikirim, foto dan lokasi GPS karyawan tampil di Web Dashboard HR bersama jam masuk dan statusnya. Karyawan sendiri bisa membuka riwayat kehadirannya per bulan di aplikasi.',
      },
      {
        q: 'Apakah SapaKerja tersedia di iPhone dan Android?',
        a: 'Ya. SapaKerja tersedia di App Store untuk iPhone dan di Google Play untuk Android.',
      },
      {
        q: 'Bagaimana SapaKerja memperlakukan data pribadi karyawan?',
        a: 'Foto presensi hanya dapat diakses oleh HR/admin perusahaan tempat karyawan bekerja dan tidak dibagikan kepada pihak ketiga. SapaKerja tidak melakukan pengenalan wajah. Rinciannya ada di Kebijakan Privasi.',
      },
      {
        q: 'Bagaimana memulai memakai SapaKerja di kantor kami?',
        a: 'Hubungi tim Bidtech lewat WhatsApp atau email. Kami menjelaskan paket, membantu pengaturan awal, dan menyiapkan demo untuk tim HR Anda. Akun karyawan dibuat oleh HR perusahaan.',
      },
      {
        q: 'Siapa yang membuat SapaKerja?',
        a: 'SapaKerja dibuat dan dikelola oleh Bidtech (PT Solusi Bisnis Jalanin Aja Dulu), software house di Batam, Kepulauan Riau.',
      },
    ],
    privacyLink: 'Baca Kebijakan Privasi',
  },

  contact: {
    eyebrow: 'KONTAK',
    title: 'Mau pakai SapaKerja di kantor Anda?',
    lead: 'Tim Bidtech siap menjelaskan paket, membantu pengaturan awal, dan menyiapkan demo untuk tim HR Anda. Sapa kami lewat jalur yang paling nyaman.',
    whatsapp: 'Chat WhatsApp',
    email: 'Kirim Email',
    emailCard: 'Email',
    phoneCard: 'Telepon & WhatsApp',
    phoneLabel: 'Nomor {n}',
    officeTitle: 'Kantor Bidtech',
    officeAddress: 'King Business Centre, Blok A5 No.3, Kel. Belian, Kec. Batam Kota, Batam, 29464',
    openMaps: 'Buka di Google Maps →',
  },

  download: {
    eyebrow: 'UNDUH SAPAKERJA',
    title: 'Absen dari ponsel, mulai besok pagi.',
    lead: 'Pasang SapaKerja di HP karyawan Anda. Satu sapaan setiap pagi, dan kehadiran tim tercatat rapi.',
    chips: ['iPhone & Android', 'Selfie + lokasi', 'Langsung ke dasbor HR'],
  },

  footer: {
    about:
      'Aplikasi absensi untuk kantor. Karyawan mencatat kehadiran dan izinnya sendiri dari HP, HR melihat siapa yang tepat waktu tanpa bertanya satu per satu.',
    featuresTitle: 'FITUR',
    featureLinks: [
      { href: '#fitur-presensi', label: 'Presensi selfie' },
      { href: '#fitur-konfirmasi', label: 'Konfirmasi & status' },
      { href: '#fitur-beranda', label: 'Beranda' },
      { href: '#fitur-riwayat', label: 'Riwayat presensi' },
      { href: '#fitur-profil', label: 'Profil & akun' },
    ],
    companyTitle: 'PERUSAHAAN',
    bidtech: 'Bidtech',
    contact: 'Kontak',
    download: 'Unduh aplikasi',
    privacy: 'Kebijakan privasi',
    hrDashboard: 'Dashboard HR',
    reach: 'HUBUNGI',
    tagline: ['Datang tepat waktu,', 'kantor lebih teratur.'],
    copyright: '© 2026 SapaKerja · sapakerja.com',
    madeBy: 'Produk dari Bidtech · PT Solusi Bisnis Jalanin Aja Dulu',
  },

  notFound: {
    title: 'Halaman tidak ditemukan',
    body: 'Alamat yang Anda buka tidak ada atau sudah dipindahkan.',
    back: 'Kembali ke beranda',
  },

  // Isi layar mockup di dalam bingkai ponsel.

  privacy: {
    brandSub: 'Kebijakan Privasi',
    updatedLabel: 'Terakhir diperbarui:',
    updatedDate: '17 November 2026',
    title: 'Kebijakan Privasi',
    lead: 'Kebijakan ini menjelaskan data pribadi apa yang dikumpulkan SapaKerja, untuk apa data itu dipakai, dan bagaimana data tersebut dijaga.',
    footerLink: 'Ke halaman masuk',
    homeLink: 'Ke beranda SapaKerja',
    sections: [
      {
        title: '1. Pendahuluan',
        blocks: [
          {
            type: 'p',
            text: 'SapaKerja adalah aplikasi absensi karyawan (iOS, Android, dan dashboard web HR) yang dikelola oleh {company} dan hanya digunakan oleh karyawan perusahaan. Akun dibuat oleh HR perusahaan; tidak ada pendaftaran mandiri oleh pengguna.',
          },
        ],
      },
      {
        title: '2. Data yang dikumpulkan',
        blocks: [
          {
            type: 'ul',
            items: [
              'Nama lengkap.',
              'Email (dipakai untuk masuk) dan nomor HP, bila diisi oleh HR.',
              'Jabatan, departemen, dan status kepegawaian (misalnya karyawan, magang, atau PKL).',
              'ID akun (nomor induk internal yang dibuat sistem).',
              'Foto selfie yang diambil saat presensi.',
              'Foto profil (opsional), dipilih sendiri dari galeri foto.',
              'Data lokasi presensi: posisi perangkat dibaca saat presensi untuk menghitung jarak ke titik kantor. Yang tersimpan pada catatan presensi adalah hasil verifikasi, yaitu jarak dari kantor (dalam meter), nama kantor, dan koordinat lokasi acuan presensi.',
              'Waktu presensi dan statusnya (tepat waktu, terlambat), serta penanda bila presensi dikirim belakangan karena perangkat sempat tidak terhubung internet.',
              'Data teknis: token sesi login yang disimpan di penyimpanan aman perangkat, serta log teknis server (misalnya alamat IP dan waktu akses) untuk keamanan dan pemeliharaan.',
            ],
          },
          {
            type: 'p',
            text: 'Bila perangkat sedang offline, data presensi (waktu, foto, dan lokasi) disimpan sementara di penyimpanan aman perangkat dan dikirim ke server setelah koneksi kembali.',
          },
        ],
      },
      {
        id: 'attendance-photos',
        title: '3. Foto Presensi (Attendance Photos)',
        blocks: [
          {
            type: 'p',
            text: 'Saat melakukan presensi, SapaKerja mengambil satu foto melalui kamera perangkat sebagai bukti kehadiran di lokasi kantor yang telah ditentukan. Foto dapat menampilkan wajah pengguna, namun SapaKerja tidak melakukan deteksi wajah maupun pengenalan wajah, tidak membuat data biometrik atau pola wajah (face template), dan tidak menganalisis foto secara otomatis. Foto disimpan di server yang dikelola oleh {company}, hanya dapat diakses oleh tim HR/admin perusahaan tempat pengguna bekerja, tidak dibagikan kepada pihak ketiga mana pun, dan disimpan selama satu tahun sejak data presensi dibuat sebelum dihapus. Pengguna atau perusahaan dapat meminta penghapusan foto lebih awal dengan menghubungi {email}.',
          },
          { type: 'label', text: 'English', lang: 'en' },
          {
            type: 'p',
            lang: 'en',
            text: "When checking in, SapaKerja captures a single photo through the device camera as proof of attendance at the designated office location. The photo may show the user's face, but SapaKerja does not perform face detection or facial recognition, does not create biometric data or face templates, and does not automatically analyze photos. Photos are stored on servers operated by {company}, are only accessible to the HR/admin team of the user's employer, are not shared with any third parties, and are retained for one year after the attendance record is created before being deleted. Users or their employer may request earlier deletion by contacting {email}.",
          },
        ],
      },
      {
        title: '4. Tujuan penggunaan',
        blocks: [
          {
            type: 'ul',
            items: [
              'Mencatat dan memverifikasi kehadiran karyawan.',
              'Menghitung ketepatan waktu kehadiran.',
              'Menyusun rekap kehadiran bagi HR.',
              'Mengelola akun karyawan.',
            ],
          },
          {
            type: 'p',
            text: 'Data tidak digunakan untuk iklan, tidak dijual, dan tidak dipakai untuk melacak pengguna lintas aplikasi atau situs web lain. Aplikasi seluler tidak memuat SDK iklan, analitik, atau pelaporan kerusakan (crash reporting) dari pihak ketiga.',
          },
        ],
      },
      {
        title: '5. Izin perangkat',
        blocks: [
          {
            type: 'ul',
            items: [
              '**Kamera** — mengambil foto selfie untuk presensi.',
              '**Lokasi saat aplikasi digunakan** — memastikan Anda berada di area kantor. Lokasi hanya dibaca ketika aplikasi sedang dibuka untuk presensi; aplikasi tidak melacak lokasi di latar belakang.',
              '**Galeri foto** — memilih foto untuk mengubah foto profil. Aplikasi hanya memakai foto yang Anda pilih.',
            ],
          },
          {
            type: 'p',
            text: 'Izin diminta tepat sebelum fitur terkait dipakai dan dapat Anda cabut kapan saja lewat pengaturan perangkat. Tanpa izin kamera atau lokasi, presensi tidak dapat dilakukan.',
          },
        ],
      },
      {
        title: '6. Siapa yang dapat mengakses',
        blocks: [
          {
            type: 'p',
            text: 'Data presensi dan profil dapat diakses oleh karyawan yang bersangkutan dan oleh admin/HR {company}. Data tidak dibagikan kepada pihak ketiga, kecuali bila diwajibkan oleh hukum atau permintaan resmi dari instansi yang berwenang.',
          },
          {
            type: 'p',
            text: 'Server dan penyimpanan foto dikelola oleh perusahaan. Satu hal yang perlu diketahui: pada dashboard web HR, detail presensi menampilkan peta tersemat dari Google Maps untuk titik lokasi presensi, sehingga Google menerima koordinat titik tersebut dan data teknis peramban admin yang membuka peta.',
          },
        ],
      },
      {
        id: 'website',
        title: '7. Situs web publik sapakerja.com',
        blocks: [
          {
            type: 'p',
            text: 'Bagian ini berlaku bagi pengunjung situs web publik sapakerja.com (halaman perkenalan produk dan halaman ini), bukan bagi pengguna aplikasi.',
          },
          {
            type: 'ul',
            items: [
              '**Google Tag Manager dan Google Analytics** — kami memakai Google Tag Manager untuk memuat alat pengukuran Google Analytics yang mengukur kunjungan, misalnya halaman yang dibuka, perkiraan wilayah, jenis perangkat, dan peramban. Google dapat menyimpan cookie atau pengenal serupa di peramban Anda. Data ini bersifat statistik dan tidak dipakai untuk mengenali Anda secara pribadi.',
              '**Google Maps** — bagian Kontak menampilkan peta tersemat lokasi kantor Bidtech. Saat peta dimuat, Google menerima data teknis peramban Anda (misalnya alamat IP).',
              '**Huruf (font)** — huruf situs ini disajikan dari server kami sendiri, bukan dari Google Fonts.',
              'Situs ini tidak meminta Anda mengisi data pribadi. Bila Anda menghubungi kami lewat WhatsApp atau email, data yang Anda kirim kami pakai hanya untuk menanggapi pesan tersebut.',
            ],
          },
          {
            type: 'p',
            text: 'Anda dapat menolak atau menghapus cookie lewat pengaturan peramban, atau memasang pengaya penolak Google Analytics.',
          },
        ],
      },
      {
        title: '8. Penyimpanan dan keamanan',
        blocks: [
          {
            type: 'ul',
            items: [
              'Data dikirim antara aplikasi/dashboard dan server melalui HTTPS.',
              'Kata sandi disimpan dalam bentuk hash, bukan teks asli.',
              'Akses ke data dibatasi berdasarkan akun dan peran (karyawan atau HR).',
              'Foto disimpan di penyimpanan objek pada server perusahaan.',
              'Token login di perangkat disimpan di penyimpanan aman sistem (Keychain/Keystore).',
            ],
          },
          {
            type: 'p',
            text: 'Tidak ada sistem yang sepenuhnya bebas risiko, tetapi kami berupaya menjaga data dengan langkah teknis yang wajar.',
          },
        ],
      },
      {
        title: '9. Retensi data',
        blocks: [
          {
            type: 'p',
            text: 'Data disimpan selama karyawan aktif dan selama diperlukan untuk keperluan kepegawaian serta kewajiban hukum perusahaan. Setelah itu, data dihapus atau dianonimkan.',
          },
        ],
      },
      {
        title: '10. Hak karyawan',
        blocks: [
          {
            type: 'p',
            text: 'Anda dapat meminta akses, koreksi, atau penghapusan data pribadi Anda melalui HR perusahaan atau melalui email {email}. Pengelolaan data pribadi ini mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
          },
        ],
      },
      {
        title: '11. Anak-anak',
        blocks: [
          {
            type: 'p',
            text: 'Aplikasi ini tidak ditujukan untuk anak di bawah 13 tahun. Seluruh akun dibuat dan dikelola oleh HR perusahaan; tidak ada pendaftaran mandiri.',
          },
        ],
      },
      {
        title: '12. Perubahan kebijakan dan kontak',
        blocks: [
          {
            type: 'p',
            text: 'Kebijakan ini dapat diperbarui sewaktu-waktu. Tanggal pembaruan terakhir tercantum di bagian atas halaman ini. Untuk pertanyaan tentang kebijakan ini, hubungi kami:',
          },
        ],
      },
    ] as PrivacySection[],
  },
};

export default id;
