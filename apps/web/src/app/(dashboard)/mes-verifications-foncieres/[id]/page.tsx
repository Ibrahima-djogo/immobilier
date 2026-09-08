"use client";

import { useParams } from "next/navigation";
import { Building2, Landmark, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { Button, Card, InfoField, InfoGrid } from "@/components/ui";
import { FonciereDocuments } from "@/components/verification-fonciere/FonciereDocuments";
import { FonciereHistory } from "@/components/verification-fonciere/FonciereHistory";
import { FonciereStatusBadge } from "@/components/verification-fonciere/FonciereStatusBadge";
import { FonciereTimeline } from "@/components/verification-fonciere/FonciereTimeline";
import { useRequirePublicSession } from "@/hooks/useRequirePublicSession";
import {
  FONCIERE_REQUEST_MODE_SHORT_LABELS,
  FONCIERE_VERIFICATION_PUBLIC_NOTICE,
} from "@/lib/verification-fonciere/constants";
import { formatFonciereDate } from "@/lib/verification-fonciere/display";
import {
  findFonciereRequest,
  type FonciereClientRecord,
} from "@/lib/verification-fonciere/storage";
import { routes } from "@/lib/routes/app-routes";

import styles from "../page.module.css";

export default function MyFonciereVerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = String(params?.id || "").trim();
  const { ready, isLoggedIn } = useRequirePublicSession(
    requestId
      ? routes.myFonciereVerification(requestId)
      : routes.myFonciereVerifications,
  );
  const [request, setRequest] = useState<FonciereClientRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const next = requestId
          ? (await findFonciereRequest(requestId)) ?? null
          : null;
        if (!cancelled) setRequest(next);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, isLoggedIn, requestId]);

  return (
    <UserShell active="verifications-foncieres">
      <section className={styles.content}>
        <PageHero
          variant="dashboard"
          eyebrow="Dossier foncier"
          title={request?.reference ?? "Vérification foncière"}
          icon={<Landmark size={16} aria-hidden="true" />}
          backHref={routes.myFonciereVerifications}
          backLabel="Mes vérifications foncières"
        />

        {!ready || !isLoggedIn ? (
          <p className={styles.status} role="status">
            Vérification de votre connexion…
          </p>
        ) : !loaded ? (
          <p className={styles.status} role="status">
            Chargement du dossier…
          </p>
        ) : !request ? (
          <div className={styles.empty}>
            <p>Ce dossier est introuvable sur cet appareil.</p>
            <Button href={routes.myFonciereVerifications} variant="secondary">
              Retour à la liste
            </Button>
          </div>
        ) : (
          <div className={styles.stack}>
            <Card as="section">
              <div className={styles.header}>
                <div>
                  <strong>{request.reference}</strong>
                  <p className={styles.headerTerrain}>{request.propertyTitle}</p>
                </div>
                <FonciereStatusBadge status={request.status} />
              </div>
            </Card>

            <Card as="section">
              <h2>Résumé</h2>
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
                <InfoField label="Bien" value={request.propertyTitle} />
                <InfoField
                  label="Demandeur"
                  value={request.requester?.fullName || request.requesterName}
                />
                <InfoField
                  label="Mode choisi"
                  value={FONCIERE_REQUEST_MODE_SHORT_LABELS[request.requestMode]}
                />
                <InfoField
                  label="Date de création"
                  value={formatFonciereDate(request.createdAt)}
                />
              </InfoGrid>
              <p className={styles.notice}>{FONCIERE_VERIFICATION_PUBLIC_NOTICE}</p>
            </Card>

            <Card as="section">
              <h2>Avancement</h2>
              <FonciereTimeline history={request.history} />
            </Card>

            <Card as="section">
              <h2>Documents du dossier</h2>
              <FonciereDocuments documents={request.documents} />
            </Card>

            <Card as="section">
              <h2>Historique</h2>
              <FonciereHistory history={request.history} />
            </Card>
          </div>
        )}
      </section>
    </UserShell>
  );
}
