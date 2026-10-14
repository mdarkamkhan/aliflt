import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  build: {
    format: 'directory' // outputs /services/blouse/index.html to match existing Eleventy URLs exactly
  }
});
