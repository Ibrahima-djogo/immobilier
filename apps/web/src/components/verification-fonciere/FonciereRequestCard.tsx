import Link from "next/link";
import { Building2, MapPin } from "lucide-react";

import { Button } from "@/components/ui";
import { FONCIERE_REQUEST_MODE_SHORT_LABELS } from "@/lib/verification-fonciere/constants";
import { formatFonciereDate } from "@/lib/verification-fonciere/display";
import type { FonciereClientRecord } from "@/lib/verification-fonciere/storage";
import { routes } from "@/lib/routes/app-routes";

import { FonciereStatusBadge } from "./FonciereStatusBadge";
import styles from "./FonciereRequestCard.module.css";

type Props = {
  request: FonciereClientRecord;
  href?: string;
  actionLabel?: string;
  showRequester?: boolean;
};

export function FonciereRequestCard({
  request,
  href = routes.myFonciereVerification(request.id),
  actionLabel = "Voir le dossier",
  showRequester = false,
}: Props) {
  const location = request.propertyLocation?.trim() || "Localisation à confirmer";

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.media} aria-hidden="true" tabIndex={-1}>
        {request.propertyImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={request.propertyImage} alt="" className={styles.image} />
        ) : (
          <span className={styles.fallback}>
            <Building2 size={22} />
          </span>
        )}
      </Link>
      <div className={styles.body}>
        <div className={styles.top}>
          <p className={styles.reference}>{request.reference}</p>
          <FonciereStatusBadge status={request.status} />
        </div>
        <h2 className={styles.title}>
          <Link href={href}>{request.propertyTitle}</Link>
        </h2>
        <p className={styles.location}>
          <MapPin size={14} aria-hidden="true" />
          <span>{location}</span>
        </p>
        <dl className={showRequester ? `${styles.meta} ${styles.metaWide}` : styles.meta}>
          {showRequester ? (
            <div>
              <dt>Demandeur</dt>
              <dd>{request.requester?.fullName || request.requesterName || "—"}</dd>
            </div>
          ) : null}
          <div>
            <dt>Mode</dt>
            <dd>{FONCIERE_REQUEST_MODE_SHORT_LABELS[request.requestMode]}</dd>
          </div>
          <div>
            <dt>Créée le</dt>
            <dd>{formatFonciereDate(request.createdAt)}</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Button href={href} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
