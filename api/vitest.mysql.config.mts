import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/mysqlTeardown.ts'],
    env: { TEST_WITH_MYSQL: '1' },
    fileParallelism: false,
    testTimeout: 20000,
  },
});
