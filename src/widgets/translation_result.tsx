import React, { useState } from 'react';
import { Volume2, Copy, Share2, Star, Check, Sparkles, AlertCircle, RotateCcw, Activity } from 'lucide-react';
import type { TranslationResult as TResult } from '../services/translation_engine';
import { SpeechService } from '../services/speech_service';
import { getLanguageByCode } from '../models/language';
import { PronunciationCoachModal } from './pronunciation_coach_modal';

interface TranslationResultProps {
  result: TResult | null;
  originalText: string;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  onRetry?: () => void;
}

export const TranslationResultCard: React.FC<TranslationResultProps> = ({
  result,
  originalText,
  onToggleFavorite,
  isFavorite = false,
  onRetry
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  if (!result) return null;

  const targetLangMeta = getLanguageByCode(result.targetLang);
  const sourceLangMeta = getLanguageByCode(result.sourceLang);
  const isUrdu = result.targetLang === 'ur' || result.targetLang === 'ar';

  if (result.error) {
    return (
      <div className="w-full rounded-2xl bg-rose-950/30 border border-rose-500/30 p-4 shadow-xl space-y-3 text-rose-200 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Translation Unavailable</span>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>

        <p className="text-xs leading-relaxed font-medium text-rose-100">
          {result.error}
        </p>
      </div>
    );
  }

  if (!result.translatedText) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    SpeechService.speak(result.translatedText, result.targetLang, () => {
      setIsSpeaking(false);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LinguaGo Translation',
        text: `${originalText} ➔ ${result.translatedText} (${targetLangMeta.name})`
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const isLocal = result.isOffline !== false && !result.engineUsed.toLowerCase().includes('cloud');
  const isFallback = result.engineUsed.toLowerCase().includes('fallback');
  const isEmergencyDb = result.engineUsed.toLowerCase().includes('phrase') || result.engineUsed.toLowerCase().includes('emergency');
  const isLocalNeural = isLocal && !isEmergencyDb;

  return (
    <>
      <div className="w-full rounded-2xl bg-[#0f172a] border border-slate-700/60 p-4.5 shadow-xl space-y-3.5 animate-in fade-in duration-200">
        {/* Header Telemetry Badge */}
        <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{result.engineUsed}</span>
            </span>

            {result.durationMs !== undefined && result.durationMs > 0 && (
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                ({result.durationMs}ms)
              </span>
            )}
          </div>

          <div className="shrink-0 ml-2">
            {isFallback ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] border border-amber-500/30 font-bold">
                Offline Auto-Fallback
              </span>
            ) : isLocalNeural ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/30 font-bold">
                100% Offline Neural AI
              </span>
            ) : isEmergencyDb ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] border border-amber-500/30 font-bold">
                Offline Phrasebook
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/30 font-bold">
                Cloud Online API
              </span>
            )}
          </div>
        </div>

        {/* Original Text Reference */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {sourceLangMeta.name} ({sourceLangMeta.nativeName})
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {originalText}
          </p>
        </div>

        {/* Translated Target Text */}
        <div className="pt-1 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {targetLangMeta.name} ({targetLangMeta.nativeName})
          </span>
          <div
            dir={isUrdu ? 'rtl' : 'ltr'}
            className={`text-lg sm:text-xl font-bold text-white tracking-wide leading-relaxed selection:bg-amber-500 selection:text-slate-950 ${
              isUrdu ? 'font-serif text-right leading-loose' : ''
            }`}
          >
            {result.translatedText}
          </div>

          {result.phoneticText && (
            <p className="text-xs text-slate-400 font-serif italic pt-0.5">
              "{result.phoneticText}"
            </p>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            {/* Speak Button */}
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              title="Pronounce translation"
              className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
              }`}
              aria-label="Speak translated text"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer active:scale-90"
              aria-label="Copy translated text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Pronunciation Practice Coach Button */}
            <button
              onClick={() => setIsCoachOpen(true)}
              title="Practice Pronunciation"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              aria-label="Practice pronunciation"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Practice</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Share Button */}
            <button
              onClick={handleShare}
              title="Share translation"
              className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer active:scale-90"
              aria-label="Share translation"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Favorite Star Button */}
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                  isFavorite
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-amber-400 border-slate-800'
                }`}
                aria-label={isFavorite ? 'Saved as favorite' : 'Save as favorite'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pronunciation Practice Modal */}
      <PronunciationCoachModal
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        targetLang={result.targetLang}
        initialText={result.translatedText}
        initialEnglishText={originalText}
      />
    </>
  );
};
