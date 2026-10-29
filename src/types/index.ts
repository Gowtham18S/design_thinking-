export type LanguageCode =
  | 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn' | 'bn' | 'mr' | 'gu' | 'pa' | 'ur'
  | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ru' | 'uk' | 'zh' | 'ja' | 'ko' | 'ar'
  | 'tr' | 'id' | 'vi';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  isDownloaded: boolean;
  packVersion: string;
  sizeMb: number;
  offlineSupported: boolean;
  onlineSupported: boolean;
}

export type CategoryType = 'emergency' | 'healthcare' | 'travel';

export interface PhraseItem {
  id: string;
  category: CategoryType;
  subcategory?: string;
  english: string;
  translations: Partial<Record<LanguageCode, string>> & { en: string };
  phonetics?: Partial<Record<LanguageCode, string>>;
  isPreset?: boolean;
}

export interface PrivacyShareSettings {
  includeName: boolean;
  includeLanguage: boolean;
  includeContact: boolean;
  includeBloodGroup: boolean;
  includeAllergies: boolean;
  includeMedicalInfo: boolean;
  includeOtherNotes: boolean;
}

export interface EmergencyProfile {
  name: string;
  preferredLanguage: LanguageCode;
  emergencyContact: string;
  bloodGroup: string;
  allergies: string;
  medicalInfo: string;
  otherNotes: string;
  updatedAt: string;
  privacyShareSettings: PrivacyShareSettings;
}

export interface HistoryItem {
  id: string;
  originalText: string;
  sourceLang: LanguageCode;
  translatedText: string;
  targetLang: LanguageCode;
  category?: CategoryType | 'custom' | 'phrase_builder';
  timestamp: string;
  isFavorite: boolean;
}

export interface LanguagePack {
  id: string;
  code: LanguageCode;
  name: string;
  nativeName: string;
  version: string;
  availableVersion: string;
  sizeMb: number;
  isInstalled: boolean;
  phraseCount: number;
  lastUpdated?: string;
  downloadProgress?: number;
}

export type NetworkMode = 'offline' | 'online' | 'unstable';

export type TranslationRoutingMode = 'auto' | 'online_only' | 'offline_only';

export interface ConnectionNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'offline_fallback';
  message: string;
  timestamp: number;
}

export type UserSelectedMode = 'online' | 'offline';

export type ServiceHealthStatus =
  | 'online_service_available'
  | 'online_checking'
  | 'online_network_unavailable'
  | 'online_service_unavailable'
  | 'offline_pack_ready'
  | 'offline_pack_missing';

export interface DetailedConnectionStatus {
  status: ServiceHealthStatus;
  label: string;
  detail: string;
  badge: string;
  badgeColor: string;
  dotColor: string;
  accentColor: string;
  isOnlineMode: boolean;
  canTranslate: boolean;
}

export interface UserSettings {
  allowAnalytics: boolean;
  autoSpeakTranslation: boolean;
  hapticFeedback: boolean;
  darkMode: boolean;
  routingMode?: TranslationRoutingMode;
  userSelectedMode?: UserSelectedMode;
  simulatedNetwork: NetworkMode | 'auto';
  offlineModelQuantization: 'int8' | 'fp16';
}

export interface PhraseBuilderSelection {
  person: string;
  action: string;
  object: string;
  location: string;
}

export type PracticeMode = 'word' | 'sentence' | 'conversation';
export type PracticeCategory = 'travel' | 'restaurant' | 'hotel' | 'emergency' | 'conversation';

export interface WordAnalysis {
  word: string;
  expectedWord: string;
  status: 'correct' | 'warning' | 'incorrect';
  phoneticHint?: string;
  feedback?: string;
}

export interface PronunciationScore {
  overall: number;
  wordAccuracy: number;
  pronunciation: number;
  rhythm: number;
  fluency: number;
  tone: number | null;
  confidenceScore: number;
  isAdvancedAnalysisAvailable: boolean;
}

export interface PronunciationFeedback {
  generalMessage: string;
  rhythmMessage?: string;
  toneMessage?: string;
  languageSpecificTips: string[];
  words: WordAnalysis[];
}

export interface PronunciationPracticeSession {
  id: string;
  language: LanguageCode;
  targetText: string;
  phoneticText?: string;
  recognizedText: string;
  overallScore: number;
  wordAccuracy: number;
  pronunciationScore: number;
  rhythmScore: number;
  fluencyScore: number;
  toneScore: number | null;
  practiceMode: PracticeMode;
  processingMode: 'offline' | 'online';
  category?: PracticeCategory;
  createdAt: string;
}

