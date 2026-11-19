import * as Application from 'expo-application';
import Storage from 'expo-sqlite/kv-store';
import * as Updates from 'expo-updates';

import {
  CHECK_TIMEOUT_MS,
  FETCH_TIMEOUT_MS,
  FIRST_RUN_KEY,
  isFirstRunOfBuild,
  runStartupUpdate,
} from '../startup-update';

jest.mock('expo-application', () => ({
  __esModule: true,
  nativeApplicationVersion: '1.0.3',
  nativeBuildVersion: '4',
}));

jest.mock('expo-sqlite/kv-store', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItemSync: jest.fn((key: string) => store.get(key) ?? null),
      setItemSync: jest.fn((key: string, value: string) => void store.set(key, value)),
      clear: () => store.clear(),
    },
  };
});

jest.mock('expo-updates', () => ({
  __esModule: true,
  isEnabled: true,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

const app = Application as { nativeApplicationVersion: string; nativeBuildVersion: string };
const updates = Updates as unknown as {
  isEnabled: boolean;
  checkForUpdateAsync: jest.Mock;
  fetchUpdateAsync: jest.Mock;
  reloadAsync: jest.Mock;
};
const kv = Storage as unknown as {
  getItemSync: jest.Mock;
  setItemSync: jest.Mock;
  clear: () => void;
};
const globals = globalThis as unknown as { __DEV__: boolean };

const BUILD = '1.0.3+4';
const never = () => new Promise<never>(() => {});

// Implementasi bawaan storage palsu; dipulihkan tiap tes karena ada tes yang membuatnya melempar error.
function resetStorage() {
  kv.clear();
  const store = new Map<string, string>();
  kv.getItemSync.mockImplementation((key: string) => store.get(key) ?? null);
  kv.setItemSync.mockImplementation((key: string, value: string) => void store.set(key, value));
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  globals.__DEV__ = false;
  updates.isEnabled = true;
  app.nativeApplicationVersion = '1.0.3';
  app.nativeBuildVersion = '4';
  jest.clearAllMocks();
  resetStorage();
  updates.reloadAsync.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('runStartupUpdate', () => {
  it('(a) first-run dengan update tersedia: simpan penanda SEBELUM reload lalu return reloading', async () => {
    let markerAtReload: string | null = null;
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockResolvedValue({ isNew: true });
    updates.reloadAsync.mockImplementation(async () => {
      markerAtReload = kv.getItemSync(FIRST_RUN_KEY);
    });

    await expect(runStartupUpdate()).resolves.toBe('reloading');

    expect(updates.reloadAsync).toHaveBeenCalledTimes(1);
    expect(markerAtReload).toBe(BUILD);
  });

  it('(b) first-run tanpa update: simpan penanda, return ready, tanpa reload', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: false });

    await expect(runStartupUpdate()).resolves.toBe('ready');

    expect(updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(updates.reloadAsync).not.toHaveBeenCalled();
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe(BUILD);
  });

  it('(b2) first-run: update ada tetapi hasil unduh bukan baru -> ready tanpa reload', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockResolvedValue({ isNew: false });

    await expect(runStartupUpdate()).resolves.toBe('ready');

    expect(updates.reloadAsync).not.toHaveBeenCalled();
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe(BUILD);
  });

  it('(c) first-run saat check error (offline): tetap ready dan simpan penanda', async () => {
    updates.checkForUpdateAsync.mockRejectedValue(new Error('offline'));

    await expect(runStartupUpdate()).resolves.toBe('ready');

    expect(updates.reloadAsync).not.toHaveBeenCalled();
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe(BUILD);
  });

  it('(c) first-run saat check timeout: tetap ready dan simpan penanda', async () => {
    updates.checkForUpdateAsync.mockImplementation(never);

    const result = runStartupUpdate();
    await jest.advanceTimersByTimeAsync(CHECK_TIMEOUT_MS);

    await expect(result).resolves.toBe('ready');
    expect(updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe(BUILD);
  });

  it('(c) first-run saat unduh timeout: tetap ready dan simpan penanda', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockImplementation(never);

    const result = runStartupUpdate();
    await jest.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS);

    await expect(result).resolves.toBe('ready');
    expect(updates.reloadAsync).not.toHaveBeenCalled();
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe(BUILD);
  });

  it('(c) reload yang gagal tidak melempar error ke pemanggil', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockResolvedValue({ isNew: true });
    updates.reloadAsync.mockRejectedValue(new Error('reload gagal'));

    await expect(runStartupUpdate()).resolves.toBe('ready');
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe(BUILD);
  });

  it('(d) bukan first-run: tidak memanggil check maupun reload', async () => {
    kv.setItemSync(FIRST_RUN_KEY, BUILD);
    kv.setItemSync.mockClear();

    await expect(runStartupUpdate()).resolves.toBe('ready');

    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();
    expect(updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(updates.reloadAsync).not.toHaveBeenCalled();
    expect(kv.setItemSync).not.toHaveBeenCalled();
  });

  it('(e) versi native berbeda dianggap first-run lagi', async () => {
    kv.setItemSync(FIRST_RUN_KEY, BUILD);
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: false });

    app.nativeApplicationVersion = '1.0.4';
    await runStartupUpdate();
    expect(updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe('1.0.4+4');

    // Nomor build berbeda pada versi yang sama juga dihitung build baru.
    app.nativeBuildVersion = '5';
    await runStartupUpdate();
    expect(updates.checkForUpdateAsync).toHaveBeenCalledTimes(2);
    expect(kv.getItemSync(FIRST_RUN_KEY)).toBe('1.0.4+5');
  });

  it('(f) Updates.isEnabled false: langsung ready', async () => {
    updates.isEnabled = false;

    await expect(runStartupUpdate()).resolves.toBe('ready');

    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();
    expect(kv.setItemSync).not.toHaveBeenCalled();
  });

  it('(f) __DEV__ true: langsung ready', async () => {
    globals.__DEV__ = true;

    await expect(runStartupUpdate()).resolves.toBe('ready');

    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();
    expect(kv.setItemSync).not.toHaveBeenCalled();
  });

  it('storage gagal dibaca: dianggap bukan first-run agar user tidak tertahan', async () => {
    kv.getItemSync.mockImplementation(() => {
      throw new Error('storage rusak');
    });

    expect(isFirstRunOfBuild()).toBe(false);
    await expect(runStartupUpdate()).resolves.toBe('ready');
    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('storage gagal ditulis: tetap ready tanpa melempar error', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: false });
    kv.setItemSync.mockImplementation(() => {
      throw new Error('disk penuh');
    });

    await expect(runStartupUpdate()).resolves.toBe('ready');
  });
});

describe('isFirstRunOfBuild', () => {
  it('true saat penanda kosong, false setelah penanda build ini tersimpan', () => {
    expect(isFirstRunOfBuild()).toBe(true);
    kv.setItemSync(FIRST_RUN_KEY, BUILD);
    expect(isFirstRunOfBuild()).toBe(false);
  });
});
