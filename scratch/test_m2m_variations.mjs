import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = false;

async function testVariations() {
  const translator = await pipeline('translation', 'Xenova/m2m100_418M', { dtype: 'q8' });

  const variations = [
    "The afternoon class was very boring, so I felt sleepy.",
    "The afternoon lecture was very boring, so I felt sleepy.",
    "The class in the afternoon was very boring, so I felt sleepy.",
    "The afternoon class was extremely boring, so I felt sleepy.",
    "The afternoon class was very dull, so I felt sleepy.",
    "Because the afternoon class was very boring, I felt sleepy.",
    "The afternoon class was very boring. Therefore, I felt sleepy."
  ];

  for (const v of variations) {
    const res = await translator(v, { src_lang: 'en', tgt_lang: 'ta', num_beams: 1 });
    console.log(`\nInput: "${v}"`);
    console.log(`Output: "${res[0].translation_text}"`);
  }
}

testVariations().catch(console.error);
