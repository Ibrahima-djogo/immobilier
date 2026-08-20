/** Libellés d’affichage des permissions admin — les codes internes restent inchangés. */

const PERMISSION_LABELS: Record<string, string> = {
  TOUTES: "Toutes les permissions",
  UTILISATEURS_LECTURE: "Voir les utilisateurs",
  UTILISATEURS_ECRITURE: "Gérer les utilisateurs",
  ANNONCES: "Voir les annonces",
  ANNONCES_ECRITURE: "Gérer les annonces",
  ANNONCES_PUBLICATION: "Publier les annonces",
  BIENS_ECRITURE: "Gérer les biens",
  MODERATION: "Modération",
  SIGNALEMENTS: "Signalements",
  CONTACTS: "Contacts",
  VERIFICATIONS: "Vérifications",
  CONTENUS: "Contenus",
  FAQ: "FAQ",
  GUIDES: "Guides",
  AUDIT: "Journal d’audit",
  PARAMETRES: "Paramètres",
  ADMINISTRATEURS: "Administrateurs",
  STATISTIQUES: "Statistiques",
  REFERENTIELS: "Référentiels",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  MODERATEUR: "Modérateur",
  SUPPORT: "Support",
  CONTENT_ADMIN: "Administrateur de contenu",
};

function humanizeCode(code: string) {
  const cleaned = String(code || "").trim();
  if (!cleaned) return "";
  const words = cleaned
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
  return words;
}

export function formatAdminRoleLabel(role: string) {
  return ROLE_LABELS[role] ?? humanizeCode(role);
}

export function formatPermissionLabel(permission: string) {
  return PERMISSION_LABELS[permission] ?? humanizeCode(permission);
}

export function isAllPermissions(permissions: string[]) {
  return permissions.includes("TOUTES");
}

export function formatAccessCountLabel(
  permissions: string[],
  role?: string,
) {
  if (role === "SUPER_ADMIN" || isAllPermissions(permissions)) {
    return "Toutes les permissions";
  }
  const count = permissions.length;
  if (count === 0) return "Aucune permission";
  return count === 1 ? "1 permission" : `${count} permissions`;
}
