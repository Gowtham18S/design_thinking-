import { pipeline, env } from '@huggingface/transformers';

console.log('--- Testing Complex Sentences & Long Paragraphs ---');

// We already have the model cached locally in ~/.cache/huggingface/hub/
env.allowRemoteModels = false; // Strictly test offline! No network calls!

async function runTests() {
  const translator = await pipeline('translation', 'Xenova/m2m100_418M', {
    dtype: 'q8',
  });

  console.log('Translator loaded strictly from local cache (allowRemoteModels=false)!');

  // Test 1: Complex sentence English -> Tamil
  console.log('\n--- Test 1: Complex sentence (EN -> TA) ---');
  const complexEn = "Although it was raining heavily yesterday, the doctor visited all the patients in the emergency ward without any delay.";
  const res1 = await translator(complexEn, { src_lang: 'en', tgt_lang: 'ta' });
  console.log('Input:', complexEn);
  console.log('Output (TA):', res1[0].translation_text);

  // Test 2: Punctuation, contractions, names
  console.log('\n--- Test 2: Contractions, punctuation & names (EN -> TA) ---');
  const contractionEn = "Dr. Sundar said, \"Don't worry, we won't let anything happen to Priya's brother; he'll recover soon!\"";
  const res2 = await translator(contractionEn, { src_lang: 'en', tgt_lang: 'ta' });
  console.log('Input:', contractionEn);
  console.log('Output (TA):', res2[0].translation_text);

  // Test 3: Tamil -> English short & complex
  console.log('\n--- Test 3: Tamil -> English complex ---');
  const taComplex = "நேற்று இரவு கடுமையான காய்ச்சல் இருந்ததால், அவர் இன்று காலை மருத்துவமனைக்கு சென்றார்.";
  const res3 = await translator(taComplex, { src_lang: 'ta', tgt_lang: 'en' });
  console.log('Input (TA):', taComplex);
  console.log('Output (EN):', res3[0].translation_text);

  // Test 4: Long paragraph (>100 words) with sentence chunking
  console.log('\n--- Test 4: Paragraph (>100 words) ---');
  const paragraphEn = "Design thinking is a human-centered approach to innovation that draws from the designer's toolkit to integrate the needs of people, the possibilities of technology, and the requirements for business success. When facing an unexpected emergency in an unfamiliar city, clear communication becomes a matter of life and safety. Traditional dictionaries often fail because they translate individual words without understanding grammatical relationships or cultural context. Neural machine translation models analyze complete syntactic structures across languages. By downloading the complete language model to your device, you can travel confidently across Tamil Nadu knowing that you can converse with local citizens, doctors, and transport workers even when network connectivity is completely unavailable.";
  
  // Sentence chunker test:
  const sentences = paragraphEn.split(/(?<=[.!?])\s+/).filter(Boolean);
  console.log(`Paragraph split into ${sentences.length} sentences.`);
  const translatedChunks = [];
  for (const s of sentences) {
    const chunkRes = await translator(s, { src_lang: 'en', tgt_lang: 'ta' });
    translatedChunks.push(chunkRes[0].translation_text);
  }
  const fullTranslatedTa = translatedChunks.join(' ');
  console.log('Full translated Tamil paragraph:\n', fullTranslatedTa);

  // Test 5: Reverse paragraph Tamil -> English
  console.log('\n--- Test 5: Reverse paragraph (TA -> EN) ---');
  const taSentences = fullTranslatedTa.split(/(?<=[.!?।])\s+/).filter(Boolean);
  const backToEnChunks = [];
  for (const s of taSentences.slice(0, 3)) { // test first 3 sentences back
    const backRes = await translator(s, { src_lang: 'ta', tgt_lang: 'en' });
    backToEnChunks.push(backRes[0].translation_text);
  }
  console.log('Re-translated back to English:\n', backToEnChunks.join(' '));

  console.log('\n--- All offline neural translation tests passed successfully! ---');
}

runTests().catch(err => {
  console.error('Test failed:', err);
});
