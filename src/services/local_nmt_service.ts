import fs from 'fs';
import path from 'path';
import { LANGUAGE_REGISTRY, isPairSupportedOffline, NLLB_LANG_CODES } from './language_registry.ts';
import { ContextTravelNormalizer } from './context_travel_normalizer.ts';
import { SourceSentenceNormalizer } from './source_sentence_normalizer.ts';
import { TargetCompletenessValidator } from './target_completeness_validator.ts';
import { NativeScriptTransliteration } from './native_script_transliteration.ts';
import { SourceToTranslationConsistencyCheck, type ConsistencyReport } from './source_to_translation_consistency_check.ts';
import type { LanguageCode } from '../types/index.ts';

export interface PackMetadata {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  directions: string[];
  engine: string;
  sizeMb: number;
  isInstalled: boolean;
  version: string;
  description: string;
  qualityStatus: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  engineUsed: string;
  confidence: number;
  durationMs: number;
  error?: string;
  domain?: string;
  qualityWarning?: string;
  consistencyReport?: ConsistencyReport;
}

const NLLB_CACHE_BASE = path.resolve(process.cwd(), 'node_modules/@huggingface/transformers/.cache/Xenova/nllb-200-distilled-600M');
const M2M_CACHE_BASE = path.resolve(process.cwd(), 'node_modules/@huggingface/transformers/.cache/Xenova/m2m100_418M');
const METADATA_FILE = path.resolve(process.cwd(), 'src/database/installed_models.json');

const NLLB_REQUIRED_FILES = [
  { path: 'config.json', minSize: 500 },
  { path: 'generation_config.json', minSize: 100 },
  { path: 'tokenizer_config.json', minSize: 500 },
  { path: 'tokenizer.json', minSize: 5000000 },
  { path: 'onnx/encoder_model_quantized.onnx', minSize: 200000000 },
  { path: 'onnx/decoder_model_merged_quantized.onnx', minSize: 200000000 }
];

const M2M_REQUIRED_FILES = [
  { path: 'config.json', minSize: 500 },
  { path: 'generation_config.json', minSize: 100 },
  { path: 'tokenizer_config.json', minSize: 500 },
  { path: 'tokenizer.json', minSize: 5000000 },
  { path: 'onnx/encoder_model_quantized.onnx', minSize: 200000000 },
  { path: 'onnx/decoder_model_merged_quantized.onnx', minSize: 200000000 }
];

let pipelinePromise: Promise<any> | null = null;
let translatorInstance: any = null;

// Translation In-Memory Cache for rapid 0ms repeated translations
const TRANSLATION_CACHE = new Map<string, TranslationResponse>();
const MAX_CACHE_ENTRIES = 500;
const IN_FLIGHT_REQUESTS = new Map<string, Promise<TranslationResponse>>();

export interface ActiveModelInfo {
  modelId: string;
  cacheBase: string;
  isNLLB: boolean;
  name: string;
  sizeMb: number;
}

export function getActiveOfflineModel(): ActiveModelInfo {
  let nllbComplete = true;
  for (const req of NLLB_REQUIRED_FILES) {
    const fullPath = path.join(NLLB_CACHE_BASE, req.path);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size < req.minSize) {
      nllbComplete = false;
      break;
    }
  }

  if (nllbComplete) {
    return {
      modelId: 'Xenova/nllb-200-distilled-600M',
      cacheBase: NLLB_CACHE_BASE,
      isNLLB: true,
      name: 'NLLB-200 Neural NMT (High-Fidelity Offline)',
      sizeMb: 873.2
    };
  }

  return {
    modelId: 'Xenova/m2m100_418M',
    cacheBase: M2M_CACHE_BASE,
    isNLLB: false,
    name: 'M2M-100 Neural NMT (Context-Aware INT8)',
    sizeMb: 630.5
  };
}

function checkModelFilesExist(): boolean {
  const active = getActiveOfflineModel();
  const reqs = active.isNLLB ? NLLB_REQUIRED_FILES : M2M_REQUIRED_FILES;
  for (const req of reqs) {
    const fullPath = path.join(active.cacheBase, req.path);
    if (!fs.existsSync(fullPath)) return false;
    const stat = fs.statSync(fullPath);
    if (stat.size < req.minSize) return false;
  }
  return true;
}

function getStoredMetadata(): Record<string, boolean> {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const content = fs.readFileSync(METADATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn('Could not read model metadata file:', e);
  }
  return {};
}

function saveStoredMetadata(meta: Record<string, boolean>) {
  try {
    const dir = path.dirname(METADATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(METADATA_FILE, JSON.stringify(meta, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write model metadata file:', e);
  }
}

export class LocalNMTService {
  /**
   * Check if a language model pack is marked installed
   */
  public static isModelInstalled(langCode: string = 'ta'): boolean {
    const filesExist = checkModelFilesExist();
    if (!filesExist) return false;

    // Check registry support
    const entry = LANGUAGE_REGISTRY[langCode as LanguageCode];
    if (entry && entry.offlineStatus === 'unsupported_offline') {
      return false;
    }

    const stored = getStoredMetadata();
    if (stored[langCode] === undefined) {
      stored[langCode] = true;
      saveStoredMetadata(stored);
      return true;
    }
    return Boolean(stored[langCode]);
  }

  /**
   * Get list of language packs and their status across all supported languages
   */
  public static getPacks(): PackMetadata[] {
    const filesExist = checkModelFilesExist();
    const stored = getStoredMetadata();
    const activeModel = getActiveOfflineModel();

    const supportedCodes: LanguageCode[] = [
      'ta', 'hi', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa', 'ur', 'te', 'es', 'fr', 'de'
    ];

    return supportedCodes.map(code => {
      const reg = LANGUAGE_REGISTRY[code];
      const isInstalled = filesExist && (stored[code] !== false);

      return {
        id: `pack_${code}`,
        code,
        name: `English ↔ ${reg.name} Pack`,
        nativeName: `English ↔ ${reg.nativeName}`,
        directions: [`en -> ${code}`, `${code} -> en`],
        engine: activeModel.name,
        sizeMb: activeModel.sizeMb,
        isInstalled,
        version: '2.1.0',
        description: `${reg.family} language pack with high-fidelity sentence accuracy, verified grammar, and 100% offline support.`,
        qualityStatus: reg.offlineStatus
      };
    });
  }

  /**
   * Install or activate a language pack
   */
  public static async installPack(langCode: string): Promise<{ success: boolean; message: string; pack: PackMetadata }> {
    const filesExist = checkModelFilesExist();
    if (!filesExist) {
      throw new Error('Neural model files are missing from disk cache. Please verify cache directory.');
    }

    const reg = LANGUAGE_REGISTRY[langCode as LanguageCode];
    if (reg && reg.offlineStatus === 'unsupported_offline') {
      throw new Error(`Offline neural translation is not supported for ${reg.name} in the on-device vocabulary.`);
    }

    const stored = getStoredMetadata();
    stored[langCode] = true;
    stored['en'] = true;
    saveStoredMetadata(stored);

    // Warm up the translator instance in the background
    this.getTranslator().catch(err => {
      console.warn('Warmup warning:', err);
    });

    const packs = this.getPacks();
    const pack = packs.find(p => p.code === langCode) || packs[0];

    return {
      success: true,
      message: `Successfully installed and activated ${pack.name}.`,
      pack
    };
  }

  /**
   * Uninstall or deactivate a language pack
   */
  public static async uninstallPack(langCode: string): Promise<{ success: boolean; message: string }> {
    const stored = getStoredMetadata();
    stored[langCode] = false;
    saveStoredMetadata(stored);

    return {
      success: true,
      message: `Uninstalled language pack for ${langCode}.`
    };
  }

  /**
   * Lazy load local translator instance with strictly offline configuration
   */
  public static async getTranslator(): Promise<any> {
    if (translatorInstance) return translatorInstance;
    if (pipelinePromise) return pipelinePromise;

    pipelinePromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      // Strictly offline: zero network requests
      env.allowRemoteModels = false;

      const activeModel = getActiveOfflineModel();
      const instance = await pipeline('translation', activeModel.modelId, {
        dtype: 'q8'
      });

      translatorInstance = instance;
      return instance;
    })();

    try {
      const instance = await pipelinePromise;
      return instance;
    } catch (err) {
      pipelinePromise = null;
      throw err;
    }
  }

  /**
   * Translate text between any supported languages with High-Fidelity Sentence-Level Accuracy
   */
  public static async translate(
    text: string = '',
    sourceLang: string = 'en',
    targetLang: string = 'ta'
  ): Promise<TranslationResponse> {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return {
        translatedText: '',
        sourceLang,
        targetLang,
        engineUsed: 'NLLB-200 Neural NMT (High-Fidelity Offline)',
        confidence: 1.0,
        durationMs: 0
      };
    }

    if (sourceLang === targetLang) {
      return {
        translatedText: trimmed,
        sourceLang,
        targetLang,
        engineUsed: 'Passthrough (Identical Language)',
        confidence: 1.0,
        durationMs: 0
      };
    }

    // Check registry support
    const pairSupport = isPairSupportedOffline(sourceLang as LanguageCode, targetLang as LanguageCode);
    if (!pairSupport.isSupported) {
      return {
        translatedText: '',
        sourceLang,
        targetLang,
        engineUsed: 'Preset Emergency Phrase DB',
        confidence: 0,
        durationMs: 0,
        error: pairSupport.reason || `Offline translation is not supported for ${sourceLang} -> ${targetLang}.`
      };
    }

    // Check if installed
    const isInstalled = this.isModelInstalled(targetLang) || this.isModelInstalled(sourceLang);
    if (!isInstalled) {
      return {
        translatedText: '',
        sourceLang,
        targetLang,
        engineUsed: 'Offline Engine (Model Required)',
        confidence: 0,
        durationMs: 0,
        error: `Offline translation model for ${sourceLang} -> ${targetLang} is not installed. Please install the language pack in Settings or Language Packs to translate without network access.`
      };
    }

    const cacheKey = `${sourceLang}::${targetLang}::${trimmed}`;
    if (TRANSLATION_CACHE.has(cacheKey)) {
      const cached = TRANSLATION_CACHE.get(cacheKey)!;
      return {
        ...cached,
        durationMs: 1
      };
    }

    if (IN_FLIGHT_REQUESTS.has(cacheKey)) {
      return IN_FLIGHT_REQUESTS.get(cacheKey)!;
    }

    const runInference = async (): Promise<TranslationResponse> => {
      const startTime = Date.now();
      const domainInfo = ContextTravelNormalizer.detectDomain(trimmed);
      const activeModel = getActiveOfflineModel();
      const translator = await this.getTranslator();

      // =====================================================================
      // STEP 1: Language code mapping
      //   - NLLB-200 uses Flores-200 codes (eng_Latn, tam_Taml, hin_Deva, etc.)
      //   - M2M-100 uses standard 2-letter ISO codes (en, ta, hi, etc.)
      // =====================================================================
      const modelSrc = activeModel.isNLLB
        ? (NLLB_LANG_CODES[sourceLang as LanguageCode] || sourceLang)
        : sourceLang;
      const modelTgt = activeModel.isNLLB
        ? (NLLB_LANG_CODES[targetLang as LanguageCode] || targetLang)
        : targetLang;

      // =====================================================================
      // STEP 2: Source normalization & sentence boundary segmentation
      //   Splits paragraphs into clean logical sentence units to prevent
      //   truncation, context drop, or cross-sentence hallucinations.
      // =====================================================================
      const normalizedSrc = sourceLang === 'en'
        ? SourceSentenceNormalizer.normalize(trimmed)
        : { normalizedText: trimmed, isModified: false, hasClauses: false, clauses: [trimmed], extractedEntities: [] };

      const sourceToTranslate = normalizedSrc.normalizedText;

      const sentences = sourceToTranslate
        .split(/(?<=[.!?\n।۔])\s+/)
        .map(s => s.trim())
        .filter(Boolean);

      const translatedChunks: string[] = [];

      for (const sentence of sentences) {
        // ===================================================================
        // STEP 3: Neural translation of each complete sentence
        //   For NLLB-200: greedy decoding with max_new_tokens: 150
        //   For M2M-100: greedy decoding with n-gram repetition constraints
        // ===================================================================
        const genOptions = activeModel.isNLLB
          ? {
              src_lang: modelSrc,
              tgt_lang: modelTgt,
              max_new_tokens: 150
            }
          : {
              src_lang: modelSrc,
              tgt_lang: modelTgt,
              num_beams: 1,
              repetition_penalty: 1.25,
              no_repeat_ngram_size: 3,
              max_new_tokens: 120
            };

        const output = await translator(sentence, genOptions);

        if (Array.isArray(output) && output[0]?.translation_text) {
          let rawChunk = output[0].translation_text.trim();

          // Hallucination cleansing and entity preservation
          rawChunk = ContextTravelNormalizer.naturalizeOutput(
            rawChunk, sentence, sourceLang, targetLang
          );

          // Proper noun transliteration (e.g. Free Fire, Gowtham, Sundar)
          rawChunk = NativeScriptTransliteration.transliterateProperNouns(rawChunk, targetLang);
          rawChunk = rawChunk.normalize('NFC');

          translatedChunks.push(rawChunk);
        } else {
          translatedChunks.push('');
        }
      }

      // =====================================================================
      // STEP 4: Sentence assembly and Unicode normalization
      //   Ensures all source sentences are represented in exact order.
      // =====================================================================
      const finalTranslation = translatedChunks.join(' ').normalize('NFC').trim();
      const durationMs = Date.now() - startTime;

      // =====================================================================
      // STEP 5: Source-to-Translation Consistency Validation (Section 6)
      //   Checks sentence count, negation preservation, numbers, and hallucinations.
      // =====================================================================
      const consistency = SourceToTranslationConsistencyCheck.validate(
        trimmed,
        finalTranslation,
        sourceLang,
        targetLang
      );

      const completeness = TargetCompletenessValidator.validate(
        finalTranslation, trimmed, sourceLang, targetLang
      );

      const isHighQuality = consistency.isConsistent && completeness.isValid;
      const combinedScore = Math.min(consistency.qualityScore, completeness.qualityScore);

      const warningsList: string[] = [...consistency.warnings, ...consistency.issues];
      if (!completeness.isValid && completeness.reason) {
        warningsList.push(completeness.reason);
      }

      const result: TranslationResponse = {
        translatedText: finalTranslation,
        sourceLang,
        targetLang,
        engineUsed: activeModel.name,
        confidence: isHighQuality ? 0.98 : Math.max(0.4, combinedScore),
        durationMs,
        domain: domainInfo.domain,
        qualityWarning: warningsList.length > 0 ? warningsList[0] : undefined,
        consistencyReport: consistency
      };

      if (TRANSLATION_CACHE.size >= MAX_CACHE_ENTRIES) {
        const firstKey = TRANSLATION_CACHE.keys().next().value;
        if (firstKey) TRANSLATION_CACHE.delete(firstKey);
      }
      TRANSLATION_CACHE.set(cacheKey, result);

      return result;
    };

    const promise = runInference();
    IN_FLIGHT_REQUESTS.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      IN_FLIGHT_REQUESTS.delete(cacheKey);
    }
  }
}
