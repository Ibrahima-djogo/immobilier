"use client";

import { useCallback, useEffect, useState } from "react";

import { DEMO_POLL_MS } from "@/lib/demo-api/config";
import {
  propertyService,
  type DemoProperty,
} from "@/lib/demo-api/listings";

export function useDemoProperties(
  params: { ownerId?: string; agencyId?: string },
  options?: { poll?: boolean },
) {
  const [items, setItems] = useState<DemoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ownerId = params.ownerId;
  const agencyId = params.agencyId;
  const poll = options?.poll;

  const refresh = useCallback(async () => {
    try {
      const data = await propertyService.list({ ownerId, agencyId });
      setItems(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les biens (Demo API).",
      );
    } finally {
      setLoading(false);
    }
  }, [ownerId, agencyId]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) void refresh();
    };
    const startId = window.setTimeout(run, 0);
    const pollId = poll ? window.setInterval(run, DEMO_POLL_MS) : null;
    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      if (pollId) window.clearInterval(pollId);
    };
  }, [refresh, poll]);

  return { items, loading, error, refresh };
}
