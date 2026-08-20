import { formatRoleLabel, formatStatusLabel } from "@/lib/ui/status";
import { validateApplicantReason } from "./decision-reason";
import {
  canEditRoleRequest,
  canResubmitRefusedRoleRequest,
  correctionFormHref,
  isRoleRequestFinallyClosed,
  resolveCorrectionFocus,
  resolveRoleRequestNextStep,
  shouldLockRoleRequestForm,
  stepForCorrectionFocus,
} from "./role-request-tracking";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const refusedOpen = {
  id: "rr-refused-open",
  status: "REFUSEE" as const,
  canResubmit: true,
};
const refusedClosed = {
  id: "rr-refused-closed",
  status: "REFUSEE" as const,
  canResubmit: false,
};
const toCorrect = { id: "rr-correction", status: "A_CORRIGER" as const };
const pending = { id: "rr-pending", status: "EN_ATTENTE" as const };

const refusedOpenStep = resolveRoleRequestNextStep(refusedOpen);
assert(
  refusedOpenStep.title === "Corriger votre dossier",
  "REFUSEE + canResubmit=true → corriger le dossier",
);
assert(
  refusedOpenStep.actionLabel === "Corriger mon dossier" &&
    refusedOpenStep.actionHref === "/demande-role?id=rr-refused-open",
  "REFUSEE + canResubmit=true → bouton Corriger mon dossier",
);
assert(
  canResubmitRefusedRoleRequest(refusedOpen) &&
    canEditRoleRequest(refusedOpen) &&
    !shouldLockRoleRequestForm(refusedOpen),
  "REFUSEE + canResubmit=true reste éditable, distinct de A_CORRIGER",
);
assert(
  refusedOpenStep.title !== "Attendre le contrôle",
  "REFUSEE ne doit pas afficher Attendre le contrôle",
);

const refusedClosedStep = resolveRoleRequestNextStep(refusedClosed);
assert(
  refusedClosedStep.eyebrow === "Décision finale" &&
    refusedClosedStep.title === "Demande clôturée",
  "REFUSEE + canResubmit=false → décision finale",
);
assert(
  refusedClosedStep.actionLabel === null,
  "REFUSEE + canResubmit=false → aucun bouton",
);
assert(
  isRoleRequestFinallyClosed(refusedClosed) &&
    !canEditRoleRequest(refusedClosed) &&
    shouldLockRoleRequestForm(refusedClosed),
  "REFUSEE + canResubmit=false clôture le dossier",
);
assert(
  refusedClosedStep.description.includes("compte reste un compte standard"),
  "REFUSEE clôturée précise que le compte reste standard",
);

const correctionStep = resolveRoleRequestNextStep(toCorrect);
assert(
  correctionStep.title === "Compléter puis renvoyer",
  "A_CORRIGER reste un dossier ouvert",
);
assert(
  canEditRoleRequest(toCorrect) &&
    !canResubmitRefusedRoleRequest(toCorrect) &&
    !shouldLockRoleRequestForm(toCorrect),
  "A_CORRIGER ≠ REFUSEE / canResubmit",
);

const pendingStep = resolveRoleRequestNextStep(pending);
assert(
  pendingStep.title === "Attendre le contrôle",
  "EN_ATTENTE → attendre le contrôle",
);
assert(
  pendingStep.actionLabel === null && shouldLockRoleRequestForm(pending),
  "EN_ATTENTE n’offre pas de correction",
);

assert(formatStatusLabel("EN_ATTENTE") === "En attente", "EN_ATTENTE formaté");
assert(formatStatusLabel("REFUSEE") === "Refusée", "REFUSEE formaté");
assert(formatStatusLabel("A_CORRIGER") === "À corriger", "A_CORRIGER formaté");
assert(formatStatusLabel("VALIDE") === "Validé", "VALIDE formaté");
assert(formatRoleLabel("PROPRIETAIRE") === "Propriétaire", "PROPRIETAIRE formaté");

assert(
  correctionFormHref("rr-demo-correction") ===
    "/demande-role?id=rr-demo-correction",
  "Le lien de correction pointe vers la même demande",
);
assert(
  refusedClosedStep.actionHref === null,
  "REFUSEE + canResubmit=false n’a pas de lien de correction",
);
assert(stepForCorrectionFocus("documents") === 4, "Documents → étape 4");
assert(stepForCorrectionFocus("identity") === 2, "Identité → étape 2");
assert(stepForCorrectionFocus("company") === 3, "Entreprise → étape 3");
assert(stepForCorrectionFocus("declarations") === 5, "Déclarations → étape 5");

const docFocus = resolveCorrectionFocus({
  correctionTarget: "documents",
  documents: [
    {
      label: "Pièce — recto",
      verificationStatus: "A_CORRIGER",
      rejectionReason: "Image trop floue",
    },
  ],
});
assert(docFocus.focus === "documents", "correctionTarget documents");
assert(
  docFocus.items.some((item) => item.includes("recto")),
  "Les pièces à corriger sont listées",
);

assert(!validateApplicantReason("").ok, "motif vide refusé");
assert(!validateApplicantReason("ghjkhj").ok, "motif inexploitable refusé");
assert(!validateApplicantReason("   ok   ").ok, "motif trop court refusé");
assert(
  !validateApplicantReason("aaaaaaaaaaaaaaaaaaaaaaaaaaaa").ok,
  "suite de caractères identiques refusée",
);
const usable = validateApplicantReason(
  "Le document d’identité est illisible et ne permet pas de vérifier l’identité du demandeur.",
);
assert(usable.ok, "motif exploitable accepté");

console.log("OK — 4 cas suivi demande de rôle + libellés + motif de refus");
