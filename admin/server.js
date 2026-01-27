import { createServer } from 'http';
import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { extname, join, resolve } from 'path';

const port = Number(process.env.PORT || 80);
const root = resolve(process.cwd(), 'dist');
const apiTarget = process.env.API_PROXY_TARGET || 'http://api:4000';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.map': 'application/json; charset=utf-8'
};

const serveFile = async (filePath, res) => {
  const ext = extname(filePath).toLowerCase();
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  createReadStream(filePath).pipe(res);
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const proxyApiRequest = async (req, res) => {
  const targetUrl = new URL(req.url || '/', apiTarget);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(',') : value);
  }
  headers.delete('host');
  headers.set('x-forwarded-host', req.headers.host || '');
  headers.set('x-forwarded-proto', 'https');

  const method = req.method || 'GET';
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : await readRequestBody(req);

  const response = await fetch(targetUrl, {
    method,
    headers,
    body
  });

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') {
      return;
    }
    res.setHeader(key, value);
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
};

const resolvePath = (urlPath) => {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = decoded.startsWith('/') ? decoded.slice(1) : decoded;
  const fullPath = resolve(root, safePath);
  if (!fullPath.startsWith(root)) {
    return null;
  }
  return fullPath;
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = req.url || '/';
    if (urlPath.startsWith('/api/')) {
      await proxyApiRequest(req, res);
      return;
    }
    let filePath = resolvePath(urlPath);
    if (!filePath) {
      res.statusCode = 400;
      res.end('Bad request');
      return;
    }

    const stats = await fs.stat(filePath).catch(() => null);
    if (stats && stats.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const exists = await fs.stat(filePath).catch(() => null);
    if (!exists || !exists.isFile()) {
      filePath = join(root, 'index.html');
    }

    await serveFile(filePath, res);
  } catch (error) {
    res.statusCode = 500;
    res.end('Server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Admin console serving on http://0.0.0.0:${port}`);
});
