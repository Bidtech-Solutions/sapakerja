import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/typography';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { GatePhase } from '@/lib/permission-gate';

export type PermissionKind = 'camera' | 'location';
/** `servicesOff` = izin lokasi sudah ada tetapi Layanan Lokasi (GPS) perangkat mati. */
export type PromptPhase = Exclude<GatePhase, 'granted'> | 'servicesOff';

type Step = { title: string; subtitle?: string };

type Props = {
  kind: PermissionKind;
  phase: PromptPhase;
  /** Tombol "Lanjutkan": memunculkan dialog izin sistem. */
  onContinue: () => void;
  /** Tombol "Buka Pengaturan": hanya dirender saat izin ditolak permanen / GPS mati. */
  onOpenSettings: () => void;
  onBack: () => void;
};

/**
 * Layar penjelasan izin (kamera / lokasi), sesuai App Store 5.1.1(iv):
 * - checking / requesting : netral (indikator muat), TANPA tombol atau teks Pengaturan;
 * - canAsk                : penjelasan + tombol "Lanjutkan" (dialog sistem);
 * - blocked / servicesOff : penjelasan + panduan + "Buka Pengaturan" (setelah izin ditolak).
 */
export function PermissionPrompt({ kind, phase, onContinue, onOpenSettings, onBack }: Props) {
  const { t } = useTranslation();

  if (phase === 'checking' || phase === 'requesting') {
    return (
      <View
        style={styles.neutral}
        testID="permission-loading"
        accessibilityLabel={t('permission.checking')}
      >
        <ActivityIndicator color="#05564E" />
      </View>
    );
  }

  const isAsk = phase === 'canAsk';
  const base = `permission.${kind}`;
  const titleKey = isAsk
    ? 'askTitle'
    : phase === 'servicesOff'
      ? 'servicesOffTitle'
      : 'blockedTitle';
  const bodyKey = isAsk ? 'askBody' : phase === 'servicesOff' ? 'servicesOffBody' : 'blockedBody';
  const steps = t(`${base}.steps`, { returnObjects: true }) as unknown as Step[];
  const badge = kind === 'location' ? t('permission.location.stepsBadge') : null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.illustrationCircle}>
        <MaterialCommunityIcons
          name={
            kind === 'camera'
              ? isAsk
                ? 'camera-outline'
                : 'camera-off-outline'
              : isAsk
                ? 'map-marker-outline'
                : 'map-marker-off-outline'
          }
          size={54}
          color="#64748B"
        />
        {!isAsk && kind === 'camera' ? (
          <View style={styles.padlockBadge}>
            <Feather name="lock" size={14} color="#DC2626" />
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{t(`${base}.${titleKey}`)}</Text>
      <Text style={styles.subtitle}>{t(`${base}.${bodyKey}`)}</Text>

      {isAsk ? (
        <Pressable
          testID="permission-continue"
          accessibilityRole="button"
          accessibilityLabel={t('common.continue')}
          onPress={onContinue}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        >
          <Text style={styles.primaryBtnText}>{t('common.continue')}</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" style={styles.btnIcon} />
        </Pressable>
      ) : (
        <>
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Text style={styles.guideTitle}>{t(`${base}.guideTitle`)}</Text>
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            {steps.map((step, i) => (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  {step.subtitle ? <Text style={styles.stepSubtitle}>{step.subtitle}</Text> : null}
                </View>
              </View>
            ))}
          </View>

          <Pressable
            testID="permission-open-settings"
            accessibilityRole="button"
            accessibilityLabel={t('common.openSettings')}
            onPress={onOpenSettings}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Feather name="settings" size={17} color="#FFFFFF" style={styles.btnIconLeft} />
            <Text style={styles.primaryBtnText}>{t('common.openSettings')}</Text>
          </Pressable>
        </>
      )}

      <Pressable
        testID="permission-back"
        accessibilityRole="button"
        accessibilityLabel={t('common.backToHome')}
        onPress={onBack}
        style={styles.backLink}
        hitSlop={8}
      >
        <Text style={styles.backLinkText}>{t('common.backToHome')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  neutral: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
    marginBottom: 16,
  },
  padlockBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1F24',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  guideCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDF2F4',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F1F24',
  },
  badge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  stepInfo: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 32,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: '#05564E',
    borderRadius: 14,
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#05564E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  primaryBtnPressed: {
    backgroundColor: '#033F39',
    transform: [{ scale: 0.99 }],
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnIcon: {
    marginLeft: 8,
  },
  btnIconLeft: {
    marginRight: 8,
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#05564E',
  },
});
