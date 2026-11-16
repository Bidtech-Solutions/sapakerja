import { useEffect, type ReactNode } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { UpdateScreen } from './UpdateScreen';
import { useStartupUpdate } from './useStartupUpdate';

type Props = {
  children: ReactNode;
  /**
   * Inisialisasi lain (font, dll.) sudah siap. Splash native baru disembunyikan bila gate
   * selesai DAN ready=true. Saat ini belum ada font/inisialisasi lain, jadi bawaannya true.
   */
  ready?: boolean;
};

/**
 * Pemilik tunggal SplashScreen.hideAsync(). preventAutoHideAsync() dipanggil sekali di
 * app/_layout.tsx (tingkat modul, sebelum render); expo-router tidak menyembunyikan splash
 * sendiri selama itu aktif.
 *
 * - checking    : render kosong, splash native masih menutupi layar (maks ~4 detik)
 * - downloading : splash disembunyikan, UpdateScreen (tampilan sama) menggantikannya
 * - done        : aplikasi normal
 */
export function UpdateGate({ children, ready = true }: Props) {
  const phase = useStartupUpdate();
  const canHideSplash = phase !== 'checking' && ready;

  useEffect(() => {
    if (canHideSplash) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [canHideSplash]);

  if (phase === 'checking') return null;
  if (phase === 'downloading') return <UpdateScreen />;
  return <>{children}</>;
}
