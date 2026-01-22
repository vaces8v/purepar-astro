import { createServer } from 'http';
import { handler as ssrHandler } from './dist/server/entry.mjs';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const compressionMiddleware = compression();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, 'dist', 'client');

const contentTypeByExt = {
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const serveStatic = (req, res) => {
  if (!req.url) return false;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/ceny' || pathname === '/ceny/') {
    res.statusCode = 301;
    res.setHeader('Location', '/uslugi/otdelka-bani');
    res.end();
    return true;
  }

  if (pathname === '/materialy' || pathname === '/materialy/' || pathname.startsWith('/materialy/')) {
    res.statusCode = 301;
    res.setHeader('Location', '/uslugi/otdelka-bani');
    res.end();
    return true;
  }

  if (pathname === '/uslugi' || pathname === '/uslugi/') {
    res.statusCode = 301;
    res.setHeader('Location', '/uslugi/otdelka-bani');
    res.end();
    return true;
  }

  if (
    pathname.startsWith('/uslugi/') &&
    pathname !== '/uslugi/otdelka-bani' &&
    pathname !== '/uslugi/remont-bani' &&
    pathname !== '/uslugi/otdelka-sauny'
  ) {
    res.statusCode = 301;
    res.setHeader('Location', '/uslugi/otdelka-bani');
    res.end();
    return true;
  }

  if (pathname === '/sitemap.xml') {
    res.statusCode = 301;
    res.setHeader('Location', '/sitemap-index.xml');
    res.end();
    return true;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  if (pathname.includes('..')) return false;

  const relPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(clientRoot, relPath);
  if (!filePath.startsWith(clientRoot)) return false;

  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = contentTypeByExt[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);

    if (req.method === 'HEAD') {
      res.statusCode = 200;
      res.end();
      return true;
    }

    res.statusCode = 200;
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
};

const server = createServer((req, res) => {
  compressionMiddleware(req, res, () => {
    if (serveStatic(req, res)) return;
    ssrHandler(req, res);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOSTNAME || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server with compression listening on http://${HOST}:${PORT}`);
});
