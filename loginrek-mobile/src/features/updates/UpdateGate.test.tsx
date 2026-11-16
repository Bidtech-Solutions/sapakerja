import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';

import i18n from '@/i18n';
import { RELOAD_GRACE_MS } from './startup-update';
import { UpdateGate } from './UpdateGate';
import { resetStartupUpdateForTests } from './useStartupUpdate';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone', Bare: 'bare' },
}));
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn().mockResolvedValue(undefined),
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
}));
jest.mock('expo-updates', () => ({
  isEnabled: true,
  isEmergencyLaunch: false,
  updateId: 'running-update-id',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  useUpdates: jest.fn(),
}));

const updates = Updates as unknown as {
  checkForUpdateAsync: jest.Mock;
  fetchUpdateAsync: jest.Mock;
  reloadAsync: jest.Mock;
  useUpdates: jest.Mock;
};
const netInfoFetch = NetInfo.fetch as unknown as jest.Mock;
const hideAsync = SplashScreen.hideAsync as jest.Mock;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = (ms = 0) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

function renderGate(ready?: boolean) {
  return render(
    <UpdateGate ready={ready}>
      <Text testID="app">aplikasi</Text>
    </UpdateGate>,
  );
}

beforeEach(async () => {
  jest.useFakeTimers();
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  await i18n.changeLanguage('en');
  resetStartupUpdateForTests();
  hideAsync.mockClear();
  netInfoFetch.mockReset().mockResolvedValue({ isConnected: true, isInternetReachable: true });
  updates.checkForUpdateAsync.mockReset().mockResolvedValue({ isAvailable: false });
  updates.fetchUpdateAsync
    .mockReset()
    .mockResolvedValue({ isNew: true, manifest: { id: 'new-update-id' } });
  updates.reloadAsync.mockReset().mockResolvedValue(undefined);
  updates.useUpdates.mockReset().mockReturnValue({ isDownloading: false });
});

afterEach(() => {
  jest.useRealTimers();
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

describe('UpdateGate', () => {
  it('tanpa update: kosong selama pengecekan (splash native menutupi), lalu aplikasi tampil', async () => {
    const check = deferred<{ isAvailable: boolean }>();
    updates.checkForUpdateAsync.mockReturnValue(check.promise);

    await renderGate();
    await tick();
    expect(screen.queryByTestId('app')).toBeNull();
    expect(screen.queryByTestId('update-screen')).toBeNull();
    expect(hideAsync).not.toHaveBeenCalled(); // splash tetap tampil selama pengecekan

    check.resolve({ isAvailable: false });
    await tick();

    expect(screen.getByTestId('app')).toBeTruthy();
    expect(screen.queryByTestId('update-screen')).toBeNull();
    expect(hideAsync).toHaveBeenCalledTimes(1);
    expect(updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('ada update: UpdateScreen tampil selama unduhan lalu reloadAsync dipanggil (aplikasi lama tidak sempat tampil)', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    const download = deferred<{ isNew: boolean; manifest: { id: string } }>();
    updates.fetchUpdateAsync.mockReturnValue(download.promise);

    await renderGate();
    await tick();

    expect(screen.getByTestId('update-screen')).toBeTruthy();
    expect(screen.getByText('Updating the app...')).toBeTruthy();
    expect(screen.queryByTestId('app')).toBeNull();
    expect(hideAsync).toHaveBeenCalledTimes(1); // splash digantikan UpdateScreen yang sama
    expect(updates.reloadAsync).not.toHaveBeenCalled();

    download.resolve({ isNew: true, manifest: { id: 'new-update-id' } });
    await tick();

    expect(updates.reloadAsync).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('update-screen')).toBeTruthy();
    expect(screen.queryByTestId('app')).toBeNull();

    // Pengaman: reload tertahan tidak mengunci aplikasi selamanya.
    await tick(RELOAD_GRACE_MS + 100);
    expect(screen.getByTestId('app')).toBeTruthy();
    expect(updates.reloadAsync).toHaveBeenCalledTimes(1);
    expect(hideAsync).toHaveBeenCalledTimes(1);
  });

  it('unduhan gagal: aplikasi tampil dengan bundle saat ini, tanpa reload', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockRejectedValue(new Error('gagal'));

    await renderGate();
    await tick();

    expect(screen.getByTestId('app')).toBeTruthy();
    expect(screen.queryByTestId('update-screen')).toBeNull();
    expect(updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('offline: aplikasi tampil tanpa memeriksa update', async () => {
    netInfoFetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });

    await renderGate();
    await tick();

    expect(screen.getByTestId('app')).toBeTruthy();
    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('mode dev: aplikasi langsung tampil di render pertama, tanpa cek apa pun', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    resetStartupUpdateForTests();

    await renderGate();

    expect(screen.getByTestId('app')).toBeTruthy();
    expect(netInfoFetch).not.toHaveBeenCalled();
    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();
    expect(hideAsync).toHaveBeenCalledTimes(1);
  });

  it('ready=false: splash tidak disembunyikan sebelum inisialisasi lain siap', async () => {
    await renderGate(false);
    await tick();
    expect(hideAsync).not.toHaveBeenCalled();
  });

  it('pengecekan hanya sekali per proses walau gate mount ulang', async () => {
    const first = await renderGate();
    await tick();
    await first.unmount();
    await renderGate();
    await tick();
    expect(updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
  });
});

describe('UpdateScreen', () => {
  it('menampilkan progress bar tipis saat useUpdates menyediakan downloadProgress', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockReturnValue(new Promise(() => {}));
    updates.useUpdates.mockReturnValue({ isDownloading: true, downloadProgress: 0.4 });

    await renderGate();
    await tick();

    expect(screen.getByTestId('update-progress')).toBeTruthy();
  });

  it('tanpa downloadProgress cukup indikator, tanpa tombol apa pun', async () => {
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockReturnValue(new Promise(() => {}));

    await renderGate();
    await tick();

    expect(screen.getByTestId('update-screen')).toBeTruthy();
    expect(screen.queryByTestId('update-progress')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('teks mengikuti bahasa (Indonesia)', async () => {
    await i18n.changeLanguage('id');
    updates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    updates.fetchUpdateAsync.mockReturnValue(new Promise(() => {}));

    await renderGate();
    await tick();

    expect(screen.getByText('Memperbarui aplikasi...')).toBeTruthy();
  });
});
