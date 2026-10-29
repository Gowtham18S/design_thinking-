import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, HardDrive, Check, ChevronDown } from 'lucide-react';
import { NetworkService } from '../services/network_service';
import { ModelCacheManager } from '../services/model_cache_manager';
import type { TranslationRoutingMode } from '../types';

export interface ModeIndicatorProps {
  onOpenNetworkSettings?: () => void;
  isModelInstalled?: boolean;
  isInstalling?: boolean;
  hasTranslationFailed?: boolean;
  onInstallClick?: () => void;
  onModeChange?: (mode: TranslationRoutingMode) => void;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  onOpenNetworkSettings: _onOpenNetworkSettings,
  isModelInstalled: propIsModelInstalled,
  isInstalling: _isInstalling = false,
  hasTranslationFailed: _hasTranslationFailed = false,
  onInstallClick: _onInstallClick,
  onModeChange
}) => {
  const [routingMode, setRoutingMode] = useState<TranslationRoutingMode>(NetworkService.getRoutingMode());
  const [internalModelInstalled, setInternalModelInstalled] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkService.subscribe(() => {
      setRoutingMode(NetworkService.getRoutingMode());
    });

    if (propIsModelInstalled === undefined) {
      ModelCacheManager.isModelInstalled().then(setInternalModelInstalled);
    }

    return unsubscribe;
  }, [propIsModelInstalled]);

  const modelInstalled = propIsModelInstalled !== undefined ? propIsModelInstalled : internalModelInstalled;
  const isDeviceOnline = NetworkService.isDeviceOnline();

  const handleSelectMode = (mode: TranslationRoutingMode) => {
    NetworkService.setRoutingMode(mode);
    setRoutingMode(mode);
    setIsDropdownOpen(false);
    if (onModeChange) onModeChange(mode);
  };

  // Determine current active routing state
  const getRoutingDetails = () => {
    if (routingMode === 'offline_only') {
      return {
        badge: 'Offline Only',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
        icon: <HardDrive className="w-3.5 h-3.5 text-emerald-400" />,
        label: '100% On-Device Neural AI',
        detail: modelInstalled ? 'Pack installed & verified' : 'Language pack needed',
        accentColor: 'text-emerald-400'
      };
    }

    if (routingMode === 'online_only') {
      return {
        badge: 'Online Only',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dotColor: isDeviceOnline ? 'bg-blue-400' : 'bg-rose-400',
        icon: <Cloud className="w-3.5 h-3.5 text-blue-400" />,
        label: isDeviceOnline ? 'Cloud Translation Active' : 'No Connection',
        detail: isDeviceOnline ? 'Cloud translation service ready' : 'Connect to a network',
        accentColor: isDeviceOnline ? 'text-blue-400' : 'text-rose-400'
      };
    }

    // Default: AUTO MODE
    if (!isDeviceOnline) {
      return {
        badge: 'Auto: Offline',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-400',
        icon: <WifiOff className="w-3.5 h-3.5 text-amber-400" />,
        label: 'Offline Fallback Active',
        detail: modelInstalled ? 'Using installed language pack' : 'Install pack for offline use',
        accentColor: 'text-amber-400'
      };
    }

    return {
      badge: 'Auto: Online',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      dotColor: 'bg-emerald-400',
      icon: <Wifi className="w-3.5 h-3.5 text-indigo-400" />,
      label: 'Intelligent Auto-Switching',
      detail: modelInstalled ? 'Cloud active • Offline AI ready' : 'Cloud active',
      accentColor: 'text-indigo-300'
    };
  };

  const current = getRoutingDetails();

  return (
    <div className="relative rounded-2xl bg-[#0e1628] border border-slate-800/80 p-3 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Engine Status Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800">
            {current.icon}
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${current.dotColor} ring-2 ring-[#0e1628]`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {current.label}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border font-semibold shrink-0 ${current.badgeColor}`}>
                {current.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {current.detail}
            </p>
          </div>
        </div>

        {/* Right: Compact Mode Switcher Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all cursor-pointer active:scale-95 shadow-sm"
            aria-expanded={isDropdownOpen}
            aria-label="Change translation routing mode"
          >
            <span className="capitalize">{routingMode.replace('_', ' ')}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-[#11192e] border border-slate-700/80 shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Translation Mode
                </div>

                <button
                  onClick={() => handleSelectMode('auto')}
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    routingMode === 'auto'
                      ? 'bg-amber-500/15 text-amber-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <span className="block font-medium">Auto (Recommended)</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Cloud first, falls back to offline</span>
                  </div>
                  {routingMode === 'auto' && <Check className="w-4 h-4 text-amber-400" />}
                </button>

                <button
                  onClick={() => handleSelectMode('offline_only')}
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    routingMode === 'offline_only'
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <span className="block font-medium">Offline Only</span>
                    <span className="block text-[10px] text-slate-400 font-normal">100% on-device, 0 network calls</span>
                  </div>
                  {routingMode === 'offline_only' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleSelectMode('online_only')}
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    routingMode === 'online_only'
                      ? 'bg-blue-500/15 text-blue-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <span className="block font-medium">Online Only</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Cloud translation API only</span>
                  </div>
                  {routingMode === 'online_only' && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
