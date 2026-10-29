import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import of local NMT service
const { LocalNMTService } = await import('./src/services/local_nmt_service.ts');

const PORT = process.env.PORT || 5174;

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  try {
    if (url === '/api/status' && req.method === 'GET') {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const code = parsedUrl.searchParams.get('code') || 'ta';
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        isOfflineReady: LocalNMTService.isModelInstalled(code),
        packs: LocalNMTService.getPacks()
      }));
      return;
    }

    if (url === '/api/packs' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(LocalNMTService.getPacks()));
      return;
    }

    if (url === '/api/packs/install' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await LocalNMTService.installPack(body.code || 'ta');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }

    if (url === '/api/packs/uninstall' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await LocalNMTService.uninstallPack(body.code || 'ta');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }

    if (url === '/api/translate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const text = body.text || '';
      const sourceLang = body.sourceLang || body.src_lang || 'en';
      const targetLang = body.targetLang || body.tgt_lang || 'ta';
      const result = await LocalNMTService.translate(text, sourceLang, targetLang);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }

    // Serve static model files if requested directly
    if (url.startsWith('/models/Xenova/m2m100_418M/')) {
      const cacheBase = path.resolve(__dirname, 'node_modules/@huggingface/transformers/.cache/Xenova/m2m100_418M');
      const relPath = decodeURIComponent(url.replace('/models/Xenova/m2m100_418M/', ''));
      const fullPath = path.join(cacheBase, relPath);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes = {
          '.json': 'application/json',
          '.onnx': 'application/octet-stream',
          '.model': 'application/octet-stream',
          '.wasm': 'application/wasm'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Length', fs.statSync(fullPath).size);
        fs.createReadStream(fullPath).pipe(res);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`LinguaGo Dedicated Translation Server running on http://localhost:${PORT}`);
});
