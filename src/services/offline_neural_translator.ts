import type { LanguageCode } from '../types';
import { ModelCacheManager } from './model_cache_manager';

export interface NeuralTranslationResponse {
  translatedText: string;
  engineUsed: string;
  confidence: number;
  isExactMatch: boolean;
  durationMs?: number;
  error?: string;
}

export type ProgressCallback = (info: { stage: string; progress: number }) => void;

class OfflineNeuralTranslatorService {
  private worker: Worker | null = null;
  private workerReady = false;
  private pendingRequests = new Map<string, {
    resolve: (res: any) => void;
    reject: (err: any) => void;
    timeoutId: any;
  }>();
  private reqIdCounter = 0;
  private initPromise: Promise<void> | null = null;
  private progressListeners = new Set<ProgressCallback>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return;

    try {
      this.worker = new Worker(
        new URL('./translation_worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, id, translatedText, durationMs, error, stage, progress } = event.data;

        if (type === 'STATUS' || type === 'MODEL_PROGRESS') {
          const currentStage = stage || event.data.file || 'Loading model weights';
          const currentProgress = progress || 0;
          this.progressListeners.forEach(cb => cb({ stage: currentStage, progress: currentProgress }));
          return;
        }

        if (type === 'INIT_SUCCESS') {
          this.workerReady = true;
          return;
        }

        if (type === 'TRANSLATE_SUCCESS') {
          const pending = this.pendingRequests.get(id);
          if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(id);
            pending.resolve({ translatedText, durationMs });
          }
          return;
        }

        if (type === 'TRANSLATE_ERROR') {
          const pending = this.pendingRequests.get(id);
          if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(id);
            pending.reject(new Error(error));
          }
          return;
        }
      };

      this.worker.onerror = (err) => {
        console.error('Translation Worker error:', err);
      };
    } catch (e) {
      console.warn('Could not initialize translation Web Worker, will use fallback:', e);
      this.worker = null;
    }
  }

  public addProgressListener(cb: ProgressCallback) {
    this.progressListeners.add(cb);
    return () => this.progressListeners.delete(cb);
  }

  /**
   * Check if genuine model weights are installed in persistent Cache Storage
   */
  public async isModelInstalled(): Promise<boolean> {
    return ModelCacheManager.isModelInstalled();
  }

  /**
   * Preload or initialize the worker translation engine
   */
  public async preloadModel(allowRemoteModels = false): Promise<void> {
    if (this.workerReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      if (!this.worker) {
        this.initWorker();
      }

      if (!this.worker) {
        return resolve();
      }

      const timeout = setTimeout(() => {
        resolve(); // Don't block forever
      }, 30000);

      const handler = (e: MessageEvent) => {
        if (e.data.type === 'INIT_SUCCESS' || e.data.type === 'STATUS') {
          if (e.data.type === 'INIT_SUCCESS' || e.data.status === 'ready') {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handler);
            this.workerReady = true;
            resolve();
          }
        } else if (e.data.type === 'INIT_ERROR') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handler);
          reject(new Error(e.data.error));
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'INIT', allowRemoteModels });
    });

    return this.initPromise;
  }

  /**
   * Main sentence and paragraph neural translation entrypoint
   */
  public async translate(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
    allowRemoteModels = false
  ): Promise<NeuralTranslationResponse> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        translatedText: '',
        engineUsed: 'M2M-100 Neural NMT (On-Device ONNX)',
        confidence: 1.0,
        isExactMatch: true
      };
    }

    if (sourceLang === targetLang) {
      return {
        translatedText: trimmed,
        engineUsed: 'Passthrough (Identical Language)',
        confidence: 1.0,
        isExactMatch: true
      };
    }

    // Verify model availability if offline
    const installed = await this.isModelInstalled();
    if (!installed && !allowRemoteModels) {
      return {
        translatedText: '',
        engineUsed: 'M2M-100 Neural NMT',
        confidence: 0,
        isExactMatch: false,
        error: 'Offline neural model is not installed. Please download the language pack while connected to the internet.'
      };
    }

    if (!this.worker) {
      this.initWorker();
    }

    if (!this.worker) {
      throw new Error('Worker not available in this environment');
    }

    const id = `req_${++this.reqIdCounter}_${Date.now()}`;

    return new Promise<NeuralTranslationResponse>((resolve, reject) => {
      // 90 second timeout for very long paragraphs on low-end CPUs
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Neural translation timed out. The model took too long to generate sequence.'));
      }, 90000);

      this.pendingRequests.set(id, {
        resolve: ({ translatedText, durationMs }) => {
          resolve({
            translatedText,
            engineUsed: 'M2M-100 Neural NMT (On-Device ONNX)',
            confidence: 0.96,
            isExactMatch: false,
            durationMs
          });
        },
        reject: (err) => {
          resolve({
            translatedText: '',
            engineUsed: 'M2M-100 Neural NMT (On-Device ONNX)',
            confidence: 0,
            isExactMatch: false,
            error: err.message || 'Neural inference failed.'
          });
        },
        timeoutId
      });

      this.worker!.postMessage({
        type: 'TRANSLATE',
        id,
        text: trimmed,
        sourceLang,
        targetLang,
        allowRemoteModels: allowRemoteModels || !installed
      });
    });
  }
}

export const OfflineNeuralTranslator = new OfflineNeuralTranslatorService();
