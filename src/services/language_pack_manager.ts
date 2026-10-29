import type { LanguagePack, LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../models/language';
import { ModelCacheManager, TOTAL_MODEL_BYTES } from './model_cache_manager';
import { LANGUAGE_REGISTRY } from './language_registry';

const PACKS_STORAGE_KEY = 'bharatconnect_installed_packs_v3';

export const INITIAL_LANGUAGE_PACKS: LanguagePack[] = SUPPORTED_LANGUAGES.map((lang) => {
  const reg = LANGUAGE_REGISTRY[lang.code];
  const isOfflineAvailable = reg ? (reg.offlineStatus === 'verified_ready' || reg.offlineStatus === 'pack_available') : false;

  return {
    id: `pack_${lang.code}`,
    code: lang.code,
    name: `English ↔ ${lang.name} Pack`,
    nativeName: `${lang.nativeName} (English ↔ ${lang.name})`,
    version: lang.packVersion,
    availableVersion: '2.0.0',
    sizeMb: isOfflineAvailable ? Math.round((TOTAL_MODEL_BYTES / (1024 * 1024)) * 10) / 10 : lang.sizeMb,
    isInstalled: false,
    phraseCount: isOfflineAvailable ? 50000 : 1500,
    lastUpdated: '2026-10-26'
  };
});

export const LanguagePackManager = {
  /**
   * Get language packs, reconciling with local storage.
   */
  getPacks(): LanguagePack[] {
    try {
      const data = localStorage.getItem(PACKS_STORAGE_KEY);
      if (!data) return INITIAL_LANGUAGE_PACKS;
      const parsed: LanguagePack[] = JSON.parse(data);
      const existingCodes = new Set(parsed.map(p => p.code));
      const missing = INITIAL_LANGUAGE_PACKS.filter(p => !existingCodes.has(p.code));
      return [...parsed, ...missing];
    } catch (e) {
      return INITIAL_LANGUAGE_PACKS;
    }
  },

  /**
   * Asynchronously verify actual persistent storage and sync pack statuses
   */
  async syncInstalledState(): Promise<LanguagePack[]> {
    let isModelActuallyInstalled = await ModelCacheManager.isModelInstalled('ta');
    const backendPackMap = new Map<string, boolean>();

    // Check backend /api/packs
    try {
      const res = await fetch('/api/packs');
      if (res.ok) {
        const backendPacks: any[] = await res.json();
        for (const bp of backendPacks) {
          backendPackMap.set(bp.code, Boolean(bp.isInstalled));
        }
        if (backendPackMap.has('ta')) {
          isModelActuallyInstalled = backendPackMap.get('ta')!;
        }
      }
    } catch {}

    const currentPacks = this.getPacks();

    const updated = currentPacks.map(p => {
      const reg = LANGUAGE_REGISTRY[p.code];
      const isNeuralSupported = reg ? (reg.offlineStatus === 'verified_ready' || reg.offlineStatus === 'pack_available' || reg.offlineStatus === 'unverified_quality') : false;

      const isInstalled = backendPackMap.has(p.code)
        ? (backendPackMap.get(p.code)! && isNeuralSupported)
        : (isNeuralSupported && isModelActuallyInstalled);

      return {
        ...p,
        isInstalled,
        version: isInstalled ? '2.0.0' : '1.0.0',
        sizeMb: isNeuralSupported ? Math.round((TOTAL_MODEL_BYTES / (1024 * 1024)) * 10) / 10 : p.sizeMb
      };
    });

    this.savePacks(updated);
    return updated;
  },

  savePacks(packs: LanguagePack[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(packs));
    }
  },

  /**
   * Genuine Download & Model Installation
   */
  async updatePackVersion(
    code: LanguageCode,
    progressCallback: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<LanguagePack> {
    try {
      await ModelCacheManager.downloadAndInstallModel(
        code,
        (p) => {
          progressCallback(p.overallPercent);
        },
        signal
      );

      const isInstalled = await ModelCacheManager.isModelInstalled(code);
      if (!isInstalled) {
        throw new Error(`Model verification failed after download for ${code}.`);
      }

      const packs = this.getPacks();
      const updated = packs.map(p => {
        if (p.code === code) {
          return {
            ...p,
            version: '2.0.0',
            isInstalled: true,
            lastUpdated: new Date().toISOString().split('T')[0],
            phraseCount: 50000,
            sizeMb: Math.round((TOTAL_MODEL_BYTES / (1024 * 1024)) * 10) / 10
          };
        }
        return p;
      });

      this.savePacks(updated);
      const targetPack = updated.find(p => p.code === code) || updated[0];
      return targetPack;
    } catch (err: any) {
      console.error('Error in genuine pack installation:', err);
      throw err;
    }
  },

  /**
   * Uninstall neural model assets
   */
  async uninstallPack(code?: LanguageCode): Promise<void> {
    const targetCode = code || 'ta';
    try {
      await fetch('/api/packs/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode })
      });
    } catch {}

    const packs = this.getPacks();
    const updated = packs.map(p => {
      if (!code || p.code === code) {
        return {
          ...p,
          isInstalled: false,
          version: '1.0.0'
        };
      }
      return p;
    });
    this.savePacks(updated);
  },

  hasPendingUpdates(): boolean {
    const packs = this.getPacks();
    return packs.some(p => p.isInstalled && p.version !== p.availableVersion);
  }
};
