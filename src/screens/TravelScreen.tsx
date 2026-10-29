import React, { useState } from 'react';
import { Plane, Navigation, Volume2, Copy, Check } from 'lucide-react';
import type { LanguageCode, PhraseItem } from '../types';
import { OFFLINE_PRESET_PHRASES } from '../database/phrase_database';
import { SpeechService } from '../services/speech_service';
import { LanguageSelector } from '../widgets/language_selector';
import { getLanguageByCode } from '../models/language';
import { LocalDB } from '../database/local_db';

interface TravelScreenProps {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  onSourceChange: (lang: LanguageCode) => void;
  onTargetChange: (lang: LanguageCode) => void;
  onSwapLanguages: () => void;
}

export const TravelScreen: React.FC<TravelScreenProps> = ({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwapLanguages
}) => {
  const travelPhrases = OFFLINE_PRESET_PHRASES.filter(p => p.category === 'travel');
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseItem | null>(travelPhrases[0] || null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSelectPhrase = (phrase: PhraseItem) => {
    setSelectedPhrase(phrase);
    LocalDB.saveHistoryItem({
      originalText: phrase.english,
      sourceLang,
      translatedText: phrase.translations[targetLang] || phrase.english,
      targetLang,
      category: 'travel',
      isFavorite: false
    });
  };

  const handleSpeak = (phrase: PhraseItem) => {
    setIsSpeaking(true);
    const textToSpeak = phrase.translations[targetLang] || phrase.english;
    SpeechService.speak(textToSpeak, targetLang, () => {
      setIsSpeaking(false);
    });
  };

  const handleCopy = (phrase: PhraseItem) => {
    const text = phrase.translations[targetLang] || phrase.english;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targetLangMeta = getLanguageByCode(targetLang);

  return (
    <div className="space-y-5 pb-6">
      <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-800/60 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-600 text-white shadow-lg">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">
              ✈️ Travel & Navigation
            </h1>
            <p className="text-xs text-cyan-200">
              Bus stand, railway station, airport, taxi & cost queries.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <LanguageSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={onSourceChange}
            onTargetChange={onTargetChange}
            onSwap={onSwapLanguages}
          />
        </div>
      </div>

      {selectedPhrase && (
        <div className="p-5 rounded-3xl bg-slate-900 border-2 border-cyan-500/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2.5">
            <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4" /> Travel Phrase
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              Offline Ready
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold">Original Phrase:</span>
            <p className="text-base text-slate-200 font-bold">{selectedPhrase.english}</p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 space-y-1">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              {targetLangMeta.flag} {targetLangMeta.name}:
            </span>
            <p className="text-2xl font-black text-white leading-tight">
              {selectedPhrase.translations[targetLang] || selectedPhrase.english}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleSpeak(selectedPhrase)}
              className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isSpeaking ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Speaking...' : '🔊 Speak'}</span>
            </button>

            <button
              onClick={() => handleCopy(selectedPhrase)}
              className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied' : '📋 Copy'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Travel Phrases ({travelPhrases.length})
        </h2>
        <div className="space-y-2">
          {travelPhrases.map((phrase) => (
            <div
              key={phrase.id}
              onClick={() => handleSelectPhrase(phrase)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                selectedPhrase?.id === phrase.id
                  ? 'bg-cyan-950/80 border-cyan-500/80 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-slate-200 font-semibold truncate">{phrase.english}</p>
                <p className="text-cyan-400 font-bold truncate mt-0.5">
                  {phrase.translations[targetLang] || phrase.english}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPhrase(phrase);
                  handleSpeak(phrase);
                }}
                className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 ml-3 shrink-0 active:scale-90"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
