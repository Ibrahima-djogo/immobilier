"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Hash,
  ImageIcon,
  MessageSquareWarning,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  UserCog,
  UserRound,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import type { AdminPageHeroTone } from "@/components/administration/AdminPageHero";
import { ConfirmDialog, EmptyState, StatusBadge } from "@/components/ui";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  ACTIVITY_TYPE_OPTIONS,
  activityTypeLabel,
  adminRoleRequestService,
  buildAccessPreview,
  demoApiFileUrl,
  formatIntent,
  OPERATION_OPTIONS,
  operationLabel,
  PORTFOLIO_SIZE_LABELS,
  PRESET_OPTIONS,
  presetLabel,
  PROFILE_TYPE_OPTIONS,
  profileTypeLabel,
  PROPERTY_TYPE_OPTIONS,
  propertyTypeLabel,
  sameScopes,
  scopeOperations,
  scopesFromFlat,
  scopesFromIntents,
  type AccountConfiguration,
  type AdminRoleRequest,
  type CapabilityPreset,
  type OperationKey,
  type ProfileTypeKey,
  type PropertyScope,
  type PropertyTypeKey,
  type VerificationDocument,
} from "@/lib/demo-api/role-requests";
import { routes } from "@/lib/routes/app-routes";
import { validateApplicantReason } from "@/lib/verification/decision-reason";
import styles from "./page.module.css";

type ConfigDraft = {
  profileType: ProfileTypeKey | "";
  preset: CapabilityPreset | "";
  activityType: string;
  scopes: PropertyScope[];
};

/** Contrôles à confirmer par l’admin avant de valider une pièce obligatoire. */
const DOC_CHECKLIST = [
  { key: "readable", label: "Lisible" },
  { key: "complete", label: "Complet" },
  { key: "notExpired", label: "Non expiré" },
  { key: "consistent", label: "Cohérent avec le formulaire" },
  { key: "identityMatch", label: "Correspondance identité" },
] as const;

type DocChecklistState = Record<string, Record<string, boolean>>;

function hasFile(doc: VerificationDocument) {
  return Boolean(doc.fileUrl || doc.fileName);
}

function isMandatory(doc: VerificationDocument) {
  if (typeof doc.requirementMandatory === "boolean") {
    return doc.requirementMandatory;
  }
  return doc.requirementLevel === "OBLIGATOIRE";
}

function docsProgress(docs: VerificationDocument[]) {
  const required = docs.filter(isMandatory);
  const validated = required.filter((d) => d.verificationStatus === "VALIDE");
  return { required: required.length, validated: validated.length };
}

function requiredDocsOk(docs: VerificationDocument[]) {
  return docs
    .filter((d) => isMandatory(d) && hasFile(d))
    .every((d) => d.verificationStatus === "VALIDE");
}

function formatFileSize(size?: number | null) {
  if (!size) return null;
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Statut du dossier en langage administrateur (badge du hero). */
const STATUS_WORDING: Record<
  string,
  { label: string; tone: AdminPageHeroTone }
> = {
  EN_ATTENTE: { label: "En vérification", tone: "warning" },
  A_CORRIGER: { label: "Correction demandée", tone: "info" },
  APPROUVEE: { label: "Compte activé", tone: "success" },
  REFUSEE: { label: "Refusée", tone: "danger" },
};

/** Origine de la configuration affichée : les quatre états du dossier. */
type ConfigOrigin = "ACTIVE" | "SAVED" | "PROPOSED";

function draftFromConfiguration(
  request: AdminRoleRequest,
  source: AccountConfiguration | null | undefined,
): ConfigDraft {
  const config = source || {};
  const declaredIntents = request.declaredPropertyIntents || [];
  const declaredOps = (request.declaredOperations || []) as OperationKey[];
  let scopes: PropertyScope[] = config.allowedPropertyScopes || [];
  if (scopes.length === 0 && (config.allowedPropertyTypes || []).length > 0) {
    scopes = scopesFromFlat(
      (config.allowedPropertyTypes || []) as string[],
      (config.allowedOperations || []) as string[],
    );
  }
  if (scopes.length === 0 && declaredIntents.length > 0) {
    scopes = scopesFromIntents(declaredIntents, declaredOps);
  }
  if (scopes.length === 0) {
    scopes = scopesFromFlat(
      (request.declaredPropertyTypes || []) as string[],
      declaredOps,
    );
  }
  return {
    profileType: (config.profileType as ProfileTypeKey) || "",
    preset: (config.preset as CapabilityPreset) || "",
    activityType: config.activityType || request.activityType || "",
    scopes: scopes.map((scope) => ({
      propertyType: scope.propertyType,
      operations: [...scope.operations],
    })),
  };
}

/** Configuration de référence : active > enregistrée > proposée. */
function baselineConfiguration(request: AdminRoleRequest): {
  origin: ConfigOrigin;
  configuration: AccountConfiguration | null;
} {
  if (request.appliedConfiguration) {
    return { origin: "ACTIVE", configuration: request.appliedConfiguration };
  }
  if (request.savedConfiguration) {
    return { origin: "SAVED", configuration: request.savedConfiguration };
  }
  return { origin: "PROPOSED", configuration: request.proposedConfiguration || null };
}

function configFromRequest(request: AdminRoleRequest): ConfigDraft {
  return draftFromConfiguration(request, baselineConfiguration(request).configuration);
}

/** Blocages d’enregistrement : cohérence type ↔ opérations. */
function configIssues(
  request: AdminRoleRequest,
  config: ConfigDraft,
): string[] {
  const issues: string[] = [];
  if (!config.preset) issues.push("Choisissez un preset de capacités.");
  if (request.requestedRole === "PROPRIETAIRE" && !config.profileType) {
    issues.push("Choisissez un type de profil propriétaire.");
  }
  if (request.requestedRole === "AGENCE" && !config.activityType) {
    issues.push("Choisissez un type d’activité.");
  }
  if (config.scopes.length === 0) {
    issues.push("Autorisez au moins un type de bien.");
  }
  for (const scope of config.scopes) {
    if (scope.operations.length === 0) {
      issues.push(
        `Sélectionnez au moins une opération pour ${propertyTypeLabel(String(scope.propertyType))}.`,
      );
    }
  }
  return issues;
}

function formatStamp(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR");
}

function levelClass(level?: string | null) {
  if (level === "OBLIGATOIRE") return styles.levelRequired;
  if (level === "CONDITIONNEL") return styles.levelConditional;
  if (level === "FACULTATIF") return styles.levelOptional;
  return styles.levelMuted;
}

export default function RoleRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { admin, ready } = useAdminSession();
  const [request, setRequest] = useState<AdminRoleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigDraft>({
    profileType: "",
    preset: "",
    activityType: "",
    scopes: [],
  });
  const [pendingApprove, setPendingApprove] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState("documents");
  const [canResubmit, setCanResubmit] = useState(true);
  const [checklist, setChecklist] = useState<DocChecklistState>({});

  async function reload() {
    if (!admin || !params.id) return;
    const data = await adminRoleRequestService.get(admin, params.id);
    setRequest(data);
    setConfig(configFromRequest(data));
  }

  useEffect(() => {
    if (!ready || !admin || !params.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminRoleRequestService.get(admin, params.id);
        if (!cancelled) {
          setRequest(data);
          setConfig(configFromRequest(data));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Demande introuvable.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, ready, params.id]);

  const documents = request?.documents || [];
  const selfieDoc = documents.find(
    (d) => d.documentType === "SELFIE_VERIFICATION",
  );
  const otherDocs = documents.filter(
    (d) => d.documentType !== "SELFIE_VERIFICATION",
  );
  const progress = docsProgress(documents);
  const identityStatus =
    request?.sectionReviews?.identity?.status || "EN_ATTENTE";

  const accessPreview = useMemo(() => {
    if (!request) return null;
    return buildAccessPreview({
      role: request.requestedRole,
      allowedPropertyScopes: config.scopes,
    });
  }, [request, config.scopes]);

  const baseline = useMemo(
    () => (request ? baselineConfiguration(request) : null),
    [request],
  );

  /** Écart entre l’écran et la dernière configuration persistée. */
  const configurationDirty = useMemo(() => {
    if (!request || !baseline) return false;
    const reference = draftFromConfiguration(request, baseline.configuration);
    return (
      reference.preset !== config.preset ||
      reference.profileType !== config.profileType ||
      reference.activityType !== config.activityType ||
      !sameScopes(reference.scopes, config.scopes)
    );
  }, [request, baseline, config]);

  const issues = useMemo(
    () => (request ? configIssues(request, config) : []),
    [request, config],
  );

  const canApprove = useMemo(() => {
    if (!request) return false;
    if (["APPROUVEE", "REFUSEE"].includes(request.status)) return false;
    if (identityStatus !== "VERIFIE") return false;
    if (!requiredDocsOk(documents)) return false;
    if (!request.savedConfiguration) return false;
    if (configurationDirty) return false;
    if (issues.length > 0) return false;
    return true;
  }, [request, identityStatus, documents, configurationDirty, issues]);

  const approveBlockReason = useMemo(() => {
    if (!request) return undefined;
    if (identityStatus !== "VERIFIE") return "Validez d’abord l’identité.";
    if (!requiredDocsOk(documents)) {
      return "Toutes les pièces obligatoires doivent être validées.";
    }
    if (!request.savedConfiguration) {
      return "Enregistrez d’abord la configuration du compte.";
    }
    if (configurationDirty) {
      return "Enregistrez d’abord la configuration du compte.";
    }
    if (issues.length > 0) return issues[0];
    return undefined;
  }, [request, identityStatus, documents, configurationDirty, issues]);

  function toggleCheck(docId: string, key: string) {
    setChecklist((prev) => ({
      ...prev,
      [docId]: { ...(prev[docId] || {}), [key]: !prev[docId]?.[key] },
    }));
  }

  function checklistComplete(docId: string) {
    const state = checklist[docId] || {};
    return DOC_CHECKLIST.every((item) => state[item.key]);
  }

  async function reviewDoc(
    doc: VerificationDocument,
    verificationStatus: string,
  ) {
    if (!admin || !request) return;
    setBusy(true);
    setError(null);
    try {
      await adminRoleRequestService.reviewDocument(admin, request.id, doc.id, {
        verificationStatus,
        rejectionReason:
          verificationStatus === "A_CORRIGER" || verificationStatus === "REFUSE"
            ? reason || "Document à revoir"
            : undefined,
      });
      await reload();
      setToast(`Document → ${verificationStatus}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revue impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewIdentity(status: "VERIFIE" | "A_CORRIGER") {
    if (!admin || !request) return;
    if (status === "A_CORRIGER" && !reason.trim()) {
      setError("Motif obligatoire pour demander une correction d’identité.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminRoleRequestService.reviewSection(
        admin,
        request.id,
        "identity",
        {
          status,
          message: reason.trim() || undefined,
        },
      );
      await reload();
      setToast(`Identité → ${status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revue section impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: "APPROUVER" | "CORRIGER" | "REFUSER") {
    if (!admin || !request) return;
    if (decision === "REFUSER") {
      const check = validateApplicantReason(reason, "refus");
      if (!check.ok) {
        setError(check.message);
        return;
      }
    }
    if (decision === "CORRIGER") {
      const check = validateApplicantReason(reason, "correction");
      if (!check.ok) {
        setError(check.message);
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await adminRoleRequestService.decide(admin, request.id, {
        decision,
        reason: reason.trim() || undefined,
        correctionTarget:
          decision === "CORRIGER" ? correctionTarget : undefined,
        canResubmit: decision === "REFUSER" ? canResubmit : undefined,
        // Aucune configuration transmise : l’API applique exactement celle
        // qui a été enregistrée, seule source de vérité.
      });
      setRequest(updated);
      setConfig(configFromRequest(updated));
      setPendingApprove(false);
      setToast(
        decision === "APPROUVER"
          ? "Compte validé et configuré"
          : `Décision : ${updated.status}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Décision impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function saveConfiguration() {
    if (!admin || !request) return;
    const blocking = configIssues(request, config);
    if (blocking.length > 0) {
      setError(blocking[0]);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await adminRoleRequestService.saveAccountConfiguration(
        admin,
        request.id,
        {
          preset: config.preset,
          profileType:
            request.requestedRole === "PROPRIETAIRE"
              ? config.profileType || null
              : null,
          activityType:
            request.requestedRole === "AGENCE"
              ? config.activityType || null
              : null,
          allowedPropertyScopes: config.scopes,
        },
      );
      setRequest(updated);
      setConfig(configFromRequest(updated));
      setToast("Configuration enregistrée (le compte n’est pas encore activé)");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  function resetToProposed() {
    if (!request) return;
    setConfig(
      draftFromConfiguration(request, request.proposedConfiguration || null),
    );
    setToast(null);
  }

  function toggleType(key: PropertyTypeKey) {
    setConfig((prev) => {
      const existing = prev.scopes.find((s) => s.propertyType === key);
      if (existing) {
        return {
          ...prev,
          scopes: prev.scopes.filter((s) => s.propertyType !== key),
        };
      }
      // À l’activation, on pré-remplit avec les opérations déclarées pour ce type.
      const declared = (request?.declaredPropertyIntents || []).find(
        (intent) => intent.propertyType === key,
      );
      const operations =
        declared?.operations && declared.operations.length > 0
          ? [...declared.operations]
          : ["VENTE"];
      return { ...prev, scopes: [...prev.scopes, { propertyType: key, operations }] };
    });
  }

  function toggleScopeOperation(key: PropertyTypeKey, operation: OperationKey) {
    setConfig((prev) => ({
      ...prev,
      scopes: prev.scopes.map((scope) => {
        if (scope.propertyType !== key) return scope;
        const has = scope.operations.includes(operation);
        return {
          ...scope,
          operations: has
            ? scope.operations.filter((o) => o !== operation)
            : [...scope.operations, operation],
        };
      }),
    }));
  }

  if (loading) {
    return (
      <AdminShell
        active="roles"
        eyebrow="Dossier de vérification"
        title="Chargement…"
        description="Lecture du dossier en cours."
        icon={ShieldCheck}
        heroVariant="compact"
        backHref={routes.roleRequests}
        backLabel="Retour aux demandes"
      >
        <p>Chargement…</p>
      </AdminShell>
    );
  }

  if (!request) {
    return (
      <AdminShell
        active="roles"
        eyebrow="Dossier de vérification"
        title="Demande introuvable"
        description={error || "Cette demande n’existe pas."}
        icon={ShieldCheck}
        heroVariant="compact"
        backHref={routes.roleRequests}
        backLabel="Retour aux demandes"
      >
        <EmptyState
          title="Demande introuvable"
          description="Vérifiez l’identifiant ou vos permissions VERIFICATIONS."
        />
      </AdminShell>
    );
  }

  const p = request.personalInformation || {};
  const company = request.companyInformation || {};
  const name =
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    company.tradeName ||
    request.userId;
  const closed = ["APPROUVEE", "REFUSEE"].includes(request.status);
  const declaredIntents = request.declaredPropertyIntents || [];
  const roleWording =
    request.requestedRole === "AGENCE" ? "Agence" : "Propriétaire";
  const heroMeta = [
    { label: "Référence", value: request.reference, icon: Hash },
    { label: "Rôle demandé", value: roleWording, icon: UserCog },
  ];
  // Récapitulatif d’activation : uniquement ce qui est réellement enregistré.
  const activation = request.savedConfiguration || null;
  const activationScopes = activation?.allowedPropertyScopes || [];
  const approveSummary = [
    `Rôle : ${request.requestedRole}`,
    `Preset : ${presetLabel(activation?.preset)}`,
    request.requestedRole === "PROPRIETAIRE"
      ? `Profil : ${profileTypeLabel(activation?.profileType)}`
      : `Type d’activité : ${activityTypeLabel(activation?.activityType)}`,
    ...activationScopes.map(
      (scope) =>
        `${propertyTypeLabel(String(scope.propertyType))} — ${scope.operations
          .map((o) => operationLabel(String(o)))
          .join(" + ")}`,
    ),
  ]
    .filter(Boolean)
    .join("\n");

  function renderDocument(doc: VerificationDocument) {
    const mandatory = isMandatory(doc);
    const missingOptional = !mandatory && !hasFile(doc);
    const href = demoApiFileUrl(doc.fileUrl);
    const size = formatFileSize(doc.fileSize);
    const blockValidation =
      mandatory && doc.verificationStatus !== "VALIDE" && !checklistComplete(doc.id);
    return (
      <article key={doc.id} className={styles.docRow}>
        <div className={styles.docMeta}>
          <strong>
            <FileText size={14} aria-hidden="true" /> {doc.label}
          </strong>
          <div className={styles.docTags}>
            <span className={levelClass(doc.requirementLevel)}>
              {doc.requirementLevel || "—"}
            </span>
            <StatusBadge status={doc.verificationStatus} />
            {doc.demo ? <span className={styles.demoTag}>DEMO</span> : null}
          </div>
          <small>
            {missingOptional
              ? "Non fourni (facultatif)"
              : [doc.fileName || doc.documentType, doc.mimeType, size]
                  .filter(Boolean)
                  .join(" · ")}
          </small>
          {doc.reference || doc.issuedAt || doc.expiresAt ? (
            <small>
              {[
                doc.reference ? `N° ${doc.reference}` : null,
                doc.issuedAt ? `délivré le ${doc.issuedAt}` : null,
                doc.expiresAt ? `expire le ${doc.expiresAt}` : null,
                doc.issuer,
              ]
                .filter(Boolean)
                .join(" · ")}
            </small>
          ) : null}
          {doc.requirementLevel === "CONDITIONNEL" && doc.requirementReason ? (
            <small className={styles.conditionalReason}>
              {doc.requirementReason}
            </small>
          ) : null}
          {doc.rejectionReason ? (
            <small className={styles.conditionalReason}>
              Motif : {doc.rejectionReason}
            </small>
          ) : null}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={styles.viewLink}
            >
              <ExternalLink size={12} aria-hidden="true" /> Voir
            </a>
          ) : null}
        </div>
        {!closed && hasFile(doc) ? (
          <div className={styles.docReview}>
            {mandatory ? (
              <div className={styles.checkList}>
                {DOC_CHECKLIST.map((item) => (
                  <label key={item.key}>
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[doc.id]?.[item.key])}
                      onChange={() => toggleCheck(doc.id, item.key)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            ) : null}
            <div className={styles.docActions}>
              <button
                type="button"
                disabled={busy || blockValidation}
                title={
                  blockValidation
                    ? "Cochez les contrôles avant de valider cette pièce obligatoire"
                    : undefined
                }
                onClick={() => void reviewDoc(doc, "VALIDE")}
              >
                Valider
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void reviewDoc(doc, "A_CORRIGER")}
              >
                À corriger
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void reviewDoc(doc, "REFUSE")}
              >
                Refuser
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <AdminShell
      active="roles"
      eyebrow={`Dossier de vérification — ${roleWording}`}
      title={name}
      description="Examinez les informations, les documents et les accès demandés avant d’activer le compte."
      icon={ShieldCheck}
      heroVariant="detail"
      backHref={routes.roleRequests}
      backLabel="Retour aux demandes"
      badge={STATUS_WORDING[request.status]?.label || request.status}
      badgeTone={STATUS_WORDING[request.status]?.tone || "neutral"}
      meta={heroMeta}
    >
      {toast ? (
        <p className={styles.success} role="status">
          <CheckCircle2 size={15} aria-hidden="true" /> {toast}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.dossier}>
        {/* Résumé */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <UserRound size={18} aria-hidden="true" />
            <div>
              <h2>Résumé</h2>
              <p>Référence, demandeur, rôle et progression documentaire.</p>
            </div>
            <div className={styles.headBadges}>
              {request.demo ? (
                <span className={styles.demoBadge}>
                  {request.demoLabel || "Dossier DEMO"}
                </span>
              ) : null}
              <StatusBadge status={request.status} />
            </div>
          </div>
          <div className={styles.identity}>
            <span>
              {name
                .split(" ")
                .map((v) => v[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div>
              <h3>{name}</h3>
              <p>{p.email || "—"}</p>
              <small>
                {request.requestedRole}
                {request.activityType ? ` · ${request.activityType}` : ""}
              </small>
            </div>
          </div>
          <div className={styles.facts}>
            <p>
              <small>Référence</small>
              <strong>{request.reference}</strong>
            </p>
            <p>
              <small>Demandeur</small>
              <strong>{request.userId}</strong>
            </p>
            <p>
              <small>Rôle demandé</small>
              <strong>{request.requestedRole}</strong>
            </p>
            <p>
              <small>Documents</small>
              <strong>
                {progress.validated}/{progress.required} obligatoires validés
              </strong>
            </p>
            <p>
              <small>Complétude</small>
              <strong>{request.completeness}%</strong>
            </p>
            <p>
              <small>Soumission</small>
              <strong>
                {request.submittedAt
                  ? new Date(request.submittedAt).toLocaleString("fr-FR")
                  : "—"}
              </strong>
            </p>
          </div>
        </section>

        {/* Identité */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <h2>Identité</h2>
              <p>Checklist de vérification de l’identité déclarée.</p>
            </div>
            <StatusBadge status={identityStatus} />
          </div>
          <div className={styles.facts}>
            <p>
              <small>Nom</small>
              <strong>{name}</strong>
            </p>
            <p>
              <small>Téléphone</small>
              <strong>{p.phone || "—"}</strong>
            </p>
            <p>
              <small>Ville</small>
              <strong>{p.city || "—"}</strong>
            </p>
            <p>
              <small>Pièce</small>
              <strong>
                {p.idType || "—"} {p.idNumber || ""}
              </strong>
            </p>
            <p>
              <small>Risque</small>
              <strong>{request.risk || "—"}</strong>
            </p>
            <p>
              <small>Revue section</small>
              <strong>
                {request.sectionReviews?.identity?.message || "—"}
              </strong>
            </p>
          </div>
          {!closed ? (
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={busy || identityStatus === "VERIFIE"}
                onClick={() => void reviewIdentity("VERIFIE")}
              >
                <CheckCircle2 size={14} aria-hidden="true" /> Marquer vérifié
              </button>
              <button
                type="button"
                className={styles.warnBtn}
                disabled={busy}
                onClick={() => void reviewIdentity("A_CORRIGER")}
              >
                <MessageSquareWarning size={14} aria-hidden="true" /> Demander
                correction
              </button>
            </div>
          ) : null}
        </section>

        {/* Documents */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <FileText size={18} aria-hidden="true" />
            <div>
              <h2>Documents</h2>
              <p>
                {request.verificationNotice ||
                  "Revue pièce par pièce — documents non publics."}
              </p>
            </div>
          </div>
          <div className={styles.docList}>
            {otherDocs.length === 0 ? (
              <p className={styles.muted}>Aucun document (legacy éventuel).</p>
            ) : (
              otherDocs.map(renderDocument)
            )}
          </div>
        </section>

        {/* Photo vérification */}
        {selfieDoc ? (
          <section className={`${styles.card} ${styles.section}`}>
            <div className={styles.sectionHead}>
              <ImageIcon size={18} aria-hidden="true" />
              <div>
                <h2>Photo de vérification</h2>
                <p>Contrôle interne Demeure Guinée.</p>
              </div>
              <StatusBadge status={selfieDoc.verificationStatus} />
            </div>
            <div className={styles.docList}>{renderDocument(selfieDoc)}</div>
          </section>
        ) : null}

        {/* Coordonnées */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <UserRound size={18} aria-hidden="true" />
            <div>
              <h2>Coordonnées</h2>
              <p>Adresse et moyens de contact déclarés.</p>
            </div>
          </div>
          <div className={styles.facts}>
            <p>
              <small>Naissance</small>
              <strong>
                {[p.birthDate, p.birthPlace].filter(Boolean).join(" · ") || "—"}
              </strong>
            </p>
            <p>
              <small>Nationalité</small>
              <strong>{p.nationality || "—"}</strong>
            </p>
            <p>
              <small>Profession</small>
              <strong>{p.profession || "—"}</strong>
            </p>
            <p>
              <small>WhatsApp</small>
              <strong>{p.whatsapp || "—"}</strong>
            </p>
            <p>
              <small>Téléphone secondaire</small>
              <strong>{p.secondaryPhone || "—"}</strong>
            </p>
            <p>
              <small>Commune / quartier</small>
              <strong>
                {[p.commune, p.district].filter(Boolean).join(" · ") || "—"}
              </strong>
            </p>
            <p>
              <small>Adresse</small>
              <strong>{p.address || "—"}</strong>
            </p>
            <p>
              <small>Repère</small>
              <strong>{p.landmark || "—"}</strong>
            </p>
          </div>
          {p.additionalInfo ? (
            <p className={styles.note}>{p.additionalInfo}</p>
          ) : null}
        </section>

        {/* Projet immobilier déclaré */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <Building2 size={18} aria-hidden="true" />
            <div>
              <h2>Projet immobilier déclaré</h2>
              <p>Un type de bien, ses opérations et le volume annoncé.</p>
            </div>
          </div>
          {declaredIntents.length > 0 ? (
            <ul className={styles.intentList}>
              {declaredIntents.map((intent) => (
                <li key={String(intent.propertyType)}>
                  <strong>
                    {propertyTypeLabel(String(intent.propertyType))}
                  </strong>
                  <span>
                    {(intent.operations || [])
                      .map((o) => operationLabel(String(o)))
                      .join(" + ") || "—"}
                  </span>
                  <small>
                    {intent.quantityRange
                      ? PORTFOLIO_SIZE_LABELS[intent.quantityRange] ||
                        intent.quantityRange
                      : "Volume non précisé"}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Aucun projet déclaré.</p>
          )}
          <div className={styles.facts}>
            <p>
              <small>Volume global</small>
              <strong>
                {request.declaredPortfolioSize
                  ? PORTFOLIO_SIZE_LABELS[request.declaredPortfolioSize] ||
                    request.declaredPortfolioSize
                  : "—"}
              </strong>
            </p>
            <p>
              <small>Synthèse</small>
              <strong>
                {declaredIntents.map(formatIntent).join(" | ") || "—"}
              </strong>
            </p>
          </div>
        </section>

        {/* Déclarations */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <h2>Déclarations</h2>
              <p>Engagements acceptés lors de la soumission.</p>
            </div>
          </div>
          <ul className={styles.declarations}>
            {[
              ["accuracy", "Informations exactes"],
              ["authorization", "Autorisé à soumettre cette demande"],
              ["processing", "Vérification interne Demeure Guinée acceptée"],
              ["privacy", "Politique de confidentialité acceptée"],
            ].map(([key, label]) => (
              <li key={key}>
                {request.declarations?.[key] ? (
                  <CheckCircle2 size={14} aria-hidden="true" />
                ) : (
                  <XCircle size={14} aria-hidden="true" />
                )}
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* Entreprise / expérience (AGENCE) */}
        {request.requestedRole === "AGENCE" ? (
          <section className={`${styles.card} ${styles.section}`}>
            <div className={styles.sectionHead}>
              <Building2 size={18} aria-hidden="true" />
              <div>
                <h2>Entreprise & expérience</h2>
                <p>Informations professionnelles déclarées.</p>
              </div>
            </div>
            <div className={styles.facts}>
              <p>
                <small>Raison sociale</small>
                <strong>{company.legalName || "—"}</strong>
              </p>
              <p>
                <small>Nom commercial</small>
                <strong>{company.tradeName || "—"}</strong>
              </p>
              <p>
                <small>RCCM</small>
                <strong>{company.rccm || "—"}</strong>
              </p>
              <p>
                <small>Ville</small>
                <strong>{company.city || "—"}</strong>
              </p>
              <p>
                <small>Années d’expérience</small>
                <strong>{company.experienceYears || "—"}</strong>
              </p>
              <p>
                <small>Début</small>
                <strong>{company.experienceStartYear || "—"}</strong>
              </p>
              <p>
                <small>Spécialités</small>
                <strong>{company.specialties || "—"}</strong>
              </p>
              <p>
                <small>Résumé</small>
                <strong>{company.experienceSummary || "—"}</strong>
              </p>
            </div>
            {request.representative ? (
              <div className={styles.facts}>
                <p>
                  <small>Représentant</small>
                  <strong>
                    {[
                      request.representative.firstName,
                      request.representative.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </strong>
                </p>
                <p>
                  <small>Fonction</small>
                  <strong>{request.representative.function || "—"}</strong>
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Configuration du compte */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <Settings2 size={18} aria-hidden="true" />
            <div>
              <h2>Configuration du compte</h2>
              <p>
                Définissez les accès qui seront réellement accordés à ce compte
                après validation.
              </p>
            </div>
            <div className={styles.headBadges}>
              {configurationDirty ? (
                <span className={styles.dirtyBadge}>
                  Modifications non enregistrées
                </span>
              ) : baseline?.origin === "ACTIVE" ? (
                <span className={styles.activeBadge}>Configuration active</span>
              ) : baseline?.origin === "SAVED" ? (
                <span className={styles.savedBadge}>
                  Configuration enregistrée
                </span>
              ) : (
                <span className={styles.proposedBadge}>
                  Configuration proposée
                </span>
              )}
            </div>
          </div>

          {/* État de persistance */}
          {baseline?.origin === "PROPOSED" && !request.savedConfiguration ? (
            <p className={styles.note}>
              Configuration proposée à partir de la demande. Elle n’est pas
              encore enregistrée ni accordée au compte.
            </p>
          ) : null}
          {request.appliedConfiguration ? (
            <p className={styles.savedNote}>
              <CheckCircle2 size={14} aria-hidden="true" /> Configuration active
              sur le compte
              {formatStamp(request.appliedConfiguration.approvedAt)
                ? ` — ${formatStamp(request.appliedConfiguration.approvedAt)}`
                : ""}
              {request.appliedConfiguration.approvedByAdminName
                ? ` — ${request.appliedConfiguration.approvedByAdminName}`
                : ""}
            </p>
          ) : request.savedConfiguration ? (
            <p className={styles.savedNote}>
              <CheckCircle2 size={14} aria-hidden="true" /> Configuration
              enregistrée
              {formatStamp(request.savedConfiguration.configuredAt)
                ? ` — ${formatStamp(request.savedConfiguration.configuredAt)}`
                : ""}
              {request.savedConfiguration.configuredByAdminName
                ? ` — ${request.savedConfiguration.configuredByAdminName}`
                : ""}
              {" · le compte n’est pas encore activé."}
            </p>
          ) : null}

          {/* A. Déclaré par le demandeur (lecture seule) */}
          <h3 className={styles.subTitle}>Déclaré par le demandeur</h3>
          {declaredIntents.length > 0 ? (
            <ul className={styles.declaredScopes}>
              {declaredIntents.map((intent) => (
                <li key={`declared-${String(intent.propertyType)}`}>
                  <strong>
                    {propertyTypeLabel(String(intent.propertyType))}
                  </strong>
                  <span>
                    {(intent.operations || [])
                      .map((o) => operationLabel(String(o)))
                      .join(" + ") || "—"}
                  </span>
                  {intent.quantityRange ? (
                    <small>
                      {PORTFOLIO_SIZE_LABELS[intent.quantityRange] ||
                        intent.quantityRange}
                    </small>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Aucune intention déclarée.</p>
          )}

          {/* B. Configuration accordée par Demeure Guinée */}
          <h3 className={styles.subTitle}>
            Configuration accordée par Demeure Guinée
          </h3>
          <div className={styles.configGrid}>
            <label>
              Preset de capacités
              <select
                value={config.preset}
                disabled={closed || busy}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    preset: e.target.value as CapabilityPreset | "",
                  }))
                }
              >
                <option value="">Choisir…</option>
                {PRESET_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <small className={styles.fieldHint}>
                {config.preset
                  ? `Code interne : ${config.preset}`
                  : "Le preset définit les capacités de base, ajustables ensuite."}
              </small>
            </label>

            {request.requestedRole === "PROPRIETAIRE" ? (
              <label>
                Type de profil
                <select
                  value={config.profileType}
                  disabled={closed || busy}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      profileType: e.target.value as ProfileTypeKey | "",
                    }))
                  }
                >
                  <option value="">Choisir…</option>
                  {PROFILE_TYPE_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <small className={styles.fieldHint}>
                  {config.profileType
                    ? `Code interne : ${config.profileType}`
                    : "Particulier, multi-biens ou professionnel."}
                </small>
              </label>
            ) : (
              <label>
                Type d’activité
                <select
                  value={config.activityType}
                  disabled={closed || busy}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      activityType: e.target.value,
                    }))
                  }
                >
                  <option value="">Choisir…</option>
                  {ACTIVITY_TYPE_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <small className={styles.fieldHint}>
                  {config.activityType
                    ? `Code interne : ${config.activityType}`
                    : `Déclaré : ${activityTypeLabel(request.activityType)}`}
                </small>
              </label>
            )}
          </div>

          <div className={styles.scopeGrid}>
            {PROPERTY_TYPE_OPTIONS.map((o) => {
              const active = config.scopes.some((s) => s.propertyType === o.key);
              const declaredIntent = declaredIntents.find(
                (intent) => intent.propertyType === o.key,
              );
              const ops = scopeOperations(config.scopes, o.key);
              const missingOps = active && ops.length === 0;
              return (
                <article
                  key={o.key}
                  className={`${styles.scopeCard} ${active ? styles.scopeCardOn : ""} ${missingOps ? styles.scopeCardError : ""}`}
                >
                  <header>
                    <strong>{o.label}</strong>
                    {declaredIntent ? (
                      <span className={styles.declaredTag}>Déclaré</span>
                    ) : null}
                  </header>
                  <label className={styles.scopeToggle}>
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={closed || busy}
                      onChange={() => toggleType(o.key)}
                    />
                    Autorisé
                  </label>
                  <div className={styles.scopeOps}>
                    {OPERATION_OPTIONS.map((op) => (
                      <label
                        key={op.key}
                        className={`${styles.opCheck} ${!active ? styles.opCheckOff : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={active && ops.includes(op.key)}
                          disabled={closed || busy || !active}
                          onChange={() => toggleScopeOperation(o.key, op.key)}
                        />
                        {op.label}
                      </label>
                    ))}
                  </div>
                  {missingOps ? (
                    <small className={styles.scopeWarn}>
                      Sélectionnez au moins une opération pour ce type de bien.
                    </small>
                  ) : null}
                  {declaredIntent ? (
                    <small className={styles.scopeHint}>
                      Demandé :{" "}
                      {(declaredIntent.operations || [])
                        .map((op) => operationLabel(String(op)))
                        .join(" + ") || "—"}
                    </small>
                  ) : null}
                </article>
              );
            })}
          </div>

          {issues.length > 0 && !closed ? (
            <ul className={styles.issueList}>
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}

          {!closed ? (
            <div className={styles.configActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={busy}
                onClick={resetToProposed}
              >
                <RotateCcw size={15} aria-hidden="true" /> Réinitialiser aux
                valeurs proposées
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={
                  busy ||
                  issues.length > 0 ||
                  // Une première validation reste nécessaire même sans
                  // modification de la proposition système.
                  (!configurationDirty && Boolean(request.savedConfiguration))
                }
                title={
                  issues.length > 0
                    ? issues[0]
                    : !configurationDirty && request.savedConfiguration
                      ? "Aucune modification à enregistrer"
                      : undefined
                }
                onClick={() => void saveConfiguration()}
              >
                <Save size={15} aria-hidden="true" /> Enregistrer la
                configuration
              </button>
            </div>
          ) : null}

          <h3 className={styles.subTitle}>Aperçu d’accès (configuration en cours)</h3>
          <div className={styles.previewGrid}>
            <div>
              <strong>Autorisé</strong>
              <ul>
                {(accessPreview?.allowed || []).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Non autorisé</strong>
              <ul>
                {(accessPreview?.denied || []).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Historique */}
        <section className={`${styles.card} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <FileText size={18} aria-hidden="true" />
            <div>
              <h2>Historique</h2>
              <p>Événements de vérification et décisions.</p>
            </div>
          </div>
          <ul className={styles.history}>
            {(request.history || []).length === 0 ? (
              <li className={styles.muted}>Aucun événement.</li>
            ) : (
              (request.history || []).map((h) => (
                <li key={h.id}>
                  <strong>{h.label}</strong>
                  <small>{new Date(h.at).toLocaleString("fr-FR")}</small>
                  {h.reason ? <span>{h.reason}</span> : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* Sticky action bar */}
      {!closed ? (
        <div className={styles.actionBar}>
          <div className={styles.actionBarInner}>
            <label className={styles.reasonField}>
              Motif destiné au demandeur
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Expliquez clairement ce qui est refusé ou à corriger, et pourquoi — le demandeur lira ce texte tel quel."
              />
            </label>
            <div className={styles.actionMeta}>
              <label>
                Cible correction
                <select
                  value={correctionTarget}
                  onChange={(e) => setCorrectionTarget(e.target.value)}
                >
                  <option value="identity">Identité</option>
                  <option value="documents">Documents</option>
                  <option value="declaredProfile">Profil déclaré</option>
                  <option value="company">Entreprise</option>
                </select>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={canResubmit}
                  onChange={(e) => setCanResubmit(e.target.checked)}
                />
                Peut resoumettre (refus)
              </label>
            </div>
            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.warnBtn}
                disabled={busy}
                onClick={() => void decide("CORRIGER")}
              >
                <MessageSquareWarning size={15} aria-hidden="true" /> Demander
                correction
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                disabled={busy}
                onClick={() => void decide("REFUSER")}
              >
                <XCircle size={15} aria-hidden="true" /> Refuser
              </button>
              <button
                type="button"
                className={styles.action}
                disabled={busy || !canApprove}
                title={approveBlockReason}
                onClick={() => setPendingApprove(true)}
              >
                <CheckCircle2 size={15} aria-hidden="true" /> Valider et activer
                le compte
              </button>
              {approveBlockReason ? (
                <small className={styles.actionHint}>{approveBlockReason}</small>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingApprove}
        title="Activer ce compte ?"
        description="La demande sera approuvée et la configuration enregistrée ci-dessous sera appliquée au compte."
        subject={approveSummary}
        confirmLabel="Confirmer l’activation"
        onCancel={() => setPendingApprove(false)}
        onConfirm={() => void decide("APPROUVER")}
      />
    </AdminShell>
  );
}
