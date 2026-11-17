// Satu-satunya berkas tipe untuk seluruh lib/ (i18n + dashboard). Tipe yang hanya dipakai satu berkas boleh tetap lokal di berkas itu.
import type id from '@/i18n/id';

/* ---------------------------------------------------------------- i18n & situs publik */

export type Locale = 'id' | 'en';
/** Halaman publik yang punya URL tetap (dipakai metadata, sitemap, JSON-LD). */
export type SitePath = '/' | '/privacy';
/** Bentuk kamus: en.ts wajib punya kunci yang sama dengan id.ts (dicek `npm run typecheck`). */
export type Dictionary = typeof id;

/** Blok isi kebijakan privasi. */
export type Block =
  | { type: 'p'; text: string; lang?: string }
  | { type: 'ul'; items: string[] }
  | { type: 'label'; text: string; lang?: string };
export type PrivacySection = { id?: string; title: string; blocks: Block[] };

/* ---------------------------------------------------------------- dashboard HR (bentuk respons mengikuti docs/API.md) */

/** Profil admin yang ditampilkan di sidebar & pengaturan. */
export interface AdminData {
  name: string;
  role: string;
  email: string;
  avatar: string;
}

/** Karyawan dari GET /employees (sudah dipetakan oleh AdminProvider). */
export interface Employee {
  id: number | string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
  department: string;
  /** Status kepegawaian: Karyawan | Magang | PKL. */
  type: string;
  employeeType?: string;
  phone?: string;
  avatar?: string;
  nik?: string;
  initials?: string;
  isAdmin?: boolean;
  /** Hanya dikirim saat mengganti kata sandi; tidak pernah dibaca balik dari server. */
  password?: string;
  // Field tampilan di tabel karyawan (belum dari backend).
  location?: string;
  status?: string;
  attendanceSummary?: string;
  lateCount?: string;
  onTimeCount?: string;
}

/** Satu baris presensi yang sudah digabung dengan data karyawannya. */
export interface AttendanceRecord {
  id: number | string;
  /** Kosong pada baris placeholder "Belum Hadir" yang dibuat dari daftar karyawan. */
  userId?: number;
  employeeId?: number | string;
  name: string;
  initials?: string;
  type: string;
  email?: string;
  nik: string;
  role: string;
  department: string;
  avatar?: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  date: string;
  selfieUrl?: string | null;
  distance?: string;
  latitude?: number;
  longitude?: number;
  isOfflineSync?: boolean;
  // Field tampilan di halaman detail (belum dari backend).
  schedule?: string;
  lateMinutes?: number | string;
  timezone?: string;
}

/** Filter halaman presensi; disimpan di AdminProvider agar tidak hilang saat pindah daftar <-> detail. */
export interface AttendanceView {
  selectedDate: Date;
  viewMonth: number;
  viewYear: number;
  statusFilter: string;
  searchQuery: string;
  currentPage: number;
}

/** Filter halaman karyawan; disimpan di AdminProvider agar tidak hilang saat pindah daftar <-> tambah/ubah. */
export interface EmployeesView {
  searchQuery: string;
  selectedType: string;
  currentPage: number;
  itemsPerPage: number;
  /** Karyawan yang akan dihapus (modal konfirmasi di daftar); diisi juga dari halaman ubah. */
  employeeToDelete: Employee | null;
}

/** Nilai context yang dibagikan AdminProvider. */
export interface AdminContextValue {
  isAuthenticated: boolean;
  authChecked: boolean;
  adminData: AdminData;
  setAdminData: React.Dispatch<React.SetStateAction<AdminData>>;
  attendanceData: AttendanceRecord[];
  employeesData: Employee[];
  updateEmployees: (updatedOrFn: Employee[] | ((prev: Employee[]) => Employee[])) => void;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
  goToLogin: () => void;
  /** true setelah pengambilan data pertama (karyawan + presensi) selesai; sebelum itu "data tidak ditemukan" belum boleh disimpulkan. */
  dataReady: boolean;
  attendanceView: AttendanceView;
  setAttendanceView: React.Dispatch<React.SetStateAction<AttendanceView>>;
  employeesView: EmployeesView;
  setEmployeesView: React.Dispatch<React.SetStateAction<EmployeesView>>;
}
