import React, { useState } from 'react';
import type { LanguageCode, PracticeCategory } from '../types';
import { PronunciationCoachModal } from '../widgets/pronunciation_coach_modal';
import { getLanguageByCode, SUPPORTED_LANGUAGES } from '../models/language';
import type { Language } from '../types';
import { Mic, Volume2, Sparkles } from 'lucide-react';

interface PronunciationCoachScreenProps {
  initialTargetLang: LanguageCode;
}

export const PronunciationCoachScreen: React.FC<PronunciationCoachScreenProps> = ({
  initialTargetLang
}) => {
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(initialTargetLang);
  const [customText, setCustomText] = useState<string>('Where is the train station?');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [category] = useState<PracticeCategory>('travel');

  const langMeta = getLanguageByCode(selectedLang);

  const samplePhrases = [
    { target: 'Where is the train station?', label: 'Station Inquiry' },
    { target: 'Could I please get the menu?', label: 'Restaurant' },
    { target: 'I need medical assistance immediately.', label: 'Emergency' },
    { target: 'Thank you very much for your help.', label: 'Polite Expression' }
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-indigo-950 border border-amber-500/30 shadow-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Pronunciation Coach <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-300">
              Practice speaking target languages with real rhythm, fluency & phonetic feedback.
            </p>
          </div>
        </div>

        {/* Target Language Selection Dropdown */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400">Target Language:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as LanguageCode)}
            className="bg-slate-950 text-amber-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((l: Language) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} ({l.nativeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Practice Phrase Launcher */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-400" /> Select or Enter Phrase to Practice ({langMeta.name})
        </h3>

        {/* Custom Input */}
        <div className="space-y-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type any sentence to practice..."
            className="w-full bg-slate-950 text-white font-medium text-sm p-3.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Quick Sample Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400">Quick Practice Suggestions:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePhrases.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => setCustomText(phrase.target)}
                className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                  customText === phrase.target
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-[10px] font-normal text-slate-500 uppercase">{phrase.label}</span>
                "{phrase.target}"
              </button>
            ))}
          </div>
        </div>

        {/* Launch Coach Modal */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 text-sm font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Mic className="w-5 h-5" /> Start Pronunciation Coaching
        </button>
      </div>

      {/* Modal Integration */}
      <PronunciationCoachModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetLang={selectedLang}
        initialText={customText}
        initialEnglishText={customText}
        contextCategory={category}
      />
    </div>
  );
};
