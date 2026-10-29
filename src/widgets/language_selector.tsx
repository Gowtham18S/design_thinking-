import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, ChevronDown, Search, Check, Wifi, HardDrive } from 'lucide-react';
import type { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../models/language';

import { NetworkService } from '../services/network_service';

interface LanguageSelectorProps {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  onSourceChange: (lang: LanguageCode) => void;
  onTargetChange: (lang: LanguageCode) => void;
  onSwap: () => void;
}

interface SearchableSelectProps {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  label: string;
}

export const SearchableLanguageSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(NetworkService.isOffline());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return NetworkService.subscribe(() => {
      setIsOfflineMode(NetworkService.isOffline());
    });
  }, []);

  const selectedLang = getLanguageByCode(value);

  const baseLanguages = isOfflineMode
    ? SUPPORTED_LANGUAGES.filter((lang) => lang.offlineSupported)
    : SUPPORTED_LANGUAGES;

  const filteredLanguages = baseLanguages.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredLanguages.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredLanguages.length) % filteredLanguages.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredLanguages[highlightedIndex]) {
        onChange(filteredLanguages[highlightedIndex].code);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={label}
        className="w-full bg-[#0e1628] hover:bg-[#131d36] text-white text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 outline-none border border-slate-700/60 focus:border-amber-500 transition-all cursor-pointer flex items-center justify-between gap-1.5 shadow-sm text-left"
      >
        <span className="truncate flex items-center gap-1.5">
          <span>{selectedLang.flag}</span>
          <span className="font-bold text-white">{selectedLang.name}</span>
          <span className="text-slate-400 font-normal text-xs">({selectedLang.nativeName})</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#11192e] border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Search (e.g. Tamil, தமிழ்)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#080d19] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredLanguages.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-500">No language found</p>
            ) : (
              filteredLanguages.map((lang, idx) => {
                const isSelected = lang.code === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onChange(lang.code);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : isHighlighted
                        ? 'bg-slate-800/80 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="text-base">{lang.flag}</span>
                      <span className="font-semibold text-white">{lang.name}</span>
                      <span className="text-slate-400 font-normal">({lang.nativeName})</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {lang.offlineSupported ? (
                        <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1" title="Offline engine supported">
                          <HardDrive className="w-2.5 h-2.5" />
                          Offline
                        </span>
                      ) : (
                        <span className="text-[9px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-1" title="Online translation">
                          <Wifi className="w-2.5 h-2.5" />
                          Online
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap
}) => {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-[#080d19] border border-slate-800/90 shadow-md relative">
      <SearchableLanguageSelect
        value={sourceLang}
        onChange={onSourceChange}
        label="From Language"
      />

      <button
        type="button"
        onClick={onSwap}
        title="Swap Source and Target Languages"
        className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all active:scale-95 shrink-0 shadow-sm cursor-pointer"
      >
        <ArrowLeftRight className="w-4 h-4" />
      </button>

      <SearchableLanguageSelect
        value={targetLang}
        onChange={onTargetChange}
        label="To Language"
      />
    </div>
  );
};
