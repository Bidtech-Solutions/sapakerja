import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { ObserveRoot } from 'expo-observe';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { UpdateGate } from '@/features/updates/UpdateGate';
import { setAccessToken, setUnauthorizedHandler } from '@/lib/api';
import { tokenStorage } from '@/lib/token-storage';
import { userStore } from '@/lib/user-store';
import { colors } from '@/lib/theme';

// Splash native tetap tampil sampai UpdateGate menyembunyikannya (satu-satunya hideAsync).
// Dipanggil di tingkat modul, sebelum render apa pun; jangan panggil lagi di tempat lain.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Root layout (Expo Router). Nanti di sini: provider auth + React Query,
 * dan pemisahan grup route (auth) vs (app).
 */
function RootLayout() {
  // Token ditolak server (kedaluwarsa/dicabut): bersihkan sesi lalu minta login ulang.
  // Antrean absen offline tidak dihapus dan akan dikirim setelah login berikutnya.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      void tokenStorage.clear();
      void userStore.clearCurrentUser();
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/(auth)/login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <UpdateGate>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="(auth)/login"
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="(app)/attendance"
            options={{
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </UpdateGate>
  );
}

// Expo Observe: mengukur Time to First Render secara otomatis.
export default ObserveRoot.wrap(RootLayout);
