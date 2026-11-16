import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { ObserveRoot } from 'expo-observe';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/i18n';
import { setAccessToken, setUnauthorizedHandler } from '@/lib/api';
import { tokenStorage, userStore } from '@/lib/session';
import { colors } from '@/lib/theme';

/**
 * Channel notifikasi Android (8+). Suara ditentukan per channel dan TIDAK bisa diubah setelah
 * channel dibuat di perangkat — untuk mengganti suara, pakai id channel baru (mis. `alarm-v2`).
 * Berkas suara harus terdaftar di plugin `expo-notifications` (`sounds`) pada app.json.
 * iOS tidak memakai channel: suara dipilih lewat field `sound` pada notifikasi.
 */
async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;
  try {
    // Dimuat saat dibutuhkan agar Expo Go (tanpa dukungan penuh notifikasi) tidak gagal saat startup.
    const Notifications = await import('expo-notifications');
    await Notifications.setNotificationChannelAsync('alarm', {
      name: i18n.t('notification.channelAlarm'),
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'sapakerja_notification.wav',
    });
    await Notifications.setNotificationChannelAsync('info', {
      name: i18n.t('notification.channelInfo'),
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'sapakerja_notification_2.wav',
    });
  } catch {
    // Channel hanya memengaruhi notifikasi; kegagalannya tidak boleh menghalangi aplikasi.
  }
}

/**
 * Root layout (Expo Router). Nanti di sini: provider auth + React Query,
 * dan pemisahan grup route (auth) vs (app).
 */
function RootLayout() {
  useEffect(() => {
    void setupNotificationChannels();
  }, []);

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
  );
}

// Expo Observe: mengukur Time to First Render secara otomatis.
export default ObserveRoot.wrap(RootLayout);
