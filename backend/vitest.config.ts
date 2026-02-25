import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.ts',
        'src/index.ts',
        'src/scripts/**',
        'src/shared/dynamodb.ts',
        'src/shared/types/**',
        'src/shared/* 2.ts',
        'src/server.ts',
      ],
    },
  },
});
