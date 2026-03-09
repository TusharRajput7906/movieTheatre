import { useState, useEffect } from 'react';

/**
 * Persists state to localStorage.
 * Drop-in replacement for useState with automatic serialisation.
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* quota exceeded — ignore */ }
  }, [key, value]);

  return [value, setValue];
}
