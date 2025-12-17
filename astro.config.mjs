// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages deployment: uncomment and replace with your repo name
  // site: 'https://username.github.io',
  // base: '/resume-site',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
