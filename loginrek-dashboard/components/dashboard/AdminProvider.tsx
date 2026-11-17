'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_ORIGIN, apiFetch, clearSession, AUTH_EXPIRED_EVENT } from '@/lib/api';
import type { AdminContextValue, AdminData, AttendanceRecord, AttendanceView, Employee, EmployeesView } from '@/lib/types';

const AdminContext = createContext<AdminContextValue | null>(null);

// Profil bawaan sebelum sesi dimuat. Daftar karyawan/presensi kosong secara default: murni dari backend.
const initialAdminData: AdminData = {
  name: 'Admin Piposmart',
  role: 'HR Operations Lead',
  email: 'admin@loginrek.com',
  avatar: '',
};

/** Inisial nama (cth: "Admin Piposmart" -> "AP", "Budi Santoso" -> "BS"). */
export function getInitials(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string') return 'AP';
  const nameWithoutTitles = fullName.split(',')[0].trim();
  if (!nameWithoutTitles) return 'AP';
  const words = nameWithoutTitles.split(/s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/**
 * Baris presensi satu tanggal: catatan dari backend (dilengkapi data karyawan) + baris "Belum Hadir" untuk karyawan yang belum
 * punya catatan. Dipakai halaman daftar (/attendance) dan detail (/attendance/[id]); diletakkan di sini karena page.tsx tidak boleh mengekspor selain halaman.
 */
export function buildRecordsForDate(attendanceData: AttendanceRecord[], employeesData: Employee[], dateIso: string): AttendanceRecord[] {
  // 1. Explicit attendance records for this date
  const dateRecords = (attendanceData || []).filter(item => !item.date || item.date === dateIso);

  // 2. Enrich date records with employee info if any fields are missing
  const enrichedDateRecords = dateRecords.map((item) => {
    const matched = (employeesData || []).find(e => 
      (item.userId && Number(e.id) === Number(item.userId)) ||
      (item.employeeId && Number(e.id) === Number(item.employeeId)) ||
      (item.name && item.name !== 'Karyawan' && (e.name === item.name || e.fullName === item.name)) ||
      (item.email && e.email && item.email.toLowerCase() === e.email.toLowerCase())
    );
    if (!matched) return item;
    return {
      ...item,
      name: (item.name && item.name !== 'Karyawan') ? item.name : (matched.name || matched.fullName || item.name),
      type: (item.type && item.type !== '—') ? item.type : (matched.type || matched.employeeType || 'Karyawan'),
      department: (item.department && item.department !== 'Engineering') ? item.department : (matched.department || item.department),
      role: (item.role && item.role !== 'Karyawan') ? item.role : (matched.role || item.role),
      avatar: item.avatar || matched.avatar || '',
      nik: item.nik || matched.nik || `LR-${String(item.userId || matched.id).padStart(5, '0')}`,
    };
  });

  // 3. Track employees who already have an attendance record on this date
  const coveredKeys = new Set();
  enrichedDateRecords.forEach(r => {
    if (r.employeeId) coveredKeys.add(String(r.employeeId).toLowerCase());
    if (r.userId) coveredKeys.add(String(r.userId).toLowerCase());
    if (r.name) coveredKeys.add(String(r.name).toLowerCase());
    if (r.email) coveredKeys.add(String(r.email).toLowerCase());
  });

  // 4. For any employee in employeesData without a record on this date,
  //    show them with checkInTime: '—' and status: 'Belum Hadir'
  const defaultEmployeeRecords = (employeesData || [])
    .filter(emp => !coveredKeys.has(String(emp.id).toLowerCase()) && !coveredKeys.has(String(emp.name).toLowerCase()))
    .map(emp => ({
      id: `att-${emp.id}-${dateIso}`,
      employeeId: emp.id,
      name: emp.name,
      avatar: emp.avatar || '',
      initials: emp.initials || (emp.name ? emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'EM'),
      type: emp.type || emp.employeeType || 'Karyawan',
      department: emp.department || 'Engineering',
      role: emp.role || 'Staff',
      nik: emp.nik || `ID-${emp.id}`,
      date: dateIso,
      checkInTime: '—',
      status: 'Belum Hadir',
    }));

  return [...enrichedDateRecords, ...defaultEmployeeRecords];
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin harus dipakai di dalam <AdminProvider>');
  return ctx;
}

// Ubah path relatif dari backend (mis. /uploads/x.jpg) menjadi URL absolut.
function absoluteMedia(raw: string | null | undefined, { uploadsOnly = true }: { uploadsOnly?: boolean } = {}): string {
  if (!raw) return '';
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  if (!uploadsOnly || raw.startsWith('/uploads')) return `${API_ORIGIN}${raw}`;
  return raw;
}

function loadAdminData(): AdminData {
  try {
    const user = localStorage.getItem('admin_user');
    if (user) {
      const u = JSON.parse(user);
      const rawAvatar = u.avatarUrl || u.avatar || '';
      return {
        ...initialAdminData,
        name: u.fullName || u.name || initialAdminData.name,
        email: u.email || initialAdminData.email,
        role: u.role || initialAdminData.role,
        avatar: absoluteMedia(rawAvatar, { uploadsOnly: false }),
      };
    }
    const saved = localStorage.getItem('admin_profile');
    if (saved) return JSON.parse(saved);
  } catch {}
  return initialAdminData;
}

function loadCachedList<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return fallback;
}

/**
 * State bersama dashboard HR: sesi, profil admin, daftar karyawan, dan log presensi.
 * Dipasang di root layout (admin). Status awal sengaja netral (sama di server dan klien);
 * isi dari localStorage dibaca setelah mount agar tidak terjadi hydration mismatch.
 */
export default function AdminProvider({ children }: { children: React.ReactNode }) {
  // Sesi baru dianggap sah setelah token diverifikasi ke server (GET /auth/me) dan akunnya HR/admin.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  // Data pertama dari backend sudah dicoba diambil (berhasil atau gagal). Halaman detail/ubah menunggu ini sebelum mengalihkan
  // "data tidak ditemukan", karena cache localStorage baru dibaca setelah mount (aman untuk hydration).
  const [dataReady, setDataReady] = useState(false);
  const [adminData, setAdminData] = useState<AdminData>(initialAdminData);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  // Filter/pencarian halaman presensi & karyawan hidup di sini (bukan di halaman) supaya tidak hilang saat berpindah rute.
  const [attendanceView, setAttendanceView] = useState<AttendanceView>(() => {
    const now = new Date();
    return { selectedDate: now, viewMonth: now.getMonth(), viewYear: now.getFullYear(), statusFilter: 'Semua', searchQuery: '', currentPage: 1 };
  });
  const [employeesView, setEmployeesView] = useState<EmployeesView>({ searchQuery: '', selectedType: 'Semua', currentPage: 1, itemsPerPage: 8, employeeToDelete: null });

  // fetchAttendances dijalankan dari setInterval; ref menjaga daftar karyawan terbaru tanpa mengulang interval.
  const employeesRef = useRef(employeesData);
  useEffect(() => {
    employeesRef.current = employeesData;
  }, [employeesData]);

  // Ambil data karyawan dari database backend Go
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiFetch('/employees');
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      const mappedEmployees = list.map((emp: Employee) => ({
        ...emp,
        type: emp.type || emp.employeeType || 'Karyawan',
        avatar: absoluteMedia(emp.avatar),
      }));
      setEmployeesData(mappedEmployees);
      try {
        localStorage.setItem('loginrek_employees_cache', JSON.stringify(mappedEmployees));
      } catch {}
    } catch {
      // Backend offline: tetap gunakan data yang sudah tersimpan di browser
    }
  }, []);

  // Ambil log presensi realtime dari database backend Go
  const fetchAttendances = useCallback(async () => {
    try {
      const res = await apiFetch('/attendances?all=true');
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      const employees = employeesRef.current;
      const mapped: AttendanceRecord[] = list.map((item: any) => {
        const empUser = item.user || {};
        const matchedEmp: Partial<Employee> =
          employees.find(
            (e: Employee) =>
              (item.userId && Number(e.id) === Number(item.userId)) ||
              (item.employeeId && Number(e.id) === Number(item.employeeId)) ||
              (e.email && empUser.email && e.email.toLowerCase() === empUser.email.toLowerCase()) ||
              (e.name && empUser.fullName && e.name.toLowerCase() === empUser.fullName.toLowerCase()),
          ) || {};

        const empName =
          empUser.fullName || empUser.name || item.name || item.fullName || matchedEmp.name || matchedEmp.fullName || 'Karyawan';
        const empType =
          item.type || item.employeeType || empUser.type || empUser.employeeType || matchedEmp.type || matchedEmp.employeeType || 'Karyawan';
        const empRole = empUser.role || item.role || matchedEmp.role || 'Karyawan';
        const empDept = empUser.department || item.department || matchedEmp.department || 'Engineering';
        const rawAvatar = empUser.avatarUrl || empUser.avatar || item.avatar || matchedEmp.avatar;
        const avatarUrl = rawAvatar ? absoluteMedia(rawAvatar) : undefined;

        return {
          id: item.id,
          userId: item.userId,
          name: empName,
          type: empType,
          email: empUser.email || item.email || matchedEmp.email,
          nik: item.nik || `LR-${String(item.userId).padStart(5, '0')}`,
          role: empRole,
          department: empDept,
          avatar: avatarUrl,
          checkInTime: item.clockInTime || '—',
          checkOutTime: item.checkOutTime || '—',
          status: item.status || (item.isLate ? 'Terlambat' : 'Tepat Waktu'),
          date: item.date,
          selfieUrl: item.photoPath ? absoluteMedia(item.photoPath) : null,
          distance: item.distanceMeters !== undefined ? `${item.distanceMeters}m` : '0m',
          latitude: item.latitude,
          longitude: item.longitude,
          isOfflineSync: item.isOfflineSync,
        };
      });
      setAttendanceData(mapped);
    } catch {
      // Backend offline: tetap gunakan data awal
    }
  }, []);

  // Saat dibuka: muat cache dari browser, lalu verifikasi token yang tersimpan.
  useEffect(() => {
    setAdminData(loadAdminData());
    setEmployeesData(loadCachedList<Employee>('loginrek_employees_cache', []));
    setAttendanceData(loadCachedList<AttendanceRecord>('loginrek_attendance_cache', []));

    let hasToken = false;
    try {
      hasToken = !!localStorage.getItem('admin_token');
    } catch {}
    if (!hasToken) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/auth/me');
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json?.data?.isAdmin) {
          setIsAuthenticated(true);
        } else {
          clearSession();
        }
      } catch {
        // Server tidak terjangkau: sesi belum bisa diverifikasi, minta login ulang
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Server menolak token (kedaluwarsa / bukan admin): kembali ke login
  useEffect(() => {
    const onExpired = () => {
      setDataReady(false);
      setAdminData(initialAdminData);
      setIsAuthenticated(false);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.allSettled([fetchEmployees(), fetchAttendances()]).then(() => setDataReady(true));

    // Auto-polling realtime setiap 3 detik agar setiap absensi dari HP langsung muncul otomatis
    const timer = setInterval(() => {
      fetchAttendances();
      fetchEmployees();
    }, 3000);

    return () => clearInterval(timer);
  }, [isAuthenticated, fetchEmployees, fetchAttendances]);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setAdminData(loadAdminData());
  }, []);

  const handleLogout = useCallback(() => {
    setDataReady(false);
    clearSession();
    setAdminData(initialAdminData);
    setIsAuthenticated(false);
  }, []);

  const goToLogin = useCallback(() => setIsAuthenticated(false), []);

  // Perubahan daftar karyawan dari halaman Karyawan: simpan ke cache lalu sinkronkan ulang dari backend.
  const updateEmployees = useCallback(
    (updatedOrFn: Employee[] | ((prev: Employee[]) => Employee[])) => {
      setEmployeesData((prev) => {
        const next = typeof updatedOrFn === 'function' ? updatedOrFn(prev) : updatedOrFn;
        try {
          localStorage.setItem('loginrek_employees_cache', JSON.stringify(next));
        } catch {}
        return next;
      });
      fetchEmployees();
    },
    [fetchEmployees],
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      authChecked,
      adminData,
      setAdminData,
      attendanceData,
      employeesData,
      updateEmployees,
      handleLoginSuccess,
      handleLogout,
      goToLogin,
      dataReady,
      attendanceView,
      setAttendanceView,
      employeesView,
      setEmployeesView,
    }),
    [
      isAuthenticated,
      authChecked,
      adminData,
      attendanceData,
      employeesData,
      updateEmployees,
      handleLoginSuccess,
      handleLogout,
      goToLogin,
      dataReady,
      attendanceView,
      employeesView,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
