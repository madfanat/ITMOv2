#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const https = require('https');
const http = require('http');

const tools = [
  {
    name: 'validate_readme',
    description: 'Checks that project README and required files exist',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string' }
      },
      required: [],
      additionalProperties: false
    }
  },
  {
    name: 'check_url',
    description: 'Fetches a URL and returns basic metadata',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        method: { type: 'string' }
      },
      required: ['url'],
      additionalProperties: false
    }
  }
];

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function ok(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function err(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, data } });
}

function listTools(id) {
  ok(id, { tools });
}

function callTool(id, params) {
  if (!params || !params.name) return err(id, -32602, 'Missing tool name');
  const name = params.name;
  const args = params.arguments || {};
  if (name === 'validate_readme') {
    const cwd = args.cwd || process.cwd();
    const files = [
      'README.md',
      'AGENTS.md',
      path.join('.opencode', 'opencode.json'),
      path.join('.opencode', 'skills', 'agent-browser', 'SKILL.md'),
      path.join('.opencode', 'plugins', 'itmo-hooks.js'),
      path.join('.opencode', 'runners', 'auto-check.js'),
      path.join('.opencode', 'mcp', 'itmo-tools.js')
    ];
    const details = [];
    let okAll = true;
    for (const f of files) {
      const p = path.resolve(cwd, f);
      try {
        fs.accessSync(p, fs.constants.R_OK);
        details.push({ file: f, status: 'ok' });
      } catch (e) {
        okAll = false;
        details.push({ file: f, status: 'missing' });
      }
    }
    return ok(id, { success: okAll, details });
  }
  if (name === 'check_url') {
    const u = args.url;
    if (!u || typeof u !== 'string') return err(id, -32602, 'url is required');
    let parsed;
    try {
      parsed = new URL(u);
    } catch (e) {
      return err(id, -32602, 'invalid url');
    }
    const lib = parsed.protocol === 'http:' ? http : https;
    const method = (args.method || 'GET').toUpperCase();
    const req = lib.request({ method, hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers: { 'User-Agent': 'itmo-mcp/1.0' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        ok(id, {
          url: u,
          status: res.statusCode,
          headers: res.headers,
          bytes: body.length
        });
      });
    });
    req.on('error', (e) => err(id, -32000, 'request error', { message: String(e.message) }));
    req.end();
    return;
  }
  err(id, -32601, 'Unknown tool');
}

function initialize(id) {
  ok(id, { capabilities: { tools: true } });
}

function handle(msg) {
  if (!msg || typeof msg !== 'object') return;
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize':
      return initialize(id);
    case 'tools/list':
      return listTools(id);
    case 'tools/call':
      return callTool(id, params);
    default:
      return err(id, -32601, 'Method not found');
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 1);
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      handle(obj);
    } catch (e) {
      // ignore malformed line
    }
  }
});

process.stdin.on('end', () => process.exit(0));
