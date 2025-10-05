import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';
import te from './locales/te.json';
import mr from './locales/mr.json';
import pa from './locales/pa.json';
import ta from './locales/ta.json';
import ml from './locales/ml.json';
import gu from './locales/gu.json';
import bn from './locales/bn.json';
import or from './locales/or.json';
import ur from './locales/ur.json';

const LANGUAGE_STORAGE_KEY = 'user-locale';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  {code: 'en', name: 'English', nativeName: 'English'},
  {code: 'hi', name: 'Hindi', nativeName: 'हिन्दी'},
  {code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ'},
  {code: 'te', name: 'Telugu', nativeName: 'తెలుగు'},
  {code: 'mr', name: 'Marathi', nativeName: 'मराठी'},
  {code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ'},
  {code: 'ta', name: 'Tamil', nativeName: 'தமிழ்'},
  {code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം'},
  {code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી'},
  {code: 'bn', name: 'Bengali', nativeName: 'বাংলা'},
  {code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ'},
  {code: 'ur', name: 'Urdu', nativeName: 'اردو'},
];

// Get persisted language from AsyncStorage
const getPersistedLanguage = async (): Promise<string | null> => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return language;
  } catch (error) {
    console.error('Error getting persisted language:', error);
    return null;
  }
};

// Save language to AsyncStorage
export const saveLanguagePreference = async (
  languageCode: string,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Initialize i18n
const initI18n = async () => {
  const persistedLanguage = await getPersistedLanguage();

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    resources: {
      en: {translation: en},
      hi: {translation: hi},
      kn: {translation: kn},
      te: {translation: te},
      mr: {translation: mr},
      pa: {translation: pa},
      ta: {translation: ta},
      ml: {translation: ml},
      gu: {translation: gu},
      bn: {translation: bn},
      or: {translation: or},
      ur: {translation: ur},
    },
    lng: persistedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
