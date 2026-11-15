import i18n, { use as registerPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en';
import id from './locales/id';

export type AppLanguage = 'id' | 'en';

/**
 * Bahasa aplikasi mengikuti bahasa perangkat: Indonesia untuk perangkat berbahasa
 * Indonesia (`id`, atau kode lama Android `in`), selain itu Inggris.
 */
export function resolveLanguage(code: string | null | undefined): AppLanguage {
  const c = (code ?? '').toLowerCase();
  return c === 'id' || c === 'in' || c.startsWith('id-') ? 'id' : 'en';
}

function detectDeviceLanguage(): AppLanguage {
  try {
    return resolveLanguage(getLocales()[0]?.languageCode);
  } catch {
    return 'en';
  }
}

if (!i18n.isInitialized) {
  void registerPlugin(initReactI18next).init({
    resources: {
      id: { translation: id },
      en: { translation: en },
    },
    lng: detectDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    initAsync: false,
  });
}

export default i18n;
