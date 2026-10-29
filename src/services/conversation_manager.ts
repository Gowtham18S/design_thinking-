import type { LanguageCode } from '../types';
import { TranslationEngine } from './translation_engine';
import type { TranslationResult } from './translation_engine';
import { SpeechService } from './speech_service';
import { OCRService } from './ocr_service';
import { getLanguageByCode } from '../models/language';

export interface ConversationMessage {
  id: string;
  speaker: 'A' | 'B';
  speakerName: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  originalText: string;
  translatedText: string;
  confidence: number;
  timestamp: string;
  isOffline?: boolean;
}

export type ConversationStatus =
  | 'idle'
  | 'listening'
  | 'detecting'
  | 'converting'
  | 'translating'
  | 'speaking';

export interface ConversationConfig {
  personALang: LanguageCode;
  personBLang: LanguageCode;
  autoDetectSpeaker: boolean;
  autoSpeak: boolean;
  silenceDurationMs: number;
  maxUtteranceDurationMs: number;
}

export type ConversationListener = (state: ConversationState) => void;

export interface ConversationState {
  isListening: boolean;
  isPaused: boolean;
  status: ConversationStatus;
  config: ConversationConfig;
  messages: ConversationMessage[];
  interimText: string;
  activeSpeaker: 'A' | 'B' | null;
  errorMessage: string | null;
}

class ConversationManagerClass {
  private state: ConversationState = {
    isListening: false,
    isPaused: false,
    status: 'idle',
    config: {
      personALang: 'ta',
      personBLang: 'te',
      autoDetectSpeaker: true,
      autoSpeak: true,
      silenceDurationMs: 1200,
      maxUtteranceDurationMs: 10000
    },
    messages: [],
    interimText: '',
    activeSpeaker: null,
    errorMessage: null
  };

  private listeners: Set<ConversationListener> = new Set();
  private speechListenerHandle: { stop: () => void } | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxUtteranceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentUtteranceText = '';

  public getState(): ConversationState {
    return this.state;
  }

  public subscribe(listener: ConversationListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  public setConfig(newConfig: Partial<ConversationConfig>) {
    this.state.config = { ...this.state.config, ...newConfig };
    this.notify();
  }

  public swapLanguages() {
    const temp = this.state.config.personALang;
    this.state.config.personALang = this.state.config.personBLang;
    this.state.config.personBLang = temp;
    this.notify();
  }

  public startListening() {
    if (!SpeechService.isSpeechRecognitionSupported()) {
      this.state.errorMessage = 'Speech Recognition API is not supported in this browser environment.';
      this.notify();
      return;
    }

    this.state.isListening = true;
    this.state.isPaused = false;
    this.state.errorMessage = null;
    this.state.status = 'listening';
    this.notify();

    this.initMicrophoneListener();
  }

  public pauseListening() {
    this.state.isPaused = true;
    this.state.status = 'idle';
    this.clearTimers();
    if (this.speechListenerHandle) {
      this.speechListenerHandle.stop();
      this.speechListenerHandle = null;
    }
    this.notify();
  }

  public stopListening() {
    this.state.isListening = false;
    this.state.isPaused = false;
    this.state.status = 'idle';
    this.state.interimText = '';
    this.clearTimers();
    if (this.speechListenerHandle) {
      this.speechListenerHandle.stop();
      this.speechListenerHandle = null;
    }
    SpeechService.stopSpeaking();
    this.notify();
  }

  public clearConversation() {
    this.state.messages = [];
    this.state.interimText = '';
    this.state.errorMessage = null;
    this.notify();
  }

  private clearTimers() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxUtteranceTimer) {
      clearTimeout(this.maxUtteranceTimer);
      this.maxUtteranceTimer = null;
    }
  }

  private initMicrophoneListener() {
    if (!this.state.isListening || this.state.isPaused) return;

    // Use Person A's language as primary listener locale
    const primaryLocale = this.state.config.personALang;

    this.speechListenerHandle = SpeechService.listen(
      primaryLocale,
      (transcript, isFinal) => this.handleSpeechRecognized(transcript, isFinal),
      (err) => {
        console.warn('Live Speech Error:', err);
        if (this.state.isListening && !this.state.isPaused) {
          // Restart microphone listener smoothly after transient error
          setTimeout(() => {
            if (this.state.isListening && !this.state.isPaused) {
              this.initMicrophoneListener();
            }
          }, 800);
        }
      },
      () => {
        // When speech recognition ends automatically, restart if active
        if (this.state.isListening && !this.state.isPaused && this.state.status === 'listening') {
          setTimeout(() => {
            if (this.state.isListening && !this.state.isPaused) {
              this.initMicrophoneListener();
            }
          }, 300);
        }
      }
    );
  }

  private handleSpeechRecognized(transcript: string, isFinal: boolean) {
    if (!transcript.trim()) return;

    this.currentUtteranceText = transcript;
    this.state.interimText = transcript;
    this.state.status = 'converting';
    this.notify();

    // Reset silence timer on every new interim speech token
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    if (isFinal) {
      this.processSpeechUtterance(transcript);
    } else {
      this.silenceTimer = setTimeout(() => {
        this.processSpeechUtterance(this.currentUtteranceText);
      }, this.state.config.silenceDurationMs);
    }
  }

  public async processSpeechUtterance(rawText: string) {
    const text = rawText.trim();
    if (!text) return;

    this.clearTimers();
    this.state.status = 'detecting';
    this.notify();

    // Determine language & confidence score
    const detectedLang = OCRService.detectScriptLanguage(text);
    const { speaker, confidence } = this.identifySpeaker(text, detectedLang);

    if (confidence < 70) {
      this.state.errorMessage = 'Language unclear. Please speak again.';
      this.state.status = 'listening';
      this.state.interimText = '';
      this.notify();
      return;
    }

    const srcLang = speaker === 'A' ? this.state.config.personALang : this.state.config.personBLang;
    const tgtLang = speaker === 'A' ? this.state.config.personBLang : this.state.config.personALang;

    this.state.activeSpeaker = speaker;
    this.state.status = 'translating';
    this.state.errorMessage = null;
    this.notify();

    try {
      const translationRes: TranslationResult = await TranslationEngine.translate(text, srcLang, tgtLang);

      const message: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker,
        speakerName: speaker === 'A' ? `Person A (${getLanguageByCode(srcLang).name})` : `Person B (${getLanguageByCode(srcLang).name})`,
        sourceLang: srcLang,
        targetLang: tgtLang,
        originalText: text,
        translatedText: translationRes.translatedText || text,
        confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOffline: translationRes.isOffline
      };

      this.state.messages = [...this.state.messages, message];
      this.state.interimText = '';
      this.state.status = 'speaking';
      this.notify();

      if (this.state.config.autoSpeak && translationRes.translatedText) {
        SpeechService.speak(translationRes.translatedText, tgtLang, () => {
          this.resumeListeningAfterSpeech();
        });
      } else {
        this.resumeListeningAfterSpeech();
      }
    } catch (e) {
      console.error('Utterance translation failed:', e);
      this.state.errorMessage = 'Could not translate speech utterance. Please try again.';
      this.resumeListeningAfterSpeech();
    }
  }

  public async sendDirectPhrase(phraseText: string, speaker: 'A' | 'B' = 'A') {
    const srcLang = speaker === 'A' ? this.state.config.personALang : this.state.config.personBLang;
    const tgtLang = speaker === 'A' ? this.state.config.personBLang : this.state.config.personALang;

    this.state.status = 'translating';
    this.notify();

    try {
      const translationRes = await TranslationEngine.translate(phraseText, srcLang, tgtLang);
      const message: ConversationMessage = {
        id: `msg_${Date.now()}`,
        speaker,
        speakerName: speaker === 'A' ? `Person A (${getLanguageByCode(srcLang).name})` : `Person B (${getLanguageByCode(srcLang).name})`,
        sourceLang: srcLang,
        targetLang: tgtLang,
        originalText: phraseText,
        translatedText: translationRes.translatedText || phraseText,
        confidence: 100,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOffline: translationRes.isOffline
      };

      this.state.messages = [...this.state.messages, message];
      this.state.status = 'speaking';
      this.notify();

      if (this.state.config.autoSpeak && translationRes.translatedText) {
        SpeechService.speak(translationRes.translatedText, tgtLang, () => {
          this.resumeListeningAfterSpeech();
        });
      } else {
        this.resumeListeningAfterSpeech();
      }
    } catch (e) {
      console.error('Direct phrase translation error:', e);
    }
  }

  private resumeListeningAfterSpeech() {
    if (this.state.isListening && !this.state.isPaused) {
      this.state.status = 'listening';
      this.notify();
      this.initMicrophoneListener();
    } else {
      this.state.status = 'idle';
      this.notify();
    }
  }

  private identifySpeaker(text: string, detectedLang: LanguageCode): { speaker: 'A' | 'B'; confidence: number } {
    const pA = this.state.config.personALang;
    const pB = this.state.config.personBLang;

    if (detectedLang === pA) {
      return { speaker: 'A', confidence: 95 };
    }
    if (detectedLang === pB) {
      return { speaker: 'B', confidence: 95 };
    }

    // Secondary heuristic: script analysis match
    if (pA === 'en' && /^[a-zA-Z0-9\s.,?!']+$/.test(text)) {
      return { speaker: 'A', confidence: 90 };
    }
    if (pB === 'en' && /^[a-zA-Z0-9\s.,?!']+$/.test(text)) {
      return { speaker: 'B', confidence: 90 };
    }

    // Default to Person A if auto-detect is enabled or ambiguous
    return { speaker: 'A', confidence: 75 };
  }
}

export const ConversationManager = new ConversationManagerClass();
