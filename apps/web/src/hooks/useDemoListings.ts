"use client";

import { useCallback, useEffect, useState } from "react";

import { DEMO_POLL_MS } from "@/lib/demo-api/config";
import {
  listingService,
  type DemoListing,
} from "@/lib/demo-api/listings";

export function useDemoListings(
  params: {
    publicOnly?: boolean;
    ownerId?: string;
    agencyId?: string;
    status?: string;
  },
  options?: { poll?: boolean },
) {
  const [items, setItems] = useState<DemoListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicOnly = params.publicOnly;
  const ownerId = params.ownerId;
  const agencyId = params.agencyId;
  const status = params.status;
  const poll = options?.poll;

  const refresh = useCallback(async () => {
    try {
      const data = await listingService.list({
        publicOnly,
        ownerId,
        agencyId,
        status,
      });
      setItems(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les annonces (Demo API).",
      );
    } finally {
      setLoading(false);
    }
  }, [publicOnly, ownerId, agencyId, status]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) void refresh();
    };
    // Deferred so the fetch is not a synchronous setState in the effect body.
    const startId = window.setTimeout(run, 0);
    const pollId = poll
      ? window.setInterval(run, DEMO_POLL_MS)
      : null;
    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      if (pollId) window.clearInterval(pollId);
    };
  }, [refresh, poll]);

  return { items, loading, error, refresh };
}
