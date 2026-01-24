// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
const isNetlify = Boolean(process.env.NETLIFY);
const site = process.env.ASTRO_SITE || (isNetlify ? process.env.URL || 'http://localhost:4321' : 'http://localhost:4321');
const base = process.env.ASTRO_BASE || (isNetlify ? '/' : '/');

export default defineConfig({
  output: 'server',
  // 根据环境变量选择部署配置
  // Netlify: NETLIFY=true 自动设置，使用默认 site 和 base: '/'
  // GitHub Pages: 请设置 ASTRO_SITE / ASTRO_BASE
  site,
  base,

  adapter: node({ mode: 'standalone' }),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
