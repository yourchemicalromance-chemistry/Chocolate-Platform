import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';

const LANGUAGE_STORAGE_KEY = '@chocolate_language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  mr: { translation: mr },
  ta: { translation: ta },
  te: { translation: te },
  gu: { translation: gu },
  pa: { translation: pa },
  kn: { translation: kn },
  ml: { translation: ml },
};

const supportedLanguages = Object.keys(resources);

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

const initialLanguage = supportedLanguages.includes(deviceLanguage)
  ? deviceLanguage
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export async function restoreLanguage() {
  try {
    const savedLanguage = await AsyncStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

    if (
      savedLanguage &&
      supportedLanguages.includes(savedLanguage)
    ) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.warn('Could not restore saved language:', error);
  }
}

export async function changeAppLanguage(language: string) {
  if (!supportedLanguages.includes(language)) {
    return;
  }

  await i18n.changeLanguage(language);

  try {
    await AsyncStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      language
    );
  } catch (error) {
    console.warn('Could not save language:', error);
  }
}

export default i18n;