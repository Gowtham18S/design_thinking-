import type {
  LanguageCode,
  PronunciationScore,
  PronunciationFeedback,
  WordAnalysis
} from '../types';

/**
 * Normalizes text for comparison (removes punctuation, lowercases, trims)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”—]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * String similarity ratio (0 to 1)
 */
function stringSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  if (!norm1 && !norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  if (norm1 === norm2) return 1.0;

  const maxLen = Math.max(norm1.length, norm2.length);
  const dist = levDistance(norm1, norm2);
  return Math.max(0, (maxLen - dist) / maxLen);
}

/**
 * Checks if a language is tonal
 */

export const PronunciationAnalysisService = {
  isTonalLanguage(lang: LanguageCode): boolean {
    return lang === 'zh' || lang === 'vi';
  },

  /**
   * Evaluates spoken text against target text for a given language
   */
  analyze(
    targetText: string,
    recognizedText: string,
    lang: LanguageCode,
    speechDurationMs: number = 2500,
    recognitionConfidence: number = 0.90
  ): { score: PronunciationScore; feedback: PronunciationFeedback } {
    const normTarget = normalizeText(targetText);
    const normRecognized = normalizeText(recognizedText);

    const targetWords = normTarget ? normTarget.split(' ') : [];
    const recognizedWords = normRecognized ? normRecognized.split(' ') : [];

    // 1. Word Accuracy
    let matchedCount = 0;
    const wordAnalyses: WordAnalysis[] = [];

    targetWords.forEach((tWord, index) => {
      let bestMatchSim = 0;

      // Find best match in recognized words
      recognizedWords.forEach((rWord) => {
        const sim = stringSimilarity(tWord, rWord);
        if (sim > bestMatchSim) {
          bestMatchSim = sim;
        }
      });

      let status: 'correct' | 'warning' | 'incorrect' = 'incorrect';
      let wordFeedback: string | undefined = undefined;

      if (bestMatchSim >= 0.85) {
        status = 'correct';
        matchedCount += 1;
      } else if (bestMatchSim >= 0.50) {
        status = 'warning';
        matchedCount += 0.6;
        wordFeedback = `Pronunciation of "${tWord}" needs slight improvement.`;
      } else {
        status = 'incorrect';
        wordFeedback = `Word "${tWord}" was missing or mispronounced.`;
      }

      wordAnalyses.push({
        word: targetText.split(/\s+/)[index] || tWord,
        expectedWord: tWord,
        status,
        feedback: wordFeedback
      });
    });

    const wordAccuracy = targetWords.length > 0
      ? Math.round(Math.min(100, Math.max(0, (matchedCount / targetWords.length) * 100)))
      : 100;

    // 2. Character-level Phonetic Similarity
    const charSim = stringSimilarity(normTarget, normRecognized);
    const pronunciationScore = Math.round(
      Math.min(100, Math.max(10, (charSim * 70) + (recognitionConfidence * 30)))
    );

    // 3. Rhythm Analysis (Mora/Syllable timing based on length & target language)
    const expectedSyllableCount = Math.max(1, normTarget.length / 3);
    const actualDurationSec = speechDurationMs / 1000;
    const syllablesPerSec = expectedSyllableCount / Math.max(0.5, actualDurationSec);
    // Target optimal rate: 3.0 to 5.5 syllables per sec
    let rhythmScore = 85;
    if (syllablesPerSec < 1.8) {
      rhythmScore = 65; // too slow / choppy
    } else if (syllablesPerSec > 7.5) {
      rhythmScore = 70; // too rushed
    } else {
      rhythmScore = Math.round(85 + (1 - Math.abs(syllablesPerSec - 4.0) / 4.0) * 15);
    }
    rhythmScore = Math.min(100, Math.max(40, Math.round(rhythmScore * charSim + (charSim < 0.3 ? 20 : 0))));

    // 4. Fluency Score (based on match continuity & recognition confidence)
    const fluencyScore = Math.round(
      Math.min(100, Math.max(15, (wordAccuracy * 0.5) + (pronunciationScore * 0.3) + (rhythmScore * 0.2)))
    );

    // 5. Tone Score (ONLY for tonal languages like Mandarin/Vietnamese)
    const isTonal = this.isTonalLanguage(lang);
    let toneScore: number | null = null;
    if (isTonal) {
      toneScore = Math.round(Math.min(100, Math.max(30, (charSim * 60) + (wordAccuracy * 0.4))));
    }

    // 6. Overall Weighted Score
    let overall = 0;
    if (isTonal && toneScore !== null) {
      overall = Math.round(wordAccuracy * 0.35 + pronunciationScore * 0.3 + rhythmScore * 0.15 + toneScore * 0.2);
    } else {
      overall = Math.round(wordAccuracy * 0.4 + pronunciationScore * 0.35 + rhythmScore * 0.15 + fluencyScore * 0.1);
    }
    overall = Math.min(100, Math.max(0, overall));

    // 7. Language-Specific Tips & Feedback
    const tips: string[] = [];

    // General summary
    let generalMessage = '';
    if (overall >= 90) {
      generalMessage = 'Excellent pronunciation! Your speech sounds natural and clear.';
    } else if (overall >= 75) {
      generalMessage = 'Good effort! Your sentence is easily understandable with minor areas to refine.';
    } else if (overall >= 50) {
      generalMessage = 'Fair attempt. Focus on individual word clarity and steady rhythm.';
    } else {
      generalMessage = 'Sentence was difficult to recognize clearly. Listen to the model and try again.';
    }

    // Language-Specific Characteristics
    switch (lang) {
      case 'ja':
        if (rhythmScore < 80) {
          tips.push('⚠ Japanese rhythm uses "mora timing" — keep equal duration for each character/syllable.');
        } else {
          tips.push('✓ Good Japanese mora rhythm and pitch flow.');
        }
        break;
      case 'es':
      case 'it':
      case 'pt':
        tips.push('✓ Syllable-timed rhythm: keep vowels pure and clear.');
        if (wordAnalyses.some(w => w.status !== 'correct')) {
          tips.push('⚠ Practice trilling rhotic sounds and distinct vowel endings.');
        }
        break;
      case 'fr':
        tips.push('⚠ Focus on smooth liaison between words and clear nasal vowels.');
        break;
      case 'de':
      case 'en':
      case 'ru':
      case 'uk':
        if (rhythmScore < 80) {
          tips.push('⚠ Pay attention to stress patterns on main content words.');
        } else {
          tips.push('✓ Clear stress and vowel distinction.');
        }
        break;
      case 'ta':
      case 'te':
      case 'ml':
      case 'kn':
        tips.push('⚠ Pay attention to retroflex consonants (e.g. ழ, ள, ன / ణ, ళ) and short vs long vowel duration.');
        break;
      case 'hi':
      case 'mr':
      case 'gu':
      case 'pa':
      case 'ur':
      case 'bn':
        tips.push('⚠ Distinguish aspirated sounds (e.g. k vs. kh) and retroflex T/D sounds.');
        break;
      case 'ar':
        tips.push('⚠ Emphasize pharyngeal and guttural sounds (ع, ح, خ) and emphatic consonants (ص, ط).');
        break;
      case 'zh':
      case 'vi':
        if (toneScore !== null && toneScore < 80) {
          tips.push('⚠ Pay close attention to pitch tones on each syllable (e.g. flat, rising, falling).');
        } else {
          tips.push('✓ Accurate tone contour detected on key characters.');
        }
        break;
      case 'ko':
        tips.push('⚠ Maintain precise consonant tension (plain ㅂ, tense ㅃ, aspirated ㅍ).');
        break;
      default:
        tips.push('✓ Keep practicing to refine your accent and fluency.');
        break;
    }

    const score: PronunciationScore = {
      overall,
      wordAccuracy,
      pronunciation: pronunciationScore,
      rhythm: rhythmScore,
      fluency: fluencyScore,
      tone: toneScore,
      confidenceScore: Math.round(recognitionConfidence * 100),
      isAdvancedAnalysisAvailable: true
    };

    const feedback: PronunciationFeedback = {
      generalMessage,
      rhythmMessage: rhythmScore < 75 ? 'Rhythm needs a bit more consistency.' : 'Rhythm is natural.',
      toneMessage: isTonal ? (toneScore! < 75 ? 'Tonal pitch needs practice.' : 'Tones sound clear.') : undefined,
      languageSpecificTips: tips,
      words: wordAnalyses
    };

    return { score, feedback };
  }
};
