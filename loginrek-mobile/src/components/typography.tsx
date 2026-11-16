import type { ComponentProps } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextStyle,
} from 'react-native';

/**
 * Plus Jakarta Sans, ditanam native lewat plugin `expo-font` (app.json -> assets/fonts).
 * Nilai di bawah adalah nama PostScript = nama berkas, sehingga sama di iOS dan Android.
 * Hanya bobot ini yang dibundel; bobot lain dibulatkan ke yang terdekat.
 */
export const FONT_FAMILY = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;

/** Pilih berkas font dari nilai `fontWeight` ('normal', 'bold', '100'..'900', atau angka). */
export function fontFamilyForWeight(weight: TextStyle['fontWeight']): string {
  const value =
    weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : Number(weight);
  if (value >= 800) return FONT_FAMILY.extrabold;
  if (value >= 700) return FONT_FAMILY.bold;
  if (value >= 600) return FONT_FAMILY.semibold;
  if (value >= 500) return FONT_FAMILY.medium;
  return FONT_FAMILY.regular;
}

/**
 * Tambahkan fontFamily sesuai fontWeight pada style yang ada. `fontWeight` di-reset ke normal
 * karena bobot sudah dipilih lewat berkas font (mencegah tebal ganda / sintetis di Android).
 * Style yang sudah menetapkan fontFamily sendiri dibiarkan.
 */
export function withAppFont(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style;
  return [style, { fontFamily: fontFamilyForWeight(flat.fontWeight), fontWeight: 'normal' }];
}

/** Pengganti `Text` dari react-native yang otomatis memakai font aplikasi. */
export function Text({ style, ...props }: ComponentProps<typeof RNText>) {
  return <RNText {...props} style={withAppFont(style)} />;
}

/** Pengganti `TextInput` dari react-native yang otomatis memakai font aplikasi. */
export function TextInput({ style, ...props }: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput {...props} style={withAppFont(style)} />;
}
