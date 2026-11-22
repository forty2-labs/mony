import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { seoPlugin, siteUrlFromEnv } from './scripts/seo';

export default defineConfig(({ mode }) => {
  // SITE_URL is build-only (share tags, robots.txt, sitemap), so read it with an
  // empty prefix rather than exposing it as a VITE_ variable. On Vercel it falls
  // back to the project's production domain.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  return {
    plugins: [react(), seoPlugin(siteUrlFromEnv(env))],
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
