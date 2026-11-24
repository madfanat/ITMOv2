import { parseResult, validateIssue } from '../src/contract.ts';

const maxRequestBytes = 16 * 1024;

function json(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

async function readIssue(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > maxRequestBytes) return { status: 413 };
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value.title !== 'string' || typeof value.body !== 'string') return { status: 400 };
  const errors = validateIssue(value);
  if (errors.title || errors.body) return { status: 400, errors };
  return { issue: { title: value.title.trim(), body: value.body.trim() } };
}

export function classificationApi({ N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET }) {
  return async (request, response, next) => {
    if (request.url?.split('?')[0] !== '/api/classify') return next();
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return json(response, 405, { error: 'method_not_allowed' });
    }
    const mediaType = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
    if (mediaType !== 'application/json') return json(response, 415, { error: 'expected_json' });

    let input;
    try {
      input = await readIssue(request);
    } catch {
      return json(response, 400, { error: 'invalid_issue' });
    }
    if (!input.issue) return json(response, input.status, { error: 'invalid_issue', fields: input.errors });
    if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_SECRET) {
      return json(response, 503, { error: 'classification_unavailable' });
    }

    try {
      const upstream = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Triage-Secret': N8N_WEBHOOK_SECRET },
        body: JSON.stringify(input.issue),
        redirect: 'error',
        signal: AbortSignal.timeout(34_000),
      });
      if (!upstream.ok) throw new Error('Webhook request failed');
      return json(response, 200, parseResult(await upstream.json()));
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      return json(response, timedOut ? 504 : 502, { error: 'classification_unavailable' });
    }
  };
}
