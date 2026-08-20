"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  accountScopeService,
  operationsForPropertyType,
  resolveAllowedOperations,
  resolveAllowedScopes,
  resolveAllowedTypes,
  type AccountScopeResponse,
} from "@/lib/demo-api/account-scope";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";

type UseAccountScopeOptions = {
  /**
   * Compte dont on lit le périmètre. Les espaces propriétaire/agence écrivent
   * au nom d'un compte démo fixe : le scope affiché doit être celui de ce même
   * compte, sinon l'UI et l'API ne parlent pas du même utilisateur.
   */
  userId?: string | null;
};

export function useAccountScope(options: UseAccountScopeOptions = {}) {
  const { session, ready: sessionReady, isLoggedIn } = usePublicDemoSession();
  const userId = options.userId ?? session?.id ?? null;
  const [scope, setScope] = useState<AccountScopeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setScope(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const data = await accountScopeService.get(userId);
      setScope(data);
      setError(null);
    } catch (err) {
      setScope(null);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger la configuration du compte.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const explicitUserId = options.userId ?? null;

  useEffect(() => {
    if (!explicitUserId && !sessionReady) return;
    void refresh();
  }, [explicitUserId, sessionReady, refresh]);

  const allowedPropertyTypes = useMemo(
    () => resolveAllowedTypes(scope),
    [scope],
  );
  const allowedOperations = useMemo(
    () => resolveAllowedOperations(scope),
    [scope],
  );
  const allowedPropertyScopes = useMemo(
    () => resolveAllowedScopes(scope),
    [scope],
  );
  const operationsForType = useCallback(
    (propertyType: string) =>
      operationsForPropertyType(allowedPropertyScopes, propertyType),
    [allowedPropertyScopes],
  );
  const pendingScopeRequests = useMemo(
    () =>
      (scope?.scopeRequests || []).filter(
        (request) =>
          request.status === "EN_ATTENTE" || request.status === "A_CORRIGER",
      ),
    [scope],
  );

  return {
    userId,
    sessionReady,
    isLoggedIn,
    scope,
    loading: (!explicitUserId && !sessionReady) || loading,
    error,
    refresh,
    allowedPropertyTypes,
    allowedOperations,
    allowedPropertyScopes,
    operationsForType,
    pendingScopeRequests,
  };
}
