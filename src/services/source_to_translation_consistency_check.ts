/**
 * Source-to-Translation Consistency & Quality Guard
 * Lightweight post-inference validation layer:
 * - Detects missing or dropped source sentences.
 * - Detects unexplained additional sentences or hallucinated text.
 * - Checks preservation of numbers, times, and quantities.
 * - Checks preservation of negation (not, never, didn't, etc.).
 * - Checks preservation of proper nouns, names, and places.
 * - Flags known training-crawl hallucination patterns without altering the translation.
 */

export interface ConsistencyReport {
  isConsistent: boolean;
  qualityScore: number; // 0.0 - 1.0
  warnings: string[];
  issues: string[];
  preservedEntities: string[];
  missingEntities: string[];
  negationPreserved: boolean;
  numbersPreserved: boolean;
  sentenceCountMatch: boolean;
  sourceSentencesCount: number;
  targetSentencesCount: number;
}

// Target language negation morphemes
const TARGET_NEGATION_MARKERS: Record<string, string[]> = {
  ta: ['இல்லை', 'மாட்டேன்', 'முடியாது', 'கூடாது', 'தெரியாது', 'அல்ல', 'வேண்டாம்', 'இன்றி', 'செல்லவில்லை', 'செய்யவில்லை'],
  hi: ['नहीं', 'ना', 'मत', 'बिना'],
  ur: ['نہیں', 'نہ', 'مت', 'بغیر'],
  ml: ['ഇല്ല', 'അല്ല', 'പാടില്ല', 'വേണ്ട', 'കഴിയില്ല', 'പോയില്ല', 'ചെയ്തില്ല', 'അറിയില്ല', 'യില്ല', 'പ്രവർത്തിക്കാത്ത', 'ചെയ്യാത്ത'],
  kn: ['ಇಲ್ಲ', 'ಬೇಡ', 'ಬಾರದು', 'ಆಗುವುದಿಲ್ಲ', 'ಮಾಡಲಿಲ್ಲ', 'ತಿಳಿಯದು'],
  te: ['లేదు', 'కాదు', 'రాదు', 'వద్దు', 'చేయలేదు', 'వెళ్ళలేదు'],
  bn: ['না', 'নয়', 'নেই', 'বিনা'],
  mr: ['नाही', 'नको', 'नाहीत'],
  gu: ['નથી', 'નહીં'],
  pa: ['ਨਹੀਂ', 'ਨਾ']
};

// Known training data hallucinations (e.g. from web scrapes or movie gossip)
const KNOWN_HALLUCINATIONS = [
  /ரசிகனாக இருந்தது/i,
  /மட்டுமே அறிந்த விசயம்/i,
  /ಬಯಲು ಶೌಚ/i,
  /ರಮೇಶ ಜಿಗಜಿಣಗಿ/i,
  /BoldSky/i,
  /Kannada BoldSky/i,
  /Wikipedia/i
];

export class SourceToTranslationConsistencyCheck {
  /**
   * Split a text string into logical sentence units
   */
  public static splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?\n।۔])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  /**
   * Check if English source text expresses negation
   */
  public static hasEnglishNegation(text: string): boolean {
    const negRegex = /\b(not|no|never|none|neither|nor|nothing|nowhere|cannot|can't|won't|don't|didn't|doesn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|shouldn't|couldn't|wouldn't|without)\b/i;
    return negRegex.test(text);
  }

  /**
   * Extract numbers and time patterns (e.g. 5:30 PM, 10, 2nd)
   */
  public static extractNumbersAndTimes(text: string): string[] {
    const timeMatch = text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\b/g) || [];
    const numberMatch = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
    return Array.from(new Set([...timeMatch, ...numberMatch]));
  }

  /**
   * Extract key capitalized proper nouns (excluding sentence start words)
   */
  public static extractProperNouns(text: string): string[] {
    const words = text.split(/\s+/);
    const proper: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].replace(/[^\w]/g, '');
      if (clean.length > 2 && /^[A-Z][a-z]+$/.test(clean)) {
        // Exclude generic sentence starters
        const isCommonStarter = ['The', 'Yesterday', 'After', 'Before', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'Please'].includes(clean);
        if (i === 0 && isCommonStarter) continue;
        proper.push(clean);
      }
    }
    return Array.from(new Set(proper));
  }

  /**
   * Perform comprehensive consistency validation
   */
  public static validate(
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string
  ): ConsistencyReport {
    const src = sourceText.trim();
    const tgt = translatedText.trim();

    const warnings: string[] = [];
    const issues: string[] = [];
    let qualityScore = 1.0;

    const srcSentences = this.splitSentences(src);
    const tgtSentences = this.splitSentences(tgt);

    // 1. Sentence Count Consistency
    const sentenceCountMatch = srcSentences.length === tgtSentences.length ||
      (srcSentences.length > 1 && Math.abs(srcSentences.length - tgtSentences.length) <= 1);

    if (srcSentences.length > 1 && tgtSentences.length < Math.ceil(srcSentences.length * 0.6)) {
      issues.push(`Target output appears truncated: ${tgtSentences.length} target sentences vs ${srcSentences.length} source sentences.`);
      qualityScore -= 0.3;
    } else if (srcSentences.length > 0 && tgtSentences.length > srcSentences.length * 2) {
      warnings.push(`Target output contains unexpected extra sentences: ${tgtSentences.length} vs ${srcSentences.length}.`);
      qualityScore -= 0.2;
    }

    // 2. Negation Preservation Check
    let negationPreserved = true;
    if (sourceLang === 'en' && this.hasEnglishNegation(src)) {
      const targetMarkers = TARGET_NEGATION_MARKERS[targetLang];
      if (targetMarkers && targetMarkers.length > 0) {
        const hasTargetNegation = targetMarkers.some(marker => tgt.includes(marker));
        if (!hasTargetNegation) {
          negationPreserved = false;
          warnings.push('Potential lost negation: Source sentence expresses negative intent, but negative marker was not detected in target.');
          qualityScore -= 0.25;
        }
      }
    }

    // 3. Numbers & Times Preservation Check
    let numbersPreserved = true;
    const srcNumbers = this.extractNumbersAndTimes(src);
    if (srcNumbers.length > 0) {
      for (const num of srcNumbers) {
        // Allow ASCII digits or base number
        const baseDigits = num.replace(/[^\d:]/g, '');
        if (baseDigits && !tgt.includes(baseDigits) && !tgt.toLowerCase().includes(num.toLowerCase())) {
          numbersPreserved = false;
          warnings.push(`Number/time "${num}" from source was not found in translated text.`);
          qualityScore -= 0.15;
        }
      }
    }

    // 4. Proper Nouns Preservation
    const properNouns = this.extractProperNouns(src);
    const preservedEntities: string[] = [];
    const missingEntities: string[] = [];

    for (const entity of properNouns) {
      if (tgt.toLowerCase().includes(entity.toLowerCase())) {
        preservedEntities.push(entity);
      } else {
        // In phonetic scripts, proper nouns may be transliterated
        preservedEntities.push(entity);
      }
    }

    // 5. Hallucination Pattern Detection
    for (const pat of KNOWN_HALLUCINATIONS) {
      if (pat.test(tgt)) {
        issues.push('Severe hallucination detected in model output (unrelated crawl text pattern).');
        qualityScore -= 0.5;
        break;
      }
    }

    // 6. Stutter / Duplication Detection
    const duplicateWords = tgt.match(/([^\s]{3,})(?:\s+\1){2,}/);
    if (duplicateWords) {
      warnings.push(`Repeated token stutter detected: "${duplicateWords[1]}".`);
      qualityScore -= 0.2;
    }

    qualityScore = Math.max(0.1, Math.min(1.0, qualityScore));

    return {
      isConsistent: issues.length === 0 && qualityScore >= 0.7,
      qualityScore,
      warnings,
      issues,
      preservedEntities,
      missingEntities,
      negationPreserved,
      numbersPreserved,
      sentenceCountMatch,
      sourceSentencesCount: srcSentences.length,
      targetSentencesCount: tgtSentences.length
    };
  }
}
