import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// הגדרות לבדיקות מקצה לקצה: רצות ב-Node (בלי דפדפן מדומה) מול שרת Backend אמיתי
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  test: {
    environment: 'node',
    include: ['e2e/**/*.e2e.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false
  }
});
