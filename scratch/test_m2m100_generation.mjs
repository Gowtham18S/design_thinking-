import { pipeline, env, AutoTokenizer, AutoModelForSeq2SeqLM } from '@huggingface/transformers';

env.allowRemoteModels = false;

async function testGeneration() {
  const modelId = 'Xenova/m2m100_418M';
  const tokenizer = await AutoTokenizer.from_pretrained(modelId);
  const model = await AutoModelForSeq2SeqLM.from_pretrained(modelId, { dtype: 'q8' });

  console.log('Tokenizer special tokens:');
  console.log('ta token:', tokenizer.convert_tokens_to_ids('__ta__'));
  console.log('hi token:', tokenizer.convert_tokens_to_ids('__hi__'));
  console.log('ml token:', tokenizer.convert_tokens_to_ids('__ml__'));
  console.log('kn token:', tokenizer.convert_tokens_to_ids('__kn__'));
  console.log('te token:', tokenizer.convert_tokens_to_ids('__te__'));

  const inputTexts = [
    'gowtham is good in studies but bad in free fire game play',
    'Gowtham is good in studies, but bad in playing Free Fire game.',
    'Gowtham is very good at studying, but he plays Free Fire poorly.',
    'He is good in studies but bad in game.'
  ];

  for (const text of inputTexts) {
    console.log('\n=============================================');
    console.log('Input:', text);
    
    // Test 1: Standard pipeline
    const t = await pipeline('translation', modelId, { dtype: 'q8' });
    const res1 = await t(text, { src_lang: 'en', tgt_lang: 'ta' });
    console.log('Pipeline default:', res1[0].translation_text);

    // Test 2: Direct model generate with forced_bos_token_id for ta
    const taId = tokenizer.convert_tokens_to_ids('__ta__');
    const encoded = tokenizer(text);
    const outputTokens = await model.generate({
      ...encoded,
      forced_bos_token_id: taId,
      max_new_tokens: 100,
      num_beams: 4,
      repetition_penalty: 1.25,
      no_repeat_ngram_size: 3
    });
    const decoded = tokenizer.decode(outputTokens[0], { skip_special_tokens: true });
    console.log('Model.generate(forced_bos_token_id, num_beams=4):', decoded);
  }
}

testGeneration().catch(console.error);
