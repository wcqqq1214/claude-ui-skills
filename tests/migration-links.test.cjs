const assert = require('node:assert/strict');
const { readFileSync, readdirSync, existsSync, statSync } = require('node:fs');
const { resolve, dirname, relative, extname, posix, win32 } = require('node:path');
const { test } = require('node:test');

const root = resolve(__dirname, '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
function filesIn(directory) {
  // Local research notes are outside the published guides; never traverse them.
  if (directory === 'docs/dev') return [];
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
// Examples are code, not links to files in this repository.
const prose = source => source.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
function links(source) {
  const responsive = [];
  for (const match of source.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
    let candidates = match[1];
    while (candidates) {
      candidates = candidates.replace(/^[\s,]+/, '');
      const url = candidates.match(/^\S+/)?.[0];
      if (!url) break;
      responsive.push(url.replace(/,+$/, ''));
      candidates = candidates.slice(url.length);
      // URLs can contain commas (notably data URLs). Whitespace ends the URL;
      // skip its optional width/density descriptor to the next separator.
      if (!url.endsWith(',')) {
        const separator = candidates.indexOf(',');
        candidates = separator < 0 ? '' : candidates.slice(separator + 1);
      }
    }
  }
  return [
    ...[...source.matchAll(/!?\[[^\]\n]*\]\(<?([^\s)>]+)>?(?:\s+["'][^\n]*["'])?\)/g)].map(match => match[1]),
    ...[...source.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map(match => match[1]),
    ...responsive,
  ];
}
function chapters() {
  const list = read('demo/App.tsx').match(/const chapters = \{([\s\S]+?)\};/)?.[1];
  assert.ok(list, 'the demo must declare its chapter routes');
  return [...list.matchAll(/^\s+(\w+):/gm)].map(match => match[1]);
}
function anchors(file) {
  const normalized = file.replaceAll('\\', '/');
  const source = prose(read(normalized));
  const ids = new Set([...source.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)].map(match => match[1]));
  const duplicates = new Map();
  for (const match of source.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const slug = match[1].toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s/g, '-');
    const count = duplicates.get(slug) ?? 0;
    duplicates.set(slug, count + 1); ids.add(count ? `${slug}-${count}` : slug);
  }
  // These fragments are React routes, not static HTML element IDs.
  if (normalized === 'demo/index.html' || normalized === 'index.html') chapters().forEach(id => ids.add(id));
  return ids;
}

function checkLinks(file, source) {
  for (const target of links(prose(source))) {
    if (/^[a-z][a-z\d+.-]*:|^\/\//i.test(target)) continue;
    const [location, fragment] = target.split('#');
    const destination = location ? resolve(root, dirname(file), decodeURIComponent(location.split('?')[0])) : resolve(root, file);
    assert.ok(existsSync(destination), `${file}: missing ${target}`);
    if (fragment && statSync(destination).isFile() && ['.md', '.html'].includes(extname(destination))) {
      assert.ok(anchors(relative(root, destination)).has(decodeURIComponent(fragment)), `${file}: missing anchor ${target}`);
    }
  }
}

test('skill, guides and README links resolve to local files and valid anchors', () => {
  const documents = ['SKILL.md', 'README.md', 'README.zh-CN.md', 'demo/README.md', 'tests/README.md',
    ...filesIn('examples'), ...filesIn('references'), ...filesIn('docs')].filter(file => file.endsWith('.md'));
  for (const file of documents) checkLinks(file, read(file));
});

test('responsive screenshot links include every srcset candidate and reject missing files', () => {
  for (const file of ['README.md', 'README.zh-CN.md']) {
    const source = read(file), target = source.match(/srcset="([^"]+)"/)[1];
    assert.ok(links(source).includes(target), `${file}: dark screenshot must be checked`);
    assert.throws(() => checkLinks(file, source.replace(target, 'docs/assets/missing-screenshot.jpg')), /missing docs\/assets\/missing-screenshot\.jpg/);
  }
  assert.deepEqual(links(`<source srcset="one.jpg 1x, two.jpg 2x"><img srcset='small.jpg 320w, large.jpg 1280w'>`), ['one.jpg', 'two.jpg', 'small.jpg', 'large.jpg']);
  assert.deepEqual(links('<img srcset="one.jpg, two.jpg">'), ['one.jpg', 'two.jpg']);
  checkLinks('README.md', '<source srcset="data:image/png;base64,AAAA 1x, https://example.invalid/image.png 2x">');
});

test('chapter and Markdown anchors accept both POSIX and Windows relative paths', () => {
  const demoFiles = [posix.relative('/repo', '/repo/demo/index.html'), win32.relative('C:\\repo', 'C:\\repo\\demo\\index.html')];
  for (const file of demoFiles) {
    const ids = anchors(file);
    for (const route of chapters()) assert.ok(ids.has(route), `${file}: missing chapter ${route}`);
  }
  assert.ok(anchors(win32.relative('C:\\repo', 'C:\\repo\\demo\\README.md')).has('run'), 'Windows Markdown links retain heading anchors');
});

test('every demo chapter has linked guides and reusable TSX implementations', () => {
  const routes = chapters();
  assert.equal(new Set(routes).size, routes.length, 'chapter routes must be unique');
  const rows = read('references/components.md').split('\n').filter(line => line.includes('../demo/index.html#'));
  const documented = rows.map(row => row.match(/\.\.\/demo\/index\.html#([^\s)]+)/)?.[1]);
  assert.deepEqual([...new Set(documented)].sort(), [...routes].sort(), 'the skill index must cover every route without stale chapter entries');
  for (const row of rows) {
    const guide = row.match(/\]\((components\/[^)]+\.md)\)/)?.[1];
    assert.ok(guide, `missing scenario guide: ${row}`);
    const targets = links(prose(read(`references/${guide}`)));
    assert.ok(targets.some(target => target.startsWith('../../src/components/') && target.endsWith('.tsx')), `${guide}: no reusable TSX source`);
    assert.ok(targets.some(target => target.startsWith('../../demo/chapters/') && target.endsWith('.tsx')), `${guide}: no demo caller`);
  }
});

test('component imports, CSS sources and asset URLs are self-contained after copying src', () => {
  for (const file of filesIn('src').filter(file => /\.(?:tsx?|css)$/.test(file))) {
    const source = read(file), targets = [];
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.equal(/(?:showcase\/|DemoI18n|DemoShared)/.test(code), false, `${file}: retired runtime dependency`);
    for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) targets.push(match[1]);
    for (const match of source.matchAll(/new URL\(\s*["'](\.[^"']+)["']\s*,\s*import\.meta\.url/g)) targets.push(match[1]);
    if (file.endsWith('.css')) {
      for (const match of source.matchAll(/@(?:import|source)\s+["'](\.[^"']+)["']/g)) targets.push(match[1]);
      for (const match of source.matchAll(/url\(\s*["']?(\.[^\s)"']+)["']?\s*\)/g)) targets.push(match[1]);
    }
    for (const target of targets) {
      const destination = resolve(root, dirname(file), target);
      assert.ok(relative(resolve(root, 'src'), destination).split(/[\\/]/)[0] !== '..', `${file}: imports outside src: ${target}`);
      assert.ok(['', '.ts', '.tsx', '/index.ts', '/index.tsx'].some(suffix => existsSync(destination + suffix)), `${file}: missing ${target}`);
    }
  }
});
