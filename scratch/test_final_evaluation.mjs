import { LocalNMTService } from '../src/services/local_nmt_service.ts';
import { PROBLEM_PARAGRAPH, SEMANTIC_TEST_CASES } from './test_fixtures.mjs';

async function runEvaluation() {
  console.log('================================================================');
  console.log('LINGUAGO PRODUCTION ACCURACY & RESILIENCE EVALUATION SUITE');
  console.log('================================================================\n');

  const targets = [
    { code: 'ta', name: 'Tamil' },
    { code: 'hi', name: 'Hindi' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'ur', name: 'Urdu' },
    { code: 'te', name: 'Telugu' }
  ];

  // 1. Cold start measurement
  console.log('--- 1. Cold Start Inference Benchmark ---');
  const coldStartT0 = Date.now();
  const coldRes = await LocalNMTService.translate('Where is the railway station?', 'en', 'ta');
  const coldDuration = Date.now() - coldStartT0;
  console.log(`Cold start translation completed in ${coldDuration}ms`);
  console.log(`Result: "${coldRes.translatedText}" (${coldRes.engineUsed})\n`);

  // Subsequent inference measurement
  const subT0 = Date.now();
  const subRes = await LocalNMTService.translate('Where is the nearest hospital?', 'en', 'ta');
  const subDuration = Date.now() - subT0;
  console.log(`Subsequent translation completed in ${subDuration}ms`);
  console.log(`Result: "${subRes.translatedText}"\n`);

  // 2. Section 7: Problematic Paragraph Across All 6 Languages
  console.log('================================================================');
  console.log('--- 2. Section 7: Regression Paragraph Test (All 6 Languages) ---');
  console.log('================================================================\n');

  for (const t of targets) {
    console.log(`\n>>> Language: ${t.name.toUpperCase()} (${t.code})`);
    const t0 = Date.now();
    const res = await LocalNMTService.translate(PROBLEM_PARAGRAPH, 'en', t.code);
    const dur = Date.now() - t0;

    console.log(`Translation (${dur}ms):`);
    console.log(res.translatedText);
    console.log(`Engine: ${res.engineUsed} | Confidence: ${res.confidence}`);

    if (res.consistencyReport) {
      console.log(`Consistency: ${res.consistencyReport.isConsistent ? 'VALID' : 'FLAGGED'}`);
      console.log(`Quality Score: ${(res.consistencyReport.qualityScore * 100).toFixed(1)}%`);
      console.log(`Sentences: ${res.consistencyReport.targetSentencesCount}/${res.consistencyReport.sourceSentencesCount}`);
      console.log(`Negation Preserved: ${res.consistencyReport.negationPreserved}`);
      if (res.consistencyReport.issues.length > 0) console.log('Issues:', res.consistencyReport.issues);
      if (res.consistencyReport.warnings.length > 0) console.log('Warnings:', res.consistencyReport.warnings);
    }
  }

  // 3. Section 8: Common Meaning Errors Test Suite
  console.log('\n================================================================');
  console.log('--- 3. Section 8: Common Meaning Errors (Negation, Time, etc.) ---');
  console.log('================================================================\n');

  for (const testCase of SEMANTIC_TEST_CASES) {
    console.log(`\n[${testCase.category}] "${testCase.sentence}"`);
    console.log(`Expected Meaning: ${testCase.expectedMeaning}`);
    for (const t of targets) {
      const res = await LocalNMTService.translate(testCase.sentence, 'en', t.code);
      console.log(`  [${t.code}] ${res.translatedText}`);
    }
  }

  console.log('\n================================================================');
  console.log('ALL ACCURACY BENCHMARKS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runEvaluation().catch(console.error);
