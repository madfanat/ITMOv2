import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { classificationApi } from './api.mjs';

const dist = new URL('../dist/', import.meta.url);
const index = new URL('index.html', dist);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
};
const port = Number(process.env.PORT ?? '4173');
const api = classificationApi(process.env);

await stat(index);

async function serve(request, response) {
  const path = request.url?.split('?')[0] ?? '';
  const asset = path.match(/^\/assets\/([\w.-]+\.(js|css|woff2))$/);
  const file = path === '/' ? index : asset ? new URL(`assets/${asset[1]}`, dist) : null;
  if (!file || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }

  const metadata = await stat(file).catch(() => null);
  if (!metadata?.isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(file.pathname)],
    'Content-Length': metadata.size,
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') response.end();
  else await pipeline(createReadStream(file), response).catch(() => response.destroy());
}

createServer((request, response) => api(request, response, () => serve(request, response)))
  .listen(port, '127.0.0.1', () => console.log(`Триаж: http://127.0.0.1:${port}`));
