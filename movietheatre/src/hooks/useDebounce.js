import { useState, useEffect } from 'react';

/**
 * Delays updating a value until the user stops typing.
 * Prevents firing an API request on every keystroke.
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in ms (default 400)
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
