import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.resolve(process.cwd(), 'node_modules/@huggingface/transformers/.cache/Xenova/nllb-200-distilled-600M');

const FILES = [
  'config.json',
  'generation_config.json',
  'tokenizer_config.json',
  'tokenizer.json',
  'special_tokens_map.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx'
];

const BASE_URL = 'https://huggingface.co/Xenova/nllb-200-distilled-600M/resolve/main/';

async function downloadFile(relPath) {
  const destPath = path.join(TARGET_DIR, relPath);
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 1000) {
      console.log(`[SKIPPED] ${relPath} already exists (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      return;
    }
  }

  const url = BASE_URL + relPath;
  console.log(`[DOWNLOADING] ${relPath} from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  const totalBytes = Number(res.headers.get('content-length') || 0);
  const fileStream = fs.createWriteStream(destPath);

  const reader = res.body.getReader();
  let downloaded = 0;
  let lastLogged = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fileStream.write(value);
    downloaded += value.length;

    if (Date.now() - lastLogged > 3000) {
      const pct = totalBytes ? ((downloaded / totalBytes) * 100).toFixed(1) + '%' : '??%';
      console.log(`  -> ${relPath}: ${(downloaded / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB (${pct})`);
      lastLogged = Date.now();
    }
  }

  fileStream.end();
  console.log(`[COMPLETED] ${relPath} (${(downloaded / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  console.log('Downloading Xenova/nllb-200-distilled-600M to:', TARGET_DIR);
  for (const f of FILES) {
    await downloadFile(f);
  }
  console.log('\nAll NLLB-200 files downloaded successfully!');
}

main().catch(err => {
  console.error('Download error:', err);
  process.exit(1);
});
