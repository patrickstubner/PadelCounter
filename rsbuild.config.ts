import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { generateSW } from 'workbox-build';
import { PAGE_BASE } from './src/base';

const workboxPlugin: RsbuildPlugin = {
  name: 'padel-workbox',
  setup(api) {
    api.onAfterBuild(async () => {
      if (api.context.action !== 'build') return;
      const dist = api.context.distPath;
      const swDest = join(dist, 'sw.js');
      const prefix = `${PAGE_BASE}/`;
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
        navigateFallbackDenylist: [new RegExp(`^${prefix}.+\\.[a-z0-9]+$`, 'i')],
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
