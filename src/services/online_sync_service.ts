import { LocalDB } from '../database/local_db';
import { NetworkService } from './network_service';
import { LanguagePackManager } from './language_pack_manager';

export interface TelemetryEvent {
  eventType: 'translation' | 'situation_select' | 'phrase_built';
  sourceLang: string;
  targetLang: string;
  category?: string;
  timestamp: string;
}

export const OnlineSyncService = {
  /**
   * Log anonymous usage statistics if user explicitly granted consent in Privacy Settings
   */
  logAnonymousEvent(event: Omit<TelemetryEvent, 'timestamp'>): void {
    const settings = LocalDB.getSettings();
    // Default is false — strictly obey privacy consent
    if (!settings.allowAnalytics) return;

    if (NetworkService.isOffline()) {
      // Queue offline telemetry anonymously if desired, or skip
      return;
    }

    const payload: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    console.log('[LinguaGo Telemetry - Opted In]', payload);
  },

  /**
   * Check for model and language pack updates when online
   */
  checkForUpdates(): { hasUpdates: boolean; pendingPacksCount: number } {
    if (NetworkService.isOffline()) {
      return { hasUpdates: false, pendingPacksCount: 0 };
    }
    const hasPacks = LanguagePackManager.hasPendingUpdates();
    const pendingPacksCount = LanguagePackManager.getPacks().filter(p => p.version !== p.availableVersion).length;
    return {
      hasUpdates: hasPacks,
      pendingPacksCount
    };
  }
};
