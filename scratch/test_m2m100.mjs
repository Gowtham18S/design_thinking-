import { pipeline, env } from '@huggingface/transformers';

console.log('Testing @huggingface/transformers...');
console.log('Cache dir:', env.cacheDir);

async function test() {
  try {
    console.log('Initializing translation pipeline with Xenova/m2m100_418M (quantized)...');
    const translator = await pipeline('translation', 'Xenova/m2m100_418M', {
      dtype: 'q8',
      progress_callback: (p) => {
        if (p.status === 'progress') {
          process.stdout.write(`\rDownloading ${p.file}: ${p.progress?.toFixed(1)}% (${(p.loaded/1024/1024).toFixed(1)}MB / ${(p.total/1024/1024).toFixed(1)}MB)`);
        } else if (p.status === 'done') {
          console.log(`\nFinished ${p.file}`);
        }
      }
    });

    console.log('\nModel loaded! Testing English to Tamil:');
    const res1 = await translator('Hello, how are you?', {
      src_lang: 'en',
      tgt_lang: 'ta',
    });
    console.log('Result 1 (en->ta):', JSON.stringify(res1));

    console.log('\nTesting Tamil to English:');
    const res2 = await translator('நான் நலமாக இருக்கிறேன்.', {
      src_lang: 'ta',
      tgt_lang: 'en',
    });
    console.log('Result 2 (ta->en):', JSON.stringify(res2));
  } catch (err) {
    console.error('Error in test:', err);
  }
}

test();
