import React, { useState, useEffect } from 'react';
import { Languages, Download, CheckCircle2, HardDrive, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import type { LanguagePack, LanguageCode } from '../types';
import { LanguagePackManager } from '../services/language_pack_manager';
import { NetworkService } from '../services/network_service';
import { getLanguageRegistryEntry } from '../services/language_registry';

interface LanguageScreenProps {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  onSourceChange: (code: LanguageCode) => void;
  onTargetChange: (code: LanguageCode) => void;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({
  sourceLang: _sourceLang,
  targetLang,
  onSourceChange: _onSourceChange,
  onTargetChange
}) => {
  const [packs, setPacks] = useState<LanguagePack[]>(LanguagePackManager.getPacks());
  const [downloadingCode, setDownloadingCode] = useState<LanguageCode | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const routingMode = NetworkService.getRoutingMode();
  const isDeviceOnline = NetworkService.isDeviceOnline();

  const loadPacks = async () => {
    const updated = await LanguagePackManager.syncInstalledState();
    setPacks(updated);
  };

  useEffect(() => {
    loadPacks();
  }, []);

  const handleDownloadUpdate = async (code: LanguageCode) => {
    if (downloadingCode) return;

    const reg = getLanguageRegistryEntry(code);
    if (reg.offlineStatus === 'unsupported_offline') {
      setErrorText(`${reg.name} is not supported in the on-device offline vocabulary. Switch to Online Mode to translate with full accuracy.`);
      return;
    }

    setDownloadingCode(code);
    setProgress(0);
    setStatusText(`Installing English ↔ ${reg.name} Neural Language Pack...`);
    setErrorText(null);

    try {
      await LanguagePackManager.updatePackVersion(code, (p) => {
        setProgress(p);
        setStatusText(`Installing & Validating Neural Weights: ${p}%`);
      });

      const updated = await LanguagePackManager.syncInstalledState();
      setPacks(updated);
      setStatusText(`English ↔ ${reg.name} Pack Active! Ready for on-device offline translation.`);
      setTimeout(() => setStatusText(''), 4000);
    } catch (err: any) {
      console.error('Download error:', err);
      setErrorText(err?.message || 'Installation failed. Please verify local files.');
    } finally {
      setDownloadingCode(null);
    }
  };

  const handleUninstall = async (code: LanguageCode) => {
    const reg = getLanguageRegistryEntry(code);
    if (confirm(`Remove offline neural model pack for ${reg.name}?`)) {
      await LanguagePackManager.uninstallPack(code);
      const updated = await LanguagePackManager.syncInstalledState();
      setPacks(updated);
      setStatusText(`Language pack removed from active offline storage.`);
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Language Packs Manager
            </h1>
            <p className="text-xs text-slate-400">
              Verified On-Device Neural AI Models (873.2 MB NLLB-200 INT8 ONNX weights).
            </p>
          </div>
        </div>
      </div>

      {/* Global Status Pill */}
      <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800/80 text-xs flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-slate-300">
          <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {routingMode === 'offline_only'
              ? 'Offline Only Active — Installed language packages run 100% locally with zero internet.'
              : isDeviceOnline
              ? 'Auto Mode Active — Cloud online engine ready; installed packs provide instant offline fallback.'
              : 'Device Offline — Translating with installed offline language packages.'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorText && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Success / Status Message */}
      {statusText && !errorText && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>{statusText}</span>
        </div>
      )}

      {/* Language Packs List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Supported Languages & Model Status ({packs.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            M2M-100 Architecture
          </span>
        </div>

        <div className="space-y-2.5">
          {packs.map((pack) => {
            const isDownloading = downloadingCode === pack.code;
            const reg = getLanguageRegistryEntry(pack.code);
            const isUnsupported = reg.offlineStatus === 'unsupported_offline';

            return (
              <div
                key={pack.id}
                className="p-4 rounded-2xl bg-[#0c1322] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {reg.name}
                      </span>
                      <span className="text-xs text-amber-400 font-medium font-serif">
                        • {reg.nativeName}
                      </span>

                      {/* Offline Verification Status Badge */}
                      {isUnsupported ? (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Online Cloud Only
                        </span>
                      ) : pack.isInstalled ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Offline Ready (AI)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          Pack Available
                        </span>
                      )}

                      {/* Active target language indicator */}
                      {pack.code === targetLang ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Active Target
                        </span>
                      ) : (
                        <button
                          onClick={() => onTargetChange(pack.code)}
                          className="text-[10px] text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors cursor-pointer"
                        >
                          Select as Target
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {reg.family} • Word Order: <strong className="text-slate-300">{reg.wordOrder}</strong> • Script: {reg.script}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>Size: {isUnsupported ? 'Cloud Only' : `${pack.sizeMb} MB`}</span>
                      <span>•</span>
                      <span>Directions: en ⇄ {pack.code}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="shrink-0">
                    {isUnsupported ? (
                      <span className="text-xs text-slate-500 font-medium px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                        Cloud Mode
                      </span>
                    ) : pack.isInstalled ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUninstall(pack.code)}
                          title="Remove model from cache"
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors cursor-pointer"
                          aria-label={`Uninstall ${reg.name} package`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-emerald-400 font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                        </span>
                      </div>
                    ) : (
                      <button
                        disabled={isDownloading}
                        onClick={() => handleDownloadUpdate(pack.code)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Installing...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Install Pack</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Download Progress Bar */}
                {isDownloading && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] text-indigo-300 font-mono font-medium">
                      <span>Validating ONNX weights...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
