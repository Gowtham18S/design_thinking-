import type { EmergencyProfile, PrivacyShareSettings } from '../types';
import { getLanguageByCode } from '../models/language';

export interface SharedEmergencyData {
  appName: string;
  ver: string;
  name?: string;
  language?: string;
  contact?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalInfo?: string;
  notes?: string;
  timestamp: string;
}

export const QRService = {
  encodeProfileForQR(profile: EmergencyProfile, settings: PrivacyShareSettings): string {
    const payload: SharedEmergencyData = {
      appName: 'LinguaGo',
      ver: '1.0',
      timestamp: new Date().toISOString()
    };

    if (settings.includeName && profile.name) {
      payload.name = profile.name;
    }
    if (settings.includeLanguage && profile.preferredLanguage) {
      payload.language = getLanguageByCode(profile.preferredLanguage).name;
    }
    if (settings.includeContact && profile.emergencyContact) {
      payload.contact = profile.emergencyContact;
    }
    if (settings.includeBloodGroup && profile.bloodGroup) {
      payload.bloodGroup = profile.bloodGroup;
    }
    if (settings.includeAllergies && profile.allergies) {
      payload.allergies = profile.allergies;
    }
    if (settings.includeMedicalInfo && profile.medicalInfo) {
      payload.medicalInfo = profile.medicalInfo;
    }
    if (settings.includeOtherNotes && profile.otherNotes) {
      payload.notes = profile.otherNotes;
    }

    return JSON.stringify(payload);
  },

  decodeQRText(qrText: string): SharedEmergencyData | null {
    try {
      const parsed = JSON.parse(qrText);
      if (parsed.appName === 'LinguaGo' || parsed.appName === 'BharatConnect' || parsed.contact || parsed.name) {
        return parsed as SharedEmergencyData;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
};
