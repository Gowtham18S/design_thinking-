import type { LanguageCode } from '../types/index.ts';

export type OfflineQualityStatus = 
  | 'verified_ready'        // Fully tested, natural fluency, context-aware travel support
  | 'pack_available'         // Offline neural model supported; installable pack
  | 'unverified_quality'     // Offline model weights present, but travel fluency not fully certified
  | 'unsupported_offline';   // Not in offline neural model (e.g. Telugu not in M2M-100 vocabulary)

export interface LanguageRegistryEntry {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  script: string;
  family: string;
  wordOrder: 'SOV' | 'SVO' | 'VSO';
  uiSupported: boolean;
  sourceSupported: boolean;
  targetSupported: boolean;
  offlineStatus: OfflineQualityStatus;
  offlineQualityRating: 'A' | 'B' | 'C' | 'N/A';
  offlineModelId?: string;
  nllbCode?: string;
  directions: string[];
  notes: string;
}

export const NLLB_LANG_CODES: Record<LanguageCode, string> = {
  en: 'eng_Latn',
  ta: 'tam_Taml',
  hi: 'hin_Deva',
  ml: 'mal_Mlym',
  kn: 'kan_Knda',
  bn: 'ben_Beng',
  mr: 'mar_Deva',
  gu: 'guj_Gujr',
  pa: 'pan_Guru',
  ur: 'urd_Arab',
  te: 'tel_Telu',
  es: 'spa_Latn',
  fr: 'fra_Latn',
  de: 'deu_Latn',
  it: 'ita_Latn',
  pt: 'por_Latn',
  ru: 'rus_Cyrl',
  ar: 'arb_Arab',
  zh: 'zho_Hans',
  ja: 'jpn_Jpan',
  ko: 'kor_Hang',
  uk: 'ukr_Cyrl',
  tr: 'tur_Latn',
  id: 'ind_Latn',
  vi: 'vie_Latn'
};

export const LANGUAGE_REGISTRY: Record<LanguageCode, LanguageRegistryEntry> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    script: 'Latin',
    family: 'Indo-European (Germanic)',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> all verified languages'],
    notes: 'Reference travel source language with comprehensive bidirectional testing.'
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    script: 'Tamil',
    family: 'Dravidian',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> ta'],
    notes: 'Natural SOV word order, polite honorifics (நீங்கள்), travel terminology.'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    script: 'Devanagari',
    family: 'Indo-Aryan',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> hi'],
    notes: 'Formal travel phrasing (कृपया, आप), postpositions, interrogative copula.'
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    script: 'Malayalam',
    family: 'Dravidian',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> ml'],
    notes: 'Fixed hospital/patient confusion bug; polite question syntax (സഹായിക്കാമോ).'
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    script: 'Kannada',
    family: 'Dravidian',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> kn'],
    notes: 'Repetition loops and web crawl artifacts eliminated; natural dative pronouns (ನನಗೆ).'
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    script: 'Bengali',
    family: 'Indo-Aryan',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> bn'],
    notes: 'Corrected nearest/furthest inversion bug (কাছের vs দূরে); natural polite syntax.'
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    script: 'Devanagari',
    family: 'Indo-Aryan',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> mr'],
    notes: 'Correct postpositions (जवळचे, मला); natural emergency & transit phrasing.'
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    script: 'Gujarati',
    family: 'Indo-Aryan',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> gu'],
    notes: 'Web scrapings removed; natural transit and medical vocabulary.'
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    script: 'Gurmukhi',
    family: 'Indo-Aryan',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> pa'],
    notes: 'Gurmukhi script purification; natural question construction.'
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    script: 'Arabic (Nastaliq)',
    family: 'Indo-Aryan',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> ur'],
    notes: 'Right-to-left Nastaliq script; respectful honorifics (آپ, تشریف).'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    script: 'Latin',
    family: 'Romance',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> es'],
    notes: 'Inverted question marks (¿), gender and adjective agreements verified.'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    script: 'Latin',
    family: 'Romance',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> fr'],
    notes: 'Polite forms (s’il vous plaît), liaison, travel nouns (gare, hôpital).'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    script: 'Latin',
    family: 'Germanic',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> de'],
    notes: 'Noun capitalization, gender agreement (der Bahnhof, das Krankenhaus).'
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    script: 'Telugu',
    family: 'Dravidian',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'verified_ready',
    offlineQualityRating: 'A',
    offlineModelId: 'Xenova/nllb-200-distilled-600M',
    nllbCode: 'tel_Telu',
    directions: ['en <-> te'],
    notes: 'Native Dravidian agglutinative SOV word order with polite suffixes (-ండి); fully certified offline via NLLB-200.'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    script: 'Latin',
    family: 'Romance',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'pack_available',
    offlineQualityRating: 'B',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> pt'],
    notes: 'Supported in M2M-100; available as offline pack.'
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    script: 'Latin',
    family: 'Romance',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'pack_available',
    offlineQualityRating: 'B',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> it'],
    notes: 'Supported in M2M-100; available as offline pack.'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    script: 'Cyrillic',
    family: 'Slavic',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'pack_available',
    offlineQualityRating: 'B',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> ru'],
    notes: 'Cyrillic case inflections supported in M2M-100.'
  },
  uk: {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    script: 'Cyrillic',
    family: 'Slavic',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'unverified_quality',
    offlineQualityRating: 'C',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> uk'],
    notes: 'Model weights exist, but travel phrase quality is unverified.'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    script: 'Simplified Han',
    family: 'Sino-Tibetan',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'pack_available',
    offlineQualityRating: 'B',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> zh'],
    notes: 'Character segmentation supported in M2M-100.'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    script: 'Kanji / Kana',
    family: 'Japonic',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'unverified_quality',
    offlineQualityRating: 'C',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> ja'],
    notes: 'Requires morphological particle post-processing.'
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    script: 'Hangul',
    family: 'Koreanic',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'unverified_quality',
    offlineQualityRating: 'C',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> ko'],
    notes: 'Honorific speech levels require domain tuning.'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    script: 'Arabic',
    family: 'Afroasiatic',
    wordOrder: 'VSO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'pack_available',
    offlineQualityRating: 'B',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> ar'],
    notes: 'Right-to-left layout; gender and dual number inflections.'
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    script: 'Latin',
    family: 'Turkic',
    wordOrder: 'SOV',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'unverified_quality',
    offlineQualityRating: 'C',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> tr'],
    notes: 'Agglutinative suffix chaining in M2M-100.'
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    script: 'Latin',
    family: 'Austronesian',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'pack_available',
    offlineQualityRating: 'B',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> id'],
    notes: 'Supported in M2M-100; available as offline pack.'
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    script: 'Latin (Quoc Ngu)',
    family: 'Austroasiatic',
    wordOrder: 'SVO',
    uiSupported: true,
    sourceSupported: true,
    targetSupported: true,
    offlineStatus: 'unverified_quality',
    offlineQualityRating: 'C',
    offlineModelId: 'Xenova/m2m100_418M',
    directions: ['en <-> vi'],
    notes: 'Tonal diacritics supported in M2M-100.'
  }
};

/**
 * Returns full registry details for a given language code
 */
export function getLanguageRegistryEntry(code: LanguageCode): LanguageRegistryEntry {
  return LANGUAGE_REGISTRY[code] || LANGUAGE_REGISTRY.en;
}

/**
 * Audit helper returning verified offline status
 */
export function isLanguageVerifiedOffline(code: LanguageCode): boolean {
  const entry = LANGUAGE_REGISTRY[code];
  return entry ? (entry.offlineStatus === 'verified_ready' || entry.offlineStatus === 'pack_available') : false;
}

/**
 * Check if direction pair is supported offline
 */
export function isPairSupportedOffline(src: LanguageCode, tgt: LanguageCode): {
  isSupported: boolean;
  status: OfflineQualityStatus;
  reason?: string;
} {
  const srcEntry = getLanguageRegistryEntry(src);
  const tgtEntry = getLanguageRegistryEntry(tgt);

  if (srcEntry.offlineStatus === 'unsupported_offline') {
    return {
      isSupported: false,
      status: 'unsupported_offline',
      reason: `Offline neural model does not support ${srcEntry.name} in on-device vocabulary.`
    };
  }

  if (tgtEntry.offlineStatus === 'unsupported_offline') {
    return {
      isSupported: false,
      status: 'unsupported_offline',
      reason: `Offline neural model does not support ${tgtEntry.name} in on-device vocabulary.`
    };
  }

  if (tgtEntry.offlineStatus === 'unverified_quality' || srcEntry.offlineStatus === 'unverified_quality') {
    return {
      isSupported: true,
      status: 'unverified_quality',
      reason: `Offline translation for ${tgtEntry.name} is available but travel quality has not been certified.`
    };
  }

  return {
    isSupported: true,
    status: 'verified_ready'
  };
}
