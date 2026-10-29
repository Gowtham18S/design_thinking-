import { env, AutoTokenizer, AutoModelForSeq2SeqLM } from '@huggingface/transformers';

env.allowRemoteModels = false;

async function debugVariations() {
  const modelId = 'Xenova/m2m100_418M';
  const tokenizer = await AutoTokenizer.from_pretrained(modelId);
  const model = await AutoModelForSeq2SeqLM.from_pretrained(modelId, { dtype: 'q8' });
  const taId = tokenizer.convert_tokens_to_ids('__ta__');

  const tests = [
    'gowtham is good in studies but bad in free fire game play',
    'Gowtham is good in studies, but bad at playing Free Fire.',
    'Gowtham is good at studies. But he is bad at playing Free Fire.',
    'Gowtham is good in academics, but bad at playing Free Fire.',
    'Gowtham is good at studies, but he plays Free Fire poorly.',
    'He is good in studies, but bad at playing games.'
  ];

  for (const text of tests) {
    console.log('\n======================================================');
    console.log('INPUT:', text);
    const encoded = tokenizer(text);
    const out = await model.generate({
      ...encoded,
      forced_bos_token_id: taId,
      max_new_tokens: 100,
      repetition_penalty: 1.25,
      no_repeat_ngram_size: 3
    });
    // Convert BigInts to numbers for tokenizer.decode
    const tokenIds = Array.from(out[0].data).map(x => Number(x));
    const decoded = tokenizer.decode(tokenIds, { skip_special_tokens: true });
    console.log('DECODED (TA):', decoded);
  }
}

debugVariations().catch(console.error);
