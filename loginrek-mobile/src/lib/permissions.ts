import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

/**
 * Logika murni status izin OS -> fase layar. Dipisah dari React agar mudah diuji.
 *
 * Panduan App Store 5.1.1(iv): sebelum dialog izin sistem muncul, aplikasi tidak boleh
 * menampilkan layar/tombol yang mengarahkan pengguna ke Pengaturan, atau menahan
 * pengguna dari dialog tersebut. Karena itu `undetermined` BUKAN `denied`.
 */

/** Bentuk minimal PermissionResponse dari expo-camera / expo-location / expo-image-picker. */
export type OsPermission = {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
};

/** Hasil klasifikasi satu pembacaan status izin. */
export type PermissionState =
  /** Sudah diizinkan. */
  | 'granted'
  /** Belum pernah ditanya: langsung minta (dialog sistem), jangan tampilkan layar penolakan. */
  | 'undetermined'
  /** Ditolak tetapi OS masih mau menampilkan dialog lagi (mis. Android): tombol "Lanjutkan". */
  | 'canAsk'
  /** Ditolak dan OS tidak akan bertanya lagi: hanya Pengaturan yang bisa membantu. */
  | 'blocked';

export function classifyPermission(p: OsPermission): PermissionState {
  if (p.granted || p.status === 'granted') return 'granted';
  if (p.status === 'denied') return p.canAskAgain ? 'canAsk' : 'blocked';
  // 'undetermined' atau status yang tidak dikenal: perlakukan sebagai belum diputuskan
  // selama OS masih boleh bertanya.
  return p.canAskAgain ? 'undetermined' : 'blocked';
}

/** Fase yang dilihat layar/hook. */
export type GatePhase = 'checking' | 'requesting' | 'granted' | 'canAsk' | 'blocked';

/** Fase setelah dialog sistem selesai: `undetermined` tidak mungkin lagi, anggap boleh ditanya ulang. */
export function phaseAfterRequest(p: OsPermission): Exclude<GatePhase, 'checking' | 'requesting'> {
  const state = classifyPermission(p);
  return state === 'undetermined' ? 'canAsk' : state;
}

/**
 * Pembaca/peminta izin per jenis. Di native, sumber kebenaran adalah status OS (bukan cache);
 * di web (hanya untuk pengembangan) dipakai penanda di memori + API browser.
 */
export type PermissionAdapter = {
  get: () => Promise<OsPermission>;
  request: () => Promise<OsPermission>;
};

// Web (dev): izin dianggap diberikan setelah diminta sekali pada sesi ini.
const webGranted = { camera: false, location: false };

const GRANTED: OsPermission = { status: 'granted', granted: true, canAskAgain: true };
const UNDETERMINED: OsPermission = { status: 'undetermined', granted: false, canAskAgain: true };

export const cameraPermission: PermissionAdapter = {
  get: async () => {
    if (Platform.OS === 'web') return webGranted.camera ? GRANTED : UNDETERMINED;
    return Camera.getCameraPermissionsAsync();
  },
  request: async () => {
    if (Platform.OS !== 'web') return Camera.requestCameraPermissionsAsync();
    try {
      await navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    } catch {
      // Web hanya untuk pengembangan: lanjut dengan kamera simulasi.
    }
    webGranted.camera = true;
    return GRANTED;
  },
};

export const locationPermission: PermissionAdapter = {
  get: async () => {
    if (Platform.OS === 'web') return webGranted.location ? GRANTED : UNDETERMINED;
    return Location.getForegroundPermissionsAsync();
  },
  // Hanya foreground (When In Use); izin lokasi latar belakang tidak pernah diminta.
  request: async () => {
    if (Platform.OS !== 'web') return Location.requestForegroundPermissionsAsync();
    webGranted.location = true;
    return GRANTED;
  },
};

export const mediaLibraryPermission: PermissionAdapter = {
  get: () => ImagePicker.getMediaLibraryPermissionsAsync(),
  request: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
};

/** Layanan Lokasi (GPS) di perangkat menyala? Web dianggap menyala. */
export async function isLocationServicesEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return true;
  }
}
