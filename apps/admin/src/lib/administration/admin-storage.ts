/**
 * DEMO ONLY — couche de stockage frontend pour les comptes administratifs.
 *
 * À supprimer / remplacer lors du branchement Spring Boot par des appels API.
 * Les mots de passe démo sont stockés en clair dans localStorage : jamais en production.
 */

import {
  DEMO_ADMINISTRATORS,
  type Administrator,
  type AdminAccountRole,
  type AdminStatus,
} from "@/lib/administration/admin-accounts";

export const ADMIN_DEMO_ACCOUNTS_KEY = "demeure-guinee-admin-demo-accounts";
export const ADMIN_DEMO_SESSION_KEY = "demeure-guinee-admin-demo-session";

/** Compte stocké côté démo (mot de passe en clair — DEMO ONLY). */
export type StoredAdministrator = Administrator & {
  /**
   * Mot de passe temporaire de démonstration.
   * Ne jamais utiliser ce mécanisme en production.
   */
  demoPassword?: string;
  /**
   * Comptes seeds : tout mot de passe non vide est accepté.
   * Comptes créés : le demoPassword doit correspondre.
   */
  seedAccount?: boolean;
};

export type CreateAdministratorInput = {
  name: string;
  email: string;
  role: AdminAccountRole;
  permissions: string[];
  status?: AdminStatus;
  phone?: string;
  demoPassword: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneSeeds(): StoredAdministrator[] {
  return DEMO_ADMINISTRATORS.map((admin) => ({
    ...admin,
    permissions: [...admin.permissions],
    seedAccount: true,
    demoPassword: undefined,
  }));
}

function readRaw(): StoredAdministrator[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_DEMO_ACCOUNTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as StoredAdministrator[];
  } catch {
    return null;
  }
}

function writeAll(accounts: StoredAdministrator[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    ADMIN_DEMO_ACCOUNTS_KEY,
    JSON.stringify(accounts),
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Assure l’initialisation des seeds au premier accès client. */
export function ensureAdminDemoStore(): StoredAdministrator[] {
  const existing = readRaw();
  const seeds = cloneSeeds();
  if (!existing || existing.length === 0) {
    writeAll(seeds);
    return seeds;
  }

  let changed = false;
  const byEmail = new Map(
    existing.map((account) => [account.email.toLowerCase(), account]),
  );

  // Ajoute les nouveaux seeds manquants + resynchronise permissions des seeds.
  for (const seed of seeds) {
    const key = seed.email.toLowerCase();
    const found = byEmail.get(key);
    if (!found) {
      byEmail.set(key, seed);
      changed = true;
      continue;
    }
    if (found.seedAccount) {
      const samePerms =
        JSON.stringify(found.permissions || []) ===
        JSON.stringify(seed.permissions);
      if (
        !samePerms ||
        found.role !== seed.role ||
        found.name !== seed.name
      ) {
        found.permissions = [...seed.permissions];
        found.role = seed.role;
        found.name = seed.name;
        found.seedAccount = true;
        changed = true;
      }
    }
  }

  const merged = Array.from(byEmail.values());
  if (changed) writeAll(merged);
  return merged.map((account) => ({
    ...account,
    permissions: [...(account.permissions ?? [])],
  }));
}

export const adminStorage = {
  list(): StoredAdministrator[] {
    return ensureAdminDemoStore();
  },

  findByEmail(email: string): StoredAdministrator | undefined {
    const normalized = normalizeEmail(email);
    return ensureAdminDemoStore().find(
      (account) => account.email.toLowerCase() === normalized,
    );
  },

  findById(id: number): StoredAdministrator | undefined {
    return ensureAdminDemoStore().find((account) => account.id === id);
  },

  create(input: CreateAdministratorInput): StoredAdministrator {
    const accounts = ensureAdminDemoStore();
    const email = normalizeEmail(input.email);
    if (accounts.some((account) => account.email.toLowerCase() === email)) {
      throw new Error("Un compte utilise déjà cet e-mail.");
    }
    if (!input.demoPassword.trim()) {
      throw new Error("Le mot de passe temporaire de démonstration est requis.");
    }

    const next: StoredAdministrator = {
      id: Date.now(),
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() || undefined,
      role: input.role,
      status: input.status ?? "ACTIF",
      lastLogin:
        input.status === "EN_ATTENTE"
          ? "Invitation envoyée"
          : "Jamais connecté",
      permissions: [...input.permissions],
      createdAt: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      demoPassword: input.demoPassword,
      seedAccount: false,
    };

    writeAll([next, ...accounts]);
    return next;
  },

  update(
    id: number,
    patch: Partial<StoredAdministrator>,
  ): StoredAdministrator | undefined {
    const accounts = ensureAdminDemoStore();
    const index = accounts.findIndex((account) => account.id === id);
    if (index < 0) return undefined;

    const current = accounts[index];
    const next: StoredAdministrator = {
      ...current,
      ...patch,
      id: current.id,
      email: patch.email ? normalizeEmail(patch.email) : current.email,
      permissions: patch.permissions
        ? [...patch.permissions]
        : [...current.permissions],
    };
    accounts[index] = next;
    writeAll(accounts);
    return next;
  },

  remove(id: number): boolean {
    const accounts = ensureAdminDemoStore();
    const target = accounts.find((account) => account.id === id);
    if (!target) return false;
    if (target.role === "SUPER_ADMIN" && target.seedAccount) {
      throw new Error(
        "Le compte SUPER_ADMIN principal de démonstration ne peut pas être supprimé.",
      );
    }
    const activeSuper = accounts.filter(
      (account) =>
        account.role === "SUPER_ADMIN" && account.status === "ACTIF",
    );
    if (
      target.role === "SUPER_ADMIN" &&
      target.status === "ACTIF" &&
      activeSuper.length <= 1
    ) {
      throw new Error(
        "Impossible de supprimer le dernier SUPER_ADMIN actif.",
      );
    }
    writeAll(accounts.filter((account) => account.id !== id));
    const sessionId = adminStorage.getSessionId();
    if (sessionId === id) {
      adminStorage.clearSession();
    }
    return true;
  },

  resetAdminDemoAccounts(): StoredAdministrator[] {
    const seeds = cloneSeeds();
    writeAll(seeds);
    adminStorage.clearSession();
    return seeds;
  },

  getSessionId(): number | null {
    if (!canUseStorage()) return null;
    const raw = window.localStorage.getItem(ADMIN_DEMO_SESSION_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) ? id : null;
  },

  setSessionId(id: number) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ADMIN_DEMO_SESSION_KEY, String(id));
  },

  clearSession() {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ADMIN_DEMO_SESSION_KEY);
  },

  /**
   * Authentifie un compte démo.
   * Seeds : mot de passe non vide.
   * Comptes créés : demoPassword exact.
   */
  authenticate(
    email: string,
    password: string,
  ):
    | { ok: true; admin: StoredAdministrator }
    | { ok: false; error: string } {
    const found = adminStorage.findByEmail(email);
    if (!found) {
      return {
        ok: false,
        error:
          "Aucun compte administratif de démonstration ne correspond à cet e-mail.",
      };
    }
    if (found.status === "DESACTIVE") {
      return {
        ok: false,
        error: "Ce compte administrateur est désactivé.",
      };
    }
    if (found.status === "EN_ATTENTE") {
      return {
        ok: false,
        error:
          "Ce compte est en attente d’activation. L’invitation n’a pas encore été acceptée.",
      };
    }

    const acceptsAny =
      found.seedAccount === true ||
      !found.demoPassword ||
      found.demoPassword.length === 0;

    if (acceptsAny) {
      if (!password) {
        return { ok: false, error: "Le mot de passe est requis." };
      }
    } else if (found.demoPassword !== password) {
      return {
        ok: false,
        error: "Mot de passe incorrect (démonstration frontend).",
      };
    }

    const withLogin = adminStorage.update(found.id, {
      lastLogin: "À l’instant",
    });

    return { ok: true, admin: withLogin ?? found };
  },
};

export function resetAdminDemoAccounts() {
  return adminStorage.resetAdminDemoAccounts();
}

export function getDemoLoginHints() {
  return adminStorage
    .list()
    .filter((admin) => admin.status === "ACTIF")
    .map((admin) => ({
      email: admin.email,
      name: admin.name,
      role: admin.role,
      seedAccount: Boolean(admin.seedAccount),
    }));
}
