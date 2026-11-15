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
