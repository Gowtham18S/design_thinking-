import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = false;

const languages = ['hi', 'ur', 'ml', 'kn', 'te'];
const input = "The afternoon class was very boring, so I felt sleepy.";

async function run() {
  const translator = await pipeline('translation', 'Xenova/m2m100_418M', { dtype: 'q8' });

  for (const lang of languages) {
    try {
      const out = await translator(input, { src_lang: 'en', tgt_lang: lang, num_beams: 1 });
      console.log(`[${lang}] -> ${out[0].translation_text}`);
    } catch (e) {
      console.log(`[${lang}] Error: ${e.message}`);
    }
  }
}

run().catch(console.error);
