import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = false;

const reverseTests = [
  // Hindi -> English
  { src: 'hi', text: 'निकटतम अस्पताल कहां है?', desc: 'Where is nearest hospital?' },
  { src: 'hi', text: 'कृपया मुझे रेलवे स्टेशन पर ले जाएं।', desc: 'Please take me to railway station' },
  { src: 'hi', text: 'मुझे चिकित्सा सहायता की जरूरत है।', desc: 'I need medical help' },
  { src: 'hi', text: 'मैं भूखा नहीं हूं।', desc: 'I am not hungry' },
  { src: 'hi', text: 'मैं वहां नहीं जाना चाहता।', desc: 'I do not want to go there' },

  // Urdu -> English
  { src: 'ur', text: 'قریب ترین ہسپتال کہاں ہے؟', desc: 'Where is nearest hospital?' },
  { src: 'ur', text: 'مجھے طبی مدد کی ضرورت ہے۔', desc: 'I need medical help' },
  { src: 'ur', text: 'میں بھوکا نہیں ہوں', desc: 'I am not hungry' },
  { src: 'ur', text: 'میں پینے کا پانی کہاں خرید سکتا ہوں؟', desc: 'Where can I buy drinking water?' },

  // Tamil -> English
  { src: 'ta', text: 'அருகிலுள்ள மருத்துவமனை எங்கே உள்ளது?', desc: 'Where is nearest hospital?' },
  { src: 'ta', text: 'எனக்கு மருத்துவ உதவி தேவை.', desc: 'I need medical help' },
  { src: 'ta', text: 'நான் அங்கு போக விரும்பவில்லை.', desc: 'I do not want to go there' },
  { src: 'ta', text: 'ரயில் நிலையம் எங்கே உள்ளது?', desc: 'Where is railway station?' },

  // Malayalam -> English
  { src: 'ml', text: 'ഏറ്റവും അടുത്ത ആശുപത്രി എവിടെയാണ്?', desc: 'Where is nearest hospital?' },
  { src: 'ml', text: 'എനിക്ക് ഡോക്ടറുടെ സഹಾಯം ആവശ്യമാണ്.', desc: 'I need medical help' },
  { src: 'ml', text: 'എവിടെ കുടിക്കുന്ന വെള്ളം വാങ്ങാം?', desc: 'Where can I buy drinking water?' }
];

async function runReverse() {
  const translator = await pipeline('translation', 'Xenova/m2m100_418M', { dtype: 'q8' });
  console.log('--- REVERSE DIRECTION BENCHMARK (INDIC -> EN) ---');

  for (const item of reverseTests) {
    const t0 = Date.now();
    const out = await translator(item.text, {
      src_lang: item.src,
      tgt_lang: 'en',
      num_beams: 1,
      repetition_penalty: 1.25,
      no_repeat_ngram_size: 3,
      max_new_tokens: 100
    });
    const dur = Date.now() - t0;
    console.log(`[${item.src.toUpperCase()} -> EN] In: "${item.text}" (${item.desc})`);
    console.log(`   Out: "${out[0].translation_text}" (${dur}ms)`);
  }
}

runReverse().catch(console.error);
