/**
 * LinguaGo Accuracy Test Suite
 * Tests all 8 sentence types (A-H) across all genuinely supported offline languages.
 * Runs against the live http://localhost:5173/api/translate endpoint.
 *
 * Usage: node scratch/accuracy_test_suite.mjs
 */

// ============================================================
// TEST DEFINITIONS
// ============================================================
const TEST_SENTENCES = [
  {
    id: 'A',
    label: 'Normal Statement',
    en: 'I am going to college today.'
  },
  {
    id: 'B',
    label: 'Question',
    en: 'Where is the nearest hospital?'
  },
  {
    id: 'C',
    label: 'Request',
    en: 'Please take me to the railway station.'
  },
  {
    id: 'D',
    label: 'Emergency',
    en: 'I need medical help.'
  },
  {
    id: 'E',
    label: 'Multiple Sentences',
    en: 'I am lost. Can you help me find my hotel?'
  },
  {
    id: 'F',
    label: 'Contextual / Travel',
    en: 'Where can I buy a train ticket?'
  },
  {
    id: 'G',
    label: 'Informal + Proper Nouns',
    en: 'gowtham is good in studies but bad in free fire game play'
  },
  {
    id: 'H',
    label: 'Numbers + Proper Names',
    en: 'My train to Chennai leaves at 5:30 PM.'
  }
];

const TARGET_LANGUAGES = [
  { code: 'ta', name: 'Tamil', script: 'Tamil', latinExpected: false },
  { code: 'hi', name: 'Hindi', script: 'Devanagari', latinExpected: false },
  { code: 'ml', name: 'Malayalam', script: 'Malayalam', latinExpected: false },
  { code: 'kn', name: 'Kannada', script: 'Kannada', latinExpected: false },
  { code: 'bn', name: 'Bengali', script: 'Bengali', latinExpected: false },
  { code: 'mr', name: 'Marathi', script: 'Devanagari', latinExpected: false },
  { code: 'gu', name: 'Gujarati', script: 'Gujarati', latinExpected: false },
  { code: 'pa', name: 'Punjabi', script: 'Gurmukhi', latinExpected: false },
  { code: 'ur', name: 'Urdu', script: 'Perso-Arabic', latinExpected: false },
  { code: 'es', name: 'Spanish', script: 'Latin', latinExpected: true },
  { code: 'fr', name: 'French', script: 'Latin', latinExpected: true },
  { code: 'de', name: 'German', script: 'Latin', latinExpected: true }
];

// Common English content words that should NOT survive in non-Latin script output
const ENGLISH_CONTENT_WORDS = new Set([
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'good', 'bad', 'better', 'worse',
  'in', 'on', 'at', 'to', 'for', 'with',
  'studies', 'study', 'studying',
  'game', 'play', 'playing',
  'but', 'and', 'or', 'because',
  'he', 'she', 'they', 'we',
  'hospital', 'doctor', 'medical', 'help',
  'station', 'train', 'bus', 'ticket',
  'hotel', 'room', 'lost', 'passport'
]);

const ALLOWED_ENTITIES = new Set([
  'gowtham', 'gautam', 'sundar', 'priya', 'chennai', 'delhi', 'mumbai',
  'free', 'fire', 'google', 'youtube', 'pm', 'am', 'wifi'
]);

function assessTranslation(translated, original, latinExpected) {
  const issues = [];
  const suggestions = [];

  if (!translated || translated.trim().length === 0) {
    return { score: 0, issues: ['Empty output'], suggestions: ['Model failed to produce output'] };
  }

  // Check if output == input (no translation happened)
  if (translated.trim().toLowerCase() === original.trim().toLowerCase()) {
    return { score: 0, issues: ['Output identical to input — no translation occurred'], suggestions: ['Check src_lang/tgt_lang parameters'] };
  }

  // For non-Latin scripts, check for untranslated English words
  if (!latinExpected) {
    const latinTokens = (translated.match(/[A-Za-z]{3,}/g) || []).map(w => w.toLowerCase());
    const untranslated = latinTokens.filter(w =>
      ENGLISH_CONTENT_WORDS.has(w) && !ALLOWED_ENTITIES.has(w)
    );
    const entityOk = latinTokens.filter(w => ALLOWED_ENTITIES.has(w));

    if (untranslated.length > 0) {
      issues.push(`Untranslated English words detected: [${untranslated.join(', ')}]`);
      suggestions.push('Multi-pass pipeline should catch this via clause decomposition');
    }
    if (entityOk.length > 0) {
      suggestions.push(`Proper nouns retained (OK): [${entityOk.join(', ')}]`);
    }
  }

  // Check for repetition (3 or more consecutive identical characters/words)
  if (/(.{5,})\1{2,}/.test(translated)) {
    issues.push('Repetition loop detected in output');
    suggestions.push('Repetition penalty not effective for this pair');
  }

  // Check for very short output relative to input
  const srcWords = original.split(/\s+/).length;
  const tgtWords = translated.split(/\s+/).length;
  if (tgtWords < srcWords * 0.3 && srcWords > 4) {
    issues.push(`Output too short (${tgtWords} words vs ${srcWords} source words — ${Math.round(tgtWords / srcWords * 100)}%)`);
  }

  const score = issues.length === 0 ? 1.0 : Math.max(0.2, 1.0 - (issues.length * 0.3));
  return { score, issues, suggestions };
}

async function translate(text, tgt_lang) {
  const res = await fetch('http://localhost:5173/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, src_lang: 'en', tgt_lang })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function runAccuracyTests() {
  console.log('='.repeat(80));
  console.log('LINGUAGO OFFLINE TRANSLATION ACCURACY TEST SUITE');
  console.log('Testing 8 sentence types × 12 languages via live /api/translate endpoint');
  console.log(`Endpoint: http://localhost:5173/api/translate`);
  console.log('='.repeat(80));
  console.log('');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let apiErrors = 0;

  const perLangScores = {};
  const perSentenceScores = {};

  for (const test of TEST_SENTENCES) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`TEST ${test.id}: ${test.label}`);
    console.log(`Input: "${test.en}"`);
    console.log('─'.repeat(70));

    perSentenceScores[test.id] = { pass: 0, fail: 0, total: 0 };

    for (const lang of TARGET_LANGUAGES) {
      totalTests++;
      perSentenceScores[test.id].total++;
      if (!perLangScores[lang.code]) {
        perLangScores[lang.code] = { pass: 0, fail: 0, total: 0, name: lang.name };
      }
      perLangScores[lang.code].total++;

      try {
        const t0 = Date.now();
        const result = await translate(test.en, lang.code);
        const latency = Date.now() - t0;
        const translated = result.translatedText || result.translation || '';
        const assessment = assessTranslation(translated, test.en, lang.latinExpected);

        const statusIcon = assessment.score >= 0.9 ? '✓' : assessment.score >= 0.5 ? '~' : '✗';
        const status = assessment.score >= 0.9 ? 'PASS' : assessment.score >= 0.5 ? 'PARTIAL' : 'FAIL';

        if (assessment.score >= 0.9) {
          passedTests++;
          perSentenceScores[test.id].pass++;
          perLangScores[lang.code].pass++;
        } else {
          failedTests++;
          perSentenceScores[test.id].fail++;
          perLangScores[lang.code].fail++;
        }

        console.log(`  [${lang.code.toUpperCase()}] ${statusIcon} ${status} (${latency}ms, score: ${assessment.score.toFixed(2)})`);
        console.log(`       → "${translated}"`);
        if (assessment.issues.length > 0) {
          console.log(`       ⚠ ${assessment.issues.join(' | ')}`);
        }
        if (result.qualityWarning) {
          console.log(`       ℹ Quality warning: ${result.qualityWarning}`);
        }
      } catch (err) {
        apiErrors++;
        failedTests++;
        perLangScores[lang.code].fail++;
        perSentenceScores[test.id].fail++;
        console.log(`  [${lang.code.toUpperCase()}] ✗ API ERROR: ${err.message}`);
      }
    }
  }

  // ================================================================
  // FINAL REPORT
  // ================================================================
  console.log('\n' + '='.repeat(80));
  console.log('ACCURACY TEST REPORT');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests     : ${totalTests}`);
  console.log(`Passed          : ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed/Partial  : ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`API Errors      : ${apiErrors}`);

  console.log('\n─── Per-Language Accuracy ───');
  const langHeader = 'Language        Total  Pass  Fail  Accuracy';
  console.log(langHeader);
  console.log('─'.repeat(45));
  for (const [code, s] of Object.entries(perLangScores)) {
    const acc = ((s.pass / s.total) * 100).toFixed(0);
    console.log(`${(s.name + ' (' + code.toUpperCase() + ')').padEnd(18)}${String(s.total).padEnd(7)}${String(s.pass).padEnd(6)}${String(s.fail).padEnd(6)}${acc}%`);
  }

  console.log('\n─── Per-Sentence-Type Accuracy ───');
  const sHeader = 'Test  Label                   Pass/Total  Accuracy';
  console.log(sHeader);
  console.log('─'.repeat(52));
  for (const test of TEST_SENTENCES) {
    const s = perSentenceScores[test.id];
    const acc = ((s.pass / s.total) * 100).toFixed(0);
    console.log(`  ${test.id}   ${(test.label).padEnd(24)}${(s.pass + '/' + s.total).padEnd(12)}${acc}%`);
  }

  console.log('\n' + '='.repeat(80));
  const overallAcc = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`OVERALL ACCURACY: ${overallAcc}%`);
  console.log('='.repeat(80));
}

runAccuracyTests().catch(console.error);
