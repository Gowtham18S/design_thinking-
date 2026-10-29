import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Pause,
  Square,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  Copy,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Globe,
  HardDrive,
  Wifi,
  Plane,
  Building,
  Utensils,
  Train,
  ShoppingBag,
  Stethoscope,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import type { LanguageCode } from '../types';
import { ConversationManager } from '../services/conversation_manager';
import type { ConversationState, ConversationMessage } from '../services/conversation_manager';
import { SearchableLanguageSelect } from '../widgets/language_selector';
import { getLanguageByCode } from '../models/language';
import { NetworkService } from '../services/network_service';
import { SpeechService } from '../services/speech_service';

interface LiveConversationScreenProps {
  initialPersonALang?: LanguageCode;
  initialPersonBLang?: LanguageCode;
}

export const LiveConversationScreen: React.FC<LiveConversationScreenProps> = ({
  initialPersonALang = 'ta',
  initialPersonBLang = 'te'
}) => {
  const [state, setState] = useState<ConversationState>(ConversationManager.getState());
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('hotel');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ConversationManager.setConfig({
      personALang: initialPersonALang,
      personBLang: initialPersonBLang
    });

    const unsubscribe = ConversationManager.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
    };
  }, [initialPersonALang, initialPersonBLang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.interimText, state.status]);

  const personAMeta = getLanguageByCode(state.config.personALang);
  const personBMeta = getLanguageByCode(state.config.personBLang);
  const isOffline = NetworkService.isOffline();

  const travelSituations = [
    { id: 'hotel', label: 'Hotel', icon: <Building className="w-4 h-4" /> },
    { id: 'restaurant', label: 'Restaurant', icon: <Utensils className="w-4 h-4" /> },
    { id: 'transport', label: 'Transport', icon: <Train className="w-4 h-4" /> },
    { id: 'airport', label: 'Airport', icon: <Plane className="w-4 h-4" /> },
    { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'hospital', label: 'Hospital', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'emergency', label: 'Emergency', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'tourist', label: 'Tourist', icon: <MapPin className="w-4 h-4" /> }
  ];

  const situationalPhrases: Record<string, string[]> = {
    hotel: [
      'Where is my room?',
      'Can I check in early?',
      'What time is checkout?',
      'Can I get extra towels?',
      'The key card is not working.'
    ],
    restaurant: [
      'I am vegetarian.',
      'Does this contain peanuts?',
      'Can I get drinking water?',
      'Can I have the bill please?',
      'What is the chef special dish?'
    ],
    transport: [
      'Where is the railway station?',
      'How much is the taxi fare?',
      'Which bus goes to the city center?',
      'Is this train on time?',
      'Please stop here.'
    ],
    airport: [
      'Where is terminal 2?',
      'Where can I collect my baggage?',
      'Is there a currency exchange?',
      'Where is the boarding gate?',
      'I have lost my bag.'
    ],
    shopping: [
      'How much does this cost?',
      'Can you give me a discount?',
      'Do you accept card payment?',
      'Do you have a larger size?',
      'Can I get a receipt?'
    ],
    hospital: [
      'I need a doctor immediately.',
      'Where is the emergency room?',
      'I have a severe fever and pain.',
      'I am allergic to penicillin.',
      'Please call an ambulance.'
    ],
    emergency: [
      'Please help me!',
      'Call the police.',
      'I am lost and need directions.',
      'My belongings were stolen.',
      'Where is the nearest embassy?'
    ],
    tourist: [
      'Where is the ticket counter?',
      'What are the opening hours?',
      'Can you take a photo of us?',
      'Is photography allowed here?',
      'Where is the nearest restroom?'
    ]
  };

  const handleCopyMessage = (msg: ConversationMessage) => {
    const content = `${msg.speakerName}: "${msg.originalText}" ➔ "${msg.translatedText}"`;
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleCopyAll = () => {
    if (state.messages.length === 0) return;
    const allText = state.messages
      .map(m => `[${m.timestamp}] ${m.speakerName}: ${m.originalText} ➔ ${m.translatedText}`)
      .join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const renderStatusWaveform = () => {
    switch (state.status) {
      case 'listening':
        return (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider">
                🎤 Listening for speech...
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-5 bg-amber-400 animate-bounce" style={{ animationDelay: '450ms' }} />
            </div>
          </div>
        );
      case 'converting':
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>📝 Converting speech to text...</span>
          </div>
        );
      case 'detecting':
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>🧠 Detecting speaker & language ({personAMeta.name} / {personBMeta.name})...</span>
          </div>
        );
      case 'translating':
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>🌐 Translating bidirectionally...</span>
          </div>
        );
      case 'speaking':
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>🔊 Speaking translation audio...</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Setup & Language Selection Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Live Conversation
              </h1>
              <p className="text-[11px] text-slate-400">
                Hands-free bidirectional continuous translation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {isOffline ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                OFFLINE MODE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                ONLINE MODE
              </span>
            )}
          </div>
        </div>

        {/* Person A & Person B Language Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              👤 Person A Language:
            </span>
            <SearchableLanguageSelect
              value={state.config.personALang}
              onChange={(code) => ConversationManager.setConfig({ personALang: code })}
              label="Person A Language"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              👤 Person B Language:
            </span>
            <SearchableLanguageSelect
              value={state.config.personBLang}
              onChange={(code) => ConversationManager.setConfig({ personBLang: code })}
              label="Person B Language"
            />
          </div>
        </div>

        {/* Swap & Auto-Detect Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => ConversationManager.swapLanguages()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap Languages</span>
          </button>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium select-none">
            <input
              type="checkbox"
              checked={state.config.autoDetectSpeaker}
              onChange={(e) => ConversationManager.setConfig({ autoDetectSpeaker: e.target.checked })}
              className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
            />
            <span>Auto Detect Speaker</span>
          </label>
        </div>
      </div>

      {/* Main Controls Toolbar */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          {!state.isListening ? (
            <button
              onClick={() => ConversationManager.startListening()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>START LISTENING</span>
            </button>
          ) : (
            <>
              {state.isPaused ? (
                <button
                  onClick={() => ConversationManager.startListening()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={() => ConversationManager.pauseListening()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={() => ConversationManager.stopListening()}
                className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ConversationManager.setConfig({ autoSpeak: !state.config.autoSpeak })}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              state.config.autoSpeak
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Automatic Speech Playback"
          >
            {state.config.autoSpeak ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>Auto Speak: {state.config.autoSpeak ? 'ON' : 'OFF'}</span>
          </button>

          {state.messages.length > 0 && (
            <>
              <button
                onClick={handleCopyAll}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                title="Copy entire conversation"
              >
                {copiedAll ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={() => ConversationManager.clearConversation()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-all cursor-pointer"
                title="Clear conversation timeline"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Status Indicator */}
      {renderStatusWaveform()}

      {/* Error Message Alert */}
      {state.errorMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{state.errorMessage}</span>
        </div>
      )}

      {/* Interim Live Speech Preview */}
      {state.interimText && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-amber-500/30 text-xs text-amber-200 animate-pulse">
          <span className="font-bold text-amber-400 uppercase tracking-wider block text-[10px] mb-0.5">
            Recognizing Speech...
          </span>
          <p className="italic">"{state.interimText}"</p>
        </div>
      )}

      {/* Conversation Timeline Chat Bubbles */}
      <div className="space-y-3 min-h-48">
        {state.messages.length === 0 && !state.interimText && (
          <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No Messages Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click <strong className="text-amber-400">START LISTENING</strong> to begin a natural two-way conversation between {personAMeta.name} ({personAMeta.nativeName}) and {personBMeta.name} ({personBMeta.nativeName}).
            </p>
          </div>
        )}

        {state.messages.map((msg) => {
          const isPersonA = msg.speaker === 'A';
          const srcMeta = getLanguageByCode(msg.sourceLang);
          const tgtMeta = getLanguageByCode(msg.targetLang);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isPersonA ? 'items-start' : 'items-end'} space-y-1`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-3xl p-4 shadow-xl space-y-2 text-xs transition-all ${
                  isPersonA
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                    : 'bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/60 text-indigo-100 rounded-tr-sm'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5 gap-3">
                  <span className="font-extrabold text-amber-400 flex items-center gap-1">
                    {srcMeta.flag} {msg.speakerName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Original Speech */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Original ({srcMeta.name}):
                  </span>
                  <p className="text-slate-200 font-medium text-sm">
                    "{msg.originalText}"
                  </p>
                </div>

                {/* Target Translation */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                    {tgtMeta.flag} {tgtMeta.name} ({tgtMeta.nativeName}):
                  </span>
                  <p className="text-base font-bold text-white">
                    {msg.translatedText}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    onClick={() => SpeechService.speak(msg.translatedText, msg.targetLang)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>

                  <button
                    onClick={() => handleCopyMessage(msg)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                    title="Copy this message"
                  >
                    {copiedMsgId === msg.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Situational Quick Travel Phrases (Travel Mode) */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Travel Context Phrases
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">
            Tap to translate & speak instantly
          </span>
        </div>

        {/* Category selector chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {travelSituations.map((sit) => (
            <button
              key={sit.id}
              onClick={() => setSelectedCategory(sit.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                selectedCategory === sit.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {sit.icon}
              <span>{sit.label}</span>
            </button>
          ))}
        </div>

        {/* Phrase buttons list */}
        <div className="flex flex-wrap gap-2 pt-1">
          {situationalPhrases[selectedCategory]?.map((phrase) => (
            <button
              key={phrase}
              onClick={() => ConversationManager.sendDirectPhrase(phrase, 'A')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-950 text-slate-200 text-xs font-medium border border-slate-800 hover:border-indigo-500/50 transition-all active:scale-95 cursor-pointer text-left"
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
