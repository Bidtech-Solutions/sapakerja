import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { authApi, setAccessToken, ApiError } from '@/lib/api';
import { tokenStorage, userStore, UserAccount } from '@/lib/session';
import { colors, Text, TextInput } from '@/lib/theme';

/** Jarak (dp) antara form dan keyboard / tepi atas layar saat form digeser. */
const FORM_MARGIN = 16;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const identifierInputRef = useRef<ComponentRef<typeof RNTextInput>>(null);
  const passwordInputRef = useRef<ComponentRef<typeof RNTextInput>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Tepi atas keyboard dalam koordinat layar; null bila keyboard tertutup.
  const keyboardTopRef = useRef<number | null>(null);
  // Ukuran yang dibutuhkan untuk menghitung pergeseran (diisi lewat onLayout).
  // Posisi kolom & tombol relatif terhadap kartu putih; cardY relatif terhadap isi ScrollView.
  const layoutRef = useRef({
    viewportHeight: 0,
    cardY: 0,
    emailTop: 0,
    passwordTop: 0,
    buttonBottom: 0,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardTopRef.current = e.endCoordinates.screenY;
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardTopRef.current = null;
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /**
   * Geser layar SECUKUPNYA agar kolom Email, Password, dan tombol Masuk terlihat tepat di atas
   * keyboard (bukan scrollToEnd, yang membuat layar naik terlalu jauh). Email dan Password
   * memakai posisi yang sama sehingga pindah kolom tidak membuat layar melompat.
   */
  function scrollFormAboveKeyboard() {
    const keyboardTop = keyboardTopRef.current;
    const l = layoutRef.current;
    if (keyboardTop === null || l.viewportHeight === 0) return;
    const passwordFocused = passwordInputRef.current?.isFocused() ?? false;
    if (!passwordFocused && !identifierInputRef.current?.isFocused()) return;

    // Tinggi ScrollView yang tidak tertutup keyboard. Bila sistem sudah mengecilkan layar
    // (sebagian HP Android), viewportHeight sudah lebih kecil dan dipakai apa adanya.
    const visible = Math.min(l.viewportHeight, keyboardTop);
    const formTop = l.cardY + l.emailTop - FORM_MARGIN;
    const formBottom = l.cardY + l.buttonBottom + FORM_MARGIN;

    let target = formBottom - visible;
    if (target > formTop) {
      // Layar terlalu kecil untuk seluruh form: utamakan kolom yang sedang diketik.
      target = passwordFocused ? Math.min(target, l.cardY + l.passwordTop - FORM_MARGIN) : formTop;
    }
    scrollViewRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
  }

  // Pindah kolom saat keyboard sudah terbuka: geser langsung. Bila keyboard baru akan muncul,
  // pergeseran dilakukan di onContentSizeChange, setelah ruang seukuran keyboard terpasang
  // (bila digeser lebih awal, pergeseran terpotong dan kolom Password tetap tertutup).
  function handleFieldFocus() {
    if (keyboardTopRef.current !== null) scrollFormAboveKeyboard();
  }

  // Cegah tombol back Android kembali ke halaman Home atau sesi sebelumnya
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, []),
  );

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      setErrorMessage(t('login.fillAllFields'));
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Kata sandi hanya diverifikasi server. Tidak ada login lokal/offline: sesi berikutnya
      // memakai JWT yang tersimpan (lihat app/index.tsx), jadi login hanya perlu online sekali.
      setAccessToken(null);
      const res = await authApi.login(identifier.trim(), password);
      const token = res.data.token;
      const apiUser = res.data.user;

      await tokenStorage.set(token);
      setAccessToken(token);

      // Cache profil user aktif agar terbaca di Home dan Profile screen
      const userAccount: UserAccount = {
        id: `usr-${apiUser.id}`,
        email: apiUser.email,
        fullName: apiUser.fullName ?? t('common.employee'),
        role: apiUser.role ?? t('common.employee'),
        onTimeCount: 0,
        lateCount: 0,
        todayCheckIn: null,
        history: [],
        avatarUrl: apiUser.avatarUrl ?? undefined,
      };
      await userStore.setCurrentUser(userAccount);

      router.replace('/(app)/home');
    } catch (err: any) {
      if (err instanceof ApiError) {
        // Pesan server berbahasa Indonesia; tampilkan teks lokal sesuai bahasa perangkat.
        setErrorMessage(
          err.status === 400 || err.status === 401
            ? t('login.invalidCredentials')
            : t('login.serverError'),
        );
      } else {
        setErrorMessage(t('login.offline'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Ruang tambahan saat keyboard terbuka agar form bisa digeser ke atas keyboard.
  const keyboardSpace = keyboardHeight > 0 ? keyboardHeight + 36 : 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        onLayout={(e) => {
          layoutRef.current.viewportHeight = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={() => {
          if (keyboardTopRef.current !== null) scrollFormAboveKeyboard();
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
      >
        <Pressable onPress={Keyboard.dismiss} accessible={false} style={styles.scrollInner}>
          {/* Header Gradien Hijau/Teal */}
          <LinearGradient
            colors={['#033F39', '#06574F', '#0B7369']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.headerGradient, { paddingTop: insets.top + 28 }]}
          >
            {/* Logo SapaKerja */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('@/assets/logo-symbol.png')}
                  style={styles.logoImage}
                  accessibilityLabel={t('login.logoLabel')}
                />
              </View>
              <Text style={styles.brandTitle}>SapaKerja</Text>
              <Text style={styles.brandSubtitle}>{t('login.tagline')}</Text>
            </View>
          </LinearGradient>

          {/* Card Form Putih di Bawah */}
          {/* Ruang seukuran keyboard ada DI DALAM kartu putih (bukan di luar) agar area di
              belakang keyboard berwarna putih, bukan warna latar layar yang hijau. */}
          <View
            style={[
              styles.cardContainer,
              { paddingBottom: Math.max(insets.bottom, 24) + 28 + keyboardSpace },
            ]}
            onLayout={(e) => {
              layoutRef.current.cardY = e.nativeEvent.layout.y;
            }}
          >
            {/* Judul Form */}
            <Text style={styles.formTitle}>{t('login.title')}</Text>
            <Text style={styles.formSubtitle}>{t('login.subtitle')}</Text>

            {/* Banner Error jika ada */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Input Email / No. HP */}
            <View
              style={styles.inputGroup}
              onLayout={(e) => {
                layoutRef.current.emailTop = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>{t('login.identifierLabel')}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  ref={identifierInputRef}
                  style={styles.input}
                  placeholder={t('login.identifierPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onFocus={handleFieldFocus}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  returnKeyType="next"
                  // Tetap fokus saat Next ditekan agar keyboard tidak tertutup sesaat (layar melompat).
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
            </View>

            {/* Input Password */}
            <View
              style={[styles.inputGroup, { marginTop: 18 }]}
              onLayout={(e) => {
                layoutRef.current.passwordTop = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>{t('login.passwordLabel')}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder={t('login.passwordPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onFocus={handleFieldFocus}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={12}
                  style={styles.eyeButton}
                >
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#94A3B8" />
                </Pressable>
              </View>
            </View>

            {/* Tombol Masuk */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('login.submit')}
              onPress={handleLogin}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                layoutRef.current.buttonBottom = y + height;
              }}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                isLoading && styles.submitButtonDisabled,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>{t('login.submit')}</Text>
                  <Feather
                    name="arrow-right"
                    size={20}
                    color="#FFFFFF"
                    style={styles.arrowIcon}
                  />
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#033F39',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollInner: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  brandTitle: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    minHeight: 460,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F1F24',
    letterSpacing: -0.2,
  },
  formSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginTop: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0F1F24',
  },
  eyeButton: {
    padding: 6,
  },
  submitButton: {
    marginTop: 32,
    height: 54,
    backgroundColor: '#045850',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#045850',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonPressed: {
    backgroundColor: '#033F39',
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
