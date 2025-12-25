// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Netlify 会自动设置 site URL
  // 如需部署到 GitHub Pages，取消注释以下两行：
  // site: 'https://biglone.github.io',
  // base: '/resume-site',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
