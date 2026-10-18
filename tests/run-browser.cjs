#!/usr/bin/env node
// Runs tests/*.browser.cjs one after another (or with --jobs=N) and prints a summary.
//   npm run test:browser                 all browser tests
//   npm run test:browser -- gallery      only files whose name contains "gallery"
//   npm run test:browser -- --jobs=3     run three files at a time
// Chrome: set CHROME_BIN, or the runner looks in the usual install locations.
// Playwright: set PLAYWRIGHT_MODULE, or install the devDependency with `npm install`.
'use strict';
const {spawn} = require('node:child_process');
const {existsSync, readdirSync} = require('node:fs');
const {join} = require('node:path');

const args = process.argv.slice(2);
const jobs = Math.max(1, Number((args.find(a => a.startsWith('--jobs=')) || '--jobs=1').slice(7)) || 1);
const filters = args.filter(a => !a.startsWith('--'));

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find(existsSync);
}
function findPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return process.env.PLAYWRIGHT_MODULE;
  try { return require.resolve('playwright-core'); } catch { return undefined; }
}

const chrome = findChrome(), playwright = findPlaywright();
if (!chrome) { console.error('No Chrome found. Set CHROME_BIN to a Chrome or Chromium executable.'); process.exit(1); }
if (!playwright) { console.error('playwright-core is missing. Run `npm install`, or set PLAYWRIGHT_MODULE.'); process.exit(1); }

const files = readdirSync(__dirname).filter(f => f.endsWith('.browser.cjs'))
  .filter(f => !filters.length || filters.some(name => f.includes(name))).sort();
if (!files.length) { console.error('No browser tests match ' + filters.join(', ')); process.exit(1); }

function run(file) {
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(process.execPath, [join(__dirname, file)], {
      env: {...process.env, CHROME_BIN: chrome, PLAYWRIGHT_MODULE: playwright}, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', d => { output += d; });
    child.stderr.on('data', d => { output += d; });
    child.on('close', code => resolve({file, code, output, seconds: (Date.now() - started) / 1000}));
  });
}

(async () => {
  const queue = [...files], results = [];
  await Promise.all(Array.from({length: Math.min(jobs, queue.length)}, async () => {
    while (queue.length) {
      const result = await run(queue.shift());
      results.push(result);
      const skips = (result.output.match(/^SKIP .*/gm) || []);
      console.log(`${result.code === 0 ? 'ok  ' : 'FAIL'} ${result.file} (${result.seconds.toFixed(1)}s)`);
      for (const line of skips) console.log('     ' + line);
      if (result.code !== 0) console.log(result.output.replace(/^/gm, '     '));
    }
  }));
  const failed = results.filter(r => r.code !== 0);
  console.log(`\n${results.length - failed.length}/${results.length} browser test files passed`);
  process.exitCode = failed.length ? 1 : 0;
})();
