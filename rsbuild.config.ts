import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { generateSW } from 'workbox-build';
import { PAGE_BASE } from './src/base';

const appVersion = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyPageBase(dist: string): void {
  const root = `${PAGE_BASE}/`;
  for (const name of readdirSync(dist)) {
    if (!name.endsWith('.webmanifest')) continue;
    const manifestPath = join(dist, name);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      id: string;
      start_url: string;
      scope: string;
      icons: { src: string }[];
    };
    manifest.id = root;
    manifest.start_url = root;
    manifest.scope = root;
    for (const icon of manifest.icons) {
      icon.src = `${root}${icon.src.replace(/^\.?\//, '')}`;
    }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

const workboxPlugin: RsbuildPlugin = {
  name: 'padel-workbox',
  setup(api) {
    api.onAfterBuild(async () => {
      if (api.context.action !== 'build') return;
      const dist = api.context.distPath;
      const swDest = join(dist, 'sw.js');
      const prefix = `${PAGE_BASE}/`;
      applyPageBase(dist);
      await generateSW({
        swDest,
        globDirectory: dist,
        globPatterns: ['**/*.{html,js,css,webmanifest,png,svg,ico}'],
        globIgnores: ['**/sw.js', '**/*.map'],
        modifyURLPrefix: { '': prefix },
        inlineWorkboxRuntime: true,
        mode: 'production',
        sourcemap: false,
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        disableDevLogs: true,
        navigateFallback: `${prefix}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${escapeRegExp(prefix)}.+\\.[a-z0-9]+$`, 'i')],
        directoryIndex: 'index.html',
      });
      const original = readFileSync(swDest, 'utf8');
      const stripped = original
        .replace(/\/\*\*[\s\S]*?Welcome to your Workbox[\s\S]*?\*\//, '')
        .replaceAll('https://bit.ly/wb-precache', 'Workbox precache guidance');
      if (stripped !== original) writeFileSync(swDest, stripped);
    });
  },
};

export default defineConfig({
  plugins: [pluginReact(), workboxPlugin],
  source: {
    entry: {
      index: './src/index.tsx',
    },
    define: {
      'import.meta.env.APP_VERSION': JSON.stringify(appVersion),
    },
  },
  html: {
    template: './src/index.html',
    title: 'Padel Counter',
    mountId: 'root',
  },
  server: {
    base: PAGE_BASE,
    port: 4173,
    strictPort: true,
  },
  output: {
    assetPrefix: PAGE_BASE,
    distPath: 'dist',
    legalComments: 'none',
    sourceMap: false,
    inlineScripts: false,
    inlineStyles: false,
    dataUriLimit: 0,
    polyfill: 'off',
  },
});
