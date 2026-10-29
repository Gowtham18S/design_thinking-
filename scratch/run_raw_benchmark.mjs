import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = false;

const sentences = [
  "I am going to college, and it is very boring.",
  "I am good at studying, but I play Free Fire poorly.",
  "Where is the nearest hospital?",
  "Please take me to the railway station.",
  "I need medical help.",
  "I am not hungry.",
  "I do not want to go there.",
  "My train to Chennai leaves at 5:30 PM.",
  "Where can I buy drinking water?",
  "I am lost. Can you help me find my hotel?"
];

const targetLangs = ['hi', 'ur', 'ta', 'ml', 'kn'];

async function run() {
  console.log('Loading M2M-100 (q8)...');
  const t0 = Date.now();
  const translator = await pipeline('translation', 'Xenova/m2m100_418M', { dtype: 'q8' });
  console.log(`Loaded in ${Date.now() - t0}ms\n`);

  for (const tgt of targetLangs) {
    console.log(`\n========================================`);
    console.log(`TARGET LANGUAGE: ${tgt.toUpperCase()}`);
    console.log(`========================================`);

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const start = Date.now();
      try {
        const out = await translator(s, {
          src_lang: 'en',
          tgt_lang: tgt,
          num_beams: 1,
          repetition_penalty: 1.25,
          no_repeat_ngram_size: 3,
          max_new_tokens: 120
        });
        const duration = Date.now() - start;
        const text = out[0].translation_text;
        console.log(`[${i + 1}] EN: "${s}"`);
        console.log(`    ${tgt.toUpperCase()}: "${text}" (${duration}ms)`);
      } catch (err) {
        console.error(`[${i + 1}] ERROR for "${s}":`, err.message);
      }
    }
  }
}

run().catch(console.error);
