import { useEffect, useState } from 'react';

/** מחזיר את הערך רק אחרי שלא השתנה זמן מסוים. מונע בקשה לשרת על כל הקשה בתיבת חיפוש */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
