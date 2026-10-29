import React, { useState, useEffect } from 'react';
import { Settings, Shield, Wifi, EyeOff, Cpu, Check, Trash2, HardDrive, RefreshCw } from 'lucide-react';
import type { UserSettings, TranslationRoutingMode, NetworkMode } from '../types';
import { LocalDB } from '../database/local_db';
import { NetworkService } from '../services/network_service';
import { ModelCacheManager } from '../services/model_cache_manager';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(LocalDB.getSettings());
  const [routingMode, setRoutingMode] = useState<TranslationRoutingMode>(NetworkService.getRoutingMode());
  const [isDeviceOnline, setIsDeviceOnline] = useState<boolean>(NetworkService.isDeviceOnline());
  const [isModelInstalled, setIsModelInstalled] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [cacheClearedNotice, setCacheClearedNotice] = useState(false);

  useEffect(() => {
    ModelCacheManager.isModelInstalled().then(setIsModelInstalled);

    const unsubscribe = NetworkService.subscribe(() => {
      setRoutingMode(NetworkService.getRoutingMode());
      setIsDeviceOnline(NetworkService.isDeviceOnline());
    });

    return unsubscribe;
  }, []);

  const handleRoutingModeChange = (mode: TranslationRoutingMode) => {
    NetworkService.setRoutingMode(mode);
    setRoutingMode(mode);
    const updated = { ...settings, routingMode: mode };
    setSettings(updated);
    showNotice();
  };

  const handleNetworkSimChange = (mode: NetworkMode | 'auto') => {
    const updated = { ...settings, simulatedNetwork: mode };
    setSettings(updated);
    NetworkService.setSimulatedMode(mode);
    showNotice();
  };

  const handleToggleAnalytics = () => {
    const updated = { ...settings, allowAnalytics: !settings.allowAnalytics };
    setSettings(updated);
    LocalDB.saveSettings(updated);
    showNotice();
  };

  const handleClearHistory = () => {
    if (confirm('Clear all translation history and local cache?')) {
      LocalDB.clearHistory();
      setCacheClearedNotice(true);
      setTimeout(() => setCacheClearedNotice(false), 2500);
    }
  };

  const showNotice = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">
                Settings & Connectivity
              </h1>
              <p className="text-xs text-slate-400">
                Translation routing, offline readiness, privacy and local cache.
              </p>
            </div>
          </div>

          {savedNotice && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* 1. Primary Translation Engine Routing Mode */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Translation Engine Routing Mode
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
            Active: {routingMode.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Choose how LinguaGo selects the translation engine. Automatic mode ensures seamless translation even when you lose connectivity abroad.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Auto Mode */}
          <button
            onClick={() => handleRoutingModeChange('auto')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              routingMode === 'auto'
                ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                : 'bg-[#080d19] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-400">Auto (Recommended)</span>
              {routingMode === 'auto' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Uses cloud online API when reachable; automatically falls back to installed offline model when offline.
            </p>
          </button>

          {/* Offline Only */}
          <button
            onClick={() => handleRoutingModeChange('offline_only')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              routingMode === 'offline_only'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                : 'bg-[#080d19] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-400">Offline Only</span>
              {routingMode === 'offline_only' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              100% on-device neural execution. Zero cloud requests are ever sent. Strictly private.
            </p>
          </button>

          {/* Online Only */}
          <button
            onClick={() => handleRoutingModeChange('online_only')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              routingMode === 'online_only'
                ? 'bg-blue-500/15 border-blue-500/50 text-white shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30'
                : 'bg-[#080d19] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-blue-400">Online Only</span>
              {routingMode === 'online_only' && <Check className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Always translates via cloud API. Requires an active network connection.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Live Diagnostics & Hardware Status */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          System & Engine Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-[#080d19] border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium">Device Network Status:</span>
            </div>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
              isDeviceOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              {isDeviceOnline ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#080d19] border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium">On-Device Model Cache:</span>
            </div>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
              isModelInstalled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
            }`}>
              {isModelInstalled ? 'READY (630 MB)' : 'NOT LOADED'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Developer & Tester Network Simulator */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-amber-400" />
          Network Test Mode Simulator
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Simulate airplane mode or network blackouts without disconnecting your physical Wi-Fi:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold pt-1">
          <button
            onClick={() => handleNetworkSimChange('auto')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              settings.simulatedNetwork === 'auto'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-[#080d19] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Auto System
          </button>

          <button
            onClick={() => handleNetworkSimChange('offline')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              settings.simulatedNetwork === 'offline'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-[#080d19] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Force Offline
          </button>

          <button
            onClick={() => handleNetworkSimChange('online')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              settings.simulatedNetwork === 'online'
                ? 'bg-blue-950 border-blue-500 text-blue-300'
                : 'bg-[#080d19] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Force Online
          </button>

          <button
            onClick={() => handleNetworkSimChange('unstable')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              settings.simulatedNetwork === 'unstable'
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-[#080d19] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Simulate Drop
          </button>
        </div>
      </div>

      {/* 4. Privacy & Data Storage Controls */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Privacy & Storage Controls
        </h2>

        <div className="p-3.5 rounded-2xl bg-[#080d19] border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white">Share Anonymous Diagnostics</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Helps improve on-device neural model latency metrics.</p>
            </div>
            <button
              onClick={handleToggleAnalytics}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.allowAnalytics ? 'bg-amber-500' : 'bg-slate-800'
              }`}
              aria-label="Toggle anonymous diagnostics"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.allowAnalytics ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white">Clear Local Translation History</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Deletes all saved history records and reset cache.</p>
            </div>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {cacheClearedNotice && (
            <p className="text-xs text-emerald-400 font-medium">Local history cleared successfully.</p>
          )}

          <div className="p-2.5 rounded-xl bg-[#0c1322] border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <strong className="block text-slate-300 font-bold flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Guaranteed Privacy Protection:
            </strong>
            <p className="text-slate-400 leading-relaxed">
              LinguaGo never stores your personal travel translations, voice recordings, or emergency cards on external servers. In Offline Only mode, zero bytes leave your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
