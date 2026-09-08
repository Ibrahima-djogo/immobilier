"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import AgencyShell from "@/components/agence/AgencyShell";
import { Button, Card, InfoField, InfoGrid } from "@/components/ui";
import { FonciereStatusBadge } from "@/components/verification-fonciere/FonciereStatusBadge";
import { FonciereTimeline } from "@/components/verification-fonciere/FonciereTimeline";
import { DEMO_AGENCY_ID } from "@/lib/demo-api/config";
import {
  FONCIERE_REQUEST_MODE_SHORT_LABELS,
  FONCIERE_VERIFICATION_PUBLIC_NOTICE,
} from "@/lib/verification-fonciere/constants";
import {
  canOwnerRespondToFonciere,
  requestBelongsToAgency,
} from "@/lib/verification-fonciere/display";
import {
  findFonciereRequest,
  respondToFonciereRequest,
  type FonciereClientRecord,
} from "@/lib/verification-fonciere/storage";
import { routes } from "@/lib/routes/app-routes";

import styles from "../page.module.css";

export default function AgencyFonciereVerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = String(params?.id || "").trim();
  const [request, setRequest] = useState<FonciereClientRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = requestId
          ? (await findFonciereRequest(requestId)) ?? null
          : null;
        if (!cancelled) {
          setRequest(
            next && requestBelongsToAgency(next, DEMO_AGENCY_ID) ? next : null,
          );
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  async function respond(action: "accept" | "refuse") {
    if (!request || busy) return;
    setBusy(true);
    const next = await respondToFonciereRequest(
      request.id,
      action,
      DEMO_AGENCY_ID,
    );
    if (next) setRequest(next);
    setBusy(false);
  }

  const canRespond = request ? canOwnerRespondToFonciere(request.status) : false;

  return (
    <AgencyShell
      active="verifications-foncieres"
      eyebrow="Dossier foncier"
      title={request?.reference ?? "Vérification foncière"}
      description="Consultez la demande et répondez si elle est encore en attente."
    >
      <Link href={routes.agencyFonciereVerifications} className={styles.back}>
        <ArrowLeft size={15} aria-hidden="true" />
        Retour aux vérifications foncières
      </Link>

      {!loaded ? (
        <p className={styles.status} role="status">
          Chargement du dossier…
        </p>
      ) : !request ? (
        <section className={styles.empty}>
          <h2>Dossier introuvable</h2>
          <p>Cette demande n’est pas liée aux terrains de l’agence.</p>
          <Button href={routes.agencyFonciereVerifications} variant="secondary">
            Retour à la liste
          </Button>
        </section>
      ) : (
        <div className={styles.stack}>
          <Card as="section">
            <div className={styles.header}>
              <strong>Statut actuel</strong>
              <FonciereStatusBadge status={request.status} />
            </div>
            {canRespond ? (
              <div className={styles.actions}>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => respond("accept")}
                >
                  Accepter
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={() => respond("refuse")}
                >
                  Refuser
                </Button>
              </div>
            ) : null}
          </Card>

          <Card as="section">
            <h2 className={styles.cardTitle}>Terrain concerné</h2>
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
                label="Référence"
                value={request.propertyReference || request.propertyId || "—"}
              />
            </InfoGrid>
          </Card>

          <Card as="section">
            <h2 className={styles.cardTitle}>Demandeur</h2>
            <InfoGrid>
              <InfoField
                label="Nom"
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
          </Card>

          <Card as="section">
            <h2 className={styles.cardTitle}>Démarche</h2>
            <InfoField
              label="Mode choisi"
              value={FONCIERE_REQUEST_MODE_SHORT_LABELS[request.requestMode]}
            />
            <p className={styles.notice}>{FONCIERE_VERIFICATION_PUBLIC_NOTICE}</p>
          </Card>

          <Card as="section">
            <h2 className={styles.cardTitle}>Avancement</h2>
            <FonciereTimeline history={request.history} />
          </Card>
        </div>
      )}
    </AgencyShell>
  );
}
