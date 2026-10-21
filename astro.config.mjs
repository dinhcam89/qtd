// @ts-check
import process from 'node:process';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * @param {string | undefined} rawUrl
 * @returns {string}
 */
function getValidSiteUrl(rawUrl) {
  const fallback = 'https://qtd.workers.dev';
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return fallback;
  }
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    return new URL(trimmed).origin;
  } catch {
    return fallback;
  }
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: getValidSiteUrl(process.env.SITE_URL),
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 0,
    },
  },
});
