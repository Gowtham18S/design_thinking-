import { LocalNMTService } from '../src/services/local_nmt_service.ts';

const testParagraph = "Yesterday, I went to college by bus because my bike was not working. After reaching college, I attended my classes and had lunch with my friends. The afternoon class was very boring, so I felt sleepy. After college, I wanted to go to the railway station, but I did not know the correct route. I asked a local person for directions, and he helped me find the station. Before returning home, I bought some drinking water from a nearby shop.";

async function run() {
  console.log('Testing paragraph in Tamil (ta)...');
  const resTa = await LocalNMTService.translate(testParagraph, 'en', 'ta');
  console.log('\n--- TAMIL TRANSLATION ---');
  console.log('Translated Text:\n', resTa.translatedText);
  console.log('Engine:', resTa.engineUsed);
  console.log('Duration:', resTa.durationMs, 'ms');

  // Let's also inspect individual sentences
  const sentences = testParagraph.split(/(?<=[.!?\n।])\s+/).map(s => s.trim()).filter(Boolean);
  console.log('\n--- SENTENCE BY SENTENCE TRANSLATION (ta) ---');
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const singleRes = await LocalNMTService.translate(s, 'en', 'ta');
    console.log(`[${i+1}] ${s}`);
    console.log(`    -> ${singleRes.translatedText}`);
  }
}

run().catch(console.error);
