import { pipeline, env } from '@huggingface/transformers';

// Strictly offline!
env.allowRemoteModels = false;

const testSentence = "The afternoon class was very boring, so I felt sleepy.";

async function runTest() {
  console.log('Loading Xenova/nllb-200-distilled-600M offline...');
  const start = Date.now();
  const translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M', { dtype: 'q8' });
  console.log('Loaded in', ((Date.now() - start) / 1000).toFixed(2), 's');

  const targets = [
    { code: 'ta', nllb: 'tam_Taml', name: 'Tamil' },
    { code: 'hi', nllb: 'hin_Deva', name: 'Hindi' },
    { code: 'ur', nllb: 'urd_Arab', name: 'Urdu' },
    { code: 'kn', nllb: 'kan_Knda', name: 'Kannada' },
    { code: 'ml', nllb: 'mal_Mlym', name: 'Malayalam' },
    { code: 'te', nllb: 'tel_Telu', name: 'Telugu' }
  ];

  console.log(`\nInput: "${testSentence}"\n`);

  for (const t of targets) {
    const sTime = Date.now();
    const res = await translator(testSentence, {
      src_lang: 'eng_Latn',
      tgt_lang: t.nllb,
      max_new_tokens: 100
    });
    const dur = Date.now() - sTime;
    console.log(`[${t.name} (${t.code})] (${dur}ms):`);
    console.log(`  -> ${res[0].translation_text}`);
  }
}

runTest().catch(console.error);
