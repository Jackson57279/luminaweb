#!/usr/bin/env node
'use strict';
// Node.js wrapper — delegates to the bun-built bundle.
// Luminaweb requires Bun >= 1.1 (https://bun.sh) to run capsules.
const path = require('path');
const child_process = require('child_process');
const dist = path.join(__dirname, '..', 'dist', 'index.js');
const proc = child_process.spawn('bun', [dist].concat(process.argv.slice(2)), { stdio: 'inherit' });
proc.on('error', function() {
  process.stderr.write('\n  luminaweb requires Bun >= 1.1\n  Install at https://bun.sh\n\n');
  process.exit(1);
});
proc.on('exit', function(code) { process.exit(code || 0); });
