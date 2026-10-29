import type {
  NetworkMode,
  TranslationRoutingMode,
  ConnectionNotification,
  UserSelectedMode,
  DetailedConnectionStatus
} from '../types';
import { LocalDB } from '../database/local_db';

export type NetworkStatusListener = (mode: NetworkMode) => void;
export type NotificationListener = (notification: ConnectionNotification) => void;
export type DetailedStatusListener = (status: DetailedConnectionStatus) => void;

class NetworkServiceManager {
  private currentMode: NetworkMode = 'online';
  private userSelectedMode: UserSelectedMode = 'online';
  private routingMode: TranslationRoutingMode = 'auto';
  private listeners: Set<NetworkStatusListener> = new Set();
  private notificationListeners: Set<NotificationListener> = new Set();
  private detailedListeners: Set<DetailedStatusListener> = new Set();
  private simulatedMode: NetworkMode | 'auto' = 'auto';

  // Distinct states for true physical connectivity vs translation provider availability
  private deviceOnline: boolean = true;
  private isOnlineServiceReachable: boolean = true;
  private isCheckingService: boolean = false;
  private lastReachabilityCheck: number = 0;
  private reachabilityCheckInFlight: Promise<boolean> | null = null;
  private prevOnlineState: boolean = true;

  constructor() {
    const settings = LocalDB.getSettings();
    // Sanitize simulated mode to prevent developer simulation tests from getting permanently stuck
    this.simulatedMode = settings.simulatedNetwork || 'auto';
    this.routingMode = settings.routingMode || 'auto';

    // Load persisted user-selected mode ('online' | 'offline')
    const savedUserMode = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('linguago_user_mode') as UserSelectedMode | null)
      : null;

    if (savedUserMode === 'online' || savedUserMode === 'offline') {
      this.userSelectedMode = savedUserMode;
    } else if (settings.userSelectedMode) {
      this.userSelectedMode = settings.userSelectedMode;
    } else if (this.routingMode === 'offline_only') {
      this.userSelectedMode = 'offline';
    } else {
      this.userSelectedMode = 'online';
    }

    if (typeof window !== 'undefined') {
      // Modern browser navigator.onLine initialization
      this.prevOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.deviceOnline = this.prevOnlineState;

      // Event listeners for browser online/offline changes
      window.addEventListener('online', this.handleOnlineEvent);
      window.addEventListener('offline', this.handleOfflineEvent);

      // Verify reachability shortly after startup without blocking UI
      setTimeout(() => {
        this.verifyRealConnectivity();
      }, 500);
    }
  }

  private handleOnlineEvent = () => {
    this.prevOnlineState = true;
    this.deviceOnline = true;
    this.isOnlineServiceReachable = true;
    this.updateCurrentStatus(true);

    if (this.userSelectedMode === 'online') {
      this.notify(
        'success',
        'Internet connection detected. Online translation service is ready.'
      );
    }
  };

  private handleOfflineEvent = () => {
    this.prevOnlineState = false;
    this.deviceOnline = false;
    this.updateCurrentStatus(true);

    if (this.userSelectedMode === 'online') {
      this.notify(
        'warning',
        'Device is disconnected from the internet. You can switch to Offline Mode to translate with installed packs.'
      );
    }
  };

  /**
   * Active probe to verify real device connectivity (avoids false navigator.onLine negatives)
   */
  public async verifyRealConnectivity(): Promise<boolean> {
    if (this.simulatedMode === 'offline') {
      this.deviceOnline = false;
      this.updateCurrentStatus(true);
      return false;
    }
    if (this.simulatedMode === 'online') {
      this.deviceOnline = true;
      this.updateCurrentStatus(true);
      return true;
    }

    try {
      this.isCheckingService = true;
      this.notifyDetailedListeners();

      // Probe a fast, high-reliability public endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const probePromise = fetch('https://api.mymemory.translated.net/get?q=test&langpair=en|es', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });

      const res = await probePromise;
      clearTimeout(timeoutId);

      this.deviceOnline = true;
      this.isOnlineServiceReachable = res.ok || res.status === 429 || res.status === 200;
    } catch (_err) {
      // If the primary probe fails, check if the browser actually thinks it is online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.deviceOnline = true;
        // Service might be blocked or rate-limited, but device is online
        this.isOnlineServiceReachable = false;
      } else {
        this.deviceOnline = false;
        this.isOnlineServiceReachable = false;
      }
    } finally {
      this.isCheckingService = false;
      this.lastReachabilityCheck = Date.now();
      this.updateCurrentStatus(true);
    }

    return this.deviceOnline;
  }

  public updateCurrentStatus(shouldNotify: boolean = true) {
    if (this.simulatedMode !== 'auto') {
      this.currentMode = this.simulatedMode;
    } else {
      if (!this.deviceOnline) {
        this.currentMode = 'offline';
      } else if (!this.isOnlineServiceReachable) {
        this.currentMode = 'unstable';
      } else {
        this.currentMode = 'online';
      }
    }

    if (shouldNotify) {
      this.notifyListeners();
      this.notifyDetailedListeners();
    }
  }

  /**
   * User-selected Mode Management (Primary Mode Selection)
   */
  public getUserMode(): UserSelectedMode {
    return this.userSelectedMode;
  }

  public setUserMode(mode: UserSelectedMode) {
    this.userSelectedMode = mode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('linguago_user_mode', mode);
    }

    // Keep legacy routingMode synchronized
    this.routingMode = mode === 'offline' ? 'offline_only' : 'online_only';
    const settings = LocalDB.getSettings();
    settings.userSelectedMode = mode;
    settings.routingMode = this.routingMode;
    LocalDB.saveSettings(settings);

    if (mode === 'offline') {
      this.notify(
        'info',
        'Offline Mode selected — 100% on-device neural translation with 0 cloud calls.'
      );
    } else {
      this.notify(
        'info',
        'Online Mode selected — using high-speed cloud translation services.'
      );
      // Check online provider availability when switching to online mode
      this.verifyRealConnectivity();
    }

    this.notifyListeners();
    this.notifyDetailedListeners();
  }

  public getMode(): NetworkMode {
    return this.currentMode;
  }

  public getRoutingMode(): TranslationRoutingMode {
    return this.routingMode;
  }

  public setRoutingMode(mode: TranslationRoutingMode) {
    this.routingMode = mode;
    if (mode === 'offline_only') {
      this.userSelectedMode = 'offline';
    } else {
      this.userSelectedMode = 'online';
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('linguago_user_mode', this.userSelectedMode);
    }

    const settings = LocalDB.getSettings();
    settings.routingMode = mode;
    settings.userSelectedMode = this.userSelectedMode;
    LocalDB.saveSettings(settings);

    this.notifyListeners();
    this.notifyDetailedListeners();
  }

  public isOffline(): boolean {
    return this.userSelectedMode === 'offline' || this.routingMode === 'offline_only';
  }

  public isDeviceOnline(): boolean {
    if (this.simulatedMode === 'offline') return false;
    if (this.simulatedMode === 'online') return true;
    return this.deviceOnline;
  }

  public isProviderAvailable(): boolean {
    return this.isDeviceOnline() && this.isOnlineServiceReachable;
  }

  public recordOnlineSuccess() {
    this.deviceOnline = true;
    if (!this.isOnlineServiceReachable) {
      this.isOnlineServiceReachable = true;
      this.updateCurrentStatus(true);
    }
  }

  public recordOnlineFailure(reason?: string, isProviderError: boolean = false) {
    if (isProviderError) {
      // Device is online, but the specific translation API had an issue
      this.deviceOnline = true;
      this.isOnlineServiceReachable = false;
    } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.deviceOnline = false;
      this.isOnlineServiceReachable = false;
    } else {
      this.isOnlineServiceReachable = false;
    }

    this.updateCurrentStatus(true);

    if (reason && this.userSelectedMode === 'online') {
      this.notify('warning', reason);
    }
  }

  /**
   * Bounded reachability probe with debounce
   */
  public async checkReachability(force: boolean = false): Promise<boolean> {
    if (this.simulatedMode === 'offline') return false;
    if (this.simulatedMode === 'online') return true;

    const now = Date.now();
    if (!force && now - this.lastReachabilityCheck < 15000) {
      return this.isOnlineServiceReachable;
    }

    if (this.reachabilityCheckInFlight) {
      return this.reachabilityCheckInFlight;
    }

    this.reachabilityCheckInFlight = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('https://api.mymemory.translated.net/get?q=hi&langpair=en|es', {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store'
        });

        clearTimeout(timeoutId);
        this.deviceOnline = true;
        this.isOnlineServiceReachable = res.ok || res.status === 429;
      } catch (_e) {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.deviceOnline = true;
          this.isOnlineServiceReachable = false;
        } else {
          this.deviceOnline = false;
          this.isOnlineServiceReachable = false;
        }
      } finally {
        this.lastReachabilityCheck = Date.now();
        this.reachabilityCheckInFlight = null;
        this.updateCurrentStatus(false);
      }

      return this.isOnlineServiceReachable;
    })();

    return this.reachabilityCheckInFlight;
  }

  /**
   * Get accurate, truthful, descriptive connection and mode status
   */
  public getDetailedStatus(isModelInstalled: boolean = true): DetailedConnectionStatus {
    const isOnlineMode = this.userSelectedMode === 'online';

    if (isOnlineMode) {
      if (this.isCheckingService) {
        return {
          status: 'online_checking',
          label: 'Online Mode — Checking Service',
          detail: 'Checking translation server availability...',
          badge: 'Checking',
          badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dotColor: 'bg-blue-400 animate-pulse',
          accentColor: 'text-blue-400',
          isOnlineMode: true,
          canTranslate: true
        };
      }

      if (!this.isDeviceOnline()) {
        return {
          status: 'online_network_unavailable',
          label: 'Online Mode — Network Unavailable',
          detail: 'No internet connection detected. Switch to Offline Mode to translate with installed packs.',
          badge: 'No Internet',
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dotColor: 'bg-rose-400',
          accentColor: 'text-rose-400',
          isOnlineMode: true,
          canTranslate: false
        };
      }

      if (!this.isOnlineServiceReachable) {
        return {
          status: 'online_service_unavailable',
          label: 'Online Mode — Service Unavailable',
          detail: 'Online translation service is unreachable. You can retry or switch to Offline Mode.',
          badge: 'Service Down',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dotColor: 'bg-amber-400',
          accentColor: 'text-amber-400',
          isOnlineMode: true,
          canTranslate: false
        };
      }

      return {
        status: 'online_service_available',
        label: 'Online Mode — Service Available',
        detail: 'Fast translation with online cloud services ready.',
        badge: 'Cloud Ready',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        dotColor: 'bg-emerald-400',
        accentColor: 'text-cyan-400',
        isOnlineMode: true,
        canTranslate: true
      };
    }

    // OFFLINE MODE
    if (isModelInstalled) {
      return {
        status: 'offline_pack_ready',
        label: 'Offline Mode — Language Pack Ready',
        detail: '100% on-device NLLB-200 neural translation ready (0 cloud calls).',
        badge: 'Pack Ready',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
        accentColor: 'text-emerald-400',
        isOnlineMode: false,
        canTranslate: true
      };
    }

    return {
      status: 'offline_pack_missing',
      label: 'Offline Mode — Language Pack Missing',
      detail: 'This language pair requires installing an offline language pack.',
      badge: 'Pack Missing',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
      accentColor: 'text-amber-400',
      isOnlineMode: false,
      canTranslate: false
    };
  }

  public setSimulatedMode(mode: NetworkMode | 'auto') {
    this.simulatedMode = mode;
    const settings = LocalDB.getSettings();
    settings.simulatedNetwork = mode;
    LocalDB.saveSettings(settings);

    if (mode === 'offline') {
      this.deviceOnline = false;
      this.isOnlineServiceReachable = false;
    } else if (mode === 'online') {
      this.deviceOnline = true;
      this.isOnlineServiceReachable = true;
    }

    this.updateCurrentStatus(true);
  }

  public getSimulatedMode(): NetworkMode | 'auto' {
    return this.simulatedMode;
  }

  public notify(type: ConnectionNotification['type'], message: string) {
    const notif: ConnectionNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type,
      message,
      timestamp: Date.now()
    };

    this.notificationListeners.forEach(listener => {
      try {
        listener(notif);
      } catch (err) {
        console.warn('Error in notification listener:', err);
      }
    });
  }

  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.currentMode);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeNotifications(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  public subscribeDetailed(listener: DetailedStatusListener): () => void {
    this.detailedListeners.add(listener);
    listener(this.getDetailedStatus());
    return () => {
      this.detailedListeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentMode);
      } catch (err) {
        console.warn('Error in network listener:', err);
      }
    });
  }

  private notifyDetailedListeners() {
    const detailed = this.getDetailedStatus();
    this.detailedListeners.forEach(listener => {
      try {
        listener(detailed);
      } catch (err) {
        console.warn('Error in detailed network listener:', err);
      }
    });
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineEvent);
      window.removeEventListener('offline', this.handleOfflineEvent);
    }
    this.listeners.clear();
    this.notificationListeners.clear();
    this.detailedListeners.clear();
  }
}

export const NetworkService = new NetworkServiceManager();
