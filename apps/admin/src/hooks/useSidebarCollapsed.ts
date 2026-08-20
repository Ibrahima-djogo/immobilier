"use client";

import { useEffect, useState } from "react";

export function useSidebarCollapsed(storageKey: string) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // Hydratation locale intentionnelle pour la démo (pas de backend).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage bootstrap
      setCollapsed(window.localStorage.getItem(storageKey) === "1");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return { collapsed, toggleCollapsed } as const;
}
