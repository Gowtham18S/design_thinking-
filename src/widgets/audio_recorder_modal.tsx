import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import type { LanguageCode } from '../types';
import { SpeechService } from '../services/speech_service';
import { getLanguageByCode } from '../models/language';

interface AudioRecorderModalProps {
  isOpen: boolean;
  sourceLang: LanguageCode;
  onClose: () => void;
  onSpeechRecognized: (text: string) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  sourceLang,
  onClose,
  onSpeechRecognized
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const langMeta = getLanguageByCode(sourceLang);

  useEffect(() => {
    if (!isOpen) return;

    setTranscript('');
    setErrorMessage(null);
    startListening();

    return () => {
      SpeechService.stopSpeaking();
    };
  }, [isOpen]);

  const startListening = () => {
    setIsListening(true);
    setErrorMessage(null);

    SpeechService.listen(
      sourceLang,
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim()) {
          setTimeout(() => {
            onSpeechRecognized(text);
            onClose();
          }, 800);
        }
      },
      (err) => {
        setErrorMessage(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl">{langMeta.flag}</span>
            <div>
              <h3 className="text-sm font-bold text-white">Voice Input ({langMeta.name})</h3>
              <p className="text-[10px] text-slate-400">Speak clearly into your microphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-ping" />
                <span className="absolute w-20 h-20 rounded-full bg-amber-500/30 animate-pulse" />
              </>
            )}
            <button
              onClick={isListening ? () => setIsListening(false) : startListening}
              className={`relative z-10 p-6 rounded-full shadow-2xl border-2 transition-all active:scale-95 ${
                isListening
                  ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-500/50'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isListening ? <Mic className="w-8 h-8 animate-bounce" /> : <MicOff className="w-8 h-8" />}
            </button>
          </div>

          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
            {isListening ? 'Listening locally...' : 'Tap Mic to Start Speaking'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 min-h-[70px] flex items-center justify-center">
          {transcript ? (
            <p className="text-sm font-bold text-white italic">"{transcript}"</p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {errorMessage || 'e.g. "Where is the nearest hospital?"'}
            </p>
          )}
        </div>

        {transcript && (
          <button
            onClick={() => {
              onSpeechRecognized(transcript);
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            Use This Text
          </button>
        )}
      </div>
    </div>
  );
};
