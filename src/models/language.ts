import type { Language, LanguageCode } from '../types';

export const OFFLINE_LANGUAGE_CODES: LanguageCode[] = ['en', 'ta', 'hi', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa', 'ur'];

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 640.0,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 640.0,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 640.0,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 5.0,
    offlineSupported: false, // Neural model not trained on Telugu; preset emergency phrase DB supported
    onlineSupported: true
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 640.0,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 640.0,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 630.5,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 630.5,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 630.5,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 630.5,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    isDownloaded: false,
    packVersion: '2.0.0',
    sizeMb: 630.5,
    offlineSupported: true,
    onlineSupported: true
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 24.0,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 23.5,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 25.1,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 22.8,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 21.9,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 28.4,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 26.0,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 35.0,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 32.5,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 30.2,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 27.8,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 20.5,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 19.8,
    offlineSupported: false,
    onlineSupported: true
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    isDownloaded: false,
    packVersion: '1.0.0',
    sizeMb: 21.3,
    offlineSupported: false,
    onlineSupported: true
  }
];

export function getLanguageByCode(code: LanguageCode): Language {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export function isLanguageOfflineSupported(code: LanguageCode): boolean {
  const lang = getLanguageByCode(code);
  return lang ? lang.offlineSupported : false;
}

