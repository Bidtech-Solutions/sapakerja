import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { ObserveRoot } from 'expo-observe';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/i18n';
import { setAccessToken, setUnauthorizedHandler } from '@/lib/api';
import { tokenStorage, userStore } from '@/lib/session';
import { isFirstRunOfBuild, runStartupUpdate } from '@/lib/startup-update';
import { colors, spacing, Text } from '@/lib/theme';

// Splash native ditahan sampai pengecekan OTA awal selesai (lihat RootLayout).
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Layar "Menyiapkan pembaruan…" baru muncul bila pengecekan OTA awal lebih lama dari ini. */
const UPDATE_SCREEN_DELAY_MS = 500;

/** checking: splash masih tampil | updating: UpdateScreen tampil | ready: aplikasi dirender. */
type StartupPhase = 'checking' | 'updating' | 'ready';

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
 * Layar penuh saat aplikasi mengunduh pembaruan OTA di pembukaan pertama sebuah build.
 * Latarnya sama dengan splash native supaya peralihannya tidak terlihat berkedip.
 */
function UpdateScreen() {
  const { t } = useTranslation();

  return (
    <View
      style={styles.updateScreen}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
    >
      <Image source={require('@/assets/logo-symbol.png')} style={styles.updateLogo} />
      <ActivityIndicator color={colors.surface} size="large" style={styles.updateSpinner} />
      <Text style={styles.updateTitle}>{t('startupUpdate.title')}</Text>
      <Text style={styles.updateHint}>{t('startupUpdate.hint')}</Text>
    </View>
  );
}

/**
 * Root layout (Expo Router). Nanti di sini: provider auth + React Query,
 * dan pemisahan grup route (auth) vs (app).
 */
function RootLayout() {
  // Pembukaan pertama di build native ini: cek OTA di depan. Selain itu langsung 'ready' tanpa
  // menunggu apa pun (pengecekan penanda sinkron; unduhan OTA berjalan di latar belakang).
  const [phase, setPhase] = useState<StartupPhase>(() =>
    isFirstRunOfBuild() ? 'checking' : 'ready',
  );

  useEffect(() => {
    if (phase !== 'checking') return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setPhase((p) => (p === 'checking' ? 'updating' : p));
    }, UPDATE_SCREEN_DELAY_MS);

    runStartupUpdate()
      .then((result) => !cancelled && setPhase(result === 'reloading' ? 'updating' : 'ready'))
      .catch(() => !cancelled && setPhase('ready'))
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Hanya dijalankan sekali saat mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Font sudah tertanam native (plugin expo-font), jadi splash cukup menunggu pengecekan OTA.
  useEffect(() => {
    if (phase !== 'checking') void SplashScreen.hideAsync().catch(() => {});
  }, [phase]);

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

  if (phase === 'checking') return null;
  if (phase === 'updating') {
    return (
      <>
        <StatusBar style="light" />
        <UpdateScreen />
      </>
    );
  }

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

const styles = StyleSheet.create({
  updateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.splash,
  },
  updateLogo: { width: 72, height: 72 },
  updateSpinner: { marginTop: spacing.xxl },
  updateTitle: {
    marginTop: spacing.lg,
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
    textAlign: 'center',
  },
  updateHint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.surface,
    opacity: 0.85,
    textAlign: 'center',
  },
});

// Expo Observe: mengukur Time to First Render secara otomatis.
export default ObserveRoot.wrap(RootLayout);
