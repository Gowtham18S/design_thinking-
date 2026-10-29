import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = false;

async function debugSentence3() {
  console.log('Loading M2M100 pipeline...');
  const translator = await pipeline('translation', 'Xenova/m2m100_418M', { dtype: 'q8' });

  const input = "The afternoon class was very boring, so I felt sleepy.";

  console.log('\nInput:', input);

  // Test 1: Current settings (num_beams: 1, repetition_penalty: 1.25, no_repeat_ngram_size: 3)
  console.log('\n--- Test 1: num_beams: 1, repetition_penalty: 1.25, no_repeat_ngram_size: 3 ---');
  let out1 = await translator(input, {
    src_lang: 'en',
    tgt_lang: 'ta',
    num_beams: 1,
    repetition_penalty: 1.25,
    no_repeat_ngram_size: 3,
    max_new_tokens: 120
  });
  console.log('Result 1:', out1[0].translation_text);

  // Test 2: Standard greedy (num_beams: 1, no penalties)
  console.log('\n--- Test 2: num_beams: 1, no penalties ---');
  let out2 = await translator(input, {
    src_lang: 'en',
    tgt_lang: 'ta',
    num_beams: 1,
    max_new_tokens: 120
  });
  console.log('Result 2:', out2[0].translation_text);

  // Test 3: Beam search (num_beams: 4)
  console.log('\n--- Test 3: num_beams: 4 ---');
  let out3 = await translator(input, {
    src_lang: 'en',
    tgt_lang: 'ta',
    num_beams: 4,
    max_new_tokens: 120
  });
  console.log('Result 3:', out3[0].translation_text);

  // Test 4: Beam search (num_beams: 5)
  console.log('\n--- Test 4: num_beams: 5 ---');
  let out4 = await translator(input, {
    src_lang: 'en',
    tgt_lang: 'ta',
    num_beams: 5,
    max_new_tokens: 120
  });
  console.log('Result 4:', out4[0].translation_text);

  // Test 5: Clause split: "The afternoon class was very boring." + "So I felt sleepy."
  console.log('\n--- Test 5: Clauses split ---');
  let c1 = await translator("The afternoon class was very boring.", { src_lang: 'en', tgt_lang: 'ta', num_beams: 4 });
  let c2 = await translator("So I felt sleepy.", { src_lang: 'en', tgt_lang: 'ta', num_beams: 4 });
  console.log('Clause 1:', c1[0].translation_text);
  console.log('Clause 2:', c2[0].translation_text);
}

debugSentence3().catch(console.error);
