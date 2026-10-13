import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PAGE_BASE } from './base';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...filesUnder(full));
    else found.push(full);
  }
  return found;
}

describe('shipped source stays local and text-only', () => {
  const needles = [
    'dangerouslySetInnerHTML',
    'innerHTML',
    'outerHTML',
    'insertAdjacentHTML',
    'document.write',
    'eval(',
    'new Function',
    'java' + 'script:',
    'fonts.googleapis',
    'fonts.gstatic',
    'googletagmanager',
    'google-analytics',
    'storage.googleapis.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
  ];

  it('does not reference HTML injection or external hosts', () => {
    const paths = [...filesUnder(join(repoRoot, 'src')), ...filesUnder(join(repoRoot, 'public'))].filter(
      (file) => !file.endsWith('.test.ts') && !file.endsWith('.png'),
    );
    for (const file of paths) {
      const text = readFileSync(file, 'utf8');
      for (const needle of needles) {
        expect(text, relative(repoRoot, file)).not.toContain(needle);
      }
    }
  });

  it('pins the pages base path in the shell and the readme', () => {
    const live = `https://patrickstubner.github.io${PAGE_BASE}/`;
    const html = readFileSync(join(repoRoot, 'src/index.html'), 'utf8');
    const manifest = readFileSync(join(repoRoot, 'public/manifest.webmanifest'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    expect(html).toContain('<%= assetPrefix %>/');
    expect(html).not.toContain(`${PAGE_BASE}/`);
    expect(html).toContain('Content-Security-Policy');
    expect(html).not.toContain('unsafe-inline');
    expect(html).not.toContain('unsafe-eval');
    const rsbuild = readFileSync(join(repoRoot, 'rsbuild.config.ts'), 'utf8');
    expect(rsbuild).toContain('assetPrefix: PAGE_BASE');
    expect(rsbuild).toContain('escapeRegExp(prefix)');
    const manifestJson = JSON.parse(manifest) as { start_url: string; icons: { src: string }[] };
    expect(manifestJson.start_url).toBe('./');
    expect(manifestJson.icons.every((icon) => icon.src.startsWith('icons/'))).toBe(true);
    expect(readme).toContain(live);
  });
});
