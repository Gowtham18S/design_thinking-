import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  Globe,
  Compass
} from 'lucide-react';
import type { LanguageCode } from '../types';
import globeImage from '../assets/glowing_travel_globe.jpg';

interface MultilingualGlobeHeroProps {
  onSelectGreeting?: (text: string, langCode: LanguageCode) => void;
}

interface GreetingBubble {
  id: string;
  langCode: LanguageCode;
  langName: string;
  text: string;
  fullSentence: string;
  positionClasses: string;
  depth: 'foreground' | 'midground' | 'background';
  animationClass: string;
  borderColor: string;
  textColor: string;
  bgGradient: string;
  glowColor: string;
}

export const MultilingualGlobeHero: React.FC<MultilingualGlobeHeroProps> = ({
  onSelectGreeting
}) => {
  const [imageError, setImageError] = useState(false);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);

  // 9 Required Multilingual Greetings with accurate native scripts
  const greetings: GreetingBubble[] = [
    {
      id: 'en',
      langCode: 'en',
      langName: 'English',
      text: 'Hello!',
      fullSentence: 'Hello, where is the railway station?',
      positionClasses: 'top-6 -left-2 sm:top-8 sm:left-4 md:-left-4',
      depth: 'foreground',
      animationClass: 'animate-float-1',
      borderColor: 'border-cyan-400/60 hover:border-cyan-300',
      textColor: 'text-cyan-200',
      bgGradient: 'bg-gradient-to-r from-[#07162e]/95 to-[#0b2447]/95',
      glowColor: 'shadow-cyan-500/25'
    },
    {
      id: 'ta',
      langCode: 'ta',
      langName: 'Tamil',
      text: 'வணக்கம்!',
      fullSentence: 'வணக்கம், ரயில் நிலையம் எங்கே இருக்கிறது?',
      positionClasses: 'top-4 -right-2 sm:top-6 sm:right-6 md:-right-2',
      depth: 'foreground',
      animationClass: 'animate-float-2',
      borderColor: 'border-amber-400/60 hover:border-amber-300',
      textColor: 'text-amber-200',
      bgGradient: 'bg-gradient-to-r from-[#1c1229]/95 to-[#28183d]/95',
      glowColor: 'shadow-amber-500/25'
    },
    {
      id: 'hi',
      langCode: 'hi',
      langName: 'Hindi',
      text: 'नमस्ते!',
      fullSentence: 'नमस्ते, रेलवे स्टेशन कहाँ है?',
      positionClasses: 'top-1/3 -right-4 sm:top-1/3 sm:right-0 md:-right-6',
      depth: 'foreground',
      animationClass: 'animate-float-3',
      borderColor: 'border-sky-400/60 hover:border-sky-300',
      textColor: 'text-sky-200',
      bgGradient: 'bg-gradient-to-r from-[#0a1e3b]/95 to-[#12315d]/95',
      glowColor: 'shadow-sky-500/25'
    },
    {
      id: 'te',
      langCode: 'te',
      langName: 'Telugu',
      text: 'నమస్కారం!',
      fullSentence: 'నమస్కారం, రైల్వే స్టేషన్ ఎక్కడ ఉంది?',
      positionClasses: 'bottom-16 -right-2 sm:bottom-20 sm:right-4 md:-right-4',
      depth: 'midground',
      animationClass: 'animate-float-1',
      borderColor: 'border-violet-400/60 hover:border-violet-300',
      textColor: 'text-violet-200',
      bgGradient: 'bg-gradient-to-r from-[#170e2c]/95 to-[#261546]/95',
      glowColor: 'shadow-violet-500/25'
    },
    {
      id: 'kn',
      langCode: 'kn',
      langName: 'Kannada',
      text: 'ನಮಸ್ಕಾರ!',
      fullSentence: 'ನಮಸ್ಕಾರ, ರೈಲ್ವೆ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?',
      positionClasses: 'top-1/3 -left-4 sm:top-1/3 sm:left-0 md:-left-6',
      depth: 'foreground',
      animationClass: 'animate-float-2',
      borderColor: 'border-emerald-400/60 hover:border-emerald-300',
      textColor: 'text-emerald-200',
      bgGradient: 'bg-gradient-to-r from-[#071c22]/95 to-[#0e353f]/95',
      glowColor: 'shadow-emerald-500/25'
    },
    {
      id: 'ml',
      langCode: 'ml',
      langName: 'Malayalam',
      text: 'നമസ്കാരം!',
      fullSentence: 'നമസ്കാരം, റെയിൽവേ സ്റ്റേഷൻ എവിടെയാണ്?',
      positionClasses: 'bottom-16 -left-2 sm:bottom-20 sm:left-4 md:-left-4',
      depth: 'midground',
      animationClass: 'animate-float-3',
      borderColor: 'border-indigo-400/60 hover:border-indigo-300',
      textColor: 'text-indigo-200',
      bgGradient: 'bg-gradient-to-r from-[#0e1636]/95 to-[#172554]/95',
      glowColor: 'shadow-indigo-500/25'
    },
    {
      id: 'ar',
      langCode: 'ar',
      langName: 'Arabic',
      text: 'مرحباً!',
      fullSentence: 'مرحباً، أين محطة القطار؟',
      positionClasses: '-top-3 left-1/2 -translate-x-1/2',
      depth: 'background',
      animationClass: 'animate-float-1',
      borderColor: 'border-amber-400/50 hover:border-amber-300',
      textColor: 'text-amber-100',
      bgGradient: 'bg-gradient-to-r from-[#16121f]/95 to-[#261d36]/95',
      glowColor: 'shadow-amber-500/20'
    },
    {
      id: 'ja',
      langCode: 'ja',
      langName: 'Japanese',
      text: 'こんにちは!',
      fullSentence: 'こんにちは、駅はどこですか？',
      positionClasses: '-bottom-3 left-1/2 -translate-x-1/2',
      depth: 'foreground',
      animationClass: 'animate-float-2',
      borderColor: 'border-rose-400/60 hover:border-rose-300',
      textColor: 'text-rose-200',
      bgGradient: 'bg-gradient-to-r from-[#1d0e23]/95 to-[#33183d]/95',
      glowColor: 'shadow-rose-500/25'
    },
    {
      id: 'es',
      langCode: 'es',
      langName: 'Spanish',
      text: '¡Hola!',
      fullSentence: '¡Hola! ¿Dónde está la estación de tren?',
      positionClasses: 'bottom-2 right-1/4',
      depth: 'midground',
      animationClass: 'animate-float-3',
      borderColor: 'border-cyan-400/50 hover:border-cyan-300',
      textColor: 'text-cyan-200',
      bgGradient: 'bg-gradient-to-r from-[#081a30]/95 to-[#0d2e54]/95',
      glowColor: 'shadow-cyan-500/20'
    }
  ];

  const handleBubbleClick = (greeting: GreetingBubble) => {
    if (onSelectGreeting) {
      onSelectGreeting(greeting.fullSentence, greeting.langCode);
    }
  };

  return (
    <section className="relative rounded-3xl overflow-hidden p-6 sm:p-8 lg:p-10 bg-gradient-to-b from-[#081126] via-[#060c1d] to-[#040814] border border-cyan-500/25 shadow-2xl">
      {/* Background Ambient Illumination */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 left-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Responsive Two-Column Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
        {/* =========================================================================
            LEFT COLUMN: HEADING & INTRODUCTORY COPY
            ========================================================================= */}
        <div className="lg:col-span-5 text-left space-y-4">
          {/* Subtle Accent Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '7s' }} />
            <span>Context-Aware Translation AI</span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                LinguaGo
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 font-medium leading-snug pt-1">
              Translate text, conversations, and images across languages —{' '}
              <span className="text-cyan-300 font-bold">online</span> or{' '}
              <span className="text-amber-300 font-bold">offline</span>.
            </p>
          </div>

          {/* Short Supporting Line */}
          <p className="text-xs sm:text-sm text-slate-400 italic flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>“Your language companion for every journey.”</span>
          </p>

          {/* Trust and Capability Highlights */}
          <div className="pt-2 grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-2xl bg-[#091428]/80 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold">200+ Languages</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#091428]/80 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">100% Offline AI</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#091428]/80 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold">Two-Way Live Talk</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#091428]/80 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">Instant Camera OCR</span>
            </div>
          </div>

          {/* Quick Interaction Hint */}
          <p className="text-[11px] text-slate-500 pt-1">
            💡 Tap any speech bubble around the globe to translate that greeting instantly.
          </p>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: GLOWING 3D DIGITAL GLOBE & MULTILINGUAL SPEECH BUBBLES
            ========================================================================= */}
        <div className="lg:col-span-7 flex items-center justify-center relative">
          <div className="relative w-full max-w-[480px] sm:max-w-[540px] aspect-square flex items-center justify-center select-none">
            {/* Luminous Atmospheric Halo Rings */}
            <div className="absolute inset-4 sm:inset-6 rounded-full bg-cyan-500/15 blur-2xl animate-pulse-glow" />
            <div className="absolute inset-10 sm:inset-12 rounded-full border border-cyan-400/20 pointer-events-none" />
            <div className="absolute inset-16 sm:inset-20 rounded-full border border-sky-400/15 dashed pointer-events-none" />

            {/* Subtle Communication Orbit Rings */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
              viewBox="0 0 500 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse
                cx="250"
                cy="250"
                rx="210"
                ry="130"
                stroke="rgba(56, 189, 248, 0.35)"
                strokeWidth="1.2"
                strokeDasharray="6 6"
                transform="rotate(-24 250 250)"
              />
              <ellipse
                cx="250"
                cy="250"
                rx="225"
                ry="115"
                stroke="rgba(168, 85, 247, 0.3)"
                strokeWidth="1.2"
                strokeDasharray="4 8"
                transform="rotate(28 250 250)"
              />
              {/* Airplane on Flight Arc */}
              <g transform="translate(390, 160) rotate(35)">
                <path
                  d="M0 0 L14 4 L14 8 L6 6 L6 13 L9 15 L9 17 L5 16 L1 17 L1 15 L4 13 L4 6 L-4 8 L-4 4 Z"
                  fill="#38bdf8"
                />
              </g>
            </svg>

            {/* Central Glowing Earth Globe Visual */}
            <div className="relative w-[72%] sm:w-[75%] aspect-square rounded-full overflow-hidden shadow-2xl shadow-cyan-500/20 border-2 border-cyan-400/50 group">
              {!imageError ? (
                <img
                  src={globeImage}
                  alt="LinguaGo Multilingual Glowing Globe"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
              ) : (
                /* Fallback Decorative Vector Globe */
                <div className="w-full h-full bg-gradient-to-br from-[#0c2a52] via-[#081830] to-[#040c1a] flex items-center justify-center relative">
                  <Globe className="w-3/4 h-3/4 text-cyan-400/70" />
                  <div className="absolute inset-0 bg-radial from-transparent to-[#040c1a]/80" />
                </div>
              )}

              {/* Luminous Atmosphere Glare */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-white/10 pointer-events-none" />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(56,189,248,0.5)] pointer-events-none" />
            </div>

            {/* =========================================================================
                FLOATING MULTILINGUAL SPEECH BUBBLES
                ========================================================================= */}
            {greetings.map((greeting) => {
              const isHovered = hoveredBubble === greeting.id;
              const depthStyles =
                greeting.depth === 'foreground'
                  ? 'z-30 scale-100 sm:scale-105 opacity-100'
                  : greeting.depth === 'midground'
                  ? 'z-20 scale-95 sm:scale-100 opacity-95'
                  : 'z-10 scale-90 sm:scale-95 opacity-85';

              return (
                <button
                  key={greeting.id}
                  onClick={() => handleBubbleClick(greeting)}
                  onMouseEnter={() => setHoveredBubble(greeting.id)}
                  onMouseLeave={() => setHoveredBubble(null)}
                  className={`absolute ${greeting.positionClasses} ${depthStyles} ${greeting.animationClass} group/bubble cursor-pointer transition-all duration-300 hover:scale-110 hover:z-40 focus:outline-none`}
                  title={`Translate ${greeting.langName} greeting: "${greeting.fullSentence}"`}
                  aria-label={`${greeting.langName} greeting: ${greeting.text}`}
                >
                  <div
                    className={`relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl ${greeting.bgGradient} backdrop-blur-md border ${greeting.borderColor} shadow-xl ${greeting.glowColor} transition-all`}
                  >
                    {/* Language Badge */}
                    <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase border border-white/10">
                      {greeting.langCode}
                    </span>

                    {/* Greeting Text in Authentic Script */}
                    <span
                      className={`text-xs sm:text-sm font-extrabold tracking-tight ${greeting.textColor} group-hover/bubble:text-white transition-colors`}
                    >
                      {greeting.text}
                    </span>

                    {/* Sparkle icon on hover */}
                    {isHovered && (
                      <Sparkles className="w-3 h-3 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
