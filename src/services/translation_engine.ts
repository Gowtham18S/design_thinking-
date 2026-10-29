import type { LanguageCode } from '../types';
import { OFFLINE_PRESET_PHRASES } from '../database/phrase_database';
import { NetworkService } from './network_service';
import { OfflineNeuralTranslator } from './offline_neural_translator';
import { ModelCacheManager } from './model_cache_manager';
import { isPairSupportedOffline, getLanguageRegistryEntry } from './language_registry';

export interface TranslationResult {
  translatedText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  confidence: number;
  phoneticText?: string;
  isExactMatch: boolean;
  engineUsed: string;
  error?: string;
  isOffline?: boolean;
  durationMs?: number;
  domain?: string;
}

const ENGINE_TRANSLATION_CACHE = new Map<string, TranslationResult>();
const MAX_CACHE_ENTRIES = 500;

function setCache(key: string, result: TranslationResult) {
  if (ENGINE_TRANSLATION_CACHE.size >= MAX_CACHE_ENTRIES) {
    const firstKey = ENGINE_TRANSLATION_CACHE.keys().next().value;
    if (firstKey) ENGINE_TRANSLATION_CACHE.delete(firstKey);
  }
  ENGINE_TRANSLATION_CACHE.set(key, result);
}

export const TranslationEngine = {
  /**
   * Main intelligent translation entry point.
   * Handles:
   * 1. Automatic Online / Offline routing (Auto mode)
   * 2. Mid-request disconnection & timeout handling
   * 3. Seamless local neural fallback when offline or cloud fails
   * 4. Strict offline enforcement when 'offline_only' is selected
   */
  async translate(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
    externalSignal?: AbortSignal
  ): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        translatedText: '',
        sourceLang,
        targetLang,
        confidence: 1.0,
        isExactMatch: true,
        engineUsed: 'LinguaGo Core'
      };
    }

    if (sourceLang === targetLang) {
      return {
        translatedText: trimmed,
        sourceLang,
        targetLang,
        confidence: 1.0,
        isExactMatch: true,
        engineUsed: 'Passthrough (Identical Language)'
      };
    }

    // Check fast in-memory translation cache (0-1ms repeated responses)
    const cacheKey = `${sourceLang}::${targetLang}::${trimmed}`;
    if (ENGINE_TRANSLATION_CACHE.has(cacheKey)) {
      const cached = ENGINE_TRANSLATION_CACHE.get(cacheKey)!;
      return {
        ...cached,
        durationMs: 1
      };
    }

    const userMode = NetworkService.getUserMode();
    const isDeviceOnline = NetworkService.isDeviceOnline();
    const isModelInstalled = await ModelCacheManager.isModelInstalled(targetLang);
    const srcEntry = getLanguageRegistryEntry(sourceLang);
    const tgtEntry = getLanguageRegistryEntry(targetLang);
    const pairSupport = isPairSupportedOffline(sourceLang, targetLang);

    // 1. Check exact phrase database match first for quick emergency phrases
    const exactMatch = this.checkExactLocalMatch(trimmed, sourceLang, targetLang);
    if (exactMatch) {
      setCache(cacheKey, exactMatch);
      return exactMatch;
    }

    // =========================================================================
    // CASE A: OFFLINE MODE (100% On-Device Neural AI - 0 Cloud Calls)
    // =========================================================================
    if (userMode === 'offline') {
      if (!pairSupport.isSupported) {
        return {
          translatedText: '',
          sourceLang,
          targetLang,
          confidence: 0,
          isExactMatch: false,
          engineUsed: 'NLLB-200 Offline Engine',
          error: pairSupport.reason || `Offline translation is not supported for ${srcEntry.name} -> ${tgtEntry.name}. Switch to Online Mode.`,
          isOffline: true
        };
      }

      if (!isModelInstalled) {
        return {
          translatedText: '',
          sourceLang,
          targetLang,
          confidence: 0,
          isExactMatch: false,
          engineUsed: 'Offline Engine (Model Required)',
          error: `Offline translation model for ${tgtEntry.name} is not installed. Please install the ${tgtEntry.name} Language Pack or switch to Online Mode.`,
          isOffline: true
        };
      }

      const localRes = await this.translateLocallyNeural(trimmed, sourceLang, targetLang);
      if (localRes.translatedText) {
        localRes.engineUsed = localRes.engineUsed || 'NLLB-200 Neural NMT (High-Fidelity Offline)';
        ENGINE_TRANSLATION_CACHE.set(cacheKey, localRes);
      }
      return localRes;
    }

    // =========================================================================
    // CASE B: ONLINE MODE (High-speed Cloud Translation Services)
    // =========================================================================
    if (userMode === 'online') {
      if (!isDeviceOnline) {
        return {
          translatedText: '',
          sourceLang,
          targetLang,
          confidence: 0,
          isExactMatch: false,
          engineUsed: 'Cloud Translation API (Online)',
          error: 'Online Mode is selected, but no internet connection is detected. Please connect to a network or click Offline Mode below to translate with installed packs.',
          isOffline: false
        };
      }

      try {
        const startTime = Date.now();
        const onlineText = await this.translateOnline(trimmed, sourceLang, targetLang, externalSignal);
        if (onlineText) {
          NetworkService.recordOnlineSuccess();
          const onlineRes: TranslationResult = {
            translatedText: onlineText,
            sourceLang,
            targetLang,
            confidence: 0.98,
            isExactMatch: false,
            engineUsed: 'Cloud Translation API (Online)',
            isOffline: false,
            durationMs: Date.now() - startTime
          };
          ENGINE_TRANSLATION_CACHE.set(cacheKey, onlineRes);
          return onlineRes;
        }
      } catch (e: any) {
        NetworkService.recordOnlineFailure(e?.message, true);
        return {
          translatedText: '',
          sourceLang,
          targetLang,
          confidence: 0,
          isExactMatch: false,
          engineUsed: 'Cloud Translation API (Online)',
          error: 'Online translation service is temporarily unreachable. You can retry or switch to Offline Mode to translate with your installed pack.',
          isOffline: false
        };
      }
    }

    // =========================================================================
    // CASE C: AUTO MODE (Recommended Default — Intelligent Auto-Switching)
    // =========================================================================
    // 1. If device is currently offline, route directly to offline engine
    if (!isDeviceOnline) {
      if (pairSupport.isSupported && isModelInstalled) {
        NetworkService.notify(
          'offline_fallback',
          `Offline mode active — translated using your installed ${tgtEntry.name} language pack.`
        );
        const localRes = await this.translateLocallyNeural(trimmed, sourceLang, targetLang);
        localRes.engineUsed = `${localRes.engineUsed} (Offline Auto)`;
        if (localRes.translatedText) ENGINE_TRANSLATION_CACHE.set(cacheKey, localRes);
        return localRes;
      }

      return {
        translatedText: '',
        sourceLang,
        targetLang,
        confidence: 0,
        isExactMatch: false,
        engineUsed: 'Offline Engine (Unavailable)',
        error: `Offline translation unavailable for ${srcEntry.name} ➔ ${tgtEntry.name}. Connect to the internet or install the ${tgtEntry.name} language pack.`,
        isOffline: true
      };
    }

    // 2. Device is online: Attempt cloud translation with timeout & mid-request disconnect monitoring
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 4500);

      // Listen for mid-request disconnection
      const handleMidRequestDisconnect = () => {
        abortController.abort();
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('offline', handleMidRequestDisconnect);
      }

      if (externalSignal) {
        externalSignal.addEventListener('abort', () => abortController.abort());
      }

      const startTime = Date.now();
      try {
        const onlineText = await this.translateOnline(trimmed, sourceLang, targetLang, abortController.signal);
        clearTimeout(timeoutId);
        if (typeof window !== 'undefined') {
          window.removeEventListener('offline', handleMidRequestDisconnect);
        }

        if (onlineText) {
          NetworkService.recordOnlineSuccess();
          const onlineRes: TranslationResult = {
            translatedText: onlineText,
            sourceLang,
            targetLang,
            confidence: 0.98,
            isExactMatch: false,
            engineUsed: 'Cloud Translation API (Online)',
            isOffline: false,
            durationMs: Date.now() - startTime
          };
          ENGINE_TRANSLATION_CACHE.set(cacheKey, onlineRes);
          return onlineRes;
        }
      } catch (onlineError: any) {
        clearTimeout(timeoutId);
        if (typeof window !== 'undefined') {
          window.removeEventListener('offline', handleMidRequestDisconnect);
        }

        // Online attempt failed due to timeout, disconnect, or server error -> Trigger Automatic Offline Fallback!
        NetworkService.recordOnlineFailure('Online service timed out or disconnected. Falling back to offline model.');
      }
    } catch (_err) {
      // Proceed to fallback
    }

    // 3. Automatic Fallback Execution
    if (pairSupport.isSupported && isModelInstalled) {
      NetworkService.notify(
        'offline_fallback',
        `Offline mode active — translated using your installed ${tgtEntry.name} language pack.`
      );

      const fallbackRes = await this.translateLocallyNeural(trimmed, sourceLang, targetLang);
      fallbackRes.engineUsed = `${fallbackRes.engineUsed} (Offline Fallback)`;
      if (fallbackRes.translatedText) ENGINE_TRANSLATION_CACHE.set(cacheKey, fallbackRes);
      return fallbackRes;
    }

    return {
      translatedText: '',
      sourceLang,
      targetLang,
      confidence: 0,
      isExactMatch: false,
      engineUsed: 'Translation Router',
      error: `Online translation failed and ${tgtEntry.name} offline language pack is not installed. Please check your connection or install the language pack.`,
      isOffline: !isDeviceOnline
    };
  },

  /**
   * Run local neural translation using local server API or Web Worker
   */
  async translateLocallyNeural(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    // 1. Try local server API endpoint first (fast native ONNX on Node)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang, targetLang })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          return {
            translatedText: data.translatedText,
            sourceLang,
            targetLang,
            confidence: data.confidence || 0.98,
            isExactMatch: false,
            engineUsed: data.engineUsed || 'M2M-100 Neural AI (Local)',
            error: data.error,
            isOffline: true,
            durationMs: data.durationMs || (Date.now() - startTime),
            domain: data.domain
          };
        }
      }
    } catch (_e) {
      // Fall through to browser Web Worker
    }

    // 2. Fallback to in-browser Web Worker
    try {
      const workerRes = await OfflineNeuralTranslator.translate(text, sourceLang, targetLang, false);
      return {
        translatedText: workerRes.translatedText,
        sourceLang,
        targetLang,
        confidence: workerRes.confidence,
        isExactMatch: false,
        engineUsed: workerRes.engineUsed || 'M2M-100 Neural AI (Browser WASM)',
        error: workerRes.error,
        isOffline: true,
        durationMs: workerRes.durationMs || (Date.now() - startTime)
      };
    } catch (workerErr: any) {
      return {
        translatedText: '',
        sourceLang,
        targetLang,
        confidence: 0,
        isExactMatch: false,
        engineUsed: 'M2M-100 Neural AI (Local)',
        error: workerErr?.message || 'Local neural translation failed. Please verify model files.',
        isOffline: true
      };
    }
  },

  /**
   * Exact match for preset emergency / quick phrases
   */
  checkExactLocalMatch(cleanInputStr: string, sourceLang: LanguageCode, targetLang: LanguageCode): TranslationResult | null {
    const cleanInput = cleanInputStr.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
    if (!cleanInput) return null;

    for (const phrase of OFFLINE_PRESET_PHRASES) {
      const srcText = phrase.translations[sourceLang]?.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
      const engText = phrase.english.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();

      if ((srcText && cleanInput === srcText) || cleanInput === engText) {
        const tgtText = phrase.translations[targetLang];
        if (tgtText) {
          return {
            translatedText: tgtText,
            phoneticText: phrase.phonetics?.[targetLang],
            sourceLang,
            targetLang,
            confidence: 0.99,
            isExactMatch: true,
            engineUsed: 'Offline Emergency Phrase DB',
            isOffline: true
          };
        }
      }
    }
    return null;
  },

  /**
   * Online translation service with AbortSignal timeout support
   */
  async translateOnline(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
    signal?: AbortSignal
  ): Promise<string | null> {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const resultText = data[0].map((item: any) => item[0]).filter(Boolean).join('');
          if (resultText) return resultText;
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
    }

    try {
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const res = await fetch(fallbackUrl, { signal });
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
    }

    return null;
  },

  /**
   * Synchronous local lookup for emergency preset phrases
   */
  translateLocally(text: string, sourceLang: LanguageCode, targetLang: LanguageCode): TranslationResult {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        translatedText: '',
        sourceLang,
        targetLang,
        confidence: 1.0,
        isExactMatch: true,
        engineUsed: 'LinguaGo Core',
        isOffline: true
      };
    }

    if (sourceLang === targetLang) {
      return {
        translatedText: trimmed,
        sourceLang,
        targetLang,
        confidence: 1.0,
        isExactMatch: true,
        engineUsed: 'Passthrough',
        isOffline: true
      };
    }

    const exact = this.checkExactLocalMatch(trimmed, sourceLang, targetLang);
    if (exact) return exact;

    const clean = trimmed.toLowerCase();
    for (const phrase of OFFLINE_PRESET_PHRASES) {
      if (phrase.english.toLowerCase() === clean && phrase.translations[targetLang]) {
        return {
          translatedText: phrase.translations[targetLang]!,
          phoneticText: phrase.phonetics?.[targetLang],
          sourceLang,
          targetLang,
          confidence: 0.99,
          isExactMatch: true,
          engineUsed: 'Offline Emergency Phrase DB',
          isOffline: true
        };
      }
    }

    return {
      translatedText: '',
      sourceLang,
      targetLang,
      confidence: 0,
      isExactMatch: false,
      engineUsed: 'Preset Emergency Phrase DB',
      error: 'Phrase not found in emergency phrasebook. Full neural translation requires asynchronous inference.',
      isOffline: true
    };
  }
};
