"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { Button, InfoField, InfoGrid } from "@/components/ui";
import { FonciereDocuments } from "@/components/verification-fonciere/FonciereDocuments";
import { FonciereHistory } from "@/components/verification-fonciere/FonciereHistory";
import { FonciereStatusBadge } from "@/components/verification-fonciere/FonciereStatusBadge";
import {
  FONCIERE_ADMIN_AGENT_OPTIONS,
  FONCIERE_ADMIN_STATUS_ACTIONS,
  FONCIERE_PROPERTY_HOLDER_TYPE_LABELS,
  FONCIERE_REQUEST_MODE_SHORT_LABELS,
  FONCIERE_VERIFICATION_PUBLIC_NOTICE,
} from "@/lib/verification-fonciere/constants";
import {
  getFonciereAdminMeta,
  findFonciereRequest,
  saveFonciereAdminMeta,
  updateFonciereAdminStatus,
  type FonciereAdminMeta,
  type FonciereClientRecord,
} from "@/lib/verification-fonciere/storage";
import { routes } from "@/lib/routes/app-routes";

import styles from "../page.module.css";

export default function AdminFonciereVerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = String(params?.id || "").trim();
  const [request, setRequest] = useState<FonciereClientRecord | null>(null);
  const [meta, setMeta] = useState<FonciereAdminMeta>({
    assignedAgentName: "",
    internalNotes: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = requestId
          ? (await findFonciereRequest(requestId)) ?? null
          : null;
        if (cancelled) return;
        setRequest(next);
        setMeta(
          requestId
            ? await getFonciereAdminMeta(requestId)
            : { assignedAgentName: "", internalNotes: "" },
        );
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  async function applyStatus(status: (typeof FONCIERE_ADMIN_STATUS_ACTIONS)[number]) {
    if (!request || busy) return;
    setBusy(true);
    const next = await updateFonciereAdminStatus(
      request.id,
      status.status,
      status.message,
    );
    if (next) setRequest(next);
    setBusy(false);
  }

  async function persistMeta() {
    if (!request) return;
    setMeta(await saveFonciereAdminMeta(request.id, meta));
    setSaved(true);
  }

  return (
    <AdminShell
      active="verifications-foncieres"
      eyebrow="Dossier foncier"
      title={request?.reference ?? "Vérification foncière"}
      description="Supervision interne. Cette démarche ne constitue pas une certification de propriété."
    >
      <Link href={routes.adminFonciereVerifications} className={styles.back}>
        <ArrowLeft size={15} aria-hidden="true" />
        Retour aux dossiers
      </Link>

      {!loaded ? (
        <p className={styles.status} role="status">
          Chargement du dossier…
        </p>
      ) : !request ? (
        <section className={`${styles.card} ${styles.empty} ${styles.panel}`}>
          <h2>Dossier introuvable</h2>
          <p>Cette demande n’existe pas sur cet appareil.</p>
        </section>
      ) : (
        <div className={styles.stack}>
          <section className={`${styles.card} ${styles.panel}`}>
            <div className={styles.header}>
              <strong>{request.reference}</strong>
              <FonciereStatusBadge status={request.status} />
            </div>
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Terrain</h2>
            <div className={styles.property}>
              {request.propertyImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={request.propertyImage}
                  alt=""
                  className={styles.photo}
                />
              ) : (
                <div className={styles.photoFallback} aria-hidden="true">
                  <Building2 size={22} />
                </div>
              )}
              <div>
                <p className={styles.propertyTitle}>{request.propertyTitle}</p>
                <p className={styles.propertyMeta}>
                  <MapPin size={14} aria-hidden="true" />
                  <span>
                    {request.propertyLocation?.trim() ||
                      "Localisation à confirmer"}
                  </span>
                </p>
              </div>
            </div>
            <InfoGrid>
              <InfoField label="Titre" value={request.propertyTitle} />
              <InfoField
                label="Localisation"
                value={request.propertyLocation?.trim() || "—"}
              />
              <InfoField
                label="Propriétaire"
                value={request.owner?.name || request.ownerName || "—"}
              />
            </InfoGrid>
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Gestionnaire destinataire</h2>
            <InfoGrid>
              <InfoField
                label="Type"
                value={
                  FONCIERE_PROPERTY_HOLDER_TYPE_LABELS[
                    request.recipientType ||
                      request.propertyHolderType ||
                      (request.agencyId ? "AGENCY" : "OWNER")
                  ]
                }
              />
              <InfoField
                label="Nom"
                value={
                  request.recipientName ||
                  request.propertyHolderName ||
                  request.agencyName ||
                  request.ownerName ||
                  "—"
                }
              />
              <InfoField
                label="Identifiant"
                value={
                  request.recipientId ||
                  request.propertyHolderId ||
                  request.agencyId ||
                  request.ownerId ||
                  "—"
                }
              />
            </InfoGrid>
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Demandeur</h2>
            <InfoGrid>
              <InfoField
                label="Identité"
                value={request.requester?.fullName || request.requesterName}
              />
              <InfoField
                label="Téléphone"
                value={request.requester?.phone || "—"}
              />
              <InfoField
                label="E-mail"
                value={request.requester?.email || "—"}
              />
            </InfoGrid>
            {request.requester?.message ? (
              <p className={styles.message}>{request.requester.message}</p>
            ) : (
              <p className={styles.notice}>Aucun message n’a été laissé.</p>
            )}
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Processus</h2>
            <InfoGrid>
              <InfoField
                label="Mode choisi"
                value={FONCIERE_REQUEST_MODE_SHORT_LABELS[request.requestMode]}
              />
              <InfoField label="Statut">
                <FonciereStatusBadge status={request.status} />
              </InfoField>
            </InfoGrid>
            <div className={styles.actions}>
              {FONCIERE_ADMIN_STATUS_ACTIONS.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  variant={
                    action.status === request.status ? "primary" : "secondary"
                  }
                  disabled={busy || action.status === request.status}
                  onClick={() => applyStatus(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
            <p className={styles.notice}>{FONCIERE_VERIFICATION_PUBLIC_NOTICE}</p>
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Documents</h2>
            <FonciereDocuments documents={request.documents} />
            <p className={styles.notice}>
              Les fichiers sensibles ne sont jamais exposés ici.
            </p>
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Agent responsable</h2>
            <label className={styles.field}>
              Affectation interne
              <select
                value={meta.assignedAgentName}
                onChange={(event) => {
                  const assignedAgentName = event.target.value;
                  void saveFonciereAdminMeta(request.id, {
                    assignedAgentName,
                  }).then(setMeta);
                }}
              >
                <option value="">Non affecté</option>
                {FONCIERE_ADMIN_AGENT_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.notice}>
              Structure frontend uniquement. Aucune gestion de comptes.
            </p>
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Notes internes</h2>
            <label className={styles.field}>
              Notes visibles uniquement en administration
              <textarea
                value={meta.internalNotes}
                onChange={(event) => {
                  setSaved(false);
                  setMeta((current) => ({
                    ...current,
                    internalNotes: event.target.value,
                  }));
                }}
                placeholder="Observations internes, pièces à relancer, suivi…"
              />
            </label>
            <div className={styles.actions}>
              <Button type="button" onClick={persistMeta}>
                Enregistrer les notes
              </Button>
            </div>
            {saved ? (
              <p className={styles.notice}>Notes enregistrées sur cet appareil.</p>
            ) : null}
          </section>

          <section className={`${styles.card} ${styles.panel}`}>
            <h2 className={styles.sectionTitle}>Historique</h2>
            <FonciereHistory history={request.history} />
          </section>
        </div>
      )}
    </AdminShell>
  );
}
