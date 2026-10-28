#!/usr/bin/env node
const { spawnSync } = require('child_process');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return res.status || 0;
}

let status = 0;
status |= run('node', ['-v']);
status |= run('npm', ['-v']);
process.exit(status ? 1 : 0);
