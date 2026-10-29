import { env, AutoTokenizer, AutoModelForSeq2SeqLM } from '@huggingface/transformers';

env.allowRemoteModels = false;

async function debugTokens() {
  const modelId = 'Xenova/m2m100_418M';
  const tokenizer = await AutoTokenizer.from_pretrained(modelId);
  const model = await AutoModelForSeq2SeqLM.from_pretrained(modelId, { dtype: 'q8' });

  const text = 'gowtham is good in studies but bad in free fire game play';
  console.log('--- Tokenizing text: ---', text);
  const encoded = tokenizer(text);
  console.log('Input IDs:', encoded.input_ids.data);
  for (const id of encoded.input_ids.data) {
    console.log(`  Token ${id}: "${tokenizer.decode([id])}"`);
  }

  // Generate for Tamil
  const taId = tokenizer.convert_tokens_to_ids('__ta__');
  const out = await model.generate({
    ...encoded,
    forced_bos_token_id: taId,
    max_new_tokens: 100,
  });

  console.log('\n--- Output Tokens: ---');
  for (const id of out[0].data) {
    console.log(`  Token ${id}: "${tokenizer.decode([id])}"`);
  }
  console.log('Decoded full:', tokenizer.decode(out[0].data, { skip_special_tokens: true }));
}

debugTokens().catch(console.error);
