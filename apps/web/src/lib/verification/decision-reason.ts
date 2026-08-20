/** Motif destiné au demandeur — doit rester exploitable, pas un code interne. */
export const MIN_APPLICANT_REASON_LENGTH = 24;
export const MIN_APPLICANT_REASON_WORDS = 3;

export function normalizeApplicantReason(reason: string) {
  return String(reason || "").trim().replace(/\s+/g, " ");
}

export function validateApplicantReason(
  reason: string,
  kind: "refus" | "correction" = "refus",
): { ok: true; value: string } | { ok: false; message: string } {
  const value = normalizeApplicantReason(reason);
  const label = kind === "refus" ? "refus" : "correction";

  if (!value) {
    return {
      ok: false,
      message: `Indiquez un motif de ${label} exploitable pour le demandeur.`,
    };
  }

  if (value.length < MIN_APPLICANT_REASON_LENGTH) {
    return {
      ok: false,
      message: `Le motif est trop court. Expliquez le ${label} en au moins ${MIN_APPLICANT_REASON_LENGTH} caractères, pour que le demandeur comprenne la décision.`,
    };
  }

  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < MIN_APPLICANT_REASON_WORDS) {
    return {
      ok: false,
      message:
        "Rédigez une explication en plusieurs mots : ce qui a été refusé, et pourquoi.",
    };
  }

  const compact = value.replace(/\s/g, "");
  if (/^(.)\1+$/u.test(compact)) {
    return {
      ok: false,
      message: "Le motif ne peut pas être une suite de caractères identiques.",
    };
  }

  return { ok: true, value };
}
