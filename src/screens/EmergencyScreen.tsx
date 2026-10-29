import React, { useState } from 'react';
import {
  Siren,
  Ambulance,
  Hospital,
  Shield,
  HelpCircle,
  MapPin,
  Pill,
  HeartPulse,
  Volume2,
  Copy,
  Share2,
  Check
} from 'lucide-react';
import type { LanguageCode, PhraseItem } from '../types';
import { OFFLINE_PRESET_PHRASES } from '../database/phrase_database';
import { SpeechService } from '../services/speech_service';
import { LanguageSelector } from '../widgets/language_selector';
import { getLanguageByCode } from '../models/language';
import { LocalDB } from '../database/local_db';

interface EmergencyScreenProps {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  onSourceChange: (lang: LanguageCode) => void;
  onTargetChange: (lang: LanguageCode) => void;
  onSwapLanguages: () => void;
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwapLanguages
}) => {
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseItem | null>(OFFLINE_PRESET_PHRASES[0]);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const quickActions = [
    { label: 'Ambulance', icon: <Ambulance className="w-6 h-6" />, phraseId: 'em_2', color: 'from-red-600 to-red-800' },
    { label: 'Hospital', icon: <Hospital className="w-6 h-6" />, phraseId: 'em_6', color: 'from-rose-600 to-rose-800' },
    { label: 'Police', icon: <Shield className="w-6 h-6" />, phraseId: 'em_7', color: 'from-blue-600 to-blue-800' },
    { label: 'I Need Help', icon: <HelpCircle className="w-6 h-6" />, phraseId: 'em_1', color: 'from-amber-600 to-amber-800' },
    { label: 'I Am Lost', icon: <MapPin className="w-6 h-6" />, phraseId: 'em_4', color: 'from-purple-600 to-purple-800' },
    { label: 'Medicine', icon: <Pill className="w-6 h-6" />, phraseId: 'hc_4', color: 'from-emerald-600 to-emerald-800' },
    { label: 'Medical Crisis', icon: <HeartPulse className="w-6 h-6" />, phraseId: 'em_9', color: 'from-red-700 to-rose-900' }
  ];

  const emergencyPhrases = OFFLINE_PRESET_PHRASES.filter(p => p.category === 'emergency');

  const handleSelectPhrase = (phrase: PhraseItem) => {
    setSelectedPhrase(phrase);
    LocalDB.saveHistoryItem({
      originalText: phrase.english,
      sourceLang,
      translatedText: phrase.translations[targetLang] || phrase.english,
      targetLang,
      category: 'emergency',
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

  const handleShare = (phrase: PhraseItem) => {
    const text = phrase.translations[targetLang] || phrase.english;
    if (navigator.share) {
      navigator.share({
        title: 'Emergency Communication - LinguaGo',
        text: `${phrase.english} ➔ ${text}`
      }).catch(() => {});
    } else {
      handleCopy(phrase);
    }
  };

  const targetLangMeta = getLanguageByCode(targetLang);

  return (
    <div className="space-y-5 pb-6">
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border border-red-800/60 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg animate-pulse">
            <Siren className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">
              🚨 Emergency Translation
            </h1>
            <p className="text-xs text-red-200">
              1-Tap instant translation & speech for critical situations.
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

      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Quick Action Buttons
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {quickActions.map((action) => {
            const phrase = OFFLINE_PRESET_PHRASES.find(p => p.id === action.phraseId) || OFFLINE_PRESET_PHRASES[0];
            const isSelected = selectedPhrase?.id === phrase.id;

            return (
              <button
                key={action.phraseId}
                onClick={() => {
                  handleSelectPhrase(phrase);
                  handleSpeak(phrase);
                }}
                className={`p-3.5 rounded-2xl bg-gradient-to-br ${action.color} border border-white/20 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-center ${
                  isSelected ? 'ring-2 ring-amber-400 scale-[1.02]' : 'hover:opacity-90'
                }`}
              >
                <div className="p-2 rounded-xl bg-black/20 backdrop-blur-sm">
                  {action.icon}
                </div>
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedPhrase && (
        <div className="p-5 rounded-3xl bg-slate-900 border-2 border-red-500/80 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2.5">
            <span className="font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Siren className="w-4 h-4" /> Selected Emergency Phrase
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              Offline Ready
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold">Original Phrase (English):</span>
            <p className="text-base text-slate-200 font-bold">{selectedPhrase.english}</p>
          </div>

          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 space-y-1">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
              {targetLangMeta.flag} {targetLangMeta.name} Translation:
            </span>
            <p className="text-2xl font-black text-white leading-tight">
              {selectedPhrase.translations[targetLang] || selectedPhrase.english}
            </p>
            {selectedPhrase.phonetics?.[targetLang] && (
              <p className="text-xs text-red-200/80 font-mono pt-1 italic">
                "{selectedPhrase.phonetics[targetLang]}"
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleSpeak(selectedPhrase)}
              className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow ${
                isSpeaking
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Speaking' : '🔊 Speak'}</span>
            </button>

            <button
              onClick={() => handleCopy(selectedPhrase)}
              className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied' : '📋 Copy'}</span>
            </button>

            <button
              onClick={() => handleShare(selectedPhrase)}
              className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
            >
              <Share2 className="w-4 h-4 text-slate-400" />
              <span>📤 Share</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          All Emergency Phrases ({emergencyPhrases.length})
        </h2>
        <div className="space-y-2">
          {emergencyPhrases.map((phrase) => (
            <div
              key={phrase.id}
              onClick={() => handleSelectPhrase(phrase)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                selectedPhrase?.id === phrase.id
                  ? 'bg-red-950/80 border-red-500/80 ring-1 ring-red-500/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-slate-200 font-semibold truncate">{phrase.english}</p>
                <p className="text-red-400 font-bold truncate mt-0.5">
                  {phrase.translations[targetLang] || phrase.english}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPhrase(phrase);
                  handleSpeak(phrase);
                }}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 ml-3 shrink-0 active:scale-90"
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
