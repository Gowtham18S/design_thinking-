import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  Sparkles,
  Volume2,
  Copy,
  Share2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Loader2,
  RefreshCw,
  CheckSquare,
  Square,
  Globe,
  HardDrive
} from 'lucide-react';
import type { LanguageCode } from '../types';
import { OCRService } from '../services/ocr_service';
import type { OCRResult } from '../services/ocr_service';
import { SearchableLanguageSelect } from '../widgets/language_selector';
import { TranslationEngine } from '../services/translation_engine';
import type { TranslationResult } from '../services/translation_engine';
import { SpeechService } from '../services/speech_service';
import { getLanguageByCode } from '../models/language';
import { NetworkService } from '../services/network_service';

interface CameraTranslateScreenProps {
  initialTargetLang?: LanguageCode;
  onTargetLangChange?: (lang: LanguageCode) => void;
}

export const CameraTranslateScreen: React.FC<CameraTranslateScreenProps> = ({
  initialTargetLang = 'ta',
  onTargetLangChange
}) => {
  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLang, setTargetLang] = useState<LanguageCode>(initialTargetLang);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [rotation, setRotation] = useState(0);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedResult, setTranslatedResult] = useState<TranslationResult | null>(null);
  const [isEditingCustomText, setIsEditingCustomText] = useState(false);
  const [customText, setCustomText] = useState('');

  // Q&A State
  const [activeTab, setActiveTab] = useState<'translate' | 'ask'>('translate');
  const [userQuestion, setUserQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Start live camera feed
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Camera access error:', e);
      setIsCameraActive(false);
      alert('Could not access camera device. You can upload an image from your gallery.');
    }
  };

  // Stop camera feed
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setImageSrc(capturedDataUrl);
      stopCamera();
      processImage(capturedDataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageSrc(dataUrl);
        stopCamera();
        processImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (dataUrl: string) => {
    setIsProcessingOCR(true);
    setTranslatedResult(null);
    setAiAnswer(null);
    setRotation(0);

    const res = await OCRService.performLocalOCR(dataUrl);
    setOcrResult(res);
    setSourceLang(res.detectedLang);
    setCustomText(res.rawText);
    setIsProcessingOCR(false);

    if (res.rawText && !res.error) {
      // Auto translate initial image text
      handleTranslateText(res.rawText, res.detectedLang, targetLang);
    }
  };

  const handleRotate = async () => {
    if (!imageSrc) return;
    const newRot = (rotation + 90) % 360;
    setRotation(newRot);
    const rotatedUrl = await OCRService.rotateImage(imageSrc, 90);
    setImageSrc(rotatedUrl);
    processImage(rotatedUrl);
  };

  const toggleBlockSelection = (blockId: string) => {
    if (!ocrResult) return;
    const updatedBlocks = ocrResult.blocks.map((b) =>
      b.id === blockId ? { ...b, selected: !b.selected } : b
    );
    setOcrResult({ ...ocrResult, blocks: updatedBlocks });
  };

  const selectAllBlocks = (select: boolean) => {
    if (!ocrResult) return;
    const updatedBlocks = ocrResult.blocks.map((b) => ({ ...b, selected: select }));
    setOcrResult({ ...ocrResult, blocks: updatedBlocks });
  };

  const handleTranslateText = async (
    textToTranslate?: string,
    srcL?: LanguageCode,
    tgtL?: LanguageCode
  ) => {
    const sLang = srcL || sourceLang;
    const tLang = tgtL || targetLang;

    let text = textToTranslate;
    if (!text && isEditingCustomText && customText.trim()) {
      text = customText.trim();
    } else if (!text && ocrResult) {
      const selectedBlocks = ocrResult.blocks.filter((b) => b.selected);
      text = selectedBlocks.map((b) => b.text).join('\n');
    }

    if (!text || !text.trim()) return;

    setIsTranslating(true);
    try {
      const res = await TranslationEngine.translate(text, sLang, tLang);
      setTranslatedResult(res);
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAskQuestion = async (presetQuestion?: string) => {
    const q = presetQuestion || userQuestion;
    if (!q || !q.trim() || !ocrResult) return;

    setIsAnswering(true);
    try {
      const selectedBlocks = ocrResult.blocks.filter((b) => b.selected);
      const answer = await OCRService.askAboutImage(
        ocrResult.rawText,
        selectedBlocks,
        q,
        targetLang
      );
      setAiAnswer(answer);
    } catch (e) {
      console.error('Q&A Error:', e);
      setAiAnswer('Sorry, I could not analyze this question for the image.');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSpeak = (text: string, lang: LanguageCode) => {
    setIsSpeaking(true);
    SpeechService.speak(text, lang, () => setIsSpeaking(false));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targetMeta = getLanguageByCode(targetLang);

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Camera Translate
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20 font-semibold">
                  Tesseract OCR + AI
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Photograph menus, signs, or notices to translate & ask questions instantly.
              </p>
            </div>
          </div>

          {/* Active Mode Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
                NetworkService.isOffline()
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {NetworkService.isOffline() ? 'Offline Mode (Local NLLB-200)' : 'Online Mode (Cloud API)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Camera / Image Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0c1322] border border-slate-800/80 shadow-xl space-y-4">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Live Camera Feed */}
        {isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-72 sm:h-96 object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-10 px-4">
              <button
                onClick={capturePhoto}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Take Picture</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3 rounded-2xl bg-slate-900/90 text-slate-300 font-bold text-xs border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Captured / Uploaded Image View */}
        {imageSrc && !isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
            <img
              src={imageSrc}
              alt="Scanned text preview"
              className="w-full max-h-80 object-contain mx-auto"
            />

            {/* Processing Scanner Overlay */}
            {isProcessingOCR && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-bold text-white tracking-wider animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Running Local OCR Text Scanner...
                </p>
              </div>
            )}

            {/* Image Toolbar */}
            <div className="p-3 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRotate}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Rotate image 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotate</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>New Photo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Initial Empty State Buttons */}
        {!imageSrc && !isCameraActive && (
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/50 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Scan & Translate Image Text</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Point your camera at a restaurant menu, hotel notice, or street sign to translate or ask questions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={startCamera}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>📷 Take Picture</span>
              </button>

              <span className="text-xs text-slate-500 font-bold uppercase">OR</span>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>🖼️ Choose from Gallery</span>
              </button>
            </div>
          </div>
        )}

        {/* OCR Result Error or Blurry Alert */}
        {ocrResult?.error && (
          <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 space-y-2 text-amber-200">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ocrResult.isBlurry ? 'Image Blurry' : 'No Text Detected'}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-amber-100">
              {ocrResult.error}
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {/* Detected Text & Navigation Tabs */}
        {ocrResult && ocrResult.blocks.length > 0 && !ocrResult.error && (
          <div className="space-y-4 pt-2">
            {/* Metadata Badges */}
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Detected:</span>
                <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {ocrResult.detectedLangName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  Local OCR Active
                </span>
              </div>
            </div>

            {/* Mode Switch Tabs: Translate Text vs Ask About Image */}
            <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('translate')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'translate'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Translate Text ({ocrResult.blocks.length} blocks)</span>
              </button>

              <button
                onClick={() => setActiveTab('ask')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'ask'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>❓ Ask About Image</span>
              </button>
            </div>

            {/* TAB 1: TRANSLATE TEXT */}
            {activeTab === 'translate' && (
              <div className="space-y-4">
                {/* Target Language Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Target Language:
                  </label>
                  <SearchableLanguageSelect
                    value={targetLang}
                    onChange={(code: LanguageCode) => {
                      setTargetLang(code);
                      if (onTargetLangChange) onTargetLangChange(code);
                      handleTranslateText(undefined, sourceLang, code);
                    }}
                    label="Target Language"
                  />
                </div>

                {/* Detected Text Blocks or Editable Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-slate-300 uppercase tracking-wider">
                      {isEditingCustomText ? 'Edit Extracted Text' : 'Detected Text Blocks'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingCustomText(!isEditingCustomText)}
                        className="text-[11px] text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        {isEditingCustomText ? 'View Blocks' : 'Edit Text'}
                      </button>
                      {!isEditingCustomText && (
                        <>
                          <span className="text-slate-600">•</span>
                          <button
                            onClick={() => selectAllBlocks(true)}
                            className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            onClick={() => selectAllBlocks(false)}
                            className="text-[11px] text-slate-400 hover:underline font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditingCustomText ? (
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={5}
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-medium leading-relaxed"
                      placeholder="Edit extracted OCR text here before translation..."
                    />
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-950 border border-slate-800 custom-scrollbar">
                      {ocrResult.blocks.map((block) => (
                        <div
                          key={block.id}
                          onClick={() => toggleBlockSelection(block.id)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            block.selected
                              ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 font-medium'
                              : 'bg-slate-900 border-slate-800/80 text-slate-500 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {block.selected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <span className="truncate">{block.text}</span>
                          </div>
                          {block.price !== undefined && (
                            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                              {block.currency || ''}{block.price}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Translate Action Button */}
                <button
                  disabled={isTranslating}
                  onClick={() => handleTranslateText()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Translating Selected Blocks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Translate Selected Text</span>
                    </>
                  )}
                </button>

                {/* Translation Output Card */}
                {translatedResult && (
                  <div className="w-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-700/60 p-4 shadow-xl space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        {translatedResult.engineUsed}
                      </span>
                      {translatedResult.isOffline !== false ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20 font-bold">
                          🟢 Local Translation
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20 font-bold">
                          🔵 Online Translation
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                          {targetMeta.flag} {targetMeta.name} ({targetMeta.nativeName})
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white leading-snug whitespace-pre-line tracking-wide">
                        {translatedResult.translatedText}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSpeak(translatedResult.translatedText, targetLang)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                            isSpeaking
                              ? 'bg-amber-500 text-slate-950 animate-pulse'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
                        </button>

                        <button
                          onClick={() => handleCopy(translatedResult.translatedText)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: 'Camera Translation', text: translatedResult.translatedText });
                          } else {
                            handleCopy(translatedResult.translatedText);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                        title="Share translation"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ASK ABOUT THIS IMAGE */}
            {activeTab === 'ask' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 space-y-1">
                  <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    Ask Natural Language Questions About This Image
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Ask anything about the menu, prices, notices, or signs. Answers will be provided in <span className="font-bold text-white">{targetMeta.name} ({targetMeta.nativeName})</span>.
                  </p>
                </div>

                {/* Preset Question Suggestion Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Quick Sample Questions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '🥗 What is vegetarian?',
                      '💰 What is the cheapest item?',
                      '🍗 Which items contain chicken?',
                      '⚠️ What does this sign mean?',
                      '🏨 What is the check-out time?'
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setUserQuestion(chip.slice(2));
                          handleAskQuestion(chip.slice(2));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-950 text-slate-200 text-xs font-semibold border border-slate-800 hover:border-indigo-500/50 transition-all active:scale-95 cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Input Box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskQuestion();
                    }}
                    placeholder="Ask a question (e.g. 'What is vegetarian?')..."
                    className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
                  />
                  <button
                    disabled={isAnswering}
                    onClick={() => handleAskQuestion()}
                    className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isAnswering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>

                {/* AI Answer Card */}
                {aiAnswer && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-800/60 shadow-xl space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs border-b border-indigo-900/60 pb-2">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        AI Vision Analysis Answer
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                        {targetMeta.name} ({targetMeta.nativeName})
                      </span>
                    </div>

                    <p className="text-sm text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                      {aiAnswer}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleSpeak(aiAnswer, targetLang)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                          isSpeaking
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={() => handleCopy(aiAnswer)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                      >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
