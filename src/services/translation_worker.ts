import { pipeline, env } from '@huggingface/transformers';
import { ContextTravelNormalizer } from './context_travel_normalizer';

/**
 * Dedicated Translation Worker
 * Runs genuine pretrained neural machine translation (M2M-100 INT8 ONNX)
 * completely off the main UI thread with context-aware naturalization.
 */

// Configure environment for browser caching and local WASM execution
env.useBrowserCache = true;
env.cacheKey = 'transformers-cache';

// Point to local WASM binaries so it works 100% offline without CDN
if (typeof location !== 'undefined') {
  if (!env.backends) (env as any).backends = {};
  if (!env.backends.onnx) (env.backends as any).onnx = {};
  if (!env.backends.onnx.wasm) (env.backends as any).wasm = {};
  (env.backends.onnx.wasm as any).wasmPaths = `${location.origin}/wasm/`;
}

let translatorInstance: any = null;
let isInitializing = false;

async function getTranslator(allowRemoteModels: boolean = false): Promise<any> {
  if (translatorInstance) {
    return translatorInstance;
  }

  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (translatorInstance) return translatorInstance;
  }

  isInitializing = true;
  env.allowRemoteModels = allowRemoteModels;

  try {
    self.postMessage({ type: 'STATUS', status: 'loading', message: 'Loading Neural Translation Model...' });

    translatorInstance = await pipeline('translation', 'Xenova/m2m100_418M', {
      dtype: 'q8',
      progress_callback: (progress: any) => {
        if (progress.status === 'progress') {
          self.postMessage({
            type: 'MODEL_PROGRESS',
            file: progress.file,
            progress: progress.progress || 0,
            loaded: progress.loaded,
            total: progress.total
          });
        }
      }
    });

    self.postMessage({ type: 'STATUS', status: 'ready', message: 'Neural Translation Model Ready.' });
    return translatorInstance;
  } finally {
    isInitializing = false;
  }
}

/**
 * Split text at sentence and paragraph boundaries preserving punctuation
 */
function splitIntoSentences(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?\n।])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  return sentences.length > 0 ? sentences : [text];
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, id, text, sourceLang, targetLang, allowRemoteModels } = event.data;

  if (type === 'INIT' || type === 'PRELOAD') {
    try {
      await getTranslator(allowRemoteModels ?? false);
      self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (err: any) {
      self.postMessage({ type: 'INIT_ERROR', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'TRANSLATE') {
    try {
      const startTime = performance.now();
      const translator = await getTranslator(allowRemoteModels ?? false);

      const cleanText = text.normalize('NFC').trim();

      if (!cleanText) {
        self.postMessage({
          type: 'TRANSLATE_SUCCESS',
          id,
          translatedText: '',
          durationMs: 0
        });
        return;
      }

      // Sentence-level chunking
      const sentences = splitIntoSentences(cleanText);
      const translatedChunks: string[] = [];

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        self.postMessage({
          type: 'INFERENCE_PROGRESS',
          id,
          currentChunk: i + 1,
          totalChunks: sentences.length
        });

        // Autoregressive inference with greedy decoding and anti-repetition configuration
        const output = await translator(sentence, {
          src_lang: sourceLang,
          tgt_lang: targetLang,
          num_beams: 1,
          repetition_penalty: 1.25,
          no_repeat_ngram_size: 3,
          max_new_tokens: 120
        });

        if (Array.isArray(output) && output[0]?.translation_text) {
          const raw = output[0].translation_text.trim();
          const natural = ContextTravelNormalizer.naturalizeOutput(raw, sentence, sourceLang, targetLang);
          translatedChunks.push(natural);
        } else {
          translatedChunks.push('');
        }
      }

      const finalTranslatedText = translatedChunks.join(' ').normalize('NFC');
      const durationMs = Math.round(performance.now() - startTime);

      self.postMessage({
        type: 'TRANSLATE_SUCCESS',
        id,
        translatedText: finalTranslatedText,
        durationMs,
        chunkCount: sentences.length
      });
    } catch (err: any) {
      console.error('Worker translation error:', err);
      self.postMessage({
        type: 'TRANSLATE_ERROR',
        id,
        error: err?.message || 'Neural inference failed. Please ensure the model package is installed.'
      });
    }
  }
});
