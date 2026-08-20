/** Libellés et tonalités de statut — partagés par les espaces connectés.
 *  Les codes techniques restent dans les données, l'interface affiche le libellé. */

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

const TONE_BY_STATUS: Record<string, StatusTone> = {
  // Contacts et demandes
  NOUVEAU: "info",
  NOUVELLE: "info",
  EN_COURS: "warning",
  PRISE_EN_CHARGE: "info",
  QUALIFIE: "info",
  TRAITE: "success",
  TRAITEE: "success",
  CLOTURE: "neutral",
  CLOTUREE: "neutral",
  // Biens et annonces
  ACTIF: "success",
  PUBLIE: "success",
  PUBLIEE: "success",
  BROUILLON: "warning",
  EN_ATTENTE: "warning",
  A_CORRIGER: "warning",
  REFUSEE: "danger",
  REJETEE: "danger",
  SUSPENDUE: "danger",
  ARCHIVE: "neutral",
  ARCHIVEE: "neutral",
  // Demandes de rôle et vérifications
  SOUMISE: "warning",
  EN_EXAMEN: "warning",
  EN_ANALYSE: "warning",
  COMPLEMENT_REQUIS: "warning",
  APPROUVEE: "success",
  VALIDE: "success",
  VERIFIE: "success",
  NON_VERIFIE: "neutral",
  NON_SOUMIS: "neutral",
};

const LABEL_BY_STATUS: Record<string, string> = {
  A_CORRIGER: "À corriger",
  APPROUVEE: "Approuvée",
  ARCHIVE: "Archivé",
  ARCHIVEE: "Archivée",
  BLOQUE: "Bloqué",
  BROUILLON: "Brouillon",
  CLOTURE: "Clôturé",
  CLOTUREE: "Clôturée",
  COMPLEMENT_REQUIS: "Complément requis",
  DESACTIVE: "Désactivé",
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  EN_EXAMEN: "En examen",
  EN_VERIFICATION: "En vérification",
  NON_SOUMIS: "Non soumis",
  NON_VERIFIE: "Non vérifié",
  PUBLIE: "Publié",
  PUBLIEE: "Publiée",
  QUALIFIE: "Qualifié",
  REFUSE: "Refusé",
  REFUSEE: "Refusée",
  REJETEE: "Rejetée",
  SOUMISE: "Soumise",
  TRAITE: "Traité",
  TRAITEE: "Traitée",
  VALIDE: "Validé",
  VERIFIE: "Vérifié",
};

const LABEL_BY_ROLE: Record<string, string> = {
  PROPRIETAIRE: "Propriétaire",
  AGENCE: "Agence",
  UTILISATEUR: "Utilisateur",
  USER: "Utilisateur",
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super administrateur",
};

function humanizeCode(value: string) {
  const words = value.replaceAll("_", " ").toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : value;
}

export function formatStatusLabel(status: string) {
  return LABEL_BY_STATUS[status] ?? humanizeCode(status);
}

export function formatRoleLabel(role: string) {
  return LABEL_BY_ROLE[role] ?? humanizeCode(role);
}

export function statusTone(status: string): StatusTone {
  return TONE_BY_STATUS[status] ?? "neutral";
}
