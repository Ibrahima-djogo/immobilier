"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";

import {
  parsePublicDemoSession,
  readPublicDemoSessionRaw,
  subscribePublicDemoSession,
} from "@/lib/auth/public-demo-session";

function getServerSnapshot(): string | null {
  return null;
}

export function usePublicDemoSession() {
  const storeRaw = useSyncExternalStore(
    subscribePublicDemoSession,
    readPublicDemoSessionRaw,
    getServerSnapshot,
  );
  const [clientRaw, setClientRaw] = useState<string | null | undefined>(
    undefined,
  );

  useLayoutEffect(() => {
    setClientRaw(readPublicDemoSessionRaw());
  }, [storeRaw]);

  const ready = clientRaw !== undefined;
  const session = parsePublicDemoSession(ready ? clientRaw : storeRaw);

  return {
    session,
    ready,
    isLoggedIn: Boolean(session?.authenticated),
  };
}
