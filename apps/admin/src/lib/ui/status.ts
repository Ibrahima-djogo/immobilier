/** Libellés et tonalités de statut — cohérents dans tout l’admin. */

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

const TONE_BY_STATUS: Record<string, StatusTone> = {
  ACTIF: "success",
  PUBLIE: "success",
  PUBLIEE: "success",
  ACTION_PRISE: "success",
  APPROUVEE: "success",
  VALIDE: "success",
  VERIFIE: "success",
  CLOTURE: "neutral",
  EN_ATTENTE: "warning",
  EN_VERIFICATION: "warning",
  NON_SOUMIS: "neutral",
  NON_VERIFIE: "neutral",
  BROUILLON: "warning",
  NOUVEAU: "warning",
  NOUVELLE: "warning",
  PRISE_EN_CHARGE: "info",
  PLANIFIEE: "info",
  TERMINEE: "success",
  ANNULEE: "neutral",
  EN_ANALYSE: "warning",
  EN_EXAMEN: "warning",
  SOUMISE: "warning",
  COMPLEMENT_REQUIS: "warning",
  A_CORRIGER: "warning",
  SUSPENDU: "danger",
  SUSPENDUE: "danger",
  BLOQUE: "danger",
  DESACTIVE: "danger",
  INACTIF: "danger",
  REJETE: "danger",
  REJETEE: "danger",
  REFUSEE: "danger",
  REFUSE: "danger",
  SUCCES: "success",
  AUTORISE: "success",
  ECHEC: "danger",
};

const LABEL_BY_STATUS: Record<string, string> = {
  A_CORRIGER: "À CORRIGER",
  ANNULEE: "ANNULÉE",
  APPROUVEE: "APPROUVÉE",
  ARCHIVE: "ARCHIVÉ",
  BLOQUE: "BLOQUÉ",
  CLOTURE: "CLÔTURÉ",
  COMPLEMENT_REQUIS: "COMPLÉMENT REQUIS",
  DESACTIVE: "DÉSACTIVÉ",
  ECHEC: "ÉCHEC",
  NON_VERIFIE: "NON VÉRIFIÉ",
  PUBLIE: "PUBLIÉ",
  PUBLIEE: "PUBLIÉE",
  REFUSE: "REFUSÉ",
  REFUSEE: "REFUSÉE",
  REJETE: "REJETÉ",
  REJETEE: "REJETÉE",
  SUCCES: "SUCCÈS",
  TERMINEE: "TERMINÉE",
  TRAITE: "TRAITÉ",
  TRAITEE: "TRAITÉE",
  VERIFIE: "VÉRIFIÉ",
};

export function formatStatusLabel(status: string) {
  return LABEL_BY_STATUS[status] ?? status.replaceAll("_", " ");
}

export function statusTone(status: string): StatusTone {
  return TONE_BY_STATUS[status] ?? "neutral";
}
