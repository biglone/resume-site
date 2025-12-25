// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // 根据环境变量选择部署配置
  // Netlify: NETLIFY=true 自动设置，使用默认 site 和 base: '/'
  // GitHub Pages: 需要指定 site 和 base
  site: process.env.NETLIFY
    ? process.env.URL || 'https://resume-site.netlify.app'
    : 'https://biglone.github.io',
  base: process.env.NETLIFY ? '/' : '/resume-site',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
