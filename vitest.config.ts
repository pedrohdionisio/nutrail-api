import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite({ tsconfigFile: './tsconfig.json' })],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/support/setup.ts'],
    restoreMocks: true,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/main/functions/**', 'src/infra/ai/prompts/**'],
    },
  },
});
