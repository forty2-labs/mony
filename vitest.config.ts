import path from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Unit tests: pure logic under src/ and build scripts under scripts/, no
 * network or database.
 * Database isolation tests live in tests/rls and use vitest.rls.config.ts.
 */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
    // env.ts validates these at import time; unit tests never contact them.
    env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'unit-test' },
  },
});
