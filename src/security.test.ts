import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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
      (file) => !file.endsWith('.test.ts') && !file.endsWith('.png') && !file.endsWith('.ico'),
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
    expect(html).toContain('<html lang="en">');
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

  it('ships the install icons named by the manifest', () => {
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'public/manifest.webmanifest'), 'utf8')) as {
      lang: string;
      description: string;
      name: string;
      short_name: string;
      display: string;
      theme_color: string;
      background_color: string;
      icons: { src: string; sizes: string; purpose: string; type: string }[];
    };
    expect(manifest.lang).toBe('en');
    expect(manifest.description).toBe('Game counter for padel. Offline and only on this device.');
    expect(manifest.name).toBe('Padel Counter');
    expect(manifest.short_name).toBe('Padel Counter');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0a1a3f');
    expect(manifest.background_color).toBe('#0a1a3f');
    expect(manifest.icons).toEqual([
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ]);
    for (const icon of manifest.icons) {
      const file = join(repoRoot, 'public', icon.src);
      expect(existsSync(file), icon.src).toBe(true);
      const size = Number(icon.sizes.split('x')[0]);
      const png = pngInfo(file);
      expect(png.width).toBe(size);
      expect(png.height).toBe(size);
    }
    expect(pngInfo(join(repoRoot, 'public/icons/apple-touch-icon-180.png'))).toEqual({
      width: 180,
      height: 180,
      colorType: 2,
    });
    expect(pngInfo(join(repoRoot, 'public/favicon-16.png')).width).toBe(16);
    expect(pngInfo(join(repoRoot, 'public/favicon-32.png')).width).toBe(32);
    expect(existsSync(join(repoRoot, 'public/favicon.ico'))).toBe(true);
    const html = readFileSync(join(repoRoot, 'src/index.html'), 'utf8');
    expect(html).toContain('apple-touch-icon');
    expect(html).toContain('icons/apple-touch-icon-180.png');
    expect(html).toContain('favicon-16.png');
    expect(html).toContain('favicon-32.png');
    expect(html).toContain('favicon.ico');
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('apple-mobile-web-app-title" content="Padel Counter"');
    expect(html).toContain('content="#0a1a3f"');
  });
});

function pngInfo(file: string): { width: number; height: number; colorType: number } {
  const bytes = readFileSync(file);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] ?? -1 };
}
