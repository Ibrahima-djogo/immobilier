"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";

export function useRequirePublicSession(returnPath: string) {
  const router = useRouter();
  const { session, ready, isLoggedIn } = usePublicDemoSession();

  useEffect(() => {
    if (!ready || isLoggedIn) return;
    router.replace(`/connexion?retour=${encodeURIComponent(returnPath)}`);
  }, [ready, isLoggedIn, returnPath, router]);

  return { session, ready, isLoggedIn };
}
