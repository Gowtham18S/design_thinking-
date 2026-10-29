import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  History,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRightLeft,
  X,
  ClipboardPaste,
  CheckCircle2,
  WifiOff,
  Cloud,
  HardDrive,
  Download,
  Camera,
  MessageSquare,
  Volume2,
  Copy,
  Check,
  Languages,
  Radio,
  ArrowRight
} from 'lucide-react';
import type {
  LanguageCode,
  CategoryType,
  HistoryItem,
  ConnectionNotification,
  UserSelectedMode,
  DetailedConnectionStatus
} from '../types';
import { LanguageSelector } from '../widgets/language_selector';
import { TranslationResultCard } from '../widgets/translation_result';
import { TranslationEngine } from '../services/translation_engine';
import type { TranslationResult } from '../services/translation_engine';
import { LocalDB } from '../database/local_db';
import { AudioRecorderModal } from '../widgets/audio_recorder_modal';
import { getLanguageByCode } from '../models/language';
import { NetworkService } from '../services/network_service';
import { ModelCacheManager } from '../services/model_cache_manager';
import { LanguagePackManager } from '../services/language_pack_manager';
import { isPairSupportedOffline } from '../services/language_registry';
import { LanguageDetector } from '../services/language_detector';
import { SpeechService } from '../services/speech_service';
import { MultilingualGlobeHero } from '../widgets/multilingual_globe_hero';

interface HomeScreenProps {
  onNavigate: (screen: string, category?: CategoryType) => void;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  onSourceChange: (lang: LanguageCode) => void;
  onTargetChange: (lang: LanguageCode) => void;
  onSwapLanguages: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwapLanguages
}) => {
  const [inputText, setInputText] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMicOpen, setIsMicOpen] = useState(false);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>(LocalDB.getHistory().slice(0, 4));
  const [isModelInstalled, setIsModelInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStage, setInstallStage] = useState('');
  const [installError, setInstallError] = useState<string | null>(null);
  const [activeNotification, setActiveNotification] = useState<ConnectionNotification | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User-selected mode state ('online' | 'offline')
  const [userMode, setUserModeState] = useState<UserSelectedMode>(NetworkService.getUserMode());
  const [detailedStatus, setDetailedStatus] = useState<DetailedConnectionStatus>(
    NetworkService.getDetailedStatus(true)
  );

  const latestRequestIdRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const srcMeta = getLanguageByCode(sourceLang);
  const tgtMeta = getLanguageByCode(targetLang);
  const pairSupport = isPairSupportedOffline(sourceLang, targetLang);

  // Subscribe to connection notifications and detailed status
  useEffect(() => {
    const unsubscribeNotifs = NetworkService.subscribeNotifications((notif) => {
      setActiveNotification(notif);
      const timer = setTimeout(() => {
        setActiveNotification(prev => (prev?.id === notif.id ? null : prev));
      }, 5000);
      return () => clearTimeout(timer);
    });

    const unsubscribeDetailed = NetworkService.subscribeDetailed((status) => {
      setDetailedStatus(status);
      setUserModeState(NetworkService.getUserMode());
    });

    return () => {
      unsubscribeNotifs();
      unsubscribeDetailed();
    };
  }, []);

  const checkInstalled = async (lang: LanguageCode = targetLang) => {
    const installed = await ModelCacheManager.isModelInstalled(lang);
    setIsModelInstalled(installed);
    setDetailedStatus(NetworkService.getDetailedStatus(installed));
  };

  useEffect(() => {
    checkInstalled(targetLang);
  }, [sourceLang, targetLang, userMode]);

  // Language auto-detection for input
  const detected = inputText.trim().length > 3 ? LanguageDetector.detectLanguage(inputText, sourceLang) : null;
  const showDetectionNotice = detected && detected.detectedLang !== sourceLang && detected.confidence > 0.9;

  const handleSelectUserMode = (mode: UserSelectedMode) => {
    NetworkService.setUserMode(mode);
    setUserModeState(mode);
    setDetailedStatus(NetworkService.getDetailedStatus(isModelInstalled));
  };

  const handleInstallPack = async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    setInstallProgress(0);
    setInstallStage(`Preparing English ↔ ${tgtMeta.name} NLLB-200 Language Pack...`);
    setInstallError(null);

    try {
      await LanguagePackManager.updatePackVersion(targetLang, (p) => {
        setInstallProgress(p);
        if (p < 30) {
          setInstallStage(`Validating model configuration & tokenizer (${p}%)...`);
        } else if (p < 80) {
          setInstallStage(`Installing INT8 ONNX neural encoder & decoder (${p}%)...`);
        } else {
          setInstallStage(`Verifying on-device neural integrity (${p}%)...`);
        }
      });

      await checkInstalled(targetLang);
      setInstallStage(`English ↔ ${tgtMeta.name} Pack Ready!`);
      NetworkService.notify('success', `English ↔ ${tgtMeta.name} language pack is now installed and ready.`);
      setTimeout(() => setInstallStage(''), 3000);
    } catch (e: any) {
      console.error('Installation error:', e);
      setInstallError(e?.message || 'Failed to install language pack. Please check local files.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleTranslate = async (textToTranslate?: string, overrideMode?: UserSelectedMode) => {
    const text = textToTranslate !== undefined ? textToTranslate : inputText;
    if (!text.trim() || isTranslating) return;

    const currentMode = overrideMode || userMode;

    // In offline mode with missing model, trigger pack install
    if (currentMode === 'offline' && !isModelInstalled && pairSupport.isSupported) {
      handleInstallPack();
      return;
    }

    // Cancel any previous in-flight request to prevent race conditions
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const currentAbortController = new AbortController();
    activeAbortControllerRef.current = currentAbortController;

    const currentRequestId = ++latestRequestIdRef.current;
    setIsTranslating(true);

    try {
      const result = await TranslationEngine.translate(
        text,
        sourceLang,
        targetLang,
        currentAbortController.signal
      );

      if (currentRequestId !== latestRequestIdRef.current) {
        return;
      }

      setTranslationResult(result);
      setIsFavorite(false);

      if (result.translatedText && !result.error) {
        LocalDB.saveHistoryItem({
          originalText: text,
          sourceLang,
          translatedText: result.translatedText,
          targetLang,
          category: 'custom',
          isFavorite: false
        });

        setRecentHistory(LocalDB.getHistory().slice(0, 4));
      }
    } catch (e: any) {
      if (currentRequestId !== latestRequestIdRef.current) return;
      if (e?.name === 'AbortError') return;

      console.error('Translation error:', e);
      setTranslationResult({
        translatedText: '',
        sourceLang,
        targetLang,
        confidence: 0,
        isExactMatch: false,
        engineUsed: 'Translation Engine',
        error: e?.message || 'An unexpected error occurred during translation.'
      });
    } finally {
      if (currentRequestId === latestRequestIdRef.current) {
        setIsTranslating(false);
      }
    }
  };

  const handleSwap = () => {
    onSwapLanguages();
    if (translationResult && translationResult.translatedText) {
      const oldTranslated = translationResult.translatedText;
      setInputText(oldTranslated);
      setTranslationResult(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
      }
    } catch {
      // Clipboard access denied
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslationResult(null);
  };

  const handleCopyHistory = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSpeakText = (text: string, lang: LanguageCode) => {
    SpeechService.speak(text, lang);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Dynamic Non-Intrusive Connection Notification Banner */}
      {activeNotification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-2xl transition-all animate-in slide-in-from-top-2 duration-200 ${
            activeNotification.type === 'warning'
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
              : activeNotification.type === 'offline_fallback'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : activeNotification.type === 'success'
              ? 'bg-blue-950/80 border-cyan-500/50 text-cyan-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {activeNotification.type === 'warning' ? (
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            ) : activeNotification.type === 'offline_fallback' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : activeNotification.type === 'success' ? (
              <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-semibold">{activeNotification.message}</span>
          </div>

          <button
            onClick={() => setActiveNotification(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HERO SECTION — GLOWING 3D MULTILINGUAL GLOBE & TRAVEL SCENERY
          ========================================================================= */}
      <MultilingualGlobeHero
        onSelectGreeting={(text, langCode) => {
          setInputText(text);
          onTargetChange(langCode);
          handleTranslate(text);
        }}
      />

      {/* =========================================================================
          SECTION 2: TWO LARGE, PROMINENT MODE-SELECTION BUTTONS (MANDATORY)
          ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Select Translation Mode
          </h2>
          <span className="text-[11px] text-slate-400">
            Active: <strong className="text-white capitalize">{userMode} Mode</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Online Mode */}
          <button
            onClick={() => handleSelectUserMode('online')}
            className={`group relative p-5 rounded-3xl text-left transition-all cursor-pointer border text-slate-100 overflow-hidden ${
              userMode === 'online'
                ? 'bg-gradient-to-br from-[#0b1d3a] via-[#09152b] to-[#071021] border-cyan-400 shadow-2xl shadow-cyan-500/15 ring-2 ring-cyan-500/30'
                : 'bg-[#0a1122]/70 hover:bg-[#0c162c] border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
            aria-pressed={userMode === 'online'}
          >
            {/* Glow accent */}
            {userMode === 'online' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                <Cloud className="w-6 h-6" />
              </div>

              {/* Status Radio Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  userMode === 'online'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    userMode === 'online' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span>{userMode === 'online' ? 'Active Mode' : 'Select'}</span>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white group-hover:text-cyan-200 transition-colors">
                  Online Mode
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60">
                  Internet required
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fast translation with online services.
              </p>
            </div>

            {/* Sub-label connectivity health indicator */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    detailedStatus.isOnlineMode && detailedStatus.canTranslate
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                />
                Cloud Provider Status:
              </span>
              <span
                className={`font-semibold ${
                  detailedStatus.isOnlineMode && detailedStatus.canTranslate
                    ? 'text-cyan-300'
                    : 'text-amber-300'
                }`}
              >
                {detailedStatus.isOnlineMode ? detailedStatus.badge : 'Available'}
              </span>
            </div>
          </button>

          {/* Card 2: Offline Mode */}
          <button
            onClick={() => handleSelectUserMode('offline')}
            className={`group relative p-5 rounded-3xl text-left transition-all cursor-pointer border text-slate-100 overflow-hidden ${
              userMode === 'offline'
                ? 'bg-gradient-to-br from-[#1b122e] via-[#140d24] to-[#0a0714] border-amber-400 shadow-2xl shadow-amber-500/15 ring-2 ring-amber-500/30'
                : 'bg-[#0a1122]/70 hover:bg-[#0c162c] border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
            aria-pressed={userMode === 'offline'}
          >
            {/* Glow accent */}
            {userMode === 'offline' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 group-hover:scale-105 transition-transform">
                <HardDrive className="w-6 h-6" />
              </div>

              {/* Status Radio Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  userMode === 'offline'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    userMode === 'offline' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span>{userMode === 'offline' ? 'Active Mode' : 'Select'}</span>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white group-hover:text-amber-200 transition-colors">
                  Offline Mode
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 font-bold border border-amber-800/60">
                  Uses installed packs
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Translate without an internet connection.
              </p>
            </div>

            {/* Sub-label model health indicator */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isModelInstalled ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                On-Device Engine:
              </span>
              <span
                className={`font-semibold ${
                  isModelInstalled ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {isModelInstalled ? 'NLLB-200 Ready' : 'Pack Required'}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: REDESIGNED TRANSLATION WORKSPACE
          ========================================================================= */}
      <section className="relative p-5 sm:p-6 rounded-3xl bg-[#0a1020]/90 backdrop-blur-xl border border-slate-800 shadow-2xl space-y-4">
        {/* Workspace Mode & Health Status Banner */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border text-xs ${
            userMode === 'online'
              ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${detailedStatus.dotColor}`}
            />
            <span className="font-bold text-white">{detailedStatus.label}</span>
            <span className="text-[11px] text-slate-300 hidden sm:inline">
              — {detailedStatus.detail}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${detailedStatus.badgeColor}`}
            >
              {detailedStatus.badge}
            </span>

            {/* Quick Toggle Mode */}
            <button
              onClick={() => handleSelectUserMode(userMode === 'online' ? 'offline' : 'online')}
              className="text-[11px] font-bold text-slate-300 hover:text-white underline cursor-pointer"
            >
              Switch to {userMode === 'online' ? 'Offline' : 'Online'}
            </button>
          </div>
        </div>

        {/* Offline Missing Model Alert if in Offline Mode */}
        {userMode === 'offline' && !isModelInstalled && pairSupport.isSupported && (
          <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                The <strong>{tgtMeta.name}</strong> offline model is not installed yet.
              </span>
            </div>
            <button
              onClick={handleInstallPack}
              disabled={isInstalling}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs hover:bg-amber-400 transition-colors cursor-pointer shrink-0"
            >
              {isInstalling ? 'Installing...' : `Install ${tgtMeta.name} Pack`}
            </button>
          </div>
        )}

        {/* Language Pair Selectors with Swap */}
        <div className="pb-1">
          <LanguageSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={onSourceChange}
            onTargetChange={onTargetChange}
            onSwap={handleSwap}
          />
        </div>

        {/* Language Auto-Detection Notice */}
        {showDetectionNotice && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200">
            <span>
              Detected input language:{' '}
              <strong>{getLanguageByCode(detected.detectedLang).name}</strong>
            </span>
            <button
              onClick={() => onSourceChange(detected.detectedLang)}
              className="px-2.5 py-1 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" /> Switch Source
            </button>
          </div>
        )}

        {/* Large Textarea with Integrated Bottom Controls */}
        <div className="relative rounded-2xl bg-[#060b17] border border-slate-800 focus-within:border-cyan-500/80 transition-colors shadow-inner">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type text in ${srcMeta.name} (${srcMeta.nativeName}) to translate...`}
            rows={4}
            className="w-full p-4 pr-12 pb-12 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none font-medium leading-relaxed"
          />

          {/* Integrated Bottom Toolbar inside Textarea */}
          <div className="absolute bottom-2.5 left-3.5 right-3 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500 font-mono">
              {inputText.length > 0 ? `${inputText.length} characters` : ''}
            </span>

            <div className="flex items-center gap-1.5">
              {inputText.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Clear input text"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Clear input text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handlePaste}
                title="Paste from clipboard"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Paste text from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMicOpen(true)}
                title="Speak phrase using microphone"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                aria-label="Record voice speech"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Voice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Installation Progress Banner */}
        {isInstalling && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                {installStage || 'Installing model files...'}
              </span>
              <span className="font-mono text-indigo-400 font-bold">{installProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${installProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Installation Error Banner */}
        {installError && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{installError}</span>
          </div>
        )}

        {/* Prominent Translate Action Button */}
        <button
          disabled={isTranslating || !inputText.trim()}
          onClick={() => handleTranslate()}
          className={`w-full py-4 rounded-2xl font-extrabold text-sm shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            userMode === 'online'
              ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white shadow-cyan-500/20'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-amber-500/20'
          }`}
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating in {userMode === 'online' ? 'Online Mode' : 'Offline Mode'}...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {userMode === 'online'
                  ? `Translate Online (${srcMeta.name} ➔ ${tgtMeta.name})`
                  : `Translate Offline with NLLB-200 (${srcMeta.name} ➔ ${tgtMeta.name})`}
              </span>
            </>
          )}
        </button>

        {/* Translation Output Card */}
        {translationResult && (
          <div className="space-y-3 pt-1">
            <TranslationResultCard
              result={translationResult}
              originalText={inputText}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite(!isFavorite)}
              onRetry={() => handleTranslate()}
            />

            {/* Offline Fallback helper button if Online translation experienced an issue */}
            {translationResult.error && userMode === 'online' && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                <span>Online service unavailable? Try with installed local pack:</span>
                <button
                  onClick={() => {
                    handleSelectUserMode('offline');
                    handleTranslate(inputText, 'offline');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold cursor-pointer transition-colors"
                >
                  Switch to Offline Mode
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 4: FEATURE CARDS BELOW THE TRANSLATOR
          ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Travel Intelligence Features
          </h2>
          <span className="text-[11px] text-slate-400">Available across LinguaGo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Feature 1: Camera OCR */}
          <button
            onClick={() => onNavigate('camera')}
            className="p-4 rounded-3xl bg-[#0a1020]/80 hover:bg-[#0d162a] border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                Online + Offline
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-white mt-3 group-hover:text-cyan-200 transition-colors">
              Camera OCR
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Scan menus, road signs, and notices using camera or photo upload.
            </p>
          </button>

          {/* Feature 2: Live Talk */}
          <button
            onClick={() => onNavigate('conversation')}
            className="p-4 rounded-3xl bg-[#0a1020]/80 hover:bg-[#0d162a] border border-slate-800 hover:border-violet-500/40 text-left transition-all cursor-pointer group shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/25 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 font-bold border border-violet-800">
                Two-Way
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-white mt-3 group-hover:text-violet-200 transition-colors">
              Live Talk
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Real-time bilingual conversation mode for speaking with locals.
            </p>
          </button>

          {/* Feature 3: Pronunciation Coach */}
          <button
            onClick={() => onNavigate('coach')}
            className="p-4 rounded-3xl bg-[#0a1020]/80 hover:bg-[#0d162a] border border-slate-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer group shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                AI Coach
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-white mt-3 group-hover:text-emerald-200 transition-colors">
              Pronunciation Coach
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Interactive voice accuracy scoring and pronunciation practice.
            </p>
          </button>

          {/* Feature 4: Language Packs */}
          <button
            onClick={() => onNavigate('languages')}
            className="p-4 rounded-3xl bg-[#0a1020]/80 hover:bg-[#0d162a] border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/25 group-hover:scale-110 transition-transform">
                <Languages className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold border border-amber-800">
                873 MB NLLB
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-white mt-3 group-hover:text-amber-200 transition-colors">
              Language Packs
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Download and verify high-accuracy offline models for travel.
            </p>
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: RECENT TRANSLATIONS SECTION
          ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-400" />
            Recent Translations
          </h2>

          {recentHistory.length > 0 && (
            <button
              onClick={() => onNavigate('history')}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>View All History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentHistory.length > 0 ? (
          <div className="space-y-2.5">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#0a1020] border border-slate-800 hover:border-slate-700 transition-all text-xs flex items-center justify-between gap-3 group"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    setInputText(item.originalText);
                    handleTranslate(item.originalText);
                  }}
                  title="Click to reload into translator"
                >
                  <p className="text-slate-300 font-medium truncate group-hover:text-white transition-colors">
                    {item.originalText}
                  </p>
                  <p className="text-cyan-300 font-semibold truncate mt-0.5">
                    {item.translatedText}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md uppercase font-mono">
                    {item.sourceLang} ➔ {item.targetLang}
                  </span>

                  {/* Listen action */}
                  <button
                    onClick={() => handleSpeakText(item.translatedText, item.targetLang)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Listen to translation"
                    aria-label="Listen to translation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Copy action */}
                  <button
                    onClick={() => handleCopyHistory(item.translatedText, item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Copy translated text"
                    aria-label="Copy translated text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#0a1020]/60 border border-slate-800/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mx-auto flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300 font-semibold">No recent translations yet.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Your translated sentences will be stored locally on your device for instant offline travel recall.
            </p>
          </div>
        )}
      </section>

      {/* Voice Recorder Modal */}
      <AudioRecorderModal
        isOpen={isMicOpen}
        sourceLang={sourceLang}
        onClose={() => setIsMicOpen(false)}
        onSpeechRecognized={(text) => {
          setInputText(text);
          handleTranslate(text);
        }}
      />
    </div>
  );
};
