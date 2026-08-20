"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  FileText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { DemoApiError } from "@/lib/demo-api/client";
import {
  roleRequestService,
  type RoleRequest,
  type RoleRequestStatus,
} from "@/lib/demo-api/role-requests";
import { formatRoleLabel, formatStatusLabel } from "@/lib/ui/status";
import { ACTIVITY_TYPE_OPTIONS } from "@/lib/verification/role-document-requirements";
import {
  canResubmitRefusedRoleRequest,
  correctionFormHref,
  decisionDate,
  documentStatusClass,
  formatHistoryLabel,
  isRoleRequestFinallyClosed,
  refusalTargetLabel,
  resolveRoleRequestNextStep,
} from "@/lib/verification/role-request-tracking";
import styles from "./page.module.css";

const STATUS_COPY: Record<
  RoleRequestStatus,
  { description: string }
> = {
  BROUILLON: {
    description: "Votre dossier n’a pas encore été soumis.",
  },
  EN_ATTENTE: {
    description: "Votre dossier a été transmis à Demeure Guinée.",
  },
  EN_VERIFICATION: {
    description: "Votre dossier est en cours de contrôle.",
  },
  A_CORRIGER: {
    description: "Des informations ou documents doivent être corrigés.",
  },
  APPROUVEE: {
    description: "Votre demande de rôle a été validée.",
  },
  REFUSEE: {
    description: "Votre demande n’a pas été validée.",
  },
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR");
}

function formatActivityType(value: RoleRequest["activityType"]) {
  if (!value) return null;
  return ACTIVITY_TYPE_OPTIONS.find((opt) => opt.value === value)?.label ?? formatStatusLabel(value);
}

function progressIndex(status: RoleRequestStatus): number {
  switch (status) {
    case "BROUILLON":
      return 0;
    case "EN_ATTENTE":
      return 1;
    case "EN_VERIFICATION":
      return 2;
    case "A_CORRIGER":
      return 2;
    case "APPROUVEE":
      return 4;
    case "REFUSEE":
      return 3;
    default:
      return 0;
  }
}

const PROGRESS_LABELS = [
  "Créée",
  "Soumise",
  "Contrôle",
  "Décision",
  "Activation",
];

export default function RoleRequestTrackingPage() {
  const searchParams = useSearchParams();
  const requestId = (searchParams.get("id") || "").trim();
  const { ready, isLoggedIn } = usePublicDemoSession();

  const [item, setItem] = useState<RoleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [missingId, setMissingId] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);
    setMissingId(false);
    setItem(null);

    if (!requestId) {
      setMissingId(true);
      setLoading(false);
      return;
    }

    try {
      const data = await roleRequestService.get(requestId);
      if (!data || data.id !== requestId) {
        setNotFound(true);
        return;
      }
      setItem(data);
    } catch (err) {
      if (err instanceof DemoApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger votre demande pour le moment.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  const statusCopy = item ? STATUS_COPY[item.status] : null;
  const activeProgress = item ? progressIndex(item.status) : -1;
  const nextStep = item ? resolveRoleRequestNextStep(item) : null;
  const decidedAt = item ? decisionDate(item) : null;
  const statusLabel = item ? formatStatusLabel(item.status) : "";
  const targetLabel = item ? refusalTargetLabel(item) : null;

  return (
    <UserShell active="demande-role">
      <div className={styles.pageInner}>
      <PageHero
        variant="dashboard"
        eyebrow="Suivi"
        title="Demande de rôle"
        description="Consultez l’état de votre dossier de vérification transmis à Demeure Guinée."
        note="Le suivi reflète le même dossier que celui examiné par l’administration."
        icon={<ShieldCheck size={16} aria-hidden="true" />}
        backHref="/demande-role"
        backLabel="Retour au dossier"
        badge={item ? <span>{formatStatusLabel(item.status)}</span> : undefined}
        actions={
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => void load()}
            disabled={loading || !requestId}
          >
            <RefreshCcw size={15} aria-hidden="true" />
            Actualiser
          </button>
        }
      />

      {loading ? (
        <p className={styles.informationMessage} role="status">
          Chargement du dossier…
        </p>
      ) : null}

      {!loading && missingId ? (
        <section className={styles.card}>
          <h2>Aucune référence de demande n’a été fournie.</h2>
          <p>
            Ouvrez le suivi depuis une demande existante, ou reprenez votre
            dossier.
          </p>
          <Link href="/demande-role" className={styles.primaryButton}>
            Ouvrir mon dossier
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {!loading && notFound ? (
        <section className={styles.card}>
          <h2>Cette demande de rôle est introuvable.</h2>
          <p>
            L’identifiant <code>{requestId}</code> ne correspond à aucun dossier
            dans la Demo API.
          </p>
          <Link href="/demande-role" className={styles.primaryButton}>
            Retour à la demande de rôle
          </Link>
        </section>
      ) : null}

      {!loading && error ? (
        <p className={styles.informationMessage} role="alert">
          <CircleAlert size={16} aria-hidden="true" /> {error}
          {!isLoggedIn ? (
            <>
              {" "}
              <Link href={`/connexion?retour=/demande-role/suivi?id=${encodeURIComponent(requestId)}`}>
                Se connecter
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {!loading && item && statusCopy ? (
        <>
          <section
            className={styles.statusHero}
            data-status={item.status}
            aria-live="polite"
          >
            <span className={styles.statusHeroIcon}>
              {item.status === "APPROUVEE" ? (
                <BadgeCheck size={22} aria-hidden="true" />
              ) : item.status === "REFUSEE" || item.status === "A_CORRIGER" ? (
                <CircleAlert size={22} aria-hidden="true" />
              ) : (
                <Clock3 size={22} aria-hidden="true" />
              )}
            </span>
            <div className={styles.statusHeroContent}>
              <span>{statusLabel}</span>
              <h2>{statusCopy.description}</h2>
              <p>
                Vérification interne Demeure Guinée — aucune certification
                ministérielle automatique.
              </p>
            </div>
            <div className={styles.statusReference}>
              <small>Référence</small>
              <strong>{item.reference}</strong>
            </div>
          </section>

          <section className={styles.progressCard}>
            <div className={styles.sectionTitle}>
              <div>
                <span>Progression</span>
                <h2>Complétude {item.completeness}%</h2>
              </div>
              <strong>{statusLabel}</strong>
            </div>
            <ol className={styles.progressSteps}>
              {PROGRESS_LABELS.map((label, index) => {
                const done = index < activeProgress;
                const active = index === activeProgress;
                return (
                  <li
                    key={label}
                    className={`${styles.progressStep} ${done ? styles.completedStep : ""} ${active ? styles.activeStep : ""}`}
                  >
                    <span>{index + 1}</span>
                    <small>{label}</small>
                  </li>
                );
              })}
            </ol>
          </section>

          {item.status === "A_CORRIGER" ? (
            <section className={styles.complementRequestCard}>
              <span className={styles.complementIcon}>
                <CircleAlert size={18} aria-hidden="true" />
              </span>
              <div>
                <span>Correction demandée</span>
                <h2>Corriger mon dossier</h2>
                <p>
                  {item.correctionMessage ||
                    "L’administration a demandé des corrections sur ce dossier."}
                </p>
                {(item.documents || [])
                  .filter(
                    (d) =>
                      d.verificationStatus === "A_CORRIGER" ||
                      d.verificationStatus === "REFUSE",
                  )
                  .map((d) => (
                    <div key={d.id}>
                      <small>{d.label}</small>
                      <strong>
                        {d.rejectionReason ||
                          formatStatusLabel(d.verificationStatus)}
                      </strong>
                    </div>
                  ))}
              </div>
              <Link
                href={correctionFormHref(item.id)}
                className={styles.primaryButton}
              >
                Corriger mon dossier
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          ) : null}

          {item.status === "REFUSEE" ? (
            <section className={styles.decisionCard}>
              <div className={styles.decisionHeader}>
                <span className={styles.decisionIcon}>
                  <CircleAlert size={18} aria-hidden="true" />
                </span>
                <div>
                  <span>Décision</span>
                  <h2>Décision de Demeure Guinée</h2>
                </div>
              </div>

              <div className={styles.decisionFacts}>
                <article>
                  <small>Statut</small>
                  <strong>Demande refusée</strong>
                </article>
                {targetLabel ? (
                  <article>
                    <small>Élément concerné</small>
                    <strong>{targetLabel}</strong>
                  </article>
                ) : null}
                <article>
                  <small>Date de décision</small>
                  <strong>{formatDateTime(decidedAt) || "—"}</strong>
                </article>
                <article>
                  <small>Nouvelle soumission</small>
                  <strong
                    className={
                      canResubmitRefusedRoleRequest(item)
                        ? styles.resubmitAllowed
                        : styles.resubmitDenied
                    }
                  >
                    {canResubmitRefusedRoleRequest(item)
                      ? "Autorisée"
                      : "Non autorisée"}
                  </strong>
                </article>
              </div>

              <div className={styles.decisionReason}>
                <small>Motif détaillé</small>
                <p>
                  {item.correctionMessage ||
                    "Aucun motif détaillé n’a été communiqué pour cette décision."}
                </p>
              </div>

              {canResubmitRefusedRoleRequest(item) ? (
                <div className={styles.decisionNext}>
                  <h3>Que devez-vous faire ?</h3>
                  <p>
                    Vous pouvez corriger le même dossier, puis le renvoyer pour
                    vérification. Il repassera alors en attente. Ce n’est pas
                    une nouvelle demande.
                  </p>
                  <Link
                    href={correctionFormHref(item.id)}
                    className={styles.primaryButton}
                  >
                    Corriger mon dossier
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              ) : isRoleRequestFinallyClosed(item) ? (
                <p className={styles.decisionClosed}>
                  Cette demande est clôturée et ne peut pas être soumise à
                  nouveau. Votre compte reste un compte standard.
                </p>
              ) : null}
            </section>
          ) : null}

          <div className={styles.mainGrid}>
            <div className={styles.mainColumn}>
              <section className={styles.card}>
                <div className={styles.sectionTitle}>
                  <div>
                    <span>Dossier</span>
                    <h2>Informations</h2>
                  </div>
                </div>
                <div className={styles.requestDetails}>
                  <article>
                    <span>
                      <FileText size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Référence</small>
                      <strong>{item.reference}</strong>
                    </div>
                  </article>
                  <article>
                    <span>
                      <ShieldCheck size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Rôle demandé</small>
                      <strong>{formatRoleLabel(item.requestedRole)}</strong>
                    </div>
                  </article>
                  {item.activityType ? (
                    <article>
                      <span>
                        <ShieldCheck size={16} aria-hidden="true" />
                      </span>
                      <div>
                        <small>Type d’activité</small>
                        <strong>{formatActivityType(item.activityType)}</strong>
                      </div>
                    </article>
                  ) : null}
                  <article>
                    <span>
                      <Clock3 size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Date de soumission</small>
                      <strong>
                        {formatDateTime(item.submittedAt) || "Non soumise"}
                      </strong>
                    </div>
                  </article>
                  {decidedAt ? (
                    <article>
                      <span>
                        <BadgeCheck size={16} aria-hidden="true" />
                      </span>
                      <div>
                        <small>Date de décision</small>
                        <strong>{formatDateTime(decidedAt)}</strong>
                      </div>
                    </article>
                  ) : null}
                  <article>
                    <span>
                      <BadgeCheck size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Statut</small>
                      <strong>{statusLabel}</strong>
                    </div>
                  </article>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.sectionTitle}>
                  <div>
                    <span>Documents</span>
                    <h2>État documentaire</h2>
                  </div>
                </div>
                <div className={styles.documentsList}>
                  {(item.documents || []).length === 0 ? (
                    <article>
                      <span className={styles.documentIcon}>
                        <FileText size={16} aria-hidden="true" />
                      </span>
                      <div className={styles.documentContent}>
                        <strong>Aucun document</strong>
                        <p>Aucun fichier associé à ce dossier.</p>
                      </div>
                    </article>
                  ) : (
                    (item.documents || []).map((doc) => (
                      <article key={doc.id}>
                        <span className={styles.documentIcon}>
                          <FileText size={16} aria-hidden="true" />
                        </span>
                        <div className={styles.documentContent}>
                          <strong>{doc.label}</strong>
                          <p>{doc.fileName || formatStatusLabel(doc.documentType)}</p>
                          <span
                            className={
                              documentStatusClass(doc.verificationStatus) ===
                              "valid"
                                ? styles.validDocument
                                : documentStatusClass(doc.verificationStatus) ===
                                    "rejected"
                                  ? styles.rejectedDocument
                                  : styles.pendingDocument
                            }
                          >
                            {formatStatusLabel(doc.verificationStatus)}
                            {doc.rejectionReason
                              ? ` — ${doc.rejectionReason}`
                              : ""}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
                <div className={styles.documentsPrivacy}>
                  <ShieldCheck size={15} aria-hidden="true" />
                  <p>
                    Documents privés — jamais exposés sur les pages publiques
                    d’annonces.
                  </p>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.sectionTitle}>
                  <div>
                    <span>Historique</span>
                    <h2>Événements</h2>
                  </div>
                </div>
                <div className={styles.timeline}>
                  {(item.history || []).length === 0 ? (
                    <article className={styles.timelineItem}>
                      <span className={styles.timelineMarker} />
                      <div>
                        <strong>Aucun événement</strong>
                        <p>L’historique apparaîtra ici.</p>
                      </div>
                    </article>
                  ) : (
                    (item.history || []).map((h, index) => (
                      <article
                        key={h.id}
                        className={`${styles.timelineItem} ${index === 0 ? styles.timelineActive : ""}`}
                      >
                        <span className={styles.timelineMarker} />
                        <div>
                          <strong>{formatHistoryLabel(h.label)}</strong>
                          {h.reason ? <p>{h.reason}</p> : null}
                          <time dateTime={h.at}>
                            {formatDateTime(h.at)}
                          </time>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            <aside className={styles.sideColumn}>
              {nextStep ? (
                <section
                  className={
                    nextStep.variant === "closed"
                      ? styles.closedActionCard
                      : styles.nextActionCard
                  }
                >
                  <span
                    className={
                      nextStep.variant === "closed"
                        ? styles.closedActionIcon
                        : styles.nextActionIcon
                    }
                  >
                    {nextStep.variant === "closed" ? (
                      <CircleAlert size={18} aria-hidden="true" />
                    ) : (
                      <ShieldCheck size={18} aria-hidden="true" />
                    )}
                  </span>
                  <p className={styles.cardEyebrow}>{nextStep.eyebrow}</p>
                  <h2>{nextStep.title}</h2>
                  <p>{nextStep.description}</p>
                  {nextStep.actionHref && nextStep.actionLabel ? (
                    <Link
                      href={nextStep.actionHref}
                      className={styles.primaryButton}
                    >
                      {nextStep.actionLabel}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  ) : null}
                </section>
              ) : null}

              <section className={styles.helpCard}>
                <span>
                  <ShieldCheck size={16} aria-hidden="true" />
                </span>
                <div>
                  <h2>Informations du dossier</h2>
                  <p>
                    Référence {item.reference} · rôle{" "}
                    {formatRoleLabel(item.requestedRole)}.
                  </p>
                  <p>
                    Soumise le{" "}
                    {formatDateTime(item.submittedAt) || "—"}
                    {decidedAt
                      ? ` · décision le ${formatDateTime(decidedAt)}`
                      : ""}
                    .
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </>
      ) : null}
      </div>
    </UserShell>
  );
}
