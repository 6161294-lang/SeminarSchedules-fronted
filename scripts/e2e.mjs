// מריץ את בדיקות המקצה-לקצה מול שרת Backend שרץ.
// שימוש: npm run test:e2e -- http://localhost:3100
// חשוב: הבדיקות יוצרות משתמשות, כיתות ושיעורים. מריצים אותן רק מול מסד נתונים לבדיקות.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const apiUrl = (process.argv[2] ?? process.env.E2E_API_URL ?? 'http://localhost:3100').replace(/\/+$/, '');

try {
  const res = await fetch(`${apiUrl}/api/health`);
  const health = await res.json();
  if (health.database !== 'up') throw new Error('מסד הנתונים של השרת לא זמין');
} catch (error) {
  console.error(`לא ניתן להגיע לשרת ב-${apiUrl}: ${error instanceof Error ? error.message : error}`);
  console.error('הפעילי את ה-Backend על מסד נתונים לבדיקות (עם נתוני Seed), ואז נסי שוב.');
  process.exit(1);
}

// מריצים את vitest ישירות עם Node (בלי shell), כך שזה עובד אותו דבר ב-Windows, Mac ו-Linux
const require = createRequire(import.meta.url);
const vitestEntry = path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs');

const child = spawn(process.execPath, [vitestEntry, 'run', '--config', 'vitest.e2e.config.ts'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_API_URL: apiUrl, E2E_RUN: '1' }
});
child.on('exit', (code) => process.exit(code ?? 1));
