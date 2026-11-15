import { Linking, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import i18n from '@/i18n';
import { PermissionPrompt } from '@/components/PermissionPrompt';
import { usePermissionGate } from '@/hooks/use-permission-gate';
import type { OsPermission } from '@/lib/permission-gate';

const UNDETERMINED: OsPermission = { status: 'undetermined', granted: false, canAskAgain: true };
const GRANTED: OsPermission = { status: 'granted', granted: true, canAskAgain: true };
const DENIED_CAN_ASK: OsPermission = { status: 'denied', granted: false, canAskAgain: true };
const DENIED_BLOCKED: OsPermission = { status: 'denied', granted: false, canAskAgain: false };

type HarnessProps = {
  get: () => Promise<OsPermission>;
  request: () => Promise<OsPermission>;
  enabled?: boolean;
  kind?: 'camera' | 'location';
};

/** Menyusun hook + layar persis seperti attendance.tsx. */
function Harness({ get, request, enabled, kind = 'camera' }: HarnessProps) {
  const gate = usePermissionGate({ getPermission: get, requestPermission: request, enabled });
  if (gate.phase === 'granted') return <Text testID="feature">fitur jalan</Text>;
  return (
    <PermissionPrompt
      kind={kind}
      phase={gate.phase}
      onContinue={gate.ask}
      onOpenSettings={gate.openSettings}
      onBack={() => {}}
    />
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// Kata yang tidak boleh terlihat sebelum dialog sistem selesai, di kedua bahasa.
const SETTINGS_TEXTS = ['Buka Pengaturan', 'Open Settings', 'Settings', 'Pengaturan'];

function expectNoSettingsUI() {
  expect(screen.queryByTestId('permission-open-settings')).toBeNull();
  for (const text of SETTINGS_TEXTS) {
    expect(screen.queryByText(text, { exact: false })).toBeNull();
  }
}

describe.each(['en', 'id'] as const)('alur izin (bahasa: %s)', (lng) => {
  let openSettings: jest.SpyInstance;

  beforeEach(async () => {
    await i18n.changeLanguage(lng);
    openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  });

  afterEach(() => {
    openSettings.mockRestore();
  });

  it('undetermined: netral, tanpa tombol Pengaturan, dan requestPermission langsung dipanggil', async () => {
    const dialog = deferred<OsPermission>();
    const get = jest.fn().mockResolvedValue(UNDETERMINED);
    const request = jest.fn().mockReturnValue(dialog.promise);

    await render(<Harness get={get} request={request} />);

    // Render pertama (sebelum status terbaca) sudah netral.
    expectNoSettingsUI();

    // Status terbaca -> dialog sistem diminta, layar tetap netral selama dialog terbuka.
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('permission-loading')).toBeTruthy();
    expect(screen.queryByTestId('permission-continue')).toBeNull();
    expectNoSettingsUI();

    // Pengguna memilih "Izinkan" -> fitur berjalan.
    await act(async () => {
      dialog.resolve(GRANTED);
    });
    expect(await screen.findByTestId('feature')).toBeTruthy();
    expect(request).toHaveBeenCalledTimes(1);
    expect(openSettings).not.toHaveBeenCalled();
  });

  it('undetermined lalu ditolak di dialog (iOS: canAskAgain=false): baru boleh ke Pengaturan', async () => {
    const get = jest.fn().mockResolvedValue(UNDETERMINED);
    const request = jest.fn().mockResolvedValue(DENIED_BLOCKED);

    await render(<Harness get={get} request={request} />);

    expect(await screen.findByTestId('permission-open-settings')).toBeTruthy();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('denied + canAskAgain: tombol "Lanjutkan" memanggil requestPermission, tanpa Pengaturan', async () => {
    const get = jest.fn().mockResolvedValue(DENIED_CAN_ASK);
    const request = jest.fn().mockResolvedValue(GRANTED);

    await render(<Harness get={get} request={request} />);

    const continueBtn = await screen.findByTestId('permission-continue');
    expect(screen.getByText(i18n.t('common.continue'))).toBeTruthy();
    expectNoSettingsUI();
    // Tidak ada permintaan otomatis: menunggu ketukan pengguna.
    expect(request).not.toHaveBeenCalled();

    await fireEvent.press(continueBtn);

    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId('feature')).toBeTruthy();
    expect(openSettings).not.toHaveBeenCalled();
  });

  it('denied tanpa canAskAgain: tombol Pengaturan muncul dan membuka Linking.openSettings', async () => {
    const get = jest.fn().mockResolvedValue(DENIED_BLOCKED);
    const request = jest.fn();

    await render(<Harness get={get} request={request} />);

    const settingsBtn = await screen.findByTestId('permission-open-settings');
    expect(screen.getByText(i18n.t('common.openSettings'))).toBeTruthy();
    expect(screen.queryByTestId('permission-continue')).toBeNull();
    expect(request).not.toHaveBeenCalled();

    await fireEvent.press(settingsBtn);
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it('lokasi: panduan GPS hanya muncul setelah izin ditolak, tidak saat undetermined', async () => {
    const dialog = deferred<OsPermission>();
    const get = jest.fn().mockResolvedValue(UNDETERMINED);
    const request = jest.fn().mockReturnValue(dialog.promise);

    await render(<Harness kind="location" get={get} request={request} />);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    const gpsStep = i18n.t('permission.location.steps.1.title');
    expect(screen.queryByText(gpsStep)).toBeNull();
    expectNoSettingsUI();

    await act(async () => {
      dialog.resolve(DENIED_BLOCKED);
    });
    expect(await screen.findByText(gpsStep)).toBeTruthy();
    expect(screen.getByTestId('permission-open-settings')).toBeTruthy();
  });

  it('enabled=false: izin belum dibaca maupun diminta (lokasi menunggu kamera)', async () => {
    const get = jest.fn().mockResolvedValue(UNDETERMINED);
    const request = jest.fn().mockResolvedValue(GRANTED);

    await render(<Harness get={get} request={request} enabled={false} />);

    expect(screen.getByTestId('permission-loading')).toBeTruthy();
    expectNoSettingsUI();
    expect(get).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });
});
