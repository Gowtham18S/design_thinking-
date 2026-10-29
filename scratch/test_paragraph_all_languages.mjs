import { pipeline, env } from '@huggingface/transformers';
import { SourceToTranslationConsistencyCheck } from '../src/services/source_to_translation_consistency_check.ts';
import { PROBLEM_PARAGRAPH, SEMANTIC_TEST_CASES } from './test_fixtures.mjs';

env.allowRemoteModels = false;

async function testAll() {
  console.log('Loading Xenova/nllb-200-distilled-600M...');
  const translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M', { dtype: 'q8' });

  const targets = [
    { code: 'ta', nllb: 'tam_Taml', name: 'Tamil' },
    { code: 'hi', nllb: 'hin_Deva', name: 'Hindi' },
    { code: 'kn', nllb: 'kan_Knda', name: 'Kannada' },
    { code: 'ml', nllb: 'mal_Mlym', name: 'Malayalam' },
    { code: 'ur', nllb: 'urd_Arab', name: 'Urdu' },
    { code: 'te', nllb: 'tel_Telu', name: 'Telugu' }
  ];

  const sentences = PROBLEM_PARAGRAPH.split(/(?<=[.!?\n।])\s+/).map(s => s.trim()).filter(Boolean);

  console.log('\n================================================================');
  console.log('SECTION 7: PROBLEM PARAGRAPH TEST ACROSS ALL 6 LANGUAGES');
  console.log('================================================================\n');

  for (const t of targets) {
    console.log(`\n--------------------------------------------------------------`);
    console.log(`TARGET: ${t.name.toUpperCase()} (${t.code})`);
    console.log(`--------------------------------------------------------------`);

    const translatedSentences = [];
    const t0 = Date.now();

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const res = await translator(s, {
        src_lang: 'eng_Latn',
        tgt_lang: t.nllb,
        max_new_tokens: 150
      });
      const translated = res[0].translation_text.trim();
      translatedSentences.push(translated);
      console.log(`[S${i+1}] ${s}`);
      console.log(`     -> ${translated}`);
    }

    const fullParagraph = translatedSentences.join(' ');
    const totalTime = Date.now() - t0;
    console.log(`\nFull Paragraph (${totalTime}ms total):`);
    console.log(fullParagraph);

    // Run Source-to-Translation Consistency Validator
    const report = SourceToTranslationConsistencyCheck.validate(
      PROBLEM_PARAGRAPH,
      fullParagraph,
      'en',
      t.code
    );

    console.log('\nConsistency Check:');
    console.log(`  Consistent: ${report.isConsistent}`);
    console.log(`  Quality Score: ${(report.qualityScore * 100).toFixed(1)}%`);
    console.log(`  Sentence Count: ${report.targetSentencesCount}/${report.sourceSentencesCount}`);
    console.log(`  Negation Preserved: ${report.negationPreserved}`);
    if (report.issues.length > 0) console.log(`  Issues:`, report.issues);
    if (report.warnings.length > 0) console.log(`  Warnings:`, report.warnings);
  }

  console.log('\n================================================================');
  console.log('SECTION 8: COMMON MEANING ERRORS (NEGATION, TIME, CAUSE, ETC.)');
  console.log('================================================================\n');

  for (const testCase of SEMANTIC_TEST_CASES) {
    console.log(`\n[${testCase.category}] "${testCase.sentence}"`);
    console.log(`Target expectation: ${testCase.expectedMeaning}`);
    for (const t of targets) {
      const res = await translator(testCase.sentence, {
        src_lang: 'eng_Latn',
        tgt_lang: t.nllb,
        max_new_tokens: 100
      });
      console.log(`  [${t.code}] ${res[0].translation_text.trim()}`);
    }
  }
}

testAll().catch(console.error);
