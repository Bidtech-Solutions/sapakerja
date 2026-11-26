import { authApi } from '../api';
import { userStore, type UserAccount } from '../session';
import { refreshProfile } from '../profile-sync';

jest.mock('../api', () => ({
  __esModule: true,
  authApi: { me: jest.fn() },
}));

jest.mock('../session', () => ({
  __esModule: true,
  userStore: { getCurrentUser: jest.fn(), setCurrentUser: jest.fn() },
}));

const me = authApi.me as jest.Mock;
const getCurrentUser = userStore.getCurrentUser as jest.Mock;
const setCurrentUser = userStore.setCurrentUser as jest.Mock;

const local: UserAccount = {
  id: 'usr-7',
  email: 'baginda@loginrek.com',
  fullName: 'Baginda',
  role: 'Staff',
  onTimeCount: 3,
  lateCount: 1,
  todayCheckIn: null,
  history: [],
  avatarUrl: 'https://example.test/a.webp',
};

const serverUser = {
  id: 7,
  email: 'baginda@loginrek.com',
  initials: 'BA',
  fullName: 'Baginta',
  role: 'Staff',
  avatarUrl: 'https://example.test/a.webp',
};

beforeEach(() => {
  jest.clearAllMocks();
  getCurrentUser.mockResolvedValue(local);
});

describe('refreshProfile', () => {
  it('memperbarui nama lokal dari server dan menyimpannya, data lain tetap', async () => {
    me.mockResolvedValue({ data: serverUser });

    const result = await refreshProfile();

    expect(result?.fullName).toBe('Baginta');
    expect(result?.onTimeCount).toBe(3);
    expect(setCurrentUser).toHaveBeenCalledTimes(1);
    expect(setCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Baginta' }));
  });

  it('tidak menulis ulang bila tidak ada yang berubah', async () => {
    me.mockResolvedValue({ data: { ...serverUser, fullName: 'Baginda' } });

    const result = await refreshProfile();

    expect(result?.fullName).toBe('Baginda');
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it('nama dan jabatan kosong dari server tidak menimpa nilai lokal', async () => {
    me.mockResolvedValue({ data: { ...serverUser, fullName: '  ', role: null } });

    const result = await refreshProfile();

    expect(result?.fullName).toBe('Baginda');
    expect(result?.role).toBe('Staff');
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it('mengosongkan foto di HP bila server sudah tidak punya foto (dihapus admin)', async () => {
    me.mockResolvedValue({ data: { ...serverUser, fullName: 'Baginda', avatarUrl: null } });

    const result = await refreshProfile();

    expect(result?.avatarUrl).toBeUndefined();
    expect(setCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: undefined }));
  });

  it.each(['data:image/jpeg;base64,AAAA', 'file:///cache/foto.jpg'])(
    'foto yang hanya ada di HP (%s) tidak dihapus walau server tidak punya foto',
    async (localAvatar) => {
      getCurrentUser.mockResolvedValue({ ...local, avatarUrl: localAvatar });
      me.mockResolvedValue({ data: { ...serverUser, fullName: 'Baginda', avatarUrl: null } });

      const result = await refreshProfile();

      expect(result?.avatarUrl).toBe(localAvatar);
      expect(setCurrentUser).not.toHaveBeenCalled();
    },
  );

  it('memakai foto dari server bila ada', async () => {
    me.mockResolvedValue({
      data: { ...serverUser, fullName: 'Baginda', avatarUrl: 'avatars/baru.webp' },
    });

    const result = await refreshProfile();

    expect(result?.avatarUrl).toBe('avatars/baru.webp');
    expect(setCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('mengembalikan null (tanpa melempar) saat server tidak terjangkau', async () => {
    me.mockRejectedValue(new Error('Network request failed'));

    await expect(refreshProfile()).resolves.toBeNull();
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it('mengembalikan null bila belum ada pengguna tersimpan', async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(refreshProfile()).resolves.toBeNull();
    expect(me).not.toHaveBeenCalled();
  });
});
