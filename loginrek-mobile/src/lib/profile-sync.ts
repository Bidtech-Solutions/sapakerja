import { authApi } from '@/lib/api';
import { userStore, type UserAccount } from '@/lib/session';

/** Foto yang hanya ada di HP (belum/gagal diunggah): bukan URL atau path dari server. */
function isLocalOnlyAvatar(avatarUrl?: string): boolean {
  return !!avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('file:'));
}

/**
 * Samakan profil yang tersimpan di HP (nama, jabatan, foto) dengan data terbaru di server.
 *
 * Profil di HP hanya disalin saat login, jadi perubahan dari dashboard HR (mis. nama karyawan)
 * tidak terlihat sampai pengguna keluar lalu masuk lagi. Fungsi ini memanggil `GET /auth/me`
 * dan memperbarui salinan lokal.
 *
 * - Nama dan jabatan kosong dari server tidak menimpa nilai lokal.
 * - Foto: bila server punya foto, dipakai. Bila server TIDAK punya foto (dihapus admin), foto di
 *   HP ikut dikosongkan, kecuali foto itu hanya ada di HP (gagal terunggah: `data:` / `file:`)
 *   agar tidak hilang diam-diam.
 * - Dikembalikan: profil terbaru, atau `null` bila gagal (offline, sesi habis). Pemanggil cukup
 *   tetap memakai salinan lokal yang ada; kegagalan di sini tidak boleh mengganggu layar.
 *
 * Panggil SETELAH penyimpanan lain pada layar selesai, karena fungsi ini membaca dan menulis
 * salinan yang sama.
 */
export async function refreshProfile(): Promise<UserAccount | null> {
  try {
    const current = await userStore.getCurrentUser();
    if (!current) return null;

    const res = await authApi.me();
    const me = res?.data;
    if (!me) return current;

    const next: UserAccount = {
      ...current,
      fullName: me.fullName?.trim() ? me.fullName : current.fullName,
      role: me.role?.trim() ? me.role : current.role,
      avatarUrl: me.avatarUrl
        ? me.avatarUrl
        : isLocalOnlyAvatar(current.avatarUrl)
          ? current.avatarUrl
          : undefined,
    };

    const changed =
      next.fullName !== current.fullName ||
      next.role !== current.role ||
      next.avatarUrl !== current.avatarUrl;
    if (changed) await userStore.setCurrentUser(next);
    return next;
  } catch {
    return null;
  }
}
