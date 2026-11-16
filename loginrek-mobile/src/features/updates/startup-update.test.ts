import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import {
  CHECK_BUDGET_MS,
  FETCH_TIMEOUT_MS,
  NETINFO_TIMEOUT_MS,
  RELOAD_GRACE_MS,
  runStartupUpdate,
  setStartupBreadcrumbSink,
} from './startup-update';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone', Bare: 'bare' },
}));
jest.mock('expo-updates', () => ({
  isEnabled: true,
  isEmergencyLaunch: false,
  updateId: 'running-update-id',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

const mockedUpdates = Updates as unknown as {
  isEnabled: boolean;
  isEmergencyLaunch: boolean;
  checkForUpdateAsync: jest.Mock;
  fetchUpdateAsync: jest.Mock;
  reloadAsync: jest.Mock;
};
const netInfoFetch = NetInfo.fetch as unknown as jest.Mock;
const constants = Constants as unknown as { executionEnvironment: string };
const addBreadcrumb = jest.fn();

const ONLINE = { isConnected: true, isInternetReachable: true };
const NEVER = new Promise<never>(() => {});

/** Jalankan gate sampai selesai dengan jam palsu, mengembalikan hasil + lama (ms) yang dipakai. */
async function runToEnd(options?: Parameters<typeof runStartupUpdate>[0]) {
  const started = Date.now();
  const promise = runStartupUpdate(options);
  let outcome: string | undefined;
  promise.then((value) => {
    outcome = value;
  });
  // Majukan jam per 100ms sampai selesai (batas atas aman: 40 detik).
  for (let i = 0; i < 400 && outcome === undefined; i++) {
    await jest.advanceTimersByTimeAsync(100);
  }
  return { outcome: await promise, elapsed: Date.now() - started };
}

beforeEach(() => {
  jest.useFakeTimers();
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  mockedUpdates.isEnabled = true;
  mockedUpdates.isEmergencyLaunch = false;
  constants.executionEnvironment = 'standalone';
  netInfoFetch.mockReset().mockResolvedValue(ONLINE);
  mockedUpdates.checkForUpdateAsync.mockReset().mockResolvedValue({ isAvailable: false });
  mockedUpdates.fetchUpdateAsync
    .mockReset()
    .mockResolvedValue({ isNew: true, manifest: { id: 'new-update-id' } });
  mockedUpdates.reloadAsync.mockReset().mockResolvedValue(undefined);
  addBreadcrumb.mockReset();
  setStartupBreadcrumbSink(addBreadcrumb);
});

afterEach(() => {
  jest.useRealTimers();
  setStartupBreadcrumbSink(null);
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

describe('dilewati', () => {
  it.each([
    ['mode dev (__DEV__)', () => ((globalThis as { __DEV__?: boolean }).__DEV__ = true)],
    ['Updates.isEnabled false', () => (mockedUpdates.isEnabled = false)],
    ['emergency launch', () => (mockedUpdates.isEmergencyLaunch = true)],
    ['Expo Go', () => (constants.executionEnvironment = 'storeClient')],
  ])('%s: tanpa cek koneksi maupun update', async (_name, arrange) => {
    arrange();
    const { outcome } = await runToEnd();
    expect(outcome).toBe('skipped');
    expect(netInfoFetch).not.toHaveBeenCalled();
    expect(mockedUpdates.checkForUpdateAsync).not.toHaveBeenCalled();
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });
});

describe('koneksi', () => {
  it('offline (isConnected false): langsung lanjut tanpa cek update', async () => {
    netInfoFetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    const { outcome, elapsed } = await runToEnd();
    expect(outcome).toBe('offline');
    expect(elapsed).toBeLessThan(500);
    expect(mockedUpdates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('terhubung tetapi internet tidak terjangkau (isInternetReachable false): dianggap offline', async () => {
    netInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: false });
    expect((await runToEnd()).outcome).toBe('offline');
    expect(mockedUpdates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('isInternetReachable belum diketahui (null) tetap dicoba', async () => {
    netInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: null });
    expect((await runToEnd()).outcome).toBe('no-update');
    expect(mockedUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it('NetInfo menggantung: dianggap offline setelah batas waktu, tidak memblokir', async () => {
    netInfoFetch.mockReturnValue(NEVER);
    const { outcome, elapsed } = await runToEnd();
    expect(outcome).toBe('offline');
    expect(elapsed).toBeLessThanOrEqual(NETINFO_TIMEOUT_MS + 200);
    expect(mockedUpdates.checkForUpdateAsync).not.toHaveBeenCalled();
  });
});

describe('cek update', () => {
  it('online tanpa update: lanjut, tanpa unduh dan tanpa reload', async () => {
    const { outcome } = await runToEnd();
    expect(outcome).toBe('no-update');
    expect(mockedUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockedUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });

  it('timeout: lanjut, dan total gate tidak melewati ~4 detik', async () => {
    mockedUpdates.checkForUpdateAsync.mockReturnValue(NEVER);
    const { outcome, elapsed } = await runToEnd();
    expect(outcome).toBe('check-failed');
    expect(elapsed).toBeGreaterThanOrEqual(CHECK_BUDGET_MS - 200);
    expect(elapsed).toBeLessThanOrEqual(CHECK_BUDGET_MS + 200);
    expect(mockedUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });

  it('error: lanjut tanpa crash, dicatat sebagai breadcrumb', async () => {
    mockedUpdates.checkForUpdateAsync.mockRejectedValue(new Error('jaringan putus'));
    const { outcome } = await runToEnd();
    expect(outcome).toBe('check-failed');
    expect(mockedUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'startup-update',
        level: 'warning',
        data: expect.objectContaining({ error: expect.stringContaining('jaringan putus') }),
      }),
    );
  });

  it('kegagalan sink breadcrumb tidak pernah merusak gate', async () => {
    addBreadcrumb.mockImplementation(() => {
      throw new Error('sink bermasalah');
    });
    mockedUpdates.checkForUpdateAsync.mockRejectedValue(new Error('x'));
    await expect(runToEnd()).resolves.toMatchObject({ outcome: 'check-failed' });
    addBreadcrumb.mockReset();
  });
});

describe('ada update', () => {
  it('mengunduh lalu reloadAsync dipanggil tepat sekali; onUpdateFound dipanggil lebih dulu', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    const calls: string[] = [];
    mockedUpdates.fetchUpdateAsync.mockImplementation(async () => {
      calls.push('fetch');
      return { isNew: true, manifest: { id: 'new-update-id' } };
    });
    mockedUpdates.reloadAsync.mockImplementation(async () => {
      calls.push('reload');
    });

    const { outcome } = await runToEnd({ onUpdateFound: () => calls.push('found') });

    expect(calls).toEqual(['found', 'fetch', 'reload']);
    expect(mockedUpdates.reloadAsync).toHaveBeenCalledTimes(1);
    // reloadAsync normal mematikan JS; bila tertahan, gate tetap lanjut setelah jeda singkat.
    expect(outcome).toBe('reload-stalled');
  });

  it('unduhan gagal: lanjut dengan bundle saat ini, tanpa reload', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    mockedUpdates.fetchUpdateAsync.mockRejectedValue(new Error('unduhan gagal'));
    const { outcome } = await runToEnd();
    expect(outcome).toBe('fetch-failed');
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });

  it('unduhan timeout 15 detik: lanjut tanpa reload', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    mockedUpdates.fetchUpdateAsync.mockReturnValue(NEVER);
    const { outcome, elapsed } = await runToEnd();
    expect(outcome).toBe('fetch-failed');
    expect(elapsed).toBeGreaterThanOrEqual(FETCH_TIMEOUT_MS - 200);
    expect(elapsed).toBeLessThanOrEqual(FETCH_TIMEOUT_MS + 300);
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });

  it('isNew false: tanpa reload (mencegah reload berulang)', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    mockedUpdates.fetchUpdateAsync.mockResolvedValue({ isNew: false, isRollBackToEmbedded: false });
    const { outcome } = await runToEnd();
    expect(outcome).toBe('not-new');
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });

  it('update yang diunduh sama dengan yang sedang berjalan: tanpa reload', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    mockedUpdates.fetchUpdateAsync.mockResolvedValue({
      isNew: true,
      manifest: { id: 'running-update-id' },
    });
    expect((await runToEnd()).outcome).toBe('not-new');
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });

  it('reloadAsync gagal: lanjut tanpa crash', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    mockedUpdates.reloadAsync.mockRejectedValue(new Error('reload gagal'));
    expect((await runToEnd()).outcome).toBe('reload-failed');
  });

  it('reload tertahan tidak menahan aplikasi lebih dari jeda yang ditentukan', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    const { elapsed } = await runToEnd();
    expect(elapsed).toBeLessThanOrEqual(RELOAD_GRACE_MS + 300);
  });
});
