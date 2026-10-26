const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { dirname, resolve } = require('node:path');

test('public source entry typechecks without Vite client or asset declarations', () => {
  const root = resolve(__dirname, '..');
  const compiler = resolve(dirname(require.resolve('typescript/package.json')), 'bin/tsc');
  const result = spawnSync(process.execPath, [compiler,
    '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', 'false',
    '--target', 'ES2022', '--lib', 'ES2022,DOM,DOM.Iterable',
    '--module', 'ESNext', '--moduleResolution', 'Bundler',
    '--jsx', 'react-jsx', '--verbatimModuleSyntax', '--types', 'react',
    'src/index.ts',
  ], { cwd: root, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
