import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const banned = [
  'storage.googleapis.com',
  'workbox-cdn',
  'fonts.googleapis',
  'fonts.gstatic',
  'googletagmanager',
  'google-analytics',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'goo.gl',
  'bit.ly',
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const htmlPath = join(dist, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
if (!html.includes('Content-Security-Policy')) fail('CSP meta tag missing');
if (!html.includes("default-src 'self'")) fail('CSP is not restricted to self');
if (html.includes('unsafe-inline') || html.includes('unsafe-eval')) fail('CSP allows inline or eval');
if (/https?:\/\//.test(html)) fail(`external URL in index.html:\n${html}`);
if (/<script(?![^>]*\bsrc=)[^>]*>/.test(html)) fail('inline script in index.html');
if (/<style[\s>]/i.test(html)) fail('inline style in index.html');
if (!html.includes('/PadelCounter/')) fail('base path missing from index.html');

const manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8'));
if (manifest.start_url !== '/PadelCounter/' || manifest.scope !== '/PadelCounter/') {
  fail(`unexpected manifest scope: ${manifest.start_url}`);
}

const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
if (sw.includes('importScripts(')) fail('service worker loads an external script');

for (const file of walk(dist)) {
  if (file.endsWith('.png')) continue;
  const text = readFileSync(file, 'utf8');
  for (const host of banned) {
    if (text.includes(host)) fail(`${host} found in ${file}`);
  }
}

console.log('verify-build: ok');
