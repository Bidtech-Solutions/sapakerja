import { createElement, forwardRef, type ComponentProps, type ComponentRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextStyle,
} from 'react-native';

/**
 * Tema aplikasi: warna, jarak, dan font. Dipakai banyak halaman.
 * Sumber kebenaran warna: docs/DESIGN.md. Samakan dengan dashboard (src/index.css).
 */

/** Token warna brand SapaKerja — biru kehijauan (teal). */
export const colors = {
  primary: '#0E7C86',
  primaryDark: '#0A5E66',
  primaryLight: '#E6F4F5',
  accent: '#14B8A6',
  /** Latar splash native (app.json -> expo-splash-screen); dipakai agar peralihan splash ke layar app mulus. */
  splash: '#0B7F78',

  background: '#F7FAFA',
  surface: '#FFFFFF',
  text: '#0F1F24',
  textMuted: '#5B6B70',
  border: '#D9E3E5',

  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16, full: 999 } as const;

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
  return createElement(RNText, { ...props, style: withAppFont(style) });
}

/** Pengganti `TextInput` dari react-native yang otomatis memakai font aplikasi. */
export const TextInput = forwardRef<
  ComponentRef<typeof RNTextInput>,
  ComponentProps<typeof RNTextInput>
>(function TextInput({ style, ...props }, ref) {
  return createElement(RNTextInput, { ...props, ref, style: withAppFont(style) });
});
TextInput.displayName = 'TextInput';
