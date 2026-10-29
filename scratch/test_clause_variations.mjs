import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = false;

async function testClauses() {
  const t = await pipeline('translation', 'Xenova/m2m100_418M', { dtype: 'q8' });

  const variations = [
    'gowtham is good in studies but bad in free fire game play',
    'Gowtham is good in studies, but bad at playing Free Fire.',
    'Gowtham is good at studying. But he is bad at playing Free Fire.',
    'Gowtham is good in studies.',
    'He is bad at playing Free Fire.',
    'He is bad in playing games.'
  ];

  console.log('Testing across languages (ta, hi, ml, kn):');
  for (const v of variations) {
    console.log('\n--- Input:', v);
    for (const lang of ['ta', 'hi', 'ml', 'kn']) {
      try {
        const res = await t(v, {
          src_lang: 'en',
          tgt_lang: lang,
          repetition_penalty: 1.25,
          no_repeat_ngram_size: 3
        });
        console.log(`  [${lang}]: ${res[0].translation_text}`);
      } catch (e) {
        console.log(`  [${lang}] Error:`, e.message);
      }
    }
  }
}

testClauses().catch(console.error);
