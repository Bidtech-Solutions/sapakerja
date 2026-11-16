/**
 * Kamus Bahasa Indonesia (bahasa sumber). Bentuk objek ini menjadi tipe `Translation`
 * yang HARUS dipenuhi `en.ts` — kunci yang kurang akan gagal di `npm run typecheck`.
 */
const id = {
  common: {
    employee: 'Karyawan',
    ok: 'OK',
    cancel: 'Batal',
    close: 'Tutup',
    continue: 'Lanjutkan',
    openSettings: 'Buka Pengaturan',
    backToHome: 'Kembali ke Beranda',
    goToMainMenu: 'Ke Menu Utama',
    notice: 'Perhatian',
    loading: 'Memuat…',
    tabs: {
      history: 'Riwayat',
      attendance: 'Presensi',
      profile: 'Profil',
      home: 'Beranda',
    },
    status: {
      onTime: 'Tepat Waktu',
      late: 'Terlambat',
      present: 'Hadir',
      absent: 'Tidak Hadir',
    },
  },

  date: {
    dayShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
    dayLong: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    monthShort: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ],
    monthLong: [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ],
    today: 'Hari ini',
    clockIn: 'Jam Masuk: {{time}} WIB',
  },

  login: {
    tagline: 'Simpan akunmu dengan mudah',
    logoLabel: 'Logo SapaKerja',
    title: 'Masuk',
    subtitle: 'Silakan masuk dengan akun karyawan kamu',
    identifierLabel: 'Email atau No. HP',
    identifierPlaceholder: 'nama@perusahaan.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Masukkan password',
    submit: 'Masuk',
    fillAllFields: 'Silakan isi email dan kata sandi kamu',
    invalidCredentials: 'Email atau kata sandi salah.',
    serverError: 'Terjadi kesalahan pada server. Coba lagi beberapa saat.',
    offline: 'Tidak dapat terhubung ke server. Login pertama wajib online.',
  },

  home: {
    status: {
      holiday: 'Hari Libur',
      closed: 'Kantor Tutup',
      notYet: 'Belum Absen',
    },
    officeHours: 'Jam Kerja Kantor',
    checkInTime: 'Waktu Masuk',
    recapTitle: 'REKAP BULAN INI',
    targetMet: 'Target 95% tercapai',
    noRecords: 'Belum ada catatan',
    totalDuration: 'Total durasi tercatat',
    punctuality: 'Kedisiplinan 100%',
    recentTitle: 'Presensi 5 Hari Terakhir',
    recentSubtitle: 'Catatan jam masuk hari kerja sebelumnya',
    seeAll: 'Semua',
    emptyTitle: 'Belum Ada Riwayat Presensi',
    emptySubtitle: 'Lakukan absensi masuk hari ini untuk mulai mencatat kehadiran kamu.',
  },

  attendance: {
    alreadyTitle: 'Sudah Absen Hari Ini',
    alreadyBody: 'Kamu sudah melakukan absensi masuk hari ini pada pukul {{time}} WIB.',
    cameraNeededTitle: 'Izin Kamera Diperlukan',
    cameraNeededBody: 'Harap berikan izin kamera terlebih dahulu untuk melakukan presensi.',
    locationNeededTitle: 'Izin Lokasi Diperlukan',
    locationNeededBody:
      'Harap aktifkan layanan lokasi (GPS) terlebih dahulu untuk melakukan presensi.',
    outsideTitle: 'Presensi Ditolak (Di Luar Kantor) 🚫',
    outsideBody:
      'Kamu terdeteksi berada di luar area {{office}} sejauh {{distance}} meter.\n\nPresensi hanya dapat dilakukan jika kamu sudah berada di dalam kantor (maksimal {{max}} meter). Karyawan tidak dapat melakukan absensi dari rumah atau luar kantor.',
    checkLocationAgain: 'Cek Lokasi Lagi',
    captureFailedTitle: 'Gagal Mengambil Foto',
    captureFailedBody: 'Terjadi kesalahan saat memproses kamera.',
    submitFailedTitle: 'Gagal Mengirim Presensi',
    submitFailedBody: 'Terjadi kesalahan saat menyimpan presensi.',
    successTitle: 'Presensi Berhasil Terkirim! 🎉',
    alreadyOnServer: 'Kamu sudah tercatat presensi di server hari ini.',
    successBody:
      'Absensi masuk kamu telah tercatat di server pada pukul {{time}} WIB ({{status}}). Foto dan lokasi GPS langsung tampil di Web Dashboard.',
    queuedTitle: 'Presensi Dicatat (Mode Antrean / Offline) 📲',
    queuedBody:
      'Absensi masuk kamu berhasil dicatat pada pukul {{time}} WIB ({{status}}).\n\nData tersimpan aman di HP dan akan otomatis disinkronkan ke server saat jaringan terhubung.',
    recordedTime: 'WAKTU ABSEN TERCATAT',
    attendanceStatus: 'STATUS KEHADIRAN',
    retake: 'Foto Ulang',
    submit: 'Kirim Presensi',
    lightingHint: 'Pastikan pencahayaan cukup dan wajah terlihat jelas',
    insideOffice: 'Di Dalam Kantor ({{distance}}m)',
    outsideOffice: 'Di Luar Kantor ({{distance}}m / Maks {{max}}m)',
    offlineMode: 'Mode Offline (Tersimpan di HP)',
    capturing: 'Menjepret…',
    shutterLabel: 'Tombol Presensi',
  },

  permission: {
    checking: 'Memeriksa izin…',
    camera: {
      askTitle: 'Izin kamera diperlukan',
      askBody:
        'SapaKerja memakai kamera depan untuk mengambil foto selfie saat presensi. Ketuk Lanjutkan, lalu pilih Izinkan pada dialog yang muncul.',
      blockedTitle: 'Kamera belum diizinkan',
      blockedBody:
        'Akses kamera dimatikan untuk SapaKerja. Aktifkan di Pengaturan agar kamu bisa mengambil foto presensi.',
      guideTitle: 'Panduan Singkat',
      steps: [
        { title: 'Buka Pengaturan aplikasi', subtitle: '' },
        { title: 'Pilih menu Izin / Kamera', subtitle: '' },
        { title: 'Aktifkan akses Kamera', subtitle: '' },
      ],
    },
    location: {
      askTitle: 'Izin lokasi diperlukan',
      askBody:
        'SapaKerja memakai lokasi saat aplikasi digunakan untuk memastikan kamu berada di area kantor saat presensi. Ketuk Lanjutkan, lalu pilih Izinkan Saat Aplikasi Digunakan.',
      blockedTitle: 'Lokasi belum diizinkan',
      blockedBody:
        'Akses lokasi dimatikan untuk SapaKerja. Aktifkan di Pengaturan agar kehadiran kamu di area kantor dapat diverifikasi.',
      servicesOffTitle: 'Layanan lokasi (GPS) nonaktif',
      servicesOffBody:
        'Layanan Lokasi di perangkat kamu sedang mati. Aktifkan agar SapaKerja dapat memverifikasi posisi kamu saat presensi.',
      guideTitle: 'Panduan Cepat',
      stepsBadge: '3 LANGKAH',
      steps: [
        {
          title: 'Buka Pengaturan perangkat',
          subtitle: 'Masuk ke menu setelan privasi atau aplikasi',
        },
        {
          title: 'Aktifkan Layanan Lokasi (GPS)',
          subtitle: 'Pastikan mode akurasi tinggi menyala',
        },
        {
          title: "Beri izin lokasi 'Saat Aplikasi Digunakan'",
          subtitle: 'Pilih opsi ini agar presensi tervalidasi otomatis',
        },
      ],
    },
    gallery: {
      blockedTitle: 'Izin Galeri Diperlukan',
      blockedBody:
        'SapaKerja membutuhkan izin akses ke galeri foto Anda agar Anda dapat memilih dan mengubah foto profil akun. Aktifkan di Pengaturan.',
    },
  },

  history: {
    previousMonth: 'Bulan sebelumnya',
    nextMonth: 'Bulan berikutnya',
    openCalendar: 'Buka Kalender Presensi',
    closeCalendar: 'Tutup kalender',
    pickThisMonth: 'Pilih bulan ini',
    dayLabel: 'Tanggal {{day}}',
    dateFilter: 'Filter tanggal:',
    clearFilter: 'Hapus filter tanggal',
    showAll: 'Tampilkan Semua',
    activityTitle: 'Aktivitas Presensi',
    recordCount_one: '{{count}} Riwayat',
    recordCount_other: '{{count}} Riwayat',
    detailLabel: 'Detail presensi {{day}}',
    backToHistory: 'Kembali ke Halaman Riwayat',
    noRecordsOnDate: 'Tidak ada catatan presensi pada tanggal {{date}}.',
    showAllDays: 'Tampilkan Semua Hari',
    emptyTitle: 'Belum ada absensi bulan ini.',
    emptySubtitle:
      'Catatan kehadiran kamu untuk periode ini akan otomatis muncul setelah kamu melakukan presensi masuk pertama.',
    viewPreviousMonth: 'Lihat Bulan Sebelumnya',
  },

  profile: {
    editTitle: 'Edit Profil',
    changePhoto: 'Ubah Foto',
    updatingPhoto: 'Memperbarui...',
    changePhotoLabel: 'Ubah foto profil',
    fullName: 'Nama Lengkap',
    changePassword: 'Ganti Kata Sandi',
    currentPassword: 'Password Saat Ini',
    currentPasswordPlaceholder: 'Masukkan password saat ini',
    newPassword: 'Password Baru',
    newPasswordPlaceholder: 'Minimal 8 karakter',
    save: 'Simpan Perubahan',
    logout: 'Keluar dari Akun',
    logoutTitle: 'Keluar dari Akun?',
    logoutMessage:
      'Sesi login Anda akan diakhiri. Anda perlu memasukkan email dan kata sandi kembali untuk masuk.',
    logoutConfirm: 'Ya, Keluar',
    autoSavedTitle: 'Profil Tersimpan Otomatis 🎉',
    autoSavedBody:
      'Foto profil kamu sudah tersimpan secara otomatis tanpa perlu menekan tombol simpan.\n\nMasukkan kata sandi saat ini dan kata sandi baru jika ingin mengubah kata sandi akun.',
    enterCurrent: 'Silakan masukkan password saat ini.',
    enterNew: 'Silakan masukkan password baru.',
    minLength: 'Password baru minimal harus 8 karakter.',
    failedTitle: 'Gagal',
    wrongPassword: 'Password saat ini yang Anda masukkan salah.',
    noConnectionTitle: 'Tidak ada koneksi',
    noConnectionBody: 'Ganti kata sandi membutuhkan koneksi internet. Coba lagi saat online.',
    passwordUpdatedTitle: 'Sukses 🎉',
    passwordUpdatedBody:
      'Kata sandi berhasil diperbarui! Silakan gunakan kata sandi baru saat login berikutnya.',
    photoUpdatedTitle: 'Foto Profil Berhasil Diperbarui! 🎉',
    photoSynced:
      'Foto profil kamu otomatis tersimpan dan langsung terupdate di Web Dashboard Admin.',
    photoLocalOnly:
      'Foto profil tersimpan di HP dan akan otomatis tersinkron ke Web Dashboard saat server terhubung.',
    photoFailedTitle: 'Gagal Mengambil Foto',
    photoFailedBody: 'Terjadi kesalahan saat membuka galeri foto.',
  },

  updates: {
    updating: 'Memperbarui aplikasi...',
  },

  appInfo: {
    label: 'Informasi versi aplikasi',
    embedded: 'Bawaan build',
  },
};

export type Translation = typeof id;
export default id;
