/**
 * Comptes administratifs de démonstration + permissions.
 * Réutilise / unifie le modèle déjà présent sur /administrateurs.
 * Aucune session serveur — usage frontend uniquement.
 */

import { formatAdminRoleLabel } from "@/lib/ui/permissions";

export type AdminStatus = "ACTIF" | "DESACTIVE" | "EN_ATTENTE";

/**
 * Rôles de gestion déjà utilisés dans l’UI Administrateurs.
 * Conceptuellement : SUPER_ADMIN (accès total) vs famille ADMIN
 * (ADMIN, MODERATEUR, SUPPORT, CONTENT_ADMIN = profils à permissions).
 */
export type AdminAccountRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MODERATEUR"
  | "SUPPORT"
  | "CONTENT_ADMIN";

export type Administrator = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: AdminAccountRole;
  status: AdminStatus;
  lastLogin: string;
  permissions: string[];
  createdAt?: string;
  /**
   * DEMO ONLY — mot de passe temporaire en clair (localStorage).
   * À retirer lors de l’intégration Spring Boot.
   */
  demoPassword?: string;
  /** Compte seed : accepte tout mot de passe non vide. */
  seedAccount?: boolean;
};

export type AdminSection =
  | "dashboard"
  | "utilisateurs"
  | "roles"
  | "annonces"
  | "biens"
  | "moderation"
  | "signalements"
  | "contacts"
  | "referentiels"
  | "statistiques"
  | "audit"
  | "contenus"
  | "parametres"
  | "administrateurs"
  | "mon-compte";

export const AVAILABLE_ROLES: AdminAccountRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATEUR",
  "SUPPORT",
  "CONTENT_ADMIN",
];

export const AVAILABLE_PERMISSIONS = [
  "TOUTES",
  "MODERATION",
  "SIGNALEMENTS",
  "ANNONCES",
  "ANNONCES_ECRITURE",
  "ANNONCES_PUBLICATION",
  "BIENS_ECRITURE",
  "UTILISATEURS_LECTURE",
  "UTILISATEURS_ECRITURE",
  "CONTACTS",
  "VERIFICATIONS",
  "CONTENUS",
  "FAQ",
  "GUIDES",
  "AUDIT",
  "PARAMETRES",
  "ADMINISTRATEURS",
  "STATISTIQUES",
  "REFERENTIELS",
] as const;

export type AdminPermission = (typeof AVAILABLE_PERMISSIONS)[number];

export const ROLE_DEFAULT_PERMISSIONS: Record<AdminAccountRole, string[]> = {
  SUPER_ADMIN: ["TOUTES"],
  ADMIN: [
    "MODERATION",
    "SIGNALEMENTS",
    "ANNONCES",
    "ANNONCES_ECRITURE",
    "ANNONCES_PUBLICATION",
    "BIENS_ECRITURE",
    "UTILISATEURS_LECTURE",
    "UTILISATEURS_ECRITURE",
    "CONTACTS",
    "VERIFICATIONS",
    "STATISTIQUES",
    "AUDIT",
  ],
  /** Modération uniquement — pas de création/publication admin par défaut. */
  MODERATEUR: ["MODERATION", "SIGNALEMENTS", "ANNONCES"],
  SUPPORT: [
    "UTILISATEURS_LECTURE",
    "CONTACTS",
    "UTILISATEURS_ECRITURE",
    "VERIFICATIONS",
  ],
  CONTENT_ADMIN: ["CONTENUS", "FAQ", "GUIDES"],
};

/** Permissions requises pour une section (OU logique). SUPER_ADMIN / TOUTES bypass. */
export const SECTION_PERMISSIONS: Record<AdminSection, string[] | "any"> = {
  dashboard: "any",
  "mon-compte": "any",
  utilisateurs: ["UTILISATEURS_LECTURE", "UTILISATEURS_ECRITURE"],
  roles: ["VERIFICATIONS", "UTILISATEURS_LECTURE", "UTILISATEURS_ECRITURE"],
  annonces: [
    "ANNONCES",
    "ANNONCES_ECRITURE",
    "ANNONCES_PUBLICATION",
    "MODERATION",
  ],
  biens: ["BIENS_ECRITURE", "ANNONCES_ECRITURE", "ANNONCES"],
  moderation: ["MODERATION"],
  signalements: ["SIGNALEMENTS", "MODERATION"],
  contacts: ["CONTACTS"],
  referentiels: ["REFERENTIELS", "PARAMETRES"],
  statistiques: ["STATISTIQUES", "AUDIT"],
  audit: ["AUDIT"],
  contenus: ["CONTENUS", "FAQ", "GUIDES"],
  parametres: ["PARAMETRES"],
  administrateurs: ["ADMINISTRATEURS", "TOUTES"],
};

export const DEMO_ADMINISTRATORS: Administrator[] = [
  {
    id: 1,
    name: "Ibrahima Bah",
    email: "admin@demeureguinee.com",
    phone: "+224 620 00 00 01",
    role: "SUPER_ADMIN",
    status: "ACTIF",
    lastLogin: "Aujourd’hui à 10:42",
    permissions: ["TOUTES"],
    createdAt: "01 janvier 2026",
  },
  {
    id: 2,
    name: "Aïssatou Camara",
    email: "moderateur@demeureguinee.com",
    phone: "+224 620 00 00 02",
    role: "MODERATEUR",
    status: "ACTIF",
    lastLogin: "Aujourd’hui à 09:35",
    permissions: ["MODERATION", "SIGNALEMENTS", "ANNONCES"],
    createdAt: "12 mars 2026",
  },
  {
    id: 3,
    name: "Mamadou Diallo",
    email: "support@demeureguinee.com",
    phone: "+224 620 00 00 03",
    role: "SUPPORT",
    status: "ACTIF",
    lastLogin: "Hier à 16:10",
    permissions: [
      "UTILISATEURS_LECTURE",
      "UTILISATEURS_ECRITURE",
      "CONTACTS",
    ],
    createdAt: "04 avril 2026",
  },
  {
    id: 4,
    name: "Fatoumata Sylla",
    email: "contenu@demeureguinee.com",
    phone: "+224 620 00 00 04",
    role: "CONTENT_ADMIN",
    status: "ACTIF",
    lastLogin: "20 juillet 2026",
    permissions: ["CONTENUS", "FAQ", "GUIDES"],
    createdAt: "18 mai 2026",
  },
  {
    id: 5,
    name: "Invité opérations",
    email: "operations@demeureguinee.com",
    role: "ADMIN",
    status: "EN_ATTENTE",
    lastLogin: "Invitation non acceptée",
    permissions: ["ANNONCES", "UTILISATEURS_LECTURE", "STATISTIQUES"],
    createdAt: "01 août 2026",
  },
  {
    id: 6,
    name: "Sékou Touré",
    email: "admin.ops@demeureguinee.com",
    phone: "+224 620 00 00 06",
    role: "ADMIN",
    status: "ACTIF",
    lastLogin: "Aujourd’hui à 08:15",
    permissions: [...ROLE_DEFAULT_PERMISSIONS.ADMIN],
    createdAt: "22 juin 2026",
  },
  {
    id: 7,
    name: "Aminata Condé",
    email: "immobilier@demeureguinee.com",
    phone: "+224 620 00 00 07",
    role: "ADMIN",
    status: "ACTIF",
    lastLogin: "Aujourd’hui à 11:05",
    permissions: [
      "ANNONCES",
      "ANNONCES_ECRITURE",
      "ANNONCES_PUBLICATION",
      "BIENS_ECRITURE",
      "MODERATION",
      "SIGNALEMENTS",
      "CONTACTS",
    ],
    createdAt: "11 août 2026",
  },
];

export function isSuperAdmin(admin: Pick<Administrator, "role" | "permissions">) {
  return (
    admin.role === "SUPER_ADMIN" || admin.permissions.includes("TOUTES")
  );
}

export function hasPermission(
  admin: Pick<Administrator, "role" | "permissions">,
  permission: string,
) {
  if (isSuperAdmin(admin)) return true;
  return admin.permissions.includes(permission);
}

export function hasAnyPermission(
  admin: Pick<Administrator, "role" | "permissions">,
  permissions: string[],
) {
  if (isSuperAdmin(admin)) return true;
  return permissions.some((permission) =>
    admin.permissions.includes(permission),
  );
}

export function canAccessSection(
  admin: Pick<Administrator, "role" | "permissions">,
  section: AdminSection,
) {
  const required = SECTION_PERMISSIONS[section];
  if (required === "any") return true;
  if (isSuperAdmin(admin)) return true;
  return hasAnyPermission(admin, required);
}

/** Créer / modifier un Property pour un annonceur. */
export function canWriteProperties(
  admin: Pick<Administrator, "role" | "permissions">,
) {
  return hasPermission(admin, "BIENS_ECRITURE");
}

/** Créer / modifier une annonce (admin). */
export function canWriteListings(
  admin: Pick<Administrator, "role" | "permissions">,
) {
  return hasPermission(admin, "ANNONCES_ECRITURE");
}

/** Publier directement (sans file EN_ATTENTE). */
export function canPublishListings(
  admin: Pick<Administrator, "role" | "permissions">,
) {
  return hasPermission(admin, "ANNONCES_PUBLICATION");
}

/** Approuver / corriger / refuser une soumission. */
export function canModerateListings(
  admin: Pick<Administrator, "role" | "permissions">,
) {
  return hasPermission(admin, "MODERATION");
}

export function roleLabel(role: AdminAccountRole) {
  return formatAdminRoleLabel(role);
}

/** Rôle de sécurité affiché (SUPER_ADMIN vs ADMIN). */
export function securityRoleLabel(role: AdminAccountRole) {
  return role === "SUPER_ADMIN" ? "Super administrateur" : "Administrateur";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Seeds uniquement — pour la résolution runtime utiliser adminStorage.findByEmail. */
export function findSeedAdministrator(email: string) {
  const normalized = email.trim().toLowerCase();
  return DEMO_ADMINISTRATORS.find(
    (admin) => admin.email.toLowerCase() === normalized,
  );
}
