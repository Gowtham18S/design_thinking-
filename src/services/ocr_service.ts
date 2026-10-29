import { createWorker } from 'tesseract.js';
import type { LanguageCode } from '../types';
import { TranslationEngine } from './translation_engine';
import { getLanguageByCode } from '../models/language';

export interface OCRBlock {
  id: string;
  text: string;
  confidence: number;
  selected: boolean;
  price?: number;
  currency?: string;
}

export interface OCRResult {
  rawText: string;
  blocks: OCRBlock[];
  detectedLang: LanguageCode;
  detectedLangName: string;
  confidence: number;
  isBlurry: boolean;
  isLocalOCR: boolean;
  error?: string;
}

let tesseractWorkerPromise: Promise<any> | null = null;

async function getWorker(onProgress?: (progress: number, stage: string) => void) {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      try {
        const worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (onProgress && typeof m.progress === 'number') {
              onProgress(Math.round(m.progress * 100), m.status || 'Extracting text...');
            }
          }
        });
        return worker;
      } catch (err) {
        console.warn('Tesseract worker init error:', err);
        tesseractWorkerPromise = null;
        throw err;
      }
    })();
  }
  return tesseractWorkerPromise;
}

export const OCRService = {
  async rotateImage(dataUrl: string, degrees: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject(new Error('Failed to load image for rotation'));
      img.src = dataUrl;
    });
  },

  detectScriptLanguage(text: string): LanguageCode {
    if (!text || !text.trim()) return 'en';

    // Japanese Hiragana / Katakana
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    // Korean Hangul
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    // Chinese Characters (without Japanese kana)
    if (/[\u4e00-\u9faf]/.test(text)) return 'zh';
    // Devanagari (Hindi/Marathi)
    if (/[\u0900-\u097f]/.test(text)) {
      if (/आहे|मदत|रक्त|पाणी|नाही/.test(text)) return 'mr';
      return 'hi';
    }
    // Tamil
    if (/[\u0b80-\u0bff]/.test(text)) return 'ta';
    // Telugu
    if (/[\u0c00-\u0c7f]/.test(text)) return 'te';
    // Malayalam
    if (/[\u0d00-\u0d7f]/.test(text)) return 'ml';
    // Kannada
    if (/[\u0c80-\u0cff]/.test(text)) return 'kn';
    // Bengali
    if (/[\u0980-\u09ff]/.test(text)) return 'bn';
    // Arabic / Urdu
    if (/[\u0600-\u06ff]/.test(text)) {
      if (/کیا|ہے|کہاں|مجھے/.test(text)) return 'ur';
      return 'ar';
    }
    // Cyrillic (Russian / Ukrainian)
    if (/[\u0400-\u04ff]/.test(text)) {
      if (/і|ї|є|г/.test(text)) return 'uk';
      return 'ru';
    }
    // Spanish
    if (/[\u00c1\u00e1\u00c9\u00e9\u00cd\u00ed\u00d3\u00f3\u00da\u00fa\u00d1\u00f1\u00bf\u00a1]/.test(text) || /\b(el|la|los|las|de|en|por|para|con|hola|gracias|estación|hospital|salida)\b/i.test(text)) {
      return 'es';
    }
    // French
    if (/[\u00e0\u00e2\u00e7\u00e8\u00e9\u00ea\u00eb\u00ee\u00ef\u00f4\u00f9\u00fb]/.test(text) || /\b(le|la|les|du|des|et|en|bonjour|merci|sortie)\b/i.test(text)) {
      return 'fr';
    }
    // German
    if (/[\u00e4\u00f6\u00fc\u00df]/.test(text)) return 'de';
    // Italian
    if (/\b(il|la|i|le|di|del|della|per|buongiorno|grazie|stazione|uscita)\b/i.test(text)) return 'it';

    return 'en';
  },

  /**
   * Genuine OCR engine using real Tesseract.js WASM inference
   */
  async performLocalOCR(
    dataUrl: string,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<OCRResult> {
    try {
      // 1. Analyze image contrast and check for blank or blurry input
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image.'));
        image.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return {
          rawText: '',
          blocks: [],
          detectedLang: 'en',
          detectedLangName: 'English',
          confidence: 0,
          isBlurry: false,
          isLocalOCR: true,
          error: 'Could not initialize image processing canvas.'
        };
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      let variance = 0;
      for (let i = 0; i < data.length; i += 16) {
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        variance += Math.pow(lum - avgBrightness, 2);
      }
      const stdDev = Math.sqrt(variance / (data.length / 16));
      const isBlurry = stdDev < 10;

      if (isBlurry) {
        return {
          rawText: '',
          blocks: [],
          detectedLang: 'en',
          detectedLangName: 'English',
          confidence: 0,
          isBlurry: true,
          isLocalOCR: true,
          error: 'The image appears blurry or has very low contrast. Please retake a sharper photo.'
        };
      }

      // 2. Perform Real Tesseract.js OCR
      const worker = await getWorker(onProgress);
      const ret = await worker.recognize(dataUrl);

      const rawText = ret.data.text.trim();
      const lines: string[] = rawText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

      if (lines.length === 0) {
        return {
          rawText: '',
          blocks: [],
          detectedLang: 'en',
          detectedLangName: 'English',
          confidence: 0,
          isBlurry: false,
          isLocalOCR: true,
          error: 'No readable text was detected in this image. Try taking a clearer picture with better lighting.'
        };
      }

      const extractedBlocks: OCRBlock[] = lines.map((lineText: string, idx: number) => {
        const priceMatch = lineText.match(/(?:[₹$€¥£]|INR|USD|JPY|EUR)\s*\d+(?:\.\d+)?|\d+\s*(?:[₹$€¥£]|INR|USD|JPY|rupees|yen)/i);
        let numericPrice: number | undefined = undefined;
        let currencyStr: string | undefined = undefined;

        if (priceMatch) {
          const digits = lineText.match(/\d+/);
          if (digits) numericPrice = parseInt(digits[0], 10);
          const currSymbol = lineText.match(/[₹$€¥£]|INR|USD|JPY|EUR/i);
          if (currSymbol) currencyStr = currSymbol[0];
        }

        return {
          id: `block_${idx}_${Date.now()}`,
          text: lineText,
          confidence: Math.round((ret.data.confidence || 85)) / 100,
          selected: true,
          price: numericPrice,
          currency: currencyStr
        };
      });

      const detectedLang = this.detectScriptLanguage(rawText);
      const langMeta = getLanguageByCode(detectedLang);

      return {
        rawText,
        blocks: extractedBlocks,
        detectedLang,
        detectedLangName: `${langMeta.name} (${langMeta.nativeName})`,
        confidence: Math.round((ret.data.confidence || 85)) / 100,
        isBlurry: false,
        isLocalOCR: true
      };
    } catch (err: any) {
      console.error('OCR processing error:', err);
      return {
        rawText: '',
        blocks: [],
        detectedLang: 'en',
        detectedLangName: 'English',
        confidence: 0,
        isBlurry: false,
        isLocalOCR: true,
        error: err?.message || 'Failed to process image OCR. Please ensure the image is clear.'
      };
    }
  },

  async askAboutImage(
    imageText: string,
    blocks: OCRBlock[],
    userQuestion: string,
    targetLang: LanguageCode
  ): Promise<string> {
    const q = userQuestion.toLowerCase().trim();
    let answerInEnglish = '';

    const lines = blocks.map(b => b.text);

    // Q1: Vegetarian items query
    if (q.includes('veg') || q.includes('vegetarian') || q.includes('saakaahaari')) {
      const vegItems = lines.filter(line =>
        /paneer|dal|rice|roti|naan|salad|soup|dosa|idli|sambar|veg|gobi|mushroom|aloo/i.test(line) &&
        !/chicken|mutton|fish|pork|beef|egg|seafood/i.test(line)
      );
      if (vegItems.length > 0) {
        answerInEnglish = `The vegetarian options found in this image are:\n• ` + vegItems.join('\n• ');
      } else {
        answerInEnglish = 'All detected items appear to contain non-vegetarian ingredients or no distinct vegetarian items were identified.';
      }
    }
    // Q2: Cheapest item query
    else if (q.includes('cheap') || q.includes('lowest') || q.includes('price') || q.includes('least expensive')) {
      const itemsWithPrice = blocks.filter(b => b.price !== undefined);
      if (itemsWithPrice.length > 0) {
        itemsWithPrice.sort((a, b) => (a.price || 0) - (b.price || 0));
        const cheapest = itemsWithPrice[0];
        answerInEnglish = `The cheapest item is "${cheapest.text}" at ${cheapest.currency || ''}${cheapest.price}.`;
      } else {
        answerInEnglish = 'No specific price tags were detected in the visible text.';
      }
    }
    // Q3: Non-veg / Chicken items query
    else if (q.includes('chicken') || q.includes('meat') || q.includes('non-veg')) {
      const chickenItems = lines.filter(line => /chicken|mutton|fish|meat|poultry/i.test(line));
      if (chickenItems.length > 0) {
        answerInEnglish = `Items containing chicken/meat in this image:\n• ` + chickenItems.join('\n• ');
      } else {
        answerInEnglish = 'No chicken or meat items were detected in the visible text.';
      }
    }
    // General Q&A fallback
    else {
      answerInEnglish = `Based on the scanned text in the image: "${imageText.slice(0, 140)}...", this image contains text relating to signs, notices, or items.`;
    }

    if (targetLang === 'en') {
      return answerInEnglish;
    }

    const translatedResult = await TranslationEngine.translate(answerInEnglish, 'en', targetLang);
    return translatedResult.translatedText || answerInEnglish;
  }
};
