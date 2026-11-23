import * as Application from 'expo-application';
import Storage from 'expo-sqlite/kv-store';
import * as Updates from 'expo-updates';

/**
 * Pengecekan OTA saat aplikasi dibuka.
 *
 * - Pembukaan PERTAMA di sebuah build native (install baru, install ulang setelah uninstall, atau
 *   update dari store): cek OTA terbaru dan, bila ada, unduh lalu restart. Pemanggil menampilkan
 *   layar "Menyiapkan pembaruan…" selama proses ini.
 * - Pembukaan berikutnya di build yang sama: unduhan di latar belakang tetap dikerjakan
 *   oleh expo-updates dan diterapkan pada peluncuran berikutnya.
 *
 * Penanda "build ini sudah pernah dibuka" disimpan di expo-sqlite/kv-store (bukan SecureStore,
 * karena Keychain iOS bisa bertahan setelah uninstall sehingga install ulang tidak terdeteksi).
 */

export type StartupUpdateResult = 'ready' | 'reloading';

export const FIRST_RUN_KEY = 'loginrek.startup-update.build';
export const CHECK_TIMEOUT_MS = 6000;
export const FETCH_TIMEOUT_MS = 15000;

class TimeoutError extends Error {
  constructor(what: string, ms: number) {
    super(`${what} melebihi ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(what, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Gagal di sini tidak boleh sampai ke UI; cukup dicatat. */
function report(stage: string, error: unknown) {
  console.warn(`[startup-update] ${stage}:`, error);
}

function currentBuild(): string {
  return `${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`;
}

function startupUpdateEnabled(): boolean {
  return !__DEV__ && Updates.isEnabled;
}

/**
 * Sinkron, tanpa jaringan. `true` bila pembukaan ini perlu menjalankan pengecekan OTA di depan.
 * Storage yang gagal dibaca dianggap BUKAN first-run agar user tidak tertahan.
 */
export function isFirstRunOfBuild(): boolean {
  if (!startupUpdateEnabled()) return false;
  try {
    return Storage.getItemSync(FIRST_RUN_KEY) !== currentBuild();
  } catch (error) {
    report('baca penanda first-run', error);
    return false;
  }
}

function markBuildSeen() {
  try {
    Storage.setItemSync(FIRST_RUN_KEY, currentBuild());
  } catch (error) {
    report('simpan penanda first-run', error);
  }
}

export async function runStartupUpdate(): Promise<StartupUpdateResult> {
  if (!isFirstRunOfBuild()) return 'ready';

  try {
    const check = await withTimeout(
      Updates.checkForUpdateAsync(),
      CHECK_TIMEOUT_MS,
      'checkForUpdate',
    );
    if (check.isAvailable) {
      const fetched = await withTimeout(
        Updates.fetchUpdateAsync(),
        FETCH_TIMEOUT_MS,
        'fetchUpdate',
      );
      if (fetched.isNew) {
        // Penanda wajib tersimpan SEBELUM restart agar tidak terjadi loop restart.
        markBuildSeen();
        await Updates.reloadAsync();
        return 'reloading';
      }
    }
  } catch (error) {
    // Offline, timeout, atau server bermasalah: lanjut dengan bundle yang ada.
    report('cek/unduh OTA', error);
  }

  markBuildSeen();
  return 'ready';
}
