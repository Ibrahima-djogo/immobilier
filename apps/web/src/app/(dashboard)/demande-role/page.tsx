"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  CircleAlert,
  Home,
  Info,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import {
  labelPropertyType,
  normalizePropertyTypeKey,
} from "@/lib/property/typeFields";
import {
  DeclaredProjectFields,
  type DeclaredPortfolioSize,
  type DeclaredPropertyIntent,
} from "@/components/verification/DeclaredProjectFields";
import { RoleRequestDocumentsStep } from "@/components/verification/RoleRequestDocumentsStep";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { DEMO_API_URL } from "@/lib/demo-api/config";
import {
  roleRequestService,
  type ActivityType,
  type RoleRequest,
  type VerificationDocument,
} from "@/lib/demo-api/role-requests";
import { formatRoleLabel, formatStatusLabel } from "@/lib/ui/status";
import {
  ACTIVITY_TYPE_OPTIONS,
  getBlockingRequirements,
  isDocDefComplete,
  SPECIALTY_OPTIONS,
} from "@/lib/verification/role-document-requirements";
import {
  canEditRoleRequest,
  isCorrectionFlow,
  isRoleRequestFinallyClosed,
  labelForCorrectionFocus,
  resolveCorrectionFocus,
  shouldLockRoleRequestForm,
  stepForCorrectionFocus,
} from "@/lib/verification/role-request-tracking";
import styles from "./page.module.css";

type RoleType = "PROPRIETAIRE" | "AGENCE";
type Step = 1 | 2 | 3 | 4 | 5;

const stepLabels = [
  "Rôle",
  "Identité",
  "Informations",
  "Documents",
  "Déclarations",
];

const emptyPersonal = {
  firstName: "",
  lastName: "",
  birthDate: "",
  birthPlace: "",
  nationality: "Guinéenne",
  email: "",
  phone: "",
  idType: "CNI",
  idNumber: "",
  idIssuedAt: "",
  idExpiresAt: "",
  idIssuer: "",
  address: "",
  city: "",
  commune: "",
  district: "",
  landmark: "",
  profession: "",
  whatsapp: "",
  secondaryPhone: "",
  additionalInfo: "",
};

const PORTFOLIO_WEIGHT: Record<DeclaredPortfolioSize, number> = {
  ONE: 1,
  TWO_TO_FIVE: 2,
  MORE_THAN_FIVE: 3,
};

/**
 * Les listes plates restent envoyées pour compatibilité, mais elles sont
 * toujours dérivées des intentions par type (source unique).
 */
function flatFromIntents(intents: DeclaredPropertyIntent[]) {
  const types: string[] = [];
  const operations: ("VENTE" | "LOCATION")[] = [];
  let portfolioSize: DeclaredPortfolioSize | "" = "";
  for (const intent of intents) {
    if (!types.includes(intent.propertyType)) types.push(intent.propertyType);
    for (const op of intent.operations) {
      if (!operations.includes(op)) operations.push(op);
    }
    if (
      intent.quantityRange &&
      PORTFOLIO_WEIGHT[intent.quantityRange] >
        (portfolioSize ? PORTFOLIO_WEIGHT[portfolioSize] : 0)
    ) {
      portfolioSize = intent.quantityRange;
    }
  }
  return { types, operations, portfolioSize };
}

/** Lit les intentions renvoyées par l’API, avec repli sur les listes plates. */
function intentsFromRequest(request: RoleRequest): DeclaredPropertyIntent[] {
  const stored = request.declaredPropertyIntents;
  const raw: DeclaredPropertyIntent[] = stored?.length
    ? stored.map((intent) => ({
        propertyType: normalizePropertyTypeKey(intent.propertyType),
        operations: (intent.operations || []).filter(isDeclaredOperation),
        quantityRange: intent.quantityRange || null,
      }))
    : (request.declaredPropertyTypes || []).map((type) => ({
        propertyType: normalizePropertyTypeKey(type),
        operations: (request.declaredOperations || []).filter(
          isDeclaredOperation,
        ),
        quantityRange:
          (request.declaredPortfolioSize as DeclaredPortfolioSize) || null,
      }));

  const merged: DeclaredPropertyIntent[] = [];
  for (const intent of raw) {
    const existing = merged.find(
      (item) => item.propertyType === intent.propertyType,
    );
    if (!existing) {
      merged.push({ ...intent, operations: [...intent.operations] });
      continue;
    }
    for (const op of intent.operations) {
      if (!existing.operations.includes(op)) existing.operations.push(op);
    }
    existing.quantityRange = existing.quantityRange || intent.quantityRange;
  }
  return merged;
}

function isDeclaredOperation(op: string): op is "VENTE" | "LOCATION" {
  return op === "VENTE" || op === "LOCATION";
}

function findDoc(
  docs: VerificationDocument[],
  type: string,
): VerificationDocument | null {
  return docs.find((d) => d.documentType === type) || null;
}

function fileUrlAbsolute(fileUrl: string | null | undefined, userId: string) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  const base = DEMO_API_URL.replace(/\/$/, "");
  const sep = fileUrl.includes("?") ? "&" : "?";
  return `${base}${fileUrl}${sep}userId=${encodeURIComponent(userId)}`;
}

function docPreview(
  docs: VerificationDocument[],
  type: string,
  userId: string,
) {
  const d = findDoc(docs, type);
  if (!d) return null;
  return {
    id: d.id,
    fileName: d.fileName || "",
    fileUrl: fileUrlAbsolute(d.fileUrl, userId),
    mimeType: d.mimeType,
    fileSize: d.fileSize,
  };
}

export default function RoleRequestPage() {
  return (
    <Suspense fallback={<p>Chargement du dossier…</p>}>
      <RoleRequestForm />
    </Suspense>
  );
}

function RoleRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRequestId = (searchParams.get("id") || "").trim();
  const { session, ready, isLoggedIn } = usePublicDemoSession();
  const [step, setStep] = useState<Step>(1);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [role, setRole] = useState<RoleType | "">("");
  const [activityType, setActivityType] = useState<ActivityType>(null);
  const [personal, setPersonal] = useState({ ...emptyPersonal });
  const [company, setCompany] = useState({
    legalName: "",
    tradeName: "",
    rccm: "",
    nif: "",
    city: "",
    address: "",
    professionalEmail: "",
    professionalPhone: "",
    website: "",
    experienceStartYear: "",
    experienceYears: "",
    specialties: "",
    experienceSummary: "",
    agreementNumber: "",
    agreementDate: "",
    agreementIssuer: "",
    qualificationTitle: "",
    qualificationDomain: "",
  });
  const [representative, setRepresentative] = useState({
    firstName: "",
    lastName: "",
    function: "",
    phone: "",
    email: "",
  });
  const [declarations, setDeclarations] = useState({
    accuracy: false,
    authorization: false,
    processing: false,
    privacy: false,
  });
  const [declaredIntents, setDeclaredIntents] = useState<
    DeclaredPropertyIntent[]
  >([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<RoleRequest | null>(null);
  const [loadedRequest, setLoadedRequest] = useState<RoleRequest | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [focusSection, setFocusSection] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace(
        `/connexion?retour=${encodeURIComponent(
          urlRequestId
            ? `/demande-role?id=${encodeURIComponent(urlRequestId)}`
            : "/demande-role",
        )}`,
      );
      return;
    }
    if (!session) return;

    let cancelled = false;
    setBootstrapping(true);
    setError("");

    (async () => {
      try {
        let full: RoleRequest | null = null;
        if (urlRequestId) {
          const data = await roleRequestService.get(urlRequestId);
          if (data.userId && data.userId !== session.id) {
            if (!cancelled) {
              setError("Ce dossier n’appartient pas à votre compte.");
              setLoadedRequest(null);
              setSubmitted(null);
            }
            return;
          }
          full = data;
        } else {
          const list = await roleRequestService.list(session.id);
          const open =
            list.find((r) =>
              [
                "BROUILLON",
                "A_CORRIGER",
                "EN_ATTENTE",
                "EN_VERIFICATION",
              ].includes(r.status),
            ) ||
            list.find(
              (r) => r.status === "APPROUVEE" || r.status === "REFUSEE",
            );
          if (open) {
            full = await roleRequestService.get(open.id);
            if (full.userId && full.userId !== session.id) {
              full = null;
            }
          }
        }

        if (cancelled) return;
        if (!full) {
          setLoadedRequest(null);
          setSubmitted(null);
          setPersonal({
            ...emptyPersonal,
            email: session.email || "",
            phone: session.phone || "",
            firstName: session.name.split(" ")[0] || "",
            lastName: session.name.split(" ").slice(1).join(" ") || "",
            whatsapp: session.phone || "",
          });
          return;
        }

        if (isRoleRequestFinallyClosed(full)) {
          setLoadedRequest(full);
          setSubmitted(full);
          setRequestId(full.id);
          return;
        }

        setRequestId(full.id);
        setLoadedRequest(full);
        setRole(full.requestedRole);
        setActivityType(full.activityType);
        setPersonal({
          ...emptyPersonal,
          ...full.personalInformation,
          email: full.personalInformation?.email || session.email || "",
          phone: full.personalInformation?.phone || session.phone || "",
        });
        if (full.companyInformation) {
          setCompany((c) => ({ ...c, ...full.companyInformation }));
        }
        if (full.representative) {
          setRepresentative((r) => ({ ...r, ...full.representative }));
        }
        if (full.declarations) {
          setDeclarations((d) => ({ ...d, ...full.declarations }));
        }
        setDeclaredIntents(intentsFromRequest(full));
        setDocuments(full.documents || []);

        if (shouldLockRoleRequestForm(full)) {
          setSubmitted(full);
          setMessage("");
          return;
        }

        setSubmitted(null);
        if (isCorrectionFlow(full)) {
          const correction = resolveCorrectionFocus(full);
          setStep(stepForCorrectionFocus(correction.focus));
          setFocusSection(correction.focus);
          setMessage("");
        } else {
          setStep(1);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger votre dossier.",
          );
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, isLoggedIn, session, router, urlRequestId]);

  useEffect(() => {
    if (!focusSection || bootstrapping) return;
    const el = document.getElementById(`section-${focusSection}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSection, step, bootstrapping]);

  const completeness = useMemo(() => {
    let score = 5;
    if (role) score += 8;
    if (personal.firstName && personal.lastName) score += 10;
    if (personal.birthDate && personal.nationality) score += 8;
    if (personal.phone && personal.email) score += 6;
    if (personal.idType && personal.idNumber) score += 6;
    if (personal.address && personal.city && personal.commune) score += 8;
    if (role === "AGENCE") {
      if (company.legalName && company.rccm) score += 8;
      if (representative.lastName) score += 4;
      if (activityType) score += 4;
      if (company.experienceYears || company.experienceStartYear) score += 4;
    } else if (role === "PROPRIETAIRE") {
      score += 6;
    }
    if (role) {
      const ctx = {
        role: role as RoleType,
        activityType: role === "AGENCE" ? activityType : null,
      };
      const blocking = getBlockingRequirements(ctx);
      const done = blocking.filter((d) =>
        isDocDefComplete(d, documents, personal),
      ).length;
      if (blocking.length > 0) {
        score += Math.round((done / blocking.length) * 28);
      }
    }
    if (
      declarations.accuracy &&
      declarations.authorization &&
      declarations.processing &&
      declarations.privacy
    ) {
      score += 8;
    }
    return Math.min(100, score);
  }, [
    role,
    personal,
    company,
    representative,
    activityType,
    documents,
    declarations,
  ]);

  const declaredFlat = useMemo(
    () => flatFromIntents(declaredIntents),
    [declaredIntents],
  );

  const declaredPayload = {
    declaredPropertyIntents: declaredIntents,
    declaredPropertyTypes: declaredFlat.types,
    declaredOperations: declaredFlat.operations,
    declaredPortfolioSize: declaredFlat.portfolioSize || null,
  };

  const correction =
    loadedRequest && isCorrectionFlow(loadedRequest)
      ? resolveCorrectionFocus(loadedRequest)
      : null;
  const documentsToReplace = documents.filter(
    (d) =>
      d.verificationStatus === "A_CORRIGER" ||
      d.verificationStatus === "REFUSE",
  );

  async function ensureDraft() {
    if (!session || !role) throw new Error("Rôle requis");
    if (requestId) return requestId;
    if (urlRequestId) return urlRequestId;
    if (loadedRequest?.id) return loadedRequest.id;
    if (loadedRequest && isCorrectionFlow(loadedRequest)) {
      throw new Error("Impossible de créer une nouvelle demande.");
    }
    const created = await roleRequestService.create({
      userId: session.id,
      requestedRole: role,
      activityType: role === "AGENCE" ? activityType : null,
      personalInformation: personal,
    });
    setRequestId(created.id);
    setLoadedRequest(created);
    return created.id;
  }

  async function saveDraft() {
    if (!session || !role) {
      setError("Choisissez un rôle avant d’enregistrer.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = await ensureDraft();
      const updated = await roleRequestService.update(id, {
        requestedRole: role,
        activityType: role === "AGENCE" ? activityType : null,
        personalInformation: personal,
        companyInformation: role === "AGENCE" ? company : null,
        representative: role === "AGENCE" ? representative : null,
        declarations,
        ...declaredPayload,
      });
      setRequestId(updated.id);
      setLoadedRequest(updated);
      if (updated.documents) setDocuments(updated.documents);
      setMessage("Brouillon enregistré sur la Demo API.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadTypedDocument(
    documentType: string,
    label: string,
    file: File,
    options?: { side?: string; required?: boolean },
  ) {
    if (!session) throw new Error("Session requise");
    const id = await ensureDraft();
    await roleRequestService.update(id, {
      requestedRole: role as RoleType,
      activityType: role === "AGENCE" ? activityType : null,
      personalInformation: personal,
      companyInformation: role === "AGENCE" ? company : null,
      representative: role === "AGENCE" ? representative : null,
    });
    const doc = await roleRequestService.uploadDocument(id, {
      file,
      documentType,
      label,
      side: options?.side,
      required: options?.required,
      userId: session.id,
      reference: personal.idNumber || undefined,
      issuer: personal.idIssuer || undefined,
      issuedAt: personal.idIssuedAt || undefined,
      expiresAt: personal.idExpiresAt || undefined,
    });
    setDocuments((prev) => [doc, ...prev.filter((d) => d.documentType !== documentType)]);
    setMessage(`${label} enregistré.`);
  }

  async function removeTypedDocument(documentType: string) {
    if (!session || !requestId) return;
    const existing = findDoc(documents, documentType);
    if (!existing) return;
    setBusy(true);
    setError("");
    try {
      await roleRequestService.deleteDocument(requestId, existing.id, session.id);
      setDocuments((prev) => prev.filter((d) => d.id !== existing.id));
      setMessage("Document supprimé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  function nextFromStep2() {
    if (!personal.firstName.trim() || !personal.lastName.trim()) {
      setError("Indiquez votre nom et votre prénom.");
      return;
    }
    if (!personal.birthDate || !personal.nationality.trim()) {
      setError("Date de naissance et nationalité sont obligatoires.");
      return;
    }
    if (!personal.email.trim() || !personal.phone.trim()) {
      setError("E-mail et téléphone sont obligatoires.");
      return;
    }
    if (!personal.idType || !personal.idNumber.trim()) {
      setError("Type et numéro de pièce d’identité sont obligatoires.");
      return;
    }
    setError("");
    setStep(3);
  }

  function nextFromStep3() {
    if (!declaredIntents.length) {
      setError("Sélectionnez au moins un type de bien.");
      return;
    }
    const withoutOperation = declaredIntents.filter(
      (intent) => intent.operations.length === 0,
    );
    if (withoutOperation.length > 0) {
      setError(
        `Indiquez au moins une opération (vente ou location) pour : ${withoutOperation
          .map((intent) => labelPropertyType(intent.propertyType))
          .join(", ")}.`,
      );
      return;
    }
    if (role === "PROPRIETAIRE") {
      const withoutQuantity = declaredIntents.filter(
        (intent) => !intent.quantityRange,
      );
      if (withoutQuantity.length > 0) {
        setError(
          `Indiquez le volume de biens pour : ${withoutQuantity
            .map((intent) => labelPropertyType(intent.propertyType))
            .join(", ")}.`,
        );
        return;
      }
    }
    if (role === "AGENCE") {
      if (!company.legalName.trim() || !company.rccm.trim()) {
        setError("Raison sociale et RCCM sont obligatoires.");
        return;
      }
    } else {
      if (
        !personal.address.trim() ||
        !personal.city.trim() ||
        !personal.commune.trim()
      ) {
        setError("Adresse, ville et commune sont obligatoires.");
        return;
      }
    }
    setError("");
    setStep(4);
  }

  function nextFromStep4() {
    if (!role) {
      setError("Choisissez un rôle.");
      return;
    }
    const ctx = {
      role: role as RoleType,
      activityType: role === "AGENCE" ? activityType : null,
    };
    const missing = getBlockingRequirements(ctx).filter(
      (def) => !isDocDefComplete(def, documents, personal),
    );
    if (missing.length > 0) {
      setError(
        `Documents obligatoires manquants : ${missing.map((m) => m.title).join(", ")}.`,
      );
      return;
    }
    if (correction && documentsToReplace.length > 0) {
      setError("Remplacez les pièces signalées avant de renvoyer le dossier.");
      return;
    }
    setError("");
    setStep(5);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!role) {
      setError("Choisissez un rôle.");
      return;
    }
    if (
      !declarations.accuracy ||
      !declarations.authorization ||
      !declarations.processing ||
      !declarations.privacy
    ) {
      setError("Toutes les déclarations sont obligatoires.");
      return;
    }
    if (correction && documentsToReplace.length > 0) {
      setError("Remplacez les pièces signalées avant de renvoyer le dossier.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = await ensureDraft();
      await roleRequestService.update(id, {
        requestedRole: role,
        activityType: role === "AGENCE" ? activityType : null,
        personalInformation: personal,
        companyInformation: role === "AGENCE" ? company : null,
        representative: role === "AGENCE" ? representative : null,
        declarations,
        ...declaredPayload,
      });
      const result = await roleRequestService.submit(id);
      setSubmitted(result);
      setMessage("Demande soumise — vérification interne Demeure Guinée.");
      router.push(`/demande-role/suivi?id=${encodeURIComponent(result.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Soumission impossible.");
    } finally {
      setBusy(false);
    }
  }

  function nextFromStep1() {
    if (!role) {
      setError("Sélectionnez Propriétaire ou Agence.");
      return;
    }
    if (role === "AGENCE" && !activityType) {
      setError("Précisez le type d’activité.");
      return;
    }
    setError("");
    setStep(2);
  }

  if (bootstrapping) {
    return (
      <UserShell active="demande-role">
        <div className={styles.pageContent}>
          <p className={styles.informationMessage} role="status">
            Chargement du dossier…
          </p>
        </div>
      </UserShell>
    );
  }

  if (submitted && !canEditRoleRequest(submitted)) {
    return (
      <UserShell active="demande-role">
        <div className={styles.pageContent}>
        <div className={styles.submittedState}>
          <section className={styles.submittedMain}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={28} aria-hidden="true" />
            </div>
            <h1>
              {submitted.status === "APPROUVEE"
                ? "Demande approuvée"
                : submitted.status === "REFUSEE"
                  ? "Demande refusée"
                  : "Dossier transmis"}
            </h1>
            <p>
              {submitted.status === "APPROUVEE"
                ? "Votre compte est désormais vérifié par Demeure Guinée. Cela ne vérifie pas automatiquement chaque bien."
                : submitted.status === "REFUSEE"
                  ? `${submitted.correctionMessage || "Votre demande n’a pas été validée."} Cette demande est clôturée et ne peut plus être corrigée. Votre compte reste standard.`
                  : `Votre demande ${formatRoleLabel(submitted.requestedRole).toLowerCase()} est en cours de vérification interne par Demeure Guinée — aucune certification ministérielle automatique.`}
            </p>
            <div className={styles.referenceCard}>
              <div>
                <small>Référence</small>
                <strong>{submitted.reference}</strong>
              </div>
              <span className={styles.submittedBadge}>
                {formatStatusLabel(submitted.status)}
              </span>
            </div>
            <div className={styles.submittedActions}>
              <Link
                href={`/demande-role/suivi?id=${encodeURIComponent(submitted.id)}`}
                className={styles.primaryButton}
              >
                Suivre mon dossier
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
        </div>
      </UserShell>
    );
  }

  /**
   * Le panneau latéral n’est rendu que sur les étapes où il apporte du contexte.
   * Sur les étapes de saisie longue il ne ferait que réserver une colonne vide.
   */
  const sidePanel =
    step === 1 || step === 5 ? (
      <aside className={styles.sideColumn}>
        <section className={styles.processCard}>
          <span className={styles.processIcon}>
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <p className={styles.cardEyebrow}>Processus</p>
          <h2>Contrôle admin</h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Soumission</strong>
                <p>Dossier {formatStatusLabel("EN_ATTENTE").toLowerCase()}</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Contrôle documents</strong>
                <p>Validation pièce par pièce</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Décision</strong>
                <p>Approuver / corriger / refuser</p>
              </div>
            </li>
          </ol>
        </section>
        <section className={styles.helpCard}>
          <span>
            <Info size={16} aria-hidden="true" />
          </span>
          <h2>Confidentialité</h2>
          <p>
            Les justificatifs ne sont jamais exposés sur les pages publiques
            d’annonces.
          </p>
          <Link
            href={
              loadedRequest
                ? `/demande-role/suivi?id=${encodeURIComponent(loadedRequest.id)}`
                : "/demande-role/suivi"
            }
          >
            Voir le suivi
          </Link>
        </section>
      </aside>
    ) : null;

  return (
    <UserShell active="demande-role">
      <div className={styles.pageContent}>
      <PageHero
        variant="dashboard"
        eyebrow="Vérification documentaire"
        title={correction ? "Corriger mon dossier" : "Demande de rôle"}
        description={
          correction
            ? "Modifiez uniquement les éléments signalés. Les autres informations déjà enregistrées sont conservées."
            : "Complétez votre dossier afin que Demeure Guinée puisse vérifier votre profil avant l’activation de votre rôle."
        }
        note="La vérification du profil reste distincte de la vérification juridique des biens immobiliers."
        icon={<ShieldCheck size={16} aria-hidden="true" />}
        backHref={
          loadedRequest
            ? `/demande-role/suivi?id=${encodeURIComponent(loadedRequest.id)}`
            : "/tableau-de-bord"
        }
        backLabel={loadedRequest ? "Retour au suivi" : "Retour"}
        badge={<span>Étape {step} sur 5</span>}
        actions={
          <div className={styles.completionCard}>
            <div>
              <small>Complétude</small>
              <strong>{completeness}%</strong>
            </div>
            <div className={styles.completionBar}>
              <span style={{ width: `${completeness}%` }} />
            </div>
          </div>
        }
      />

      {correction ? (
        <div className={styles.correctionBanner}>
          <span>
            <CircleAlert size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>Correction demandée</strong>
            <p>
              {loadedRequest?.correctionMessage ||
                "L’administration a demandé des corrections sur ce dossier."}
            </p>
            <ul>
              {correction.focus ? (
                <li>
                  Élément à corriger :{" "}
                  {labelForCorrectionFocus(correction.focus)}
                </li>
              ) : null}
              {correction.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className={styles.ruleBanner}>
          <span>
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>Vérification interne Demeure Guinée</strong>
            <p>
              Vos documents sont transmis de manière privée à Demeure Guinée pour
              vérification. Leur envoi ne constitue pas une certification automatique
              par une administration publique.
            </p>
          </div>
        </div>
      )}

      <ol className={styles.steps}>
        {stepLabels.map((label, index) => {
          const n = (index + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={label}
              className={`${styles.stepItem} ${active ? styles.activeStep : ""} ${done ? styles.completedStep : ""}`}
            >
              <span>{done ? <Check size={14} aria-hidden="true" /> : n}</span>
              <small>{label}</small>
            </li>
          );
        })}
      </ol>

      {message ? (
        <p className={styles.informationMessage} role="status">
          <Info size={16} aria-hidden="true" /> {message}
        </p>
      ) : null}
      {error ? (
        <p className={styles.stepError} role="alert">
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </p>
      ) : null}

      <form
        className={`${styles.mainGrid} ${sidePanel ? styles.mainGridWithAside : styles.mainGridFull}`}
        onSubmit={submit}
      >
        <section className={styles.formCard}>
          {step === 1 ? (
            <>
              <div className={styles.sectionHeader}>
                <span>
                  <UserRound size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2>Choix du rôle</h2>
                  <p>Propriétaire particulier ou structure professionnelle.</p>
                </div>
              </div>
              <div className={styles.rolesGrid}>
                <button
                  type="button"
                  className={role === "PROPRIETAIRE" ? styles.selectedRoleCard : styles.roleCard}
                  onClick={() => {
                    setRole("PROPRIETAIRE");
                    setActivityType(null);
                  }}
                >
                  <span className={styles.roleIcon}>
                    <Home size={20} aria-hidden="true" />
                  </span>
                  {role === "PROPRIETAIRE" ? (
                    <span className={styles.roleCheck}>
                      <Check size={14} aria-hidden="true" />
                    </span>
                  ) : null}
                  <small>Particulier</small>
                  <strong>Propriétaire</strong>
                  <p>Publier vos biens après vérification du compte.</p>
                </button>
                <button
                  type="button"
                  className={role === "AGENCE" ? styles.selectedRoleCard : styles.roleCard}
                  onClick={() => setRole("AGENCE")}
                >
                  <span className={styles.roleIcon}>
                    <Building2 size={20} aria-hidden="true" />
                  </span>
                  {role === "AGENCE" ? (
                    <span className={styles.roleCheck}>
                      <Check size={14} aria-hidden="true" />
                    </span>
                  ) : null}
                  <small>Professionnel</small>
                  <strong>Agence / Promoteur</strong>
                  <p>RCCM, représentant, agrément promoteur si applicable.</p>
                </button>
              </div>
              {role === "AGENCE" ? (
                <div className={styles.fieldGroup}>
                  <label htmlFor="activityType">
                    Type d’activité <small>obligatoire</small>
                  </label>
                  <select
                    id="activityType"
                    value={activityType || ""}
                    onChange={(e) =>
                      setActivityType((e.target.value || null) as ActivityType)
                    }
                  >
                    <option value="">Sélectionner…</option>
                    {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className={styles.formActions}>
                <div />
                <button type="button" className={styles.primaryButton} onClick={nextFromStep1}>
                  Continuer <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className={styles.sectionHeader} id="section-identity">
                <span>
                  <UserRound size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2>Identité</h2>
                  <p>
                    Informations permettant d’identifier la personne. E-mail et
                    téléphone issus du compte.
                  </p>
                </div>
              </div>
              <p className={styles.readonlyHint}>
                Les champs e-mail et téléphone sont préremplis depuis votre
                compte et restent modifiables si nécessaire.
              </p>
              <div className={styles.twoColumns}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="lastName">
                    Nom <small>obligatoire</small>
                  </label>
                  <input
                    id="lastName"
                    value={personal.lastName}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="firstName">
                    Prénoms <small>obligatoire</small>
                  </label>
                  <input
                    id="firstName"
                    value={personal.firstName}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="birthDate">
                    Date de naissance <small>obligatoire</small>
                  </label>
                  <input
                    id="birthDate"
                    type="date"
                    value={personal.birthDate}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, birthDate: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="birthPlace">Lieu de naissance</label>
                  <input
                    id="birthPlace"
                    value={personal.birthPlace}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, birthPlace: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="nationality">
                    Nationalité <small>obligatoire</small>
                  </label>
                  <input
                    id="nationality"
                    value={personal.nationality}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, nationality: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="email">
                    E-mail <small>obligatoire</small>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={personal.email}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="phone">
                    Téléphone <small>obligatoire</small>
                  </label>
                  <input
                    id="phone"
                    value={personal.phone}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="idType">
                    Type de pièce <small>obligatoire</small>
                  </label>
                  <select
                    id="idType"
                    value={personal.idType}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, idType: e.target.value }))
                    }
                  >
                    <option value="CNI">CNI</option>
                    <option value="PASSEPORT">Passeport</option>
                    <option value="PERMIS">Permis</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="idNumber">
                    Numéro du document <small>obligatoire</small>
                  </label>
                  <input
                    id="idNumber"
                    value={personal.idNumber}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, idNumber: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="idIssuedAt">Date de délivrance</label>
                  <input
                    id="idIssuedAt"
                    type="date"
                    value={personal.idIssuedAt}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, idIssuedAt: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="idExpiresAt">Date d’expiration</label>
                  <input
                    id="idExpiresAt"
                    type="date"
                    value={personal.idExpiresAt}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, idExpiresAt: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="idIssuer">Autorité / pays de délivrance</label>
                  <input
                    id="idIssuer"
                    value={personal.idIssuer}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, idIssuer: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setStep(1)}
                >
                  Retour
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={nextFromStep2}
                >
                  Continuer <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className={styles.sectionHeader} id="section-informations">
                <span>
                  <Building2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2>Informations</h2>
                  <p>
                    {role === "AGENCE"
                      ? "Entreprise et représentant légal."
                      : "Compléments personnels et coordonnées de résidence."}
                  </p>
                </div>
              </div>
              {role === "AGENCE" ? (
                <>
                  <div className={styles.subsection} id="section-company">
                    <div className={styles.subsectionTitle}>
                      <Building2 size={16} aria-hidden="true" />
                      <div>
                        <strong>Entreprise</strong>
                        <p>Identifiants professionnels.</p>
                      </div>
                    </div>
                    <div className={styles.twoColumns}>
                      {(
                        [
                          ["legalName", "Raison sociale"],
                          ["tradeName", "Nom commercial"],
                          ["rccm", "RCCM"],
                          ["nif", "NIF"],
                          ["city", "Ville"],
                          ["address", "Adresse"],
                          ["professionalEmail", "E-mail pro"],
                          ["professionalPhone", "Téléphone pro"],
                          ["website", "Site web"],
                        ] as const
                      ).map(([key, label]) => (
                        <div className={styles.fieldGroup} key={key}>
                          <label htmlFor={`c-${key}`}>{label}</label>
                          <input
                            id={`c-${key}`}
                            value={company[key]}
                            onChange={(e) =>
                              setCompany((c) => ({
                                ...c,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.subsection}>
                    <div className={styles.subsectionTitle}>
                      <UserRound size={16} aria-hidden="true" />
                      <div>
                        <strong>Représentant</strong>
                        <p>Personne habilitée.</p>
                      </div>
                    </div>
                    <div className={styles.twoColumns}>
                      {(
                        [
                          ["firstName", "Prénom"],
                          ["lastName", "Nom"],
                          ["function", "Fonction"],
                          ["phone", "Téléphone"],
                          ["email", "E-mail"],
                        ] as const
                      ).map(([key, label]) => (
                        <div className={styles.fieldGroup} key={key}>
                          <label htmlFor={`r-${key}`}>{label}</label>
                          <input
                            id={`r-${key}`}
                            value={representative[key]}
                            onChange={(e) =>
                              setRepresentative((r) => ({
                                ...r,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.subsection} id="section-experience">
                    <div className={styles.subsectionTitle}>
                      <Briefcase size={16} aria-hidden="true" />
                      <div>
                        <strong>Expérience professionnelle</strong>
                        <p>
                          Requis pour votre profil professionnel — distinct des
                          documents juridiques d’un bien.
                        </p>
                      </div>
                    </div>
                    <div className={styles.twoColumns}>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="experienceStartYear">
                          Année de début d’activité
                        </label>
                        <input
                          id="experienceStartYear"
                          inputMode="numeric"
                          placeholder="2018"
                          value={company.experienceStartYear}
                          onChange={(e) =>
                            setCompany((c) => ({
                              ...c,
                              experienceStartYear: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="experienceYears">
                          Années d’expérience
                        </label>
                        <input
                          id="experienceYears"
                          inputMode="numeric"
                          placeholder="6"
                          value={company.experienceYears}
                          onChange={(e) =>
                            setCompany((c) => ({
                              ...c,
                              experienceYears: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div
                        className={`${styles.fieldGroup} ${styles.fieldFull}`}
                      >
                        <span className={styles.checkboxLegend}>
                          Domaines / spécialités
                        </span>
                        <div className={styles.specialtyGrid}>
                          {SPECIALTY_OPTIONS.map((opt) => {
                            const selected = company.specialties
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const checked = selected.includes(opt.id);
                            return (
                              <label key={opt.id} className={styles.specialtyItem}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? selected.filter((s) => s !== opt.id)
                                      : [...selected, opt.id];
                                    setCompany((c) => ({
                                      ...c,
                                      specialties: next.join(","),
                                    }));
                                  }}
                                />
                                {opt.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div
                        className={`${styles.fieldGroup} ${styles.fieldFull}`}
                      >
                        <label htmlFor="experienceSummary">
                          Présentez brièvement votre expérience
                        </label>
                        <textarea
                          id="experienceSummary"
                          rows={4}
                          value={company.experienceSummary}
                          onChange={(e) =>
                            setCompany((c) => ({
                              ...c,
                              experienceSummary: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    {activityType === "PROMOTEUR_IMMOBILIER" ? (
                      <div className={styles.twoColumns} style={{ marginTop: 14 }}>
                        <div className={styles.fieldGroup}>
                          <label htmlFor="agreementNumber">
                            Numéro d’agrément
                          </label>
                          <input
                            id="agreementNumber"
                            value={company.agreementNumber}
                            onChange={(e) =>
                              setCompany((c) => ({
                                ...c,
                                agreementNumber: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label htmlFor="agreementDate">
                            Date d’agrément
                          </label>
                          <input
                            id="agreementDate"
                            type="date"
                            value={company.agreementDate}
                            onChange={(e) =>
                              setCompany((c) => ({
                                ...c,
                                agreementDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label htmlFor="agreementIssuer">
                            Autorité émettrice
                          </label>
                          <input
                            id="agreementIssuer"
                            value={company.agreementIssuer}
                            onChange={(e) =>
                              setCompany((c) => ({
                                ...c,
                                agreementIssuer: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label htmlFor="qualificationTitle">
                            Qualification du représentant
                          </label>
                          <input
                            id="qualificationTitle"
                            value={company.qualificationTitle}
                            onChange={(e) =>
                              setCompany((c) => ({
                                ...c,
                                qualificationTitle: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div
                          className={`${styles.fieldGroup} ${styles.fieldWide}`}
                        >
                          <label htmlFor="qualificationDomain">
                            Domaine de qualification
                          </label>
                          <input
                            id="qualificationDomain"
                            value={company.qualificationDomain}
                            onChange={(e) =>
                              setCompany((c) => ({
                                ...c,
                                qualificationDomain: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    ) : null}
                    <p className={styles.readonlyHint}>
                      Le justificatif d’expérience (attestation, CV, références)
                      est facultatif et s’ajoute à l’étape Documents.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.roleNotice}>
                    <Info size={16} aria-hidden="true" />
                    <p>
                      Cette demande vérifie votre identité et votre profil. Les
                      documents juridiques relatifs à un bien immobilier seront
                      demandés séparément lors de l’enregistrement ou de la
                      vérification du bien.
                    </p>
                  </div>
                  <div className={styles.twoColumns}>
                    <div
                      className={`${styles.fieldGroup} ${styles.fieldWide}`}
                    >
                      <label htmlFor="address">
                        Adresse de résidence <small>obligatoire</small>
                      </label>
                      <input
                        id="address"
                        value={personal.address}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="city">
                        Ville <small>obligatoire</small>
                      </label>
                      <input
                        id="city"
                        value={personal.city}
                        onChange={(e) =>
                          setPersonal((p) => ({ ...p, city: e.target.value }))
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="commune">
                        Commune <small>obligatoire</small>
                      </label>
                      <input
                        id="commune"
                        value={personal.commune}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            commune: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="district">Quartier</label>
                      <input
                        id="district"
                        value={personal.district}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            district: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="landmark">Repère / précision</label>
                      <input
                        id="landmark"
                        value={personal.landmark}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            landmark: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="profession">Profession ou activité</label>
                      <input
                        id="profession"
                        value={personal.profession}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            profession: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="whatsapp">Numéro WhatsApp</label>
                      <input
                        id="whatsapp"
                        value={personal.whatsapp}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            whatsapp: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="secondaryPhone">
                        Téléphone secondaire
                      </label>
                      <input
                        id="secondaryPhone"
                        value={personal.secondaryPhone}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            secondaryPhone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div
                      className={`${styles.fieldGroup} ${styles.fieldWide}`}
                    >
                      <label htmlFor="additionalInfo">
                        Information complémentaire
                      </label>
                      <input
                        id="additionalInfo"
                        value={personal.additionalInfo}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            additionalInfo: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              <div className={`${styles.subsection} ${styles.projectSubsection}`}>
                <div className={styles.subsectionTitle}>
                  <Home size={16} aria-hidden="true" />
                  <div>
                    <strong>Votre projet immobilier</strong>
                    <p>
                      Types, opérations et volume déclarés — sans créer encore
                      le bien.
                    </p>
                  </div>
                </div>
                <DeclaredProjectFields
                  intents={declaredIntents}
                  onChange={setDeclaredIntents}
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setStep(2)}
                >
                  Retour
                </button>
                <div>
                  <button
                    type="button"
                    className={styles.draftButton}
                    disabled={busy}
                    onClick={saveDraft}
                  >
                    <Save size={15} aria-hidden="true" /> Brouillon
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={nextFromStep3}
                  >
                    Continuer <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {step === 4 && session ? (
            <RoleRequestDocumentsStep
              role={role as RoleType}
              activityType={role === "AGENCE" ? activityType : null}
              documentsToReplace={documentsToReplace}
              personal={{
                idType: personal.idType,
                idNumber: personal.idNumber,
                idIssuedAt: personal.idIssuedAt,
                idExpiresAt: personal.idExpiresAt,
                idIssuer: personal.idIssuer,
              }}
              documents={documents}
              sessionId={session.id}
              busy={busy}
              docPreview={docPreview}
              fileUrlAbsolute={fileUrlAbsolute}
              findDoc={findDoc}
              onUpload={async (documentType, label, file, options) => {
                setBusy(true);
                setError("");
                try {
                  await uploadTypedDocument(documentType, label, file, options);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Impossible d’envoyer ce document. Réessayez.",
                  );
                  throw err;
                } finally {
                  setBusy(false);
                }
              }}
              onRemove={removeTypedDocument}
              onSaveIdentityMeta={async (meta) => {
                setBusy(true);
                setError("");
                try {
                  const next = { ...personal, ...meta };
                  setPersonal(next);
                  const id = await ensureDraft();
                  const updated = await roleRequestService.update(id, {
                    requestedRole: role as RoleType,
                    activityType: role === "AGENCE" ? activityType : null,
                    personalInformation: next,
                    companyInformation: role === "AGENCE" ? company : null,
                    representative: role === "AGENCE" ? representative : null,
                  });
                  setRequestId(updated.id);
                  if (updated.documents) setDocuments(updated.documents);
                  setMessage("Pièce d’identité enregistrée.");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Enregistrement impossible.",
                  );
                  throw err;
                } finally {
                  setBusy(false);
                }
              }}
              onBack={() => setStep(3)}
              onDraft={saveDraft}
              onContinue={nextFromStep4}
            />
          ) : null}

          {step === 5 ? (
            <>
              <div className={styles.sectionHeader}>
                <span>
                  <CheckCircle2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="section-declarations">Déclarations & soumission</h2>
                  <p>
                    Vérifiez le récapitulatif, puis confirmez avant envoi à
                    Demeure Guinée.
                  </p>
                </div>
              </div>

              <div className={styles.recapCard}>
                <h3>Identité</h3>
                <ul className={styles.recapList}>
                  <li>
                    <span>
                      {personal.lastName} {personal.firstName}
                    </span>
                    <button
                      type="button"
                      className={styles.recapEdit}
                      onClick={() => setStep(2)}
                    >
                      Modifier
                    </button>
                  </li>
                  <li>
                    <span>
                      Né(e) le {personal.birthDate || "—"} ·{" "}
                      {personal.nationality || "—"}
                    </span>
                  </li>
                  <li>
                    <span>
                      {personal.idType} · {personal.idNumber || "—"}
                    </span>
                  </li>
                </ul>
              </div>

              <div className={styles.recapCard}>
                <h3>Informations</h3>
                <ul className={styles.recapList}>
                  {role === "AGENCE" ? (
                    <li>
                      <span>
                        {company.legalName || "—"} · RCCM {company.rccm || "—"}
                      </span>
                      <button
                        type="button"
                        className={styles.recapEdit}
                        onClick={() => setStep(3)}
                      >
                        Modifier
                      </button>
                    </li>
                  ) : (
                    <>
                      <li>
                        <span>{personal.address || "—"}</span>
                        <button
                          type="button"
                          className={styles.recapEdit}
                          onClick={() => setStep(3)}
                        >
                          Modifier
                        </button>
                      </li>
                      <li>
                        <span>
                          {personal.city}
                          {personal.commune ? ` · ${personal.commune}` : ""}
                          {personal.district ? ` · ${personal.district}` : ""}
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className={styles.recapCard}>
                <h3>Documents</h3>
                <ul className={styles.recapList}>
                  <li>
                    <span>
                      {personal.idType === "PASSEPORT" ? "Passeport" : "Pièce"}
                    </span>
                    <span
                      className={
                        personal.idType === "PASSEPORT"
                          ? findDoc(documents, "PASSEPORT")?.fileUrl
                            ? styles.recapOk
                            : styles.recapMuted
                          : findDoc(documents, "CNI_RECTO")?.fileUrl &&
                              findDoc(documents, "CNI_VERSO")?.fileUrl
                            ? styles.recapOk
                            : styles.recapMuted
                      }
                    >
                      {personal.idType === "PASSEPORT"
                        ? findDoc(documents, "PASSEPORT")?.fileUrl
                          ? "✓ ajouté"
                          : "manquant"
                        : `${findDoc(documents, "CNI_RECTO")?.fileUrl ? "✓ Recto" : "Recto manquant"} · ${findDoc(documents, "CNI_VERSO")?.fileUrl ? "✓ Verso" : "Verso manquant"}`}
                    </span>
                  </li>
                  <li>
                    <span>Photo de vérification</span>
                    <span
                      className={
                        findDoc(documents, "SELFIE_VERIFICATION")?.fileUrl
                          ? styles.recapOk
                          : styles.recapMuted
                      }
                    >
                      {findDoc(documents, "SELFIE_VERIFICATION")?.fileUrl
                        ? "✓ ajoutée"
                        : "manquante"}
                    </span>
                  </li>
                  <li>
                    <span>Justificatif de domicile</span>
                    <span
                      className={
                        findDoc(documents, "JUSTIFICATIF_DOMICILE")?.fileUrl
                          ? styles.recapOk
                          : styles.recapMuted
                      }
                    >
                      {findDoc(documents, "JUSTIFICATIF_DOMICILE")?.fileUrl
                        ? "✓ ajouté"
                        : "facultatif / non ajouté"}
                    </span>
                  </li>
                  {role === "AGENCE" ? (
                    <li>
                      <span>RCCM</span>
                      <span
                        className={
                          findDoc(documents, "RCCM")?.fileUrl
                            ? styles.recapOk
                            : styles.recapMuted
                        }
                      >
                        {findDoc(documents, "RCCM")?.fileUrl
                          ? "✓ ajouté"
                          : "manquant"}
                      </span>
                    </li>
                  ) : null}
                </ul>
                <button
                  type="button"
                  className={styles.recapEdit}
                  onClick={() => setStep(4)}
                >
                  Modifier les documents
                </button>
              </div>

              <div className={styles.declarations}>
                <h3>Déclarations obligatoires</h3>
                {(
                  [
                    [
                      "accuracy",
                      "Je confirme que les informations fournies sont exactes.",
                    ],
                    [
                      "authorization",
                      "Je suis autorisé(e) à soumettre les documents transmis.",
                    ],
                    [
                      "processing",
                      "J’accepte que Demeure Guinée effectue une vérification interne.",
                    ],
                    [
                      "privacy",
                      "J’ai pris connaissance de la politique de confidentialité.",
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={styles.declaration}>
                    <input
                      type="checkbox"
                      checked={declarations[key]}
                      onChange={(e) =>
                        setDeclarations((d) => ({
                          ...d,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    <span className={styles.customCheckbox} />
                    {label}
                  </label>
                ))}
              </div>
              <div className={styles.submissionNotice}>
                <Info size={16} aria-hidden="true" />
                <p>
                  Vos documents sont transmis de manière privée à Demeure Guinée
                  pour vérification. Leur envoi ne constitue pas une certification
                  automatique par une administration publique. La validation du
                  compte n’entraîne pas la validation juridique automatique de vos
                  biens.
                </p>
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setStep(4)}
                >
                  Retour
                </button>
                <div>
                  <button
                    type="button"
                    className={styles.draftButton}
                    disabled={busy}
                    onClick={saveDraft}
                  >
                    <Save size={15} aria-hidden="true" /> Brouillon
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={busy}
                  >
                    {canEditRoleRequest(loadedRequest || { status: "BROUILLON" }) &&
                    loadedRequest &&
                    loadedRequest.status !== "BROUILLON"
                      ? "Renvoyer pour vérification"
                      : "Soumettre le dossier"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        
</section>

        {sidePanel}
      </form>
      </div>
    </UserShell>
  );
}
