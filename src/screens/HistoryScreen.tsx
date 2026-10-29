import React, { useState, useEffect } from 'react';
import { History, Search, Star, Trash2, Volume2, Copy, Check } from 'lucide-react';
import type { HistoryItem } from '../types';
import { LocalDB } from '../database/local_db';
import { SpeechService } from '../services/speech_service';
import { getLanguageByCode } from '../models/language';

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setHistory(LocalDB.getHistory());
  }, []);

  const handleToggleFavorite = (id: string) => {
    const updated = LocalDB.toggleFavorite(id);
    setHistory(updated);
  };

  const handleDelete = (id: string) => {
    const updated = LocalDB.deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all offline translation history?')) {
      LocalDB.clearHistory();
      setHistory([]);
    }
  };

  const handleSpeak = (item: HistoryItem) => {
    SpeechService.speak(item.translatedText, item.targetLang);
  };

  const handleCopy = (item: HistoryItem) => {
    navigator.clipboard.writeText(item.translatedText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch =
      item.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = filterFavoritesOnly ? item.isFavorite : true;
    return matchesSearch && matchesFavorite;
  });

  return (
    <div className="space-y-5 pb-6">
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                Translation History
              </h1>
              <p className="text-xs text-slate-400">
                100% locally stored on your device ({history.length} items)
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all"
              title="Clear all history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <button
            onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              filterFavoritesOnly
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Star className={`w-4 h-4 ${filterFavoritesOnly ? 'fill-amber-400' : ''}`} />
            <span>Starred</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-slate-900/50 border border-slate-800/60 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No translation history found.</p>
            <p className="text-xs text-slate-500">Translations done offline will automatically appear here.</p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const srcMeta = getLanguageByCode(item.sourceLang);
            const tgtMeta = getLanguageByCode(item.targetLang);

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-mono flex items-center gap-1 text-amber-400 font-semibold">
                    {srcMeta.flag} {srcMeta.name} ➔ {tgtMeta.flag} {tgtMeta.name}
                  </span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-medium">{item.originalText}</p>
                  <p className="text-base font-bold text-white mt-0.5">{item.translatedText}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeak(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak</span>
                    </button>

                    <button
                      onClick={() => handleCopy(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        item.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
