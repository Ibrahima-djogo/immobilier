"use client";

import { useEffect, useState } from "react";

/**
 * Debounce a rapidly changing value (search text, prices, etc.).
 * Immediate filters (select/radio/checkbox) should not use this.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
