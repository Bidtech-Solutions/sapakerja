import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

export interface OfficeConfig {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// Koordinat resmi Kantor PIPOSMART (Batam Kota): https://maps.app.goo.gl/LFddLRTfyAuoyaET7 (Plus Code: 434G+94 Belian, Kota Batam)
export const DEFAULT_OFFICE: OfficeConfig = {
  name: 'Kantor Piposmart',
  address: 'Belian, Kec. Batam Kota, Kota Batam, Kepulauan Riau',
  latitude: 1.105925,
  longitude: 104.075342,
  radiusMeters: 200, // Radius absen dari titik kantor (200 meter)
};

/** Galat posisi maksimal (meter) yang diterima untuk absen. Lebih besar = sinyal lemah atau lokasi perkiraan. */
export const MAX_ACCURACY_METERS = 100;

/** Posisi terakhir yang lebih tua dari ini tidak dipakai (harus baca GPS lagi). */
const LAST_KNOWN_MAX_AGE_MS = 30_000;
/** Batas tunggu satu pembacaan GPS langsung. Tanpa ini iOS bisa menunggu tanpa batas di dalam ruangan. */
const LIVE_FIX_TIMEOUT_MS = 10_000;

// Pemanasan lokasi sedang berjalan? (cegah dua pemanasan bersamaan)
let warmUpRunning = false;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Pembacaan lokasi terlalu lama')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Alasan lokasi tidak bisa dipakai untuk absen. */
export type LocationProblem = 'imprecise' | 'mocked' | 'unavailable';

export interface VerifyResult {
  isInside: boolean;
  distanceMeters: number;
  currentCoords: { latitude: number; longitude: number } | null;
  office: OfficeConfig;
  /** Bila ada, lokasi tidak boleh dipakai absen (isInside selalu false). */
  problem?: LocationProblem;
  /** Galat posisi terbaca (meter), bila problem = 'imprecise' karena sinyal lemah. */
  accuracyMeters?: number;
  error?: string;
}

const OFFICE_STORAGE_KEY = 'loginrek.officeConfig.v3';

/**
 * Menghitung jarak antara dua koordinat GPS dalam satuan meter menggunakan rumus Haversine.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const locationStore = {
  // Ambil pengaturan titik kantor yang aktif
  getOfficeConfig: async (): Promise<OfficeConfig> => {
    try {
      if (Platform.OS === 'web') {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(OFFICE_STORAGE_KEY) : null;
        return raw ? { ...DEFAULT_OFFICE, ...JSON.parse(raw) } : DEFAULT_OFFICE;
      }
      const raw = await SecureStore.getItemAsync(OFFICE_STORAGE_KEY);
      return raw ? { ...DEFAULT_OFFICE, ...JSON.parse(raw) } : DEFAULT_OFFICE;
    } catch {
      return DEFAULT_OFFICE;
    }
  },

  // Simpan titik kantor baru (misal: "Jadikan lokasi saya saat ini sebagai kantor")
  setOfficeConfig: async (config: Partial<OfficeConfig>): Promise<OfficeConfig> => {
    const current = await locationStore.getOfficeConfig();
    const updated: OfficeConfig = { ...current, ...config };
    const serialized = JSON.stringify(updated);

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(OFFICE_STORAGE_KEY, serialized);
      }
      return updated;
    }
    await SecureStore.setItemAsync(OFFICE_STORAGE_KEY, serialized);
    return updated;
  },

  // Memanaskan GPS/cache lokasi sistem agar absen cepat (dipanggil dari Beranda). Hasil dibuang.
  // Hanya bila izin SUDAH diberikan: tidak pernah memunculkan dialog izin. Pengguna baru tetap lewat
  // alur izin di layar presensi (usePermissionGate).
  warmUp: async (): Promise<void> => {
    if (Platform.OS === 'web' || warmUpRunning) return;
    warmUpRunning = true;
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted || !(await Location.hasServicesEnabledAsync())) return;
      // Sudah ada posisi segar yang cukup presisi: tidak perlu memanaskan lagi.
      const fresh = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
        requiredAccuracy: MAX_ACCURACY_METERS,
      });
      if (fresh) return;
      await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LIVE_FIX_TIMEOUT_MS
      );
    } catch {
      // Pemanasan hanya optimasi; kegagalannya tidak boleh mengganggu Beranda.
    } finally {
      warmUpRunning = false;
    }
  },

  // Periksa apakah karyawan saat ini berada di dalam radius kantor.
  // Di perangkat sungguhan, lokasi yang kurang presisi / palsu / gagal dibaca MENOLAK absen (problem).
  // Titik kantor hanya dipakai sebagai pengganti di web dan mode dev (emulator tanpa GPS).
  verifyLocation: async (): Promise<VerifyResult> => {
    const office = await locationStore.getOfficeConfig();
    const blocked = (problem: LocationProblem, extra: Partial<VerifyResult> = {}): VerifyResult => ({
      isInside: false,
      distanceMeters: 0,
      currentCoords: null,
      office,
      problem,
      ...extra,
    });
    const atOffice = (extra: Partial<VerifyResult> = {}): VerifyResult => ({
      isInside: true,
      distanceMeters: 0,
      currentCoords: { latitude: office.latitude, longitude: office.longitude },
      office,
      ...extra,
    });

    try {
      let coords: { latitude: number; longitude: number } | null = null;

      if (Platform.OS !== 'web') {
        // Izin sudah diberikan tetapi hanya "perkiraan" (iOS: Precise Location mati; Android: hanya COARSE).
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.ios?.accuracy === 'reduced' || permission.android?.accuracy === 'coarse') {
          return blocked('imprecise');
        }

        const tooCoarse = (a: number | null) => a != null && (a < 0 || a > MAX_ACCURACY_METERS);
        // Jalur cepat: posisi terakhir yang masih segar dan cukup presisi, tanpa menunggu GPS.
        let location = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
          requiredAccuracy: MAX_ACCURACY_METERS,
        });
        if (!location) {
          // Jalur lambat: baca GPS langsung, dibatasi waktu.
          location = await withTimeout(
            // Balanced (iOS ±100 m, Android Wi-Fi/sel) = ambang MAX_ACCURACY_METERS; High (±10 m) menunggu fix GPS dan lambat.
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            LIVE_FIX_TIMEOUT_MS
          );
          // GPS yang baru menyala sering memberi bacaan pertama yang kasar: coba sekali lagi.
          if (tooCoarse(location.coords.accuracy)) {
            location = await withTimeout(
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
              LIVE_FIX_TIMEOUT_MS
            );
          }
        }
        if (location.mocked) return blocked('mocked');
        const accuracy = location.coords.accuracy;
        if (accuracy != null && accuracy < 0) return blocked('unavailable'); // bacaan tidak valid (iOS: -1)
        if (tooCoarse(accuracy)) return blocked('imprecise', { accuracyMeters: Math.round(accuracy ?? 0) });
        coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve({ latitude: office.latitude, longitude: office.longitude }),
            { enableHighAccuracy: true, timeout: 4000 }
          );
        });
      }

      if (!coords) return Platform.OS === 'web' ? atOffice() : blocked('unavailable');

      // Hitung jarak nyata dari lokasi karyawan ke kantor
      const distance = calculateDistanceMeters(
        coords.latitude,
        coords.longitude,
        office.latitude,
        office.longitude
      );

      return {
        isInside: distance <= office.radiusMeters,
        distanceMeters: distance,
        currentCoords: coords,
        office,
      };
    } catch (err: any) {
      // Web dan mode dev (emulator tanpa GPS) boleh memakai titik kantor; produksi tidak.
      if (Platform.OS === 'web' || __DEV__) return atOffice({ error: err?.message });
      return blocked('unavailable', { error: err?.message });
    }
  },
};
