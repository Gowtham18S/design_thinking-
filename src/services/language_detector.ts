import type { LanguageCode } from '../types';

export interface DetectionResult {
  detectedLang: LanguageCode;
  confidence: number;
  script: string;
}

export class LanguageDetector {
  /**
   * Deterministic on-device script and vocabulary language detection
   */
  public static detectLanguage(text: string, fallback: LanguageCode = 'en'): DetectionResult {
    const clean = text.trim();
    if (!clean) {
      return { detectedLang: fallback, confidence: 1.0, script: 'Unknown' };
    }

    // 1. Script-based Unicode block detection
    if (/[\u0B80-\u0BFF]/.test(clean)) {
      return { detectedLang: 'ta', confidence: 0.99, script: 'Tamil' };
    }
    if (/[\u0D00-\u0D7F]/.test(clean)) {
      return { detectedLang: 'ml', confidence: 0.99, script: 'Malayalam' };
    }
    if (/[\u0C80-\u0CFF]/.test(clean)) {
      return { detectedLang: 'kn', confidence: 0.99, script: 'Kannada' };
    }
    if (/[\u0980-\u09FF]/.test(clean)) {
      return { detectedLang: 'bn', confidence: 0.99, script: 'Bengali' };
    }
    if (/[\u0A00-\u0A7F]/.test(clean)) {
      return { detectedLang: 'pa', confidence: 0.99, script: 'Gurmukhi' };
    }
    if (/[\u0A80-\u0AFF]/.test(clean)) {
      return { detectedLang: 'gu', confidence: 0.99, script: 'Gujarati' };
    }
    if (/[\u0C00-\u0C7F]/.test(clean)) {
      return { detectedLang: 'te', confidence: 0.99, script: 'Telugu' };
    }
    if (/[\u0600-\u06FF]/.test(clean)) {
      return { detectedLang: 'ur', confidence: 0.95, script: 'Arabic/Urdu' };
    }
    if (/[\u0400-\u04FF]/.test(clean)) {
      return { detectedLang: 'ru', confidence: 0.95, script: 'Cyrillic' };
    }
    if (/[\u4E00-\u9FFF]/.test(clean)) {
      return { detectedLang: 'zh', confidence: 0.98, script: 'Hanzi' };
    }
    if (/[\u3040-\u30FF]/.test(clean)) {
      return { detectedLang: 'ja', confidence: 0.99, script: 'Kana' };
    }
    if (/[\uAC00-\uD7AF]/.test(clean)) {
      return { detectedLang: 'ko', confidence: 0.99, script: 'Hangul' };
    }

    // Devanagari: distinguish Hindi vs Marathi
    if (/[\u0900-\u097F]/.test(clean)) {
      if (/\b(आहे|आहात|नाही|कसे|कुठे|मला|तुम्ही)\b/i.test(clean)) {
        return { detectedLang: 'mr', confidence: 0.95, script: 'Devanagari (Marathi)' };
      }
      return { detectedLang: 'hi', confidence: 0.95, script: 'Devanagari (Hindi)' };
    }

    // Latin alphabet: distinguish Spanish, French, German, or English
    if (/[a-zA-Z]/.test(clean)) {
      const lower = clean.toLowerCase();
      if (/[¿¡ñáéíóú]/.test(lower) || /\b(dónde|está|necesito|ayuda|por favor|gracias)\b/i.test(lower)) {
        return { detectedLang: 'es', confidence: 0.92, script: 'Latin (Spanish)' };
      }
      if (/[çèêëàâôûù]/.test(lower) || /\b(où|est|besoin|aide|s'il vous plaît|merci)\b/i.test(lower)) {
        return { detectedLang: 'fr', confidence: 0.92, script: 'Latin (French)' };
      }
      if (/[äöüß]/.test(lower) || /\b(wo|ist|brauche|hilfe|bitte|danke|bahnhof)\b/i.test(lower)) {
        return { detectedLang: 'de', confidence: 0.92, script: 'Latin (German)' };
      }
      return { detectedLang: 'en', confidence: 0.9, script: 'Latin (English)' };
    }

    return { detectedLang: fallback, confidence: 0.5, script: 'Unknown' };
  }
}
