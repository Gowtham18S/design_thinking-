import { useState, useEffect } from 'react';
import {
  Home,
  MessageSquare,
  Camera,
  Languages,
  Settings,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import type { LanguageCode } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { LiveConversationScreen } from './screens/LiveConversationScreen';
import { CameraTranslateScreen } from './screens/CameraTranslateScreen';
import { PronunciationCoachScreen } from './screens/PronunciationCoachScreen';
import { LanguageScreen } from './screens/LanguageScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { isLanguageOfflineSupported } from './models/language';
import { NetworkService } from './services/network_service';
import { GlobalNetworkBackground } from './widgets/global_network_background';

export function App() {
  const [historyStack, setHistoryStack] = useState<string[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLang, setTargetLang] = useState<LanguageCode>('ta');

  // Subscribe to network & routing mode changes
  useEffect(() => {
    const handleNetworkChange = () => {
      // If switched to offline_only, auto-adjust unsupported languages to verified defaults
      if (NetworkService.isOffline()) {
        if (!isLanguageOfflineSupported(sourceLang)) {
          setSourceLang('en');
        }
        if (!isLanguageOfflineSupported(targetLang)) {
          setTargetLang('ta');
        }
      }
    };

    handleNetworkChange();
    return NetworkService.subscribe(handleNetworkChange);
  }, [sourceLang, targetLang]);

  const currentScreen = historyStack[historyIndex] || 'home';

  const navigateTo = (screen: string) => {
    if (screen === currentScreen) return;
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(screen);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  // Keyboard navigation & auxiliary mouse button support
  useEffect(() => {
    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        goBack();
      } else if (e.button === 4) {
        e.preventDefault();
        goForward();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      }
    };

    window.addEventListener('auxclick', handleAuxClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('auxclick', handleAuxClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [historyIndex, historyStack]);

  const navItems = [
    { id: 'home', label: 'Translate', icon: Home },
    { id: 'conversation', label: 'Live Talk', icon: MessageSquare },
    { id: 'camera', label: 'Camera OCR', icon: Camera },
    { id: 'languages', label: 'Packs', icon: Languages },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={(screen) => navigateTo(screen)}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
            onSwapLanguages={handleSwapLanguages}
          />
        );
      case 'conversation':
        return (
          <LiveConversationScreen
            initialPersonALang={sourceLang}
            initialPersonBLang={targetLang}
          />
        );
      case 'camera':
        return (
          <CameraTranslateScreen
            initialTargetLang={targetLang}
            onTargetLangChange={setTargetLang}
          />
        );
      case 'coach':
        return (
          <PronunciationCoachScreen
            initialTargetLang={targetLang}
          />
        );
      case 'languages':
        return (
          <LanguageScreen
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
          />
        );
      case 'settings':
        return <SettingsScreen />;
      default:
        return (
          <HomeScreen
            onNavigate={(screen) => navigateTo(screen)}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
            onSwapLanguages={handleSwapLanguages}
          />
        );
    }
  };

  const [detailedStatus, setDetailedStatus] = useState(NetworkService.getDetailedStatus());

  useEffect(() => {
    return NetworkService.subscribeDetailed((status) => {
      setDetailedStatus(status);
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050814] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Subtle Dark Navy Travel Background */}
      <GlobalNetworkBackground />

      {/* Modern Top Header */}
      <header className="sticky top-0 z-40 bg-[#070d1e]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Back/Forward Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              aria-label="LinguaGo Home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                LG
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  LinguaGo
                </span>
                <span className="text-[10px] text-cyan-400 font-medium block -mt-0.5">
                  Travel AI
                </span>
              </div>
            </button>

            {/* Back / Forward Controls */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-3">
              <button
                onClick={goBack}
                disabled={historyIndex <= 0}
                title="Back (Alt+Left)"
                className="p-1.5 rounded-lg border border-slate-800 bg-[#0e1628] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={goForward}
                disabled={historyIndex >= historyStack.length - 1}
                title="Forward (Alt+Right)"
                className="p-1.5 rounded-lg border border-slate-800 bg-[#0e1628] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Go forward"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0b1326] p-1 rounded-2xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Truthful Connection & Mode Status Badge */}
          <button
            onClick={() => navigateTo('settings')}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono font-bold cursor-pointer hover:opacity-90 transition-opacity ${detailedStatus.badgeColor}`}
            title={`${detailedStatus.label} — ${detailedStatus.detail}`}
          >
            <span className={`w-2 h-2 rounded-full ${detailedStatus.dotColor}`} />
            <span>{detailedStatus.badge}</span>
          </button>
        </div>
      </header>

      {/* Main Container View */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-5 pb-24 md:pb-8">
        {renderScreen()}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a1020]/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2 z-40 shadow-2xl">
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer min-w-[56px] ${
                  isActive
                    ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
