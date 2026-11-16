import NetInfo from '@react-native-community/netinfo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Updates from 'expo-updates';

/**
 * Pemeriksaan update OTA saat aplikasi dibuka, supaya install baru langsung memakai OTA
 * terbaru (bukan bundle bawaan di peluncuran pertama).
 *
 * Batas waktu: tanpa update gate maksimal ~CHECK_BUDGET_MS (NetInfo + cek update berbagi
 * anggaran yang sama). Dengan update, unduhan maksimal FETCH_TIMEOUT_MS. Tidak ada yang
 * boleh memblokir aplikasi tanpa batas waktu, dan semua kegagalan berujung "lanjut ke app".
 */
export const CHECK_BUDGET_MS = 4000;
export const NETINFO_TIMEOUT_MS = 1000;
export const FETCH_TIMEOUT_MS = 15000;
/** Jeda setelah reloadAsync() agar tidak sempat menampilkan app lama bila reload tertahan. */
export const RELOAD_GRACE_MS = 3000;

export type StartupOutcome =
  | 'skipped'
  | 'offline'
  | 'no-update'
  | 'check-failed'
  | 'fetch-failed'
  | 'not-new'
  | 'reload-failed'
  | 'reload-stalled';

class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} melewati batas ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export type Breadcrumb = {
  category: string;
  message: string;
  level: 'info' | 'warning';
  data?: Record<string, unknown>;
};

let breadcrumbSink: ((breadcrumb: Breadcrumb) => void) | null = null;

/**
 * Titik pasang opsional untuk catatan diagnostik gate (mis. ke layanan crash reporting bila
 * suatu saat dipakai). Bawaannya tidak ada sink, jadi tidak ada yang dikirim ke mana pun.
 * Proyek ini tidak memakai Sentry; jangan impor SDK berat di modul ini (ikut membesarkan bundle OTA).
 */
export function setStartupBreadcrumbSink(sink: ((breadcrumb: Breadcrumb) => void) | null): void {
  breadcrumbSink = sink;
}

/** Catatan diagnostik (breadcrumb); tidak pernah melempar dan tidak pernah menampilkan alert. */
export function logStartup(
  message: string,
  data?: Record<string, unknown>,
  level: Breadcrumb['level'] = 'info',
): void {
  try {
    breadcrumbSink?.({ category: 'startup-update', message, level, data });
  } catch {
    // Sink bermasalah: abaikan.
  }
}

function errorInfo(error: unknown): Record<string, unknown> {
  return { error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
}

/**
 * Alasan pemeriksaan harus dilewati, atau null bila boleh jalan.
 * Dilewati di development, Expo Go / dev client, saat expo-updates nonaktif, dan saat
 * aplikasi berjalan dari emergency launch.
 */
export function startupSkipReason(): string | null {
  if (__DEV__) return 'dev';
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'expo-go';
  if (!Updates.isEnabled) return 'updates-disabled';
  if (Updates.isEmergencyLaunch) return 'emergency-launch';
  return null;
}

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

type Options = {
  /** Dipanggil begitu ada update yang akan diunduh (UI menampilkan UpdateScreen). */
  onUpdateFound?: () => void;
};

export async function runStartupUpdate({ onUpdateFound }: Options = {}): Promise<StartupOutcome> {
  const startedAt = Date.now();

  const skip = startupSkipReason();
  if (skip) {
    logStartup('dilewati', { reason: skip });
    return 'skipped';
  }

  let online = false;
  try {
    online = await withTimeout(isOnline(), NETINFO_TIMEOUT_MS, 'netinfo');
  } catch (error) {
    logStartup('cek koneksi gagal, anggap offline', errorInfo(error), 'warning');
  }
  if (!online) {
    logStartup('offline, lanjut tanpa cek update');
    return 'offline';
  }

  let updateAvailable = false;
  try {
    const remaining = Math.max(500, CHECK_BUDGET_MS - (Date.now() - startedAt));
    const result = await withTimeout(Updates.checkForUpdateAsync(), remaining, 'checkForUpdate');
    updateAvailable = result.isAvailable === true;
  } catch (error) {
    logStartup('cek update gagal/timeout, lanjut', errorInfo(error), 'warning');
    return 'check-failed';
  }
  if (!updateAvailable) {
    logStartup('tidak ada update baru');
    return 'no-update';
  }

  logStartup('update tersedia, mengunduh');
  onUpdateFound?.();

  let fetched: Updates.UpdateFetchResult;
  try {
    fetched = await withTimeout(Updates.fetchUpdateAsync(), FETCH_TIMEOUT_MS, 'fetchUpdate');
  } catch (error) {
    logStartup(
      'unduh update gagal/timeout, lanjut dengan bundle saat ini',
      errorInfo(error),
      'warning',
    );
    return 'fetch-failed';
  }

  // Reload hanya bila unduhan benar-benar menghasilkan update baru (mencegah reload berulang).
  if (!fetched.isNew) {
    logStartup('unduhan tidak menghasilkan update baru, tanpa reload');
    return 'not-new';
  }
  if (fetched.manifest?.id && fetched.manifest.id === Updates.updateId) {
    logStartup('update yang diunduh sama dengan yang berjalan, tanpa reload');
    return 'not-new';
  }

  try {
    logStartup('update terunduh, memuat ulang');
    await Updates.reloadAsync();
  } catch (error) {
    logStartup('reload gagal, lanjut', errorInfo(error), 'warning');
    return 'reload-failed';
  }

  // reloadAsync biasanya mematikan JS ini. Bila sampai sini, tahan sebentar lalu lanjut
  // supaya aplikasi tidak pernah tertahan di layar pembaruan.
  await new Promise((resolve) => setTimeout(resolve, RELOAD_GRACE_MS));
  logStartup('reload tertahan, lanjut dengan bundle saat ini', undefined, 'warning');
  return 'reload-stalled';
}
