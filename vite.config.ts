import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { LocalNMTService } from './src/services/local_nmt_service.ts';

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        resolve(JSON.parse(body));
      } catch (err) {
        try {
          const params = new URLSearchParams(body);
          const obj: any = {};
          for (const [k, v] of params.entries()) obj[k] = v;
          resolve(obj);
        } catch {
          resolve({});
        }
      }
    });
  });
}

function serveTranslationApiPlugin() {
  const cacheBase = path.resolve(process.cwd(), 'node_modules/@huggingface/transformers/.cache/Xenova/m2m100_418M');

  return {
    name: 'serve-translation-api',
    configureServer(server: any) {
      // 1. API Endpoints for translation and packs
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = (req.url || '').split('?')[0];

        // Status endpoint
        if (url === '/api/status' && req.method === 'GET') {
          const reqUrl = new URL(req.url || '', 'http://localhost');
          const code = reqUrl.searchParams.get('code') || 'ta';
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            isOfflineReady: LocalNMTService.isModelInstalled(code),
            packs: LocalNMTService.getPacks()
          }));
          return;
        }

        // Packs list
        if (url === '/api/packs' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(LocalNMTService.getPacks()));
          return;
        }

        // Install pack
        if (url === '/api/packs/install' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const langCode = body.code || 'ta';
            const result = await LocalNMTService.installPack(langCode);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e?.message || 'Install failed' }));
          }
          return;
        }

        // Uninstall pack
        if (url === '/api/packs/uninstall' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const langCode = body.code || 'ta';
            const result = await LocalNMTService.uninstallPack(langCode);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e?.message || 'Uninstall failed' }));
          }
          return;
        }

        // Translate text
        if (url === '/api/translate' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const text = body.text || '';
            const sourceLang = body.sourceLang || body.src_lang || 'en';
            const targetLang = body.targetLang || body.tgt_lang || 'ta';
            const result = await LocalNMTService.translate(text, sourceLang, targetLang);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              translatedText: '',
              error: e?.message || 'Translation failed'
            }));
          }
          return;
        }

        // 2. Static Model Cache delivery
        if (url.startsWith('/models/Xenova/m2m100_418M/')) {
          try {
            const relativeUrl = decodeURIComponent(url.replace('/models/Xenova/m2m100_418M/', ''));
            const filePath = path.join(cacheBase, relativeUrl);

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeTypes: Record<string, string> = {
                '.json': 'application/json',
                '.onnx': 'application/octet-stream',
                '.model': 'application/octet-stream',
                '.wasm': 'application/wasm'
              };

              const stat = fs.statSync(filePath);
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
              res.setHeader('Content-Length', stat.size.toString());
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

              const stream = fs.createReadStream(filePath);
              stream.pipe(res);
              return;
            }
          } catch (err) {
            console.error('Error serving model cache file:', err);
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serveTranslationApiPlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  }
});
