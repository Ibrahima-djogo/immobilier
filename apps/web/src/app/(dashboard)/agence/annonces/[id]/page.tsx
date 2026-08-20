"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Eye,
  Heart,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import AgencyShell from "@/components/agence/AgencyShell";
import {
  listingService,
  type DemoListing,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

function statusLabel(status: string) {
  switch (status) {
    case "EN_ATTENTE":
      return "EN ATTENTE";
    case "A_CORRIGER":
      return "À CORRIGER";
    case "REFUSEE":
      return "REFUSÉE";
    case "PUBLIEE":
      return "PUBLIÉE";
    case "SUSPENDUE":
      return "SUSPENDUE";
    case "BROUILLON":
      return "BROUILLON";
    default:
      return status.replaceAll("_", " ");
  }
}

function canShowResubmit(listing: DemoListing) {
  if (listing.status === "A_CORRIGER") return true;
  return listing.status === "REFUSEE" && listing.canResubmit === true;
}

export default function AgencyAdDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<DemoListing | null>(null);
  const [property, setProperty] = useState<DemoProperty | null>(null);
  const [agencyVerified, setAgencyVerified] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await listingService.bundle(params.id);
      setListing(bundle.listing);
      setProperty(bundle.property);
      const agency = bundle.agency as { verified?: boolean } | null;
      setAgencyVerified(agency?.verified !== false);
      setError(bundle.listing ? null : "Annonce introuvable");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l’annonce (Demo API).",
      );
      setListing(null);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const resubmitBlocked = useMemo(() => {
    if (!listing) return null;
    if (!canShowResubmit(listing)) return null;
    if (
      listing.resubmitRequiresVerifiedAdvertiser &&
      !agencyVerified
    ) {
      return "Votre compte doit être vérifié avant de pouvoir renvoyer cette annonce.";
    }
    return null;
  }, [listing, agencyVerified]);

  async function resubmit() {
    if (!listing || resubmitBlocked) return;
    setBusy(true);
    try {
      const updated = await listingService.resubmit(listing.id, {
        actor: "AGENCE",
      });
      setListing(updated);
      setToast("Annonce renvoyée pour validation — EN ATTENTE.");
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Échec du renvoi.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AgencyShell
        active="annonces"
        eyebrow="Détail de l’annonce"
        title="Chargement..."
        description="Récupération via la Demo API."
      >
        <p>Chargement...</p>
      </AgencyShell>
    );
  }

  if (error || !listing) {
    return (
      <AgencyShell
        active="annonces"
        eyebrow="Détail de l’annonce"
        title="Annonce introuvable"
        description={
          error || "Cette annonce n’existe pas dans la Demo API."
        }
      >
        <Link href={routes.agencyAds} className={styles.back}>
          <ArrowLeft size={15} />
          Retour aux annonces
        </Link>
      </AgencyShell>
    );
  }

  const reason =
    listing.rejectionReason || listing.moderationNote || null;
  const showResubmit = canShowResubmit(listing);

  return (
    <AgencyShell
      active="annonces"
      eyebrow="Détail de l’annonce"
      title={listing.title}
      description="Consultez le statut, les performances et la modération (Demo API)."
      action={
        <Link className={styles.action} href={routes.editAgencyAd(listing.id)}>
          <Edit3 size={16} />
          Modifier
        </Link>
      }
    >
      <Link href={routes.agencyAds} className={styles.back}>
        <ArrowLeft size={15} />
        Retour aux annonces
      </Link>
      {toast ? <div className={styles.notice}>{toast}</div> : null}
      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.main}`}>
          <div className={styles.status}>
            <span
              className={
                styles[listing.status.toLowerCase()] ||
                styles[
                  listing.status === "REFUSEE" ? "refusee" : ""
                ] ||
                ""
              }
            >
              {statusLabel(listing.status)}
            </span>
            <small>
              Dernière mise à jour :{" "}
              {new Date(listing.updatedAt).toLocaleString("fr-FR")}
            </small>
          </div>
          <h2>Rattachement</h2>
          <p>
            Cette annonce est rattachée au bien{" "}
            <strong>
              {property?.title ?? property?.slug ?? listing.propertyId}
            </strong>
            {property?.type ? ` (${property.type})` : ""}. Le bien reste dans
            votre portefeuille indépendamment du statut de publication.
          </p>
          <p className={styles.metaIds}>
            <small>
              id {listing.id} · réf. {listing.reference} · propriété{" "}
              {listing.propertyId}
            </small>
          </p>
          {reason ? (
            <div className={styles.rejection}>
              <strong>
                {listing.status === "A_CORRIGER"
                  ? "Correction demandée"
                  : listing.status === "REFUSEE"
                    ? "Motif du refus"
                    : "Note de modération"}
              </strong>
              <p>{reason}</p>
            </div>
          ) : null}
          {listing.status === "REFUSEE" &&
          listing.canResubmit === false ? (
            <div className={styles.rejection}>
              <strong>Renvoi impossible</strong>
              <p>Cette annonce ne peut pas être renvoyée.</p>
            </div>
          ) : null}
          {showResubmit ? (
            <div className={styles.rowActions}>
              <Link href={routes.editAgencyAd(listing.id)}>
                <Edit3 size={14} />
                Modifier l’annonce
              </Link>
              <button
                type="button"
                onClick={() => void resubmit()}
                disabled={busy || Boolean(resubmitBlocked)}
                title={resubmitBlocked || undefined}
              >
                <RefreshCw size={14} />
                {busy ? "Renvoi…" : "Renvoyer pour validation"}
              </button>
            </div>
          ) : null}
          {resubmitBlocked ? (
            <p className={styles.metaIds}>
              <small>{resubmitBlocked}</small>
            </p>
          ) : null}
          <h2>Historique</h2>
          <ol>
            {(listing.history || []).map((event, index) => (
              <li key={event.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{event.label}</strong>
                  <small>
                    {new Date(event.date).toLocaleString("fr-FR")}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <aside className={`${styles.card} ${styles.metrics}`}>
          <h2>Performance</h2>
          <div>
            <span>
              <Eye size={18} />
              Vues
            </span>
            <strong>{listing.views}</strong>
          </div>
          <div>
            <span>
              <Heart size={18} />
              Favoris
            </span>
            <strong>{listing.favorites}</strong>
          </div>
          <div>
            <span>
              <MessageSquareText size={18} />
              Prospects
            </span>
            <strong>{listing.contacts}</strong>
          </div>
        </aside>
      </div>
    </AgencyShell>
  );
}
