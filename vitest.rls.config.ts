import { defineConfig } from 'vitest/config';

/**
 * Cross-user isolation tests against the local Supabase stack (`npm run db:start`).
 * They create real users and talk to the real API, the way an attacker would.
 */
export default defineConfig({
  test: {
    include: ['tests/rls/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
