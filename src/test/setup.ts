import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// ב-Node חדש (22 ומעלה) יש localStorage גלובלי משלו שלא עובד בלי הגדרה, והוא דורס את זה של jsdom.
// בבדיקות מחליפים אותו באחסון פשוט בזיכרון. בדפדפן אמיתי זה לא רלוונטי.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
