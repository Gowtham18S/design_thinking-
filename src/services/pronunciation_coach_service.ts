import type {
  LanguageCode,
  PracticeCategory,
  PronunciationPracticeSession
} from '../types';
import { NetworkService } from './network_service';
import { OFFLINE_PRESET_PHRASES } from '../database/phrase_database';

const PROGRESS_STORAGE_KEY = 'linguago_pronunciation_progress_v1';

export interface LanguageProgressSummary {
  language: LanguageCode;
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  wordsPracticed: number;
  sentencesPracticed: number;
}

export const PronunciationCoachService = {
  getProcessingMode(): 'offline' | 'online' {
    return NetworkService.isOffline() ? 'offline' : 'online';
  },

  getAllSessions(): PronunciationPracticeSession[] {
    try {
      const data = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as PronunciationPracticeSession[];
    } catch (e) {
      console.warn('Failed to load pronunciation progress:', e);
      return [];
    }
  },

  saveSession(session: Omit<PronunciationPracticeSession, 'id' | 'createdAt'>): PronunciationPracticeSession {
    const sessions = this.getAllSessions();
    const newSession: PronunciationPracticeSession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    sessions.unshift(newSession);
    const trimmed = sessions.slice(0, 100);

    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save pronunciation practice session:', e);
    }

    return newSession;
  },

  getProgressSummary(langCode: LanguageCode): LanguageProgressSummary {
    const sessions = this.getAllSessions().filter(s => s.language === langCode);

    if (sessions.length === 0) {
      return {
        language: langCode,
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        wordsPracticed: 0,
        sentencesPracticed: 0
      };
    }

    const totalSessions = sessions.length;
    const scores = sessions.map(s => s.overallScore);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalSessions);
    const bestScore = Math.max(...scores);

    let wordsPracticed = 0;
    let sentencesPracticed = 0;

    sessions.forEach(s => {
      const wordCount = s.targetText.trim().split(/\s+/).length;
      wordsPracticed += wordCount;
      if (s.practiceMode === 'sentence' || s.practiceMode === 'conversation') {
        sentencesPracticed += 1;
      }
    });

    return {
      language: langCode,
      totalSessions,
      averageScore,
      bestScore,
      wordsPracticed,
      sentencesPracticed
    };
  },

  getCategoryPracticePhrases(langCode: LanguageCode, category: PracticeCategory): Array<{ english: string; targetText: string; phonetic?: string }> {
    const mapCategory: Record<PracticeCategory, string> = {
      emergency: 'emergency',
      hotel: 'healthcare',
      restaurant: 'travel',
      travel: 'travel',
      conversation: 'travel'
    };

    const targetCategory = mapCategory[category];
    const filtered = OFFLINE_PRESET_PHRASES.filter((p) => p.category === targetCategory);

    return filtered.map((p) => ({
      english: p.english,
      targetText: p.translations[langCode] || p.english,
      phonetic: p.phonetics?.[langCode]
    }));
  }
};
