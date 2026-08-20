"use client";

import { useEffect, useState } from "react";

import {
  readPublicDemoSession,
  type PublicDemoSession,
} from "@/lib/auth/public-demo-session";

export function usePublicDemoSession() {
  const [session, setSession] = useState<PublicDemoSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      setSession(readPublicDemoSession());
      setReady(true);
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("dg-public-session", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dg-public-session", sync);
    };
  }, []);

  return { session, ready, isLoggedIn: Boolean(session?.authenticated) };
}
