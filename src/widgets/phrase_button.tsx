import React from 'react';
import { Volume2, ChevronRight } from 'lucide-react';
import type { PhraseItem, LanguageCode } from '../types';

interface PhraseButtonProps {
  phrase: PhraseItem;
  targetLang: LanguageCode;
  isSelected: boolean;
  onSelect: (phrase: PhraseItem) => void;
  onSpeak: (phrase: PhraseItem, e: React.MouseEvent) => void;
}

export const PhraseButton: React.FC<PhraseButtonProps> = ({
  phrase,
  targetLang,
  isSelected,
  onSelect,
  onSpeak
}) => {
  const translated = phrase.translations[targetLang] || phrase.english;

  return (
    <div
      onClick={() => onSelect(phrase)}
      className={`w-full p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-md active:scale-[0.99] ${
        isSelected
          ? 'bg-gradient-to-r from-red-950/80 to-slate-900 border-red-500/80 ring-1 ring-red-500/50'
          : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100 truncate">
          {phrase.english}
        </p>
        <p className="text-xs font-bold text-red-400 mt-0.5 truncate">
          {translated}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={(e) => onSpeak(phrase, e)}
          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all active:scale-90"
          title="Speak translated phrase offline"
        >
          <Volume2 className="w-4 h-4" />
        </button>
        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-red-400 translate-x-0.5' : 'text-slate-600'}`} />
      </div>
    </div>
  );
};
