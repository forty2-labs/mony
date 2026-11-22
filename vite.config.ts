import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { seoPlugin } from './scripts/seo';

export default defineConfig(({ mode }) => {
  // SITE_URL is build-only (share tags, robots.txt, sitemap), so read it with an
  // empty prefix rather than exposing it as a VITE_ variable.
  const { SITE_URL } = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  return {
    plugins: [react(), seoPlugin(SITE_URL)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
    },
  };
});
