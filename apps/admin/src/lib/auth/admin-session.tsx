"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Administrator } from "@/lib/administration/admin-accounts";
import {
  adminStorage,
  type StoredAdministrator,
} from "@/lib/administration/admin-storage";

type AdminSessionContextValue = {
  admin: StoredAdministrator | null;
  ready: boolean;
  loginWithDemoCredentials: (
    email: string,
    password: string,
  ) => { ok: true; admin: StoredAdministrator } | { ok: false; error: string };
  /** @deprecated Utiliser loginWithDemoCredentials */
  loginWithDemoEmail: (
    email: string,
    password?: string,
  ) => { ok: true; admin: StoredAdministrator } | { ok: false; error: string };
  logout: () => void;
  updateCurrentAdmin: (patch: Partial<Administrator>) => void;
  /** Recharge le compte courant depuis le store (après édition SUPER_ADMIN). */
  refreshCurrentAdmin: () => void;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
  null,
);

/** Cache mémoire synchronisé avec localStorage session (DEMO ONLY). */
let memoryAdmin: StoredAdministrator | null = null;

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<StoredAdministrator | null>(memoryAdmin);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      adminStorage.list();
      const sessionId = adminStorage.getSessionId();
      if (sessionId != null) {
        const account = adminStorage.findById(sessionId);
        if (account && account.status === "ACTIF") {
          memoryAdmin = account;
          setAdmin(account);
        } else {
          adminStorage.clearSession();
          memoryAdmin = null;
          setAdmin(null);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loginWithDemoCredentials = useCallback(
    (email: string, password: string) => {
      const result = adminStorage.authenticate(email, password);
      if (!result.ok) return result;
      memoryAdmin = result.admin;
      adminStorage.setSessionId(result.admin.id);
      setAdmin(result.admin);
      return result;
    },
    [],
  );

  const loginWithDemoEmail = useCallback(
    (email: string, password = "demo") =>
      loginWithDemoCredentials(email, password),
    [loginWithDemoCredentials],
  );

  const logout = useCallback(() => {
    memoryAdmin = null;
    adminStorage.clearSession();
    setAdmin(null);
  }, []);

  const updateCurrentAdmin = useCallback((patch: Partial<Administrator>) => {
    setAdmin((current) => {
      if (!current) return current;
      const updated = adminStorage.update(current.id, patch);
      const next = updated ?? { ...current, ...patch };
      memoryAdmin = next;
      return next;
    });
  }, []);

  const refreshCurrentAdmin = useCallback(() => {
    setAdmin((current) => {
      if (!current) return current;
      const fresh = adminStorage.findById(current.id);
      if (!fresh || fresh.status !== "ACTIF") {
        memoryAdmin = null;
        adminStorage.clearSession();
        return null;
      }
      memoryAdmin = fresh;
      return fresh;
    });
  }, []);

  const value = useMemo(
    () => ({
      admin,
      ready,
      loginWithDemoCredentials,
      loginWithDemoEmail,
      logout,
      updateCurrentAdmin,
      refreshCurrentAdmin,
    }),
    [
      admin,
      ready,
      loginWithDemoCredentials,
      loginWithDemoEmail,
      logout,
      updateCurrentAdmin,
      refreshCurrentAdmin,
    ],
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error(
      "useAdminSession doit être utilisé dans AdminSessionProvider.",
    );
  }
  return ctx;
}
