import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './lib/handler.js';
import { initializeData } from './lib/database.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json'
};

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  };
}

async function serveStatic(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.writeHead(405, { Allow: 'GET, HEAD', ...securityHeaders() }); res.end('Method not allowed'); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname); }
  catch { res.writeHead(400, securityHeaders()); res.end('Bad request'); return; }
  if (pathname === '/') pathname = '/index.html';
  const requested = path.resolve(PUBLIC_DIR, `.${pathname}`);
  if (!requested.startsWith(`${PUBLIC_DIR}${path.sep}`) && requested !== PUBLIC_DIR) {
    res.writeHead(403, securityHeaders()); res.end('Forbidden'); return;
  }
  let file = requested;
  try {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) file = path.join(file, 'index.html');
    const content = await fs.readFile(file);
    const extension = path.extname(file).toLowerCase();
    const headers = { ...securityHeaders(), 'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600' };
    res.writeHead(200, headers);
    if (req.method === 'HEAD') res.end(); else res.end(content);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') console.error('[static]', error);
    const notFound = Buffer.from('Not found');
    res.writeHead(404, { ...securityHeaders(), 'Content-Type': 'text/plain; charset=utf-8' }); res.end(notFound);
  }
}

const server = http.createServer(async (req, res) => {
  const headers = securityHeaders();
  if (req.url?.startsWith('/api/')) {
    for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
    await handleApi(req, res);
    return;
  }
  await serveStatic(req, res);
});

await initializeData();
server.listen(PORT, () => {
  console.log(`\n  SkillPath is ready  →  http://localhost:${PORT}`);
  console.log('  Public demo         →  http://localhost:' + PORT + '/#/demo');
  console.log('  Student login       →  student@skillpath.demo / SkillpathDemo26!');
  console.log('  Admin login         →  admin@skillpath.demo / AdminDemo26!\n');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
