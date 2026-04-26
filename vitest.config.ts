import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    env: {
      VITE_RAG_ENABLED: 'true',
      VITE_RAG_URL: 'http://localhost:8000',
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.cache',
      '.opencode/**',
      '.claude/**',
      '.worktrees/**',
      // App.tsx is the legacy Vite SPA (Phase 1); retired components deleted in editor-redesign
      'tests/App.embed.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'services/**/*.ts',
        'utils/**/*.ts',
        'hooks/**/*.ts',
        'constants.ts',
        'data/**/*.ts',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 63,
        lines: 70,
      },
    },
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/test-report.html',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
