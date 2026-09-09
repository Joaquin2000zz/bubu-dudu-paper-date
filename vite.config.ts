import { defineConfig } from 'vitest/config';
export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 8766, strictPort: true },
  test: { include: ['tests/**/*.test.ts', 'tests/**/*.test.js'] },
});
