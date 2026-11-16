import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUpdates } from 'expo-updates';

import { splash, Text } from '@/lib/theme';

// Harus sama dengan konfigurasi plugin expo-splash-screen di app.json (lebar 200, contain).
const LOGO_SIZE = 200;

/**
 * Tampilan sama dengan splash native (latar, logo di tengah) supaya transisinya mulus,
 * ditambah indikator + teks di bawah logo. Tanpa tombol: pengguna tidak perlu melakukan apa pun.
 */
export function UpdateScreen() {
  const { t } = useTranslation();
  const { isDownloading, downloadProgress } = useUpdates();
  const progress =
    isDownloading && typeof downloadProgress === 'number'
      ? Math.min(1, Math.max(0, downloadProgress))
      : null;

  return (
    <View style={styles.root} testID="update-screen" accessibilityLabel={t('updates.updating')}>
      <Image
        source={require('../../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {/* Posisi absolut di bawah logo agar logo tetap persis di titik tengah seperti splash native. */}
      <View style={styles.status}>
        <ActivityIndicator color={splash.foreground} />
        <Text style={styles.text}>{t('updates.updating')}</Text>
        {progress !== null ? (
          <View style={styles.track} testID="update-progress">
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: splash.background,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  status: {
    position: 'absolute',
    top: '50%',
    marginTop: LOGO_SIZE / 2 + 24,
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: splash.foreground,
  },
  track: {
    width: 160,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: splash.foreground,
  },
});
