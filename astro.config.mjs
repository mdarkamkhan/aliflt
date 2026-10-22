import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { curateApiVitePlugin } from './scripts/curate-vite-plugin.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  prefetch: true,
  build: {
    format: 'directory' // outputs /services/blouse/index.html to match existing Eleventy URLs exactly
  },
  vite: {
    plugins: [curateApiVitePlugin()]
  }
});



