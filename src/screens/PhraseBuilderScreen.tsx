import React, { useState, useEffect } from 'react';
import { Layers, Volume2, Copy, Check, RefreshCw, User, Activity, Package, MapPin, Loader2 } from 'lucide-react';
import type { LanguageCode } from '../types';
import { PHRASE_BUILDER_COMPONENTS } from '../database/phrase_database';
import { LanguageSelector } from '../widgets/language_selector';
import { TranslationEngine } from '../services/translation_engine';
import type { TranslationResult } from '../services/translation_engine';
import { SpeechService } from '../services/speech_service';
import { LocalDB } from '../database/local_db';
import { getLanguageByCode } from '../models/language';

interface PhraseBuilderScreenProps {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  onSourceChange: (lang: LanguageCode) => void;
  onTargetChange: (lang: LanguageCode) => void;
  onSwapLanguages: () => void;
}

export const PhraseBuilderScreen: React.FC<PhraseBuilderScreenProps> = ({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwapLanguages
}) => {
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(0);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(1);

  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const persons = PHRASE_BUILDER_COMPONENTS.persons;
  const actions = PHRASE_BUILDER_COMPONENTS.actions;
  const objects = PHRASE_BUILDER_COMPONENTS.objects;
  const locations = PHRASE_BUILDER_COMPONENTS.locations;

  const currentPerson = persons[selectedPersonIndex];
  const currentAction = actions[selectedActionIndex];
  const currentObject = objects[selectedObjectIndex];
  const currentLocation = locations[selectedLocationIndex];

  const generatedEnglish = `${currentPerson.en} ${currentAction.en} ${currentObject.en} ${currentLocation.en}.`;
  const [translationResult, setTranslationResult] = useState<TranslationResult>(() =>
    TranslationEngine.translateLocally(generatedEnglish, 'en', targetLang)
  );

  useEffect(() => {
    let isCancelled = false;
    setIsTranslating(true);
    TranslationEngine.translate(generatedEnglish, 'en', targetLang)
      .then(res => {
        if (!isCancelled) {
          setTranslationResult(res);
          setIsTranslating(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setTranslationResult(TranslationEngine.translateLocally(generatedEnglish, 'en', targetLang));
          setIsTranslating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [generatedEnglish, targetLang]);

  const handleSpeak = () => {
    if (!translationResult?.translatedText) return;
    setIsSpeaking(true);
    SpeechService.speak(translationResult.translatedText, targetLang, () => {
      setIsSpeaking(false);
    });
  };

  const handleCopy = () => {
    if (!translationResult?.translatedText) return;
    navigator.clipboard.writeText(translationResult.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    LocalDB.saveHistoryItem({
      originalText: generatedEnglish,
      sourceLang: 'en',
      translatedText: translationResult.translatedText,
      targetLang,
      category: 'phrase_builder',
      isFavorite: false
    });
  };

  const handleReset = () => {
    setSelectedPersonIndex(0);
    setSelectedActionIndex(0);
    setSelectedObjectIndex(0);
    setSelectedLocationIndex(1);
  };

  const targetLangMeta = getLanguageByCode(targetLang);

  return (
    <div className="space-y-5 pb-6">
      <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-800/60 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                Build Your Sentence
              </h1>
              <p className="text-xs text-indigo-200">
                Construct sentences offline without typing manually.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95"
            title="Reset selections"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 px-1">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Person:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {persons.map((p: any, idx: number) => (
              <button
                key={p.key}
                onClick={() => setSelectedPersonIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border active:scale-95 ${
                  selectedPersonIndex === idx
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 px-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" /> Action:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {actions.map((a: any, idx: number) => (
              <button
                key={a.key}
                onClick={() => setSelectedActionIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border active:scale-95 ${
                  selectedActionIndex === idx
                    ? 'bg-amber-600 border-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 px-1">
            <Package className="w-3.5 h-3.5 text-emerald-400" /> Object:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {objects.map((o: any, idx: number) => (
              <button
                key={o.key}
                onClick={() => setSelectedObjectIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border active:scale-95 ${
                  selectedObjectIndex === idx
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 px-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Location:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {locations.map((l: any, idx: number) => (
              <button
                key={l.key}
                onClick={() => setSelectedLocationIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border active:scale-95 ${
                  selectedLocationIndex === idx
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Constructed Sentence (English):
          </span>
          <p className="text-base font-bold text-white bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            "{generatedEnglish}"
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              {targetLangMeta.flag} {targetLangMeta.name} Translation:
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              {isTranslating && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
              {isTranslating ? 'Neural AI Inferencing...' : (translationResult?.engineUsed || 'Neural NMT')}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white leading-tight pt-1">
            {isTranslating ? (
              <span className="text-sm font-normal text-indigo-300 flex items-center gap-2 py-1">
                Translating sentence with on-device AI...
              </span>
            ) : (
              translationResult.translatedText || (
                <span className="text-xs font-normal text-slate-400">
                  {translationResult.error || 'Select phrase components above to translate.'}
                </span>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleSpeak}
            className={`py-3 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow ${
              isSpeaking ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isSpeaking ? 'Speaking...' : '🔊 Speak'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied' : '📋 Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
