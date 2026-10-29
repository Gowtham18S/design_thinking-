import CryptoJS from 'crypto-js';
import type { EmergencyProfile, HistoryItem, UserSettings } from '../types';

const ENCRYPTION_KEY_STORAGE = 'bharatconnect_sec_key_v1';
const EMERGENCY_CARD_KEY = 'bharatconnect_encrypted_emergency_card';
const HISTORY_KEY = 'bharatconnect_history_v1';
const SETTINGS_KEY = 'bharatconnect_settings_v1';

function getSecretKey(): string {
  let key = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString();
    localStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
  }
  return key;
}

export const DEFAULT_EMERGENCY_PROFILE: EmergencyProfile = {
  name: '',
  preferredLanguage: 'ta',
  emergencyContact: '',
  bloodGroup: '',
  allergies: '',
  medicalInfo: '',
  otherNotes: '',
  updatedAt: new Date().toISOString(),
  privacyShareSettings: {
    includeName: true,
    includeLanguage: true,
    includeContact: true,
    includeBloodGroup: true,
    includeAllergies: false,
    includeMedicalInfo: false,
    includeOtherNotes: false
  }
};

export const DEFAULT_SETTINGS: UserSettings = {
  allowAnalytics: false,
  autoSpeakTranslation: true,
  hapticFeedback: true,
  darkMode: true,
  routingMode: 'auto',
  simulatedNetwork: 'auto',
  offlineModelQuantization: 'int8'
};

export const LocalDB = {
  saveEmergencyProfile(profile: EmergencyProfile): void {
    try {
      const secret = getSecretKey();
      const json = JSON.stringify(profile);
      const encrypted = CryptoJS.AES.encrypt(json, secret).toString();
      localStorage.setItem(EMERGENCY_CARD_KEY, encrypted);
    } catch (e) {
      console.error('Error encrypting emergency profile:', e);
    }
  },

  getEmergencyProfile(): EmergencyProfile {
    try {
      const encrypted = localStorage.getItem(EMERGENCY_CARD_KEY);
      if (!encrypted) return DEFAULT_EMERGENCY_PROFILE;
      const secret = getSecretKey();
      const bytes = CryptoJS.AES.decrypt(encrypted, secret);
      const json = bytes.toString(CryptoJS.enc.Utf8);
      if (!json) return DEFAULT_EMERGENCY_PROFILE;
      return JSON.parse(json);
    } catch (e) {
      console.error('Error decrypting emergency profile:', e);
      return DEFAULT_EMERGENCY_PROFILE;
    }
  },

  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching history:', e);
      return [];
    }
  },

  saveHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
    const history = this.getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString()
    };
    if (history.length > 0 && history[0].originalText === newItem.originalText && history[0].targetLang === newItem.targetLang) {
      return history[0];
    }
    const updated = [newItem, ...history].slice(0, 200);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newItem;
  },

  toggleFavorite(id: string): HistoryItem[] {
    const history = this.getHistory();
    const updated = history.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteHistoryItem(id: string): HistoryItem[] {
    const history = this.getHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  },

  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
