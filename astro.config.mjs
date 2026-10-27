import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { curateApiVitePlugin } from './scripts/curate-vite-plugin.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'tap'
  },
  build: {
    format: 'directory', // outputs /services/blouse/index.html to match existing Eleventy URLs exactly
    inlineStylesheets: 'auto'
  },
  vite: {
    plugins: [curateApiVitePlugin()],
    build: {
      cssMinify: true,
      minify: true
    }
  }
});
