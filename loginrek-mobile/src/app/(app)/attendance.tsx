import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView } from 'expo-camera';

import { userStore, UserAccount } from '@/lib/user-store';
import {
  cameraPermission,
  classifyPermission,
  isLocationServicesEnabled,
  locationPermission,
  phaseAfterRequest,
  type GatePhase,
  type OsPermission,
} from '@/lib/permissions';
import { statusLabel } from '@/lib/attendance-format';
import { colors, Text } from '@/lib/theme';
import { locationStore, OfficeConfig } from '@/lib/location-store';
import { syncStore } from '@/lib/sync-store';
import { attendanceApi } from '@/lib/api';

// Format jam realtime digital 24 jam (HH:mm:ss WIB)
function formatTime24(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s} WIB`;
}

type PermissionGateOptions = {
  getPermission: () => Promise<OsPermission>;
  requestPermission: () => Promise<OsPermission>;
  /** false = tunda sama sekali (mis. izin lokasi menunggu izin kamera selesai). */
  enabled?: boolean;
};

type PermissionGate = {
  phase: GatePhase;
  /** Memunculkan dialog izin sistem (tombol "Lanjutkan"). */
  ask: () => Promise<void>;
  /** Membuka Pengaturan aplikasi (hanya untuk fase `blocked`). */
  openSettings: () => Promise<void>;
  /** Baca ulang status izin tanpa memunculkan dialog. */
  refresh: () => Promise<void>;
};

/**
 * Alur izin sesuai pedoman Apple:
 * - belum diputuskan  -> fase `requesting` dan dialog sistem langsung diminta (satu kali),
 * - sudah diizinkan   -> `granted`,
 * - ditolak, boleh ditanya lagi -> `canAsk` (UI: tombol "Lanjutkan" -> ask()),
 * - ditolak permanen  -> `blocked` (UI: boleh mengarahkan ke Pengaturan).
 * Kembali dari Pengaturan (app aktif lagi) membaca ulang status tanpa dialog.
 */
function usePermissionGate({
  getPermission,
  requestPermission,
  enabled = true,
}: PermissionGateOptions): PermissionGate {
  const [phase, setPhase] = useState<GatePhase>('checking');
  const mounted = useRef(true);
  const autoRequested = useRef(false);
  const getRef = useRef(getPermission);
  const requestRef = useRef(requestPermission);

  // Selalu pakai fungsi terbaru tanpa membuat efek/callback berubah identitas.
  useEffect(() => {
    getRef.current = getPermission;
    requestRef.current = requestPermission;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const safeSet = useCallback((next: GatePhase) => {
    if (mounted.current) setPhase(next);
  }, []);

  const request = useCallback(async () => {
    safeSet('requesting');
    try {
      safeSet(phaseAfterRequest(await requestRef.current()));
    } catch {
      safeSet('canAsk');
    }
  }, [safeSet]);

  const evaluate = useCallback(
    async (allowAutoRequest: boolean) => {
      try {
        const state = classifyPermission(await getRef.current());
        if (state !== 'undetermined') {
          safeSet(state);
          return;
        }
        if (allowAutoRequest && !autoRequested.current) {
          autoRequested.current = true;
          await request();
        }
      } catch {
        safeSet('canAsk');
      }
    },
    [request, safeSet],
  );

  useEffect(() => {
    if (enabled) void evaluate(true);
  }, [enabled, evaluate]);

  // Kembali dari Pengaturan: perbarui status, tanpa memunculkan dialog.
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void evaluate(false);
    });
    return () => sub.remove();
  }, [enabled, evaluate]);

  const ask = useCallback(() => request(), [request]);
  const refresh = useCallback(() => evaluate(false), [evaluate]);
  const openSettings = useCallback(() => Linking.openSettings(), []);

  return { phase, ask, openSettings, refresh };
}


// Layar penjelasan izin kamera/lokasi (App Store 5.1.1(iv)); hanya dipakai di layar ini.
type PermissionKind = 'camera' | 'location';
/** `servicesOff` = izin lokasi sudah ada tetapi Layanan Lokasi (GPS) perangkat mati. */
type PromptPhase = Exclude<GatePhase, 'granted'> | 'servicesOff';

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
function PermissionPrompt({ kind, phase, onContinue, onOpenSettings, onBack }: Props) {
  const { t } = useTranslation();

  if (phase === 'checking' || phase === 'requesting') {
    return (
      <View
        style={promptStyles.neutral}
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
      style={promptStyles.scroll}
      contentContainerStyle={promptStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={promptStyles.illustrationCircle}>
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
          <View style={promptStyles.padlockBadge}>
            <Feather name="lock" size={14} color="#DC2626" />
          </View>
        ) : null}
      </View>

      <Text style={promptStyles.title}>{t(`${base}.${titleKey}`)}</Text>
      <Text style={promptStyles.subtitle}>{t(`${base}.${bodyKey}`)}</Text>

      {isAsk ? (
        <Pressable
          testID="permission-continue"
          accessibilityRole="button"
          accessibilityLabel={t('common.continue')}
          onPress={onContinue}
          style={({ pressed }) => [promptStyles.primaryBtn, pressed && promptStyles.primaryBtnPressed]}
        >
          <Text style={promptStyles.primaryBtnText}>{t('common.continue')}</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" style={promptStyles.btnIcon} />
        </Pressable>
      ) : (
        <>
          <View style={promptStyles.guideCard}>
            <View style={promptStyles.guideHeader}>
              <Text style={promptStyles.guideTitle}>{t(`${base}.guideTitle`)}</Text>
              {badge ? (
                <View style={promptStyles.badge}>
                  <Text style={promptStyles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            {steps.map((step, i) => (
              <View key={step.title} style={promptStyles.stepRow}>
                <View style={promptStyles.stepNumber}>
                  <Text style={promptStyles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={promptStyles.stepInfo}>
                  <Text style={promptStyles.stepTitle}>{step.title}</Text>
                  {step.subtitle ? <Text style={promptStyles.stepSubtitle}>{step.subtitle}</Text> : null}
                </View>
              </View>
            ))}
          </View>

          <Pressable
            testID="permission-open-settings"
            accessibilityRole="button"
            accessibilityLabel={t('common.openSettings')}
            onPress={onOpenSettings}
            style={({ pressed }) => [promptStyles.primaryBtn, pressed && promptStyles.primaryBtnPressed]}
          >
            <Feather name="settings" size={17} color="#FFFFFF" style={promptStyles.btnIconLeft} />
            <Text style={promptStyles.primaryBtnText}>{t('common.openSettings')}</Text>
          </Pressable>
        </>
      )}

      <Pressable
        testID="permission-back"
        accessibilityRole="button"
        accessibilityLabel={t('common.backToHome')}
        onPress={onBack}
        style={promptStyles.backLink}
        hitSlop={8}
      >
        <Text style={promptStyles.backLinkText}>{t('common.backToHome')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const promptStyles = StyleSheet.create({
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

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentTime, setCurrentTime] = useState(() => formatTime24(new Date()));

  // Izin kamera lalu lokasi (berurutan agar dialog sistem tidak bertumpuk). Fase awal
  // 'checking' = layar netral; bila izin belum diputuskan, dialog sistem langsung diminta
  // (App Store 5.1.1(iv): tidak ada layar/tombol Pengaturan sebelum itu).
  const cameraGate = usePermissionGate({
    getPermission: cameraPermission.get,
    requestPermission: cameraPermission.request,
  });
  const locationGate = usePermissionGate({
    getPermission: locationPermission.get,
    requestPermission: locationPermission.request,
    enabled: cameraGate.phase === 'granted',
  });
  const hasCameraPermission = cameraGate.phase === 'granted';
  // Layanan Lokasi (GPS) perangkat; hanya relevan setelah izin lokasi diberikan.
  const [servicesEnabled, setServicesEnabled] = useState<boolean>(true);
  const locationGranted = locationGate.phase === 'granted';
  const hasLocationPermission = locationGranted && servicesEnabled;
  const locationPhase: PromptPhase =
    locationGranted ? 'servicesOff' : (locationGate.phase as PromptPhase);

  // Ref kamera native (Expo Camera) dan Web Video
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<any>(null);
  const [cameraStream, setCameraStream] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // State untuk alur Konfirmasi Foto Presensi (Sesuai Desain Figma)
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedTime, setCapturedTime] = useState<string>('08.00');
  const [capturedIsLate, setCapturedIsLate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Nilai animasi native (Sangat ringan, 60 FPS di GPU tanpa beban CPU)
  const flashAnim = useRef(new Animated.Value(0)).current;
  const previewFadeAnim = useRef(new Animated.Value(0)).current;
  const previewSlideAnim = useRef(new Animated.Value(20)).current;

  // Status Validasi Geofence Radius Kantor (Pencegah Curang)
  const [isInsideOffice, setIsInsideOffice] = useState<boolean>(true);
  const [officeDistance, setOfficeDistance] = useState<number>(0);
  const [officeConfig, setOfficeConfig] = useState<OfficeConfig | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Pantau status koneksi internet (online / offline)
  useEffect(() => {
    async function checkNet() {
      const online = await syncStore.isOnline();
      setIsOnline(online);
    }
    checkNet();
    const unsub = syncStore.subscribeNetworkState((online) => {
      setIsOnline(online);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Verifikasi apakah karyawan berada di dalam radius kantor
  async function checkGeofence() {
    try {
      const res = await locationStore.verifyLocation();
      setIsInsideOffice(res.isInside);
      setOfficeDistance(res.distanceMeters);
      setOfficeConfig(res.office);
      return res;
    } catch {
      return null;
    }
  }

  // Ambil profil user dan status izin tersimpan
  useEffect(() => {
    async function init() {
      let u = await userStore.getCurrentUser();
      if (!u) {
        router.replace('/(auth)/login');
        return;
      }
      try {
        const todayRes = await attendanceApi.getToday();
          if (todayRes?.data && !todayRes.data.hasAttended) {
            const pending = await syncStore.getPendingCount();
            const todayStr = new Date().toISOString().slice(0, 10);
            if (pending === 0 && u.todayCheckIn?.date !== todayStr) {
              u = { ...u, todayCheckIn: null };
              await userStore.setCurrentUser(u);
            }
          }
        } catch {}
        setCurrentUser(u);
        if (u.todayCheckIn) {
          Alert.alert(
            t('attendance.alreadyTitle'),
            t('attendance.alreadyBody', { time: u.todayCheckIn.time }),
            [
              { text: t('common.goToMainMenu'), onPress: () => router.replace('/(app)/home') },
              { text: t('common.ok') },
            ]
          );
        }
    }
    init();
  }, [t]);

  // Jam realtime berdetak setiap detik
  useEffect(() => {
    function updateClock() {
      setCurrentTime(formatTime24(new Date()));
    }
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Nyalakan stream kamera asli jika izin kamera & lokasi sudah aktif
  const isFullyPermitted = hasCameraPermission && hasLocationPermission;

  useEffect(() => {
    let activeStream: any = null;

    async function startLiveCamera() {
      if (isFullyPermitted && Platform.OS === 'web') {
        try {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' },
              audio: false,
            });
            activeStream = stream;
            setCameraStream(stream);
          }
        } catch (err) {
          console.warn('Gagal mengakses kamera perangkat:', err);
        }
      }
    }

    startLiveCamera();

    return () => {
      if (activeStream) {
        try {
          activeStream.getTracks().forEach((track: any) => track.stop());
        } catch {
          // Abaikan
        }
      }
    };
  }, [isFullyPermitted]);

  // Pasang stream ke elemen video saat ref siap
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      try {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play?.().catch(() => {});
      } catch {
        // Abaikan
      }
    }
  }, [cameraStream, isFullyPermitted]);

  // Setelah izin lokasi diberikan: cek Layanan Lokasi (GPS) perangkat dan, bila menyala,
  // verifikasi radius kantor. Diulang saat app kembali aktif (mis. GPS baru dinyalakan).
  useEffect(() => {
    if (!locationGranted) return;
    let cancelled = false;
    const check = async () => {
      const enabled = await isLocationServicesEnabled();
      if (cancelled) return;
      setServicesEnabled(enabled);
      if (enabled) void checkGeofence();
    };
    void check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [locationGranted]);

  // Aksi Menjepret Foto Presensi (Shutter Button)
  async function handleCapturePhoto() {
    if (currentUser?.todayCheckIn) {
      Alert.alert(
        t('attendance.alreadyTitle'),
        t('attendance.alreadyBody', { time: currentUser.todayCheckIn.time }),
        [
          { text: t('common.goToMainMenu'), onPress: () => router.replace('/(app)/home') },
          { text: t('common.ok') },
        ]
      );
      return;
    }

    // Validasi: jika izin belum lengkap, karyawan tidak bisa absen
    if (!hasCameraPermission) {
      Alert.alert(t('attendance.cameraNeededTitle'), t('attendance.cameraNeededBody'));
      return;
    }
    if (!hasLocationPermission) {
      Alert.alert(t('attendance.locationNeededTitle'), t('attendance.locationNeededBody'));
      return;
    }

    // Validasi Geofence: Karyawan HARUS berada di dalam kantor Piposmart (Anti-Curang)
    const locRes = await checkGeofence();
    if (locRes && !locRes.isInside) {
      Alert.alert(
        t('attendance.outsideTitle'),
        t('attendance.outsideBody', {
          office: locRes.office.name,
          distance: locRes.distanceMeters,
          max: locRes.office.radiusMeters,
        }),
        [
          { text: t('attendance.checkLocationAgain'), onPress: () => checkGeofence() },
          { text: t('common.close'), style: 'cancel' },
        ]
      );
      return;
    }

    setIsCapturing(true);

    // Efek shutter flash kamera instan (respon visual langsung saat tombol ditekan)
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      let photoUri: string | null = null;
      if (Platform.OS !== 'web' && cameraRef.current?.takePictureAsync) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.35,
          mirror: false,
          base64: true,
        });
        photoUri = photo?.base64 ? `data:image/jpeg;base64,${photo.base64}` : (photo?.uri ?? null);
      } else if (Platform.OS === 'web' && videoRef.current) {
        try {
          const video = videoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            photoUri = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {
          photoUri = null;
        }
      }

      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0);
      const timeFormatted = `${h}.${m}`;

      previewFadeAnim.setValue(0);
      previewSlideAnim.setValue(20);

      // Pindahkan ke mode preview konfirmasi foto
      setCapturedPhotoUri(photoUri || 'fallback');
      setCapturedTime(timeFormatted);
      setCapturedIsLate(isLate);

      // Slide & fade in halus (220ms - snappy & responsif)
      Animated.parallel([
        Animated.timing(previewFadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(previewSlideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err: any) {
      Alert.alert(t('attendance.captureFailedTitle'), err?.message || t('attendance.captureFailedBody'));
    } finally {
      setIsCapturing(false);
    }
  }

  // Aksi Foto Ulang (Jika karyawan merasa fotonya kurang bagus)
  function handleRetakePhoto() {
    Animated.timing(previewFadeAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setCapturedPhotoUri(null);
    });
  }

  // Aksi Kirim Presensi (Konfirmasi dan kembali ke Menu Utama)
  async function handleConfirmAttendance() {
    setIsSubmitting(true);
    try {
      const online = await syncStore.isOnline();

      const photoToSave =
        capturedPhotoUri && capturedPhotoUri !== 'fallback'
          ? capturedPhotoUri
          : currentUser?.avatarUrl || undefined;

      const updated = await userStore.recordAttendance(
        capturedTime,
        capturedIsLate,
        photoToSave
      );
      if (updated) {
        setCurrentUser(updated);
      }

      let isDirectSuccess = false;
      let isAlreadyCheckedIn = false;

      if (online && currentUser) {
        try {
          await attendanceApi.checkIn({
            clockInTime: `${capturedTime} WIB`,
            isLate: capturedIsLate,
            photo: photoToSave,
            latitude: officeConfig?.latitude ?? 1.105925,
            longitude: officeConfig?.longitude ?? 104.075342,
            distanceMeters: Math.round(officeDistance),
            officeName: officeConfig?.name ?? 'Kantor Piposmart',
            isOfflineSync: false,
          });
          isDirectSuccess = true;
        } catch (err: any) {
          if (err?.status === 409) {
            isAlreadyCheckedIn = true;
            isDirectSuccess = true;
          } else {
            await syncStore.addToQueue({
              email: currentUser.email,
              capturedTime,
              isLate: capturedIsLate,
              photoUri: photoToSave,
              latitude: officeConfig?.latitude ?? 1.105925,
              longitude: officeConfig?.longitude ?? 104.075342,
            });
          }
        }
      } else if (!online && currentUser) {
        await syncStore.addToQueue({
          email: currentUser.email,
          capturedTime,
          isLate: capturedIsLate,
          photoUri: photoToSave,
          latitude: officeConfig?.latitude ?? 1.105925,
          longitude: officeConfig?.longitude ?? 104.075342,
        });
      }

      if (isDirectSuccess) {
        Alert.alert(
          t('attendance.successTitle'),
          isAlreadyCheckedIn
            ? t('attendance.alreadyOnServer')
            : t('attendance.successBody', {
                time: capturedTime,
                status: statusLabel(capturedIsLate),
              }),
          [
            {
              text: t('common.goToMainMenu'),
              onPress: () => router.replace('/(app)/home'),
            },
          ]
        );
      } else {
        Alert.alert(
          t('attendance.queuedTitle'),
          t('attendance.queuedBody', {
            time: capturedTime,
            status: statusLabel(capturedIsLate),
          }),
          [
            {
              text: t('common.goToMainMenu'),
              onPress: () => router.replace('/(app)/home'),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert(t('attendance.submitFailedTitle'), err?.message || t('attendance.submitFailedBody'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Evaluasi mode layar saat ini berdasarkan izin
  const isCameraPermissionMissing = !hasCameraPermission;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Top Header: Tombol Kembali ke Home, Profil Singkat & Jam Realtime */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeftWithBack}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.backToHome')}
            onPress={() => router.replace('/(app)/home')}
            style={({ pressed }) => [styles.headerBackBtn, pressed && styles.headerBackBtnPressed]}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={26} color="#0F1F24" />
          </Pressable>
          <View>
            <Text style={styles.userName}>{currentUser?.fullName ?? t('common.employee')}</Text>
            <Text style={styles.userRole}>{currentUser?.role ?? t('common.employee')}</Text>
          </View>
        </View>
        <View style={styles.clockPill}>
          <Feather name="clock" size={13} color="#047857" style={styles.clockIcon} />
          <Text style={styles.clockText}>{currentTime}</Text>
        </View>
      </View>

      {/* ============================================================== */}
      {/* TAMPILAN PREVIEW & KONFIRMASI FOTO (1:1 Sesuai Screenshot)     */}
      {/* ============================================================== */}
      {capturedPhotoUri ? (
        <Animated.View
          style={[
            styles.previewContainer,
            {
              opacity: previewFadeAnim,
              transform: [{ translateY: previewSlideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Foto Selfie Karyawan (Dibalik horizontal agar normal sesuai tampilan kamera & tidak mirror) */}
            <View style={styles.previewPhotoCard}>
              <Image
                source={
                  capturedPhotoUri !== 'fallback'
                    ? { uri: capturedPhotoUri }
                    : require('@/assets/default-avatar.png')
                }
                style={[
                  styles.previewPhotoImage,
                  capturedPhotoUri !== 'fallback' && { transform: [{ scaleX: -1 }] },
                ]}
                resizeMode="cover"
              />
            </View>

            {/* Card Waktu Absen Tercatat */}
            <View style={styles.previewCard}>
              <View style={styles.clockIconBox}>
                <Feather name="clock" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.previewCardInfo}>
                <Text style={styles.previewCardHeaderTitle}>{t('attendance.recordedTime')}</Text>
                <View style={styles.previewTimeValueRow}>
                  <Text style={styles.previewTimeValueText}>{capturedTime}</Text>
                  <Text style={styles.previewTimeWibText}>WIB</Text>
                </View>
              </View>
            </View>

            {/* Card Status Kehadiran */}
            <View style={styles.previewStatusCard}>
              <Text style={styles.previewCardHeaderTitle}>{t('attendance.attendanceStatus')}</Text>
              <View
                style={[
                  styles.statusBadgePill,
                  capturedIsLate ? styles.statusBadgePillLate : styles.statusBadgePillOnTime,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgePillText,
                    capturedIsLate ? styles.statusBadgeTextLate : styles.statusBadgeTextOnTime,
                  ]}
                >
                  {statusLabel(capturedIsLate)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bar Aksi Bawah: Foto Ulang & Kirim Presensi */}
          <View style={[styles.previewActionFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('attendance.retake')}
              onPress={handleRetakePhoto}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.retakeBtn,
                pressed && styles.retakeBtnPressed,
              ]}
            >
              <Feather name="rotate-ccw" size={17} color="#1E293B" style={{ marginRight: 8 }} />
              <Text style={styles.retakeBtnText}>{t('attendance.retake')}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('attendance.submit')}
              onPress={handleConfirmAttendance}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && styles.confirmBtnPressed,
                isSubmitting && { opacity: 0.8 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmBtnText}>{t('attendance.submit')}</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <>
          {/* ============================================================== */}
          {/* KONDISI 1-2: IZIN KAMERA / LOKASI BELUM LENGKAP               */}
          {/* Status 'checking'/'requesting' = netral tanpa tombol Pengaturan */}
          {/* ============================================================== */}
          {!isFullyPermitted &&
            (isCameraPermissionMissing ? (
              <PermissionPrompt
                kind="camera"
                phase={cameraGate.phase as PromptPhase}
                onContinue={cameraGate.ask}
                onOpenSettings={cameraGate.openSettings}
                onBack={() => router.replace('/(app)/home')}
              />
            ) : (
              <PermissionPrompt
                kind="location"
                phase={locationPhase}
                onContinue={locationGate.ask}
                onOpenSettings={locationGate.openSettings}
                onBack={() => router.replace('/(app)/home')}
              />
            ))}

      {/* ============================================================== */}
      {/* KONDISI 3: KAMERA & LOKASI AKTIF (Viewfinder Live / Asli)     */}
      {/* ============================================================== */}
      {isFullyPermitted && (
        <View style={styles.cameraContainer}>
          {/* Kamera Asli di HP (iOS / Android) */}
          {Platform.OS !== 'web' ? (
            <CameraView
              ref={cameraRef}
              style={styles.cameraBackground}
              facing="front"
              mirror={false}
              pictureSize="1280x720"
            />
          ) : cameraStream ? (
            React.createElement('video', {
              ref: videoRef,
              autoPlay: true,
              playsInline: true,
              muted: true,
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              },
            })
          ) : (
            /* Latar polos jika kamera fisik belum aktif / diizinkan browser (hanya web) */
            <View style={[styles.cameraBackground, { backgroundColor: colors.text }]} />
          )}

          {/* Overlay Gelap Transparan Tipis */}
          <View style={styles.cameraDarkOverlay} pointerEvents="none" />

          {/* Teks Instruksi di Bagian Atas Sesuai Figma */}
          <View style={styles.instructionBox} pointerEvents="none">
            <Text style={styles.instructionText}>
              {t('attendance.lightingHint')}
            </Text>

            {/* Indikator Status Lokasi Kantor (Pencegah Curang) */}
            <View
              style={[
                styles.geofencePill,
                isInsideOffice ? styles.geofencePillInside : styles.geofencePillOutside,
              ]}
            >
              <Feather
                name={isInsideOffice ? 'check-circle' : 'alert-triangle'}
                size={11}
                color={isInsideOffice ? '#047857' : '#B45309'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.geofencePillText,
                  isInsideOffice ? styles.geofenceTextInside : styles.geofenceTextOutside,
                ]}
              >
                {isInsideOffice
                  ? t('attendance.insideOffice', { distance: officeDistance })
                  : t('attendance.outsideOffice', {
                      distance: officeDistance,
                      max: officeConfig?.radiusMeters ?? 100,
                    })}
              </Text>
            </View>

            {/* Indikator Mode Offline jika koneksi tidak tersedia */}
            {!isOnline && (
              <View style={styles.offlineNetworkPill}>
                <Feather name="wifi-off" size={11} color="#D97706" style={{ marginRight: 5 }} />
                <Text style={styles.offlineNetworkPillText}>{t('attendance.offlineMode')}</Text>
              </View>
            )}
          </View>

          {/* Frame Oval Panduan Wajah dengan Garis Putus-Putus Mint & Crosshair */}
          <View style={styles.reticleContainer} pointerEvents="none">
            <View style={styles.ovalReticle}>
              {/* Garis Crosshair Plus di Tengah */}
              <View style={styles.crosshairVertical} />
              <View style={styles.crosshairHorizontal} />
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* BOTTOM NAVIGATION BAR (1:1 Sesuai Figma)                       */}
      {/* ============================================================== */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Tab Riwayat */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.tabs.history')}
          style={styles.tabButton}
          onPress={() => router.push('/(app)/history')}
        >
          <Feather name="rotate-ccw" size={22} color="#64748B" />
          <Text style={[styles.tabLabel, { color: '#64748B' }]}>{t('common.tabs.history')}</Text>
        </Pressable>

        {/* Tab Tengah: Floating Tombol Kamera / Shutter Presensi */}
        <View style={styles.centerFabContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('attendance.shutterLabel')}
            onPress={handleCapturePhoto}
            disabled={isCapturing}
            style={({ pressed }) => [
              styles.fabButton,
              pressed && styles.fabButtonPressed,
              isCapturing && { opacity: 0.8 },
            ]}
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Feather name="camera" size={26} color="#FFFFFF" />
            )}
          </Pressable>
          <Text style={[styles.fabLabel, { color: '#05564E', fontWeight: '700' }]}>
            {isCapturing ? t('attendance.capturing') : t('common.tabs.attendance')}
          </Text>
        </View>

        {/* Tab Profil */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.tabs.profile')}
          style={styles.tabButton}
          onPress={() => router.push('/(app)/profile')}
        >
          <Feather name="user" size={22} color="#64748B" />
          <Text style={[styles.tabLabel, { color: '#64748B' }]}>{t('common.tabs.profile')}</Text>
        </Pressable>
      </View>
        </>
      )}

      {/* Efek Shutter Flash Kamera (Ringan, Native GPU) */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#FFFFFF',
            opacity: flashAnim,
            zIndex: 999,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    zIndex: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F1F24',
    letterSpacing: -0.2,
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clockIcon: {
    marginRight: 6,
  },
  clockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cameraDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  instructionBox: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 5,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 18,
  },
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalReticle: {
    width: 210,
    height: 310,
    borderRadius: 105,
    borderWidth: 2.5,
    borderColor: '#5EEAD4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  crosshairVertical: {
    position: 'absolute',
    width: 1.5,
    height: 20,
    backgroundColor: '#5EEAD4',
    opacity: 0.85,
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 20,
    height: 1.5,
    backgroundColor: '#5EEAD4',
    opacity: 0.85,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 20,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  centerFabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
    flex: 1,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#05564E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#05564E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: '#033F39',
  },
  fabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  // ==============================================================
  // GAYA PREVIEW & KONFIRMASI FOTO PRESENSI (1:1 Screenshot)
  // ==============================================================
  previewContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  previewScroll: {
    flex: 1,
  },
  previewScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  previewPhotoCard: {
    width: '100%',
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F1F24',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  previewPhotoImage: {
    width: '100%',
    height: '100%',
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  clockIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#05564E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  previewCardInfo: {
    flex: 1,
  },
  previewCardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  previewTimeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  previewTimeValueText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F1F24',
    letterSpacing: -0.5,
  },
  previewTimeWibText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  previewStatusCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statusBadgePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgePillLate: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgePillOnTime: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextLate: {
    color: '#B45309',
  },
  statusBadgeTextOnTime: {
    color: '#047857',
  },
  previewActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  retakeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retakeBtnPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.98 }],
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  confirmBtn: {
    flex: 1.4,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#05564E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#05564E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnPressed: {
    backgroundColor: '#033F39',
    transform: [{ scale: 0.98 }],
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerLeftWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#F1F5F9',
  },
  headerBackBtnPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.95 }],
  },
  geofencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 8,
  },
  geofencePillInside: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  geofencePillOutside: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  geofencePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  geofenceTextInside: {
    color: '#047857',
  },
  geofenceTextOutside: {
    color: '#B45309',
  },
  offlineNetworkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 6,
  },
  offlineNetworkPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
});
