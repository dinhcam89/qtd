// @ts-check
import process from 'node:process';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const fixturesMode = process.env.QTD_FIXTURES;
const isFixtures = fixturesMode === '1';
const isEmptyFixtures = fixturesMode === 'empty';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://qtd.pages.dev',
  outDir: isEmptyFixtures
    ? './dist-empty'
    : isFixtures
      ? './dist-fixtures'
      : './dist',
  publicDir: isFixtures ? './src/fixtures/public' : './public',
  server: isEmptyFixtures
    ? { port: 4323 }
    : isFixtures
      ? { port: 4322 }
      : { port: 4321 },
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
