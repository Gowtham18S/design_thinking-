/**
 * Target-Language Completeness Validator
 * Validates that the generated translation is a complete target-language sentence
 * without unacceptable untranslated source-language words.
 */

// Common English words that MUST be translated and should NEVER be left untranslated
const COMMON_ENGLISH_WORDS = new Set([
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'good', 'bad', 'better', 'best', 'worse', 'worst',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'studies', 'study', 'studying', 'school', 'college', 'exam',
  'game', 'games', 'play', 'playing', 'player', 'played',
  'but', 'and', 'or', 'so', 'because', 'although', 'however',
  'he', 'she', 'it', 'they', 'we', 'i', 'you',
  'his', 'her', 'their', 'our', 'my', 'your',
  'where', 'what', 'when', 'who', 'how', 'which',
  'hospital', 'doctor', 'medicine', 'medical', 'help',
  'station', 'train', 'bus', 'ticket', 'hotel', 'room',
  'food', 'water', 'meat', 'vegetarian', 'bill',
  'lost', 'passport', 'wallet', 'please', 'need'
]);

// Allowed proper nouns, brand names, and technical terms that MAY legitimately remain in Latin script
const ALLOWED_ENTITIES = new Set([
  'gowtham', 'gautam', 'goutham', 'sundar', 'priya', 'rahul', 'anand', 'kavitha',
  'free', 'fire', 'google', 'youtube', 'whatsapp', 'facebook', 'instagram', 'twitter',
  'netflix', 'amazon', 'uber', 'ola', 'chennai', 'delhi', 'mumbai', 'bangalore', 'kolkata',
  'hyderabad', 'kerala', 'tamil', 'nadu', 'india', 'wifi', 'wi-fi', 'ac', 'am', 'pm'
]);

export interface ValidationResult {
  isValid: boolean;
  untranslatedEnglishWords: string[];
  allowedEntityWords: string[];
  untranslatedRatio: number;
  qualityScore: number;
  reason?: string;
}

export class TargetCompletenessValidator {
  /**
   * Check if a script matches the target language
   */
  public static isTargetScriptNonLatin(targetLang: string): boolean {
    const nonLatinLangs = [
      'ta', 'hi', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa', 'ur', 'ar', 'ru', 'zh', 'ja', 'ko', 'te'
    ];
    return nonLatinLangs.includes(targetLang);
  }

  /**
   * Extract Latin words from text
   */
  public static extractLatinWords(text: string): string[] {
    const matches = text.match(/[A-Za-z0-9'-]+/g) || [];
    return matches.map(w => w.trim()).filter(Boolean);
  }

  /**
   * Validate that the target language translation does not contain unacceptable English leftovers
   */
  public static validate(
    translatedText: string,
    sourceText: string,
    sourceLang: string,
    targetLang: string
  ): ValidationResult {
    const trimmed = translatedText.trim();
    if (!trimmed) {
      return {
        isValid: false,
        untranslatedEnglishWords: [],
        allowedEntityWords: [],
        untranslatedRatio: 1.0,
        qualityScore: 0,
        reason: 'Empty translation output'
      };
    }

    // For Latin -> Latin (e.g. en -> es, fr, de, it, pt), skip script mismatch check
    if (!this.isTargetScriptNonLatin(targetLang)) {
      // Check if output is literally identical to source
      if (sourceLang === 'en' && trimmed.toLowerCase() === sourceText.toLowerCase().trim()) {
        return {
          isValid: false,
          untranslatedEnglishWords: ['(Entire sentence unchanged)'],
          allowedEntityWords: [],
          untranslatedRatio: 1.0,
          qualityScore: 0,
          reason: 'Sentence was copied without translation'
        };
      }
      return {
        isValid: true,
        untranslatedEnglishWords: [],
        allowedEntityWords: [],
        untranslatedRatio: 0,
        qualityScore: 0.95
      };
    }

    // For Latin -> Non-Latin (e.g. en -> ta, hi, ml, kn, bn, te, etc.)
    const latinTokens = this.extractLatinWords(trimmed);
    const untranslatedEnglishWords: string[] = [];
    const allowedEntityWords: string[] = [];

    for (const token of latinTokens) {
      const lower = token.toLowerCase();
      // Allow pure numbers, time strings (5:30, 2), or single letters
      if (/^\d+([:.]\d+)?$/.test(token) || token.length <= 1) {
        allowedEntityWords.push(token);
        continue;
      }

      if (COMMON_ENGLISH_WORDS.has(lower)) {
        untranslatedEnglishWords.push(token);
      } else if (ALLOWED_ENTITIES.has(lower)) {
        allowedEntityWords.push(token);
      } else {
        // Unknown Latin word in non-Latin target: flag as untranslated if longer than 2 chars
        if (token.length > 2) {
          untranslatedEnglishWords.push(token);
        } else {
          allowedEntityWords.push(token);
        }
      }
    }

    const totalWords = trimmed.split(/\s+/).length;
    const untranslatedRatio = untranslatedEnglishWords.length / Math.max(1, totalWords);

    // If more than 1 common English word remains in non-Latin output, it fails completeness
    const isValid = untranslatedEnglishWords.length === 0;
    const qualityScore = Math.max(0, 1.0 - untranslatedRatio * 1.5);

    return {
      isValid,
      untranslatedEnglishWords,
      allowedEntityWords,
      untranslatedRatio,
      qualityScore,
      reason: isValid
        ? undefined
        : `Translation contains ${untranslatedEnglishWords.length} untranslated English words: [${untranslatedEnglishWords.join(', ')}]`
    };
  }
}
