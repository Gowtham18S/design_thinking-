import { AutoTokenizer } from '@huggingface/transformers';

async function checkTokenizer() {
  const tokenizer = await AutoTokenizer.from_pretrained('Xenova/m2m100_418M');
  const text = "The afternoon class was very boring, so I felt sleepy.";
  const encoded = tokenizer(text);
  console.log('Encoded tokens:', encoded.input_ids);
  console.log('Token count:', encoded.input_ids.length);
  const decoded = encoded.input_ids.map(id => tokenizer.decode([id]));
  console.log('Token pieces:', decoded);
}

checkTokenizer().catch(console.error);
