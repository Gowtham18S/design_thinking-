import { pipeline, env } from '@huggingface/transformers';
import { SourceSentenceNormalizer } from '../src/services/source_sentence_normalizer.ts';
import { TargetCompletenessValidator } from '../src/services/target_completeness_validator.ts';
import { NativeScriptTransliteration } from '../src/services/native_script_transliteration.ts';

env.allowRemoteModels = false;

async function testFullPipeline() {
  const translator = await pipeline('translation', 'Xenova/m2m100_418M', { dtype: 'q8' });

  const testInputs = [
    'gowtham is good in studies but bad in free fire game play',
    'Where is the nearest hospital?',
    'Please take me to the railway station.',
    'I need medical help.',
    'I am lost. Can you help me find my hotel?',
    'My train to Chennai leaves at 5:30 PM.'
  ];

  const targetLangs = ['ta', 'hi', 'ml', 'kn', 'bn', 'es', 'fr', 'de'];

  for (const rawInput of testInputs) {
    console.log('\n================================================================');
    console.log('INPUT:', rawInput);
    const norm = SourceSentenceNormalizer.normalize(rawInput);
    console.log('NORMALIZED:', norm.normalizedText);

    for (const tgt of targetLangs) {
      // Pass 1: Unified translation of normalized text
      let pass1Out = '';
      try {
        const res = await translator(norm.normalizedText, {
          src_lang: 'en',
          tgt_lang: tgt,
          repetition_penalty: 1.25,
          no_repeat_ngram_size: 3
        });
        pass1Out = res[0].translation_text.trim();
      } catch (e) {
        pass1Out = `[Error: ${e.message}]`;
      }

      let validation = TargetCompletenessValidator.validate(pass1Out, rawInput, 'en', tgt);
      let finalOutput = pass1Out;
      let passUsed = 'Pass 1 (Direct Neural)';

      // Pass 2: Clause decomposition if Pass 1 had untranslated English words
      if (!validation.isValid && norm.hasClauses && norm.clauses.length >= 2) {
        passUsed = 'Pass 2 (Clause Decomposition)';
        const translatedClauses = [];
        for (const cl of norm.clauses) {
          const clRes = await translator(cl, {
            src_lang: 'en',
            tgt_lang: tgt,
            repetition_penalty: 1.25,
            no_repeat_ngram_size: 3
          });
          translatedClauses.push(clRes[0].translation_text.trim().replace(/[.!?।]$/, ''));
        }
        const nativeConj = NativeScriptTransliteration.getConjunction(norm.conjunction || 'but', tgt);
        finalOutput = `${translatedClauses[0]}, ${nativeConj} ${translatedClauses[1]}.`;
        validation = TargetCompletenessValidator.validate(finalOutput, rawInput, 'en', tgt);
      }

      // Transliterate proper nouns to native script for natural readability
      finalOutput = NativeScriptTransliteration.transliterateProperNouns(finalOutput, tgt);

      console.log(`  [${tgt.toUpperCase()}] (${passUsed}) Valid: ${validation.isValid ? 'YES' : 'NO'}`);
      console.log(`    -> "${finalOutput}"`);
      if (!validation.isValid) {
        console.log(`    -> Untranslated: ${validation.untranslatedEnglishWords.join(', ')}`);
      }
    }
  }
}

testFullPipeline().catch(console.error);
