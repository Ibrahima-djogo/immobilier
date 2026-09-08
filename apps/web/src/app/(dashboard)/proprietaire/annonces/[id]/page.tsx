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
import { useCallback, useEffect, useState } from "react";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
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
      return "EN ATTENTE DE VALIDATION";
    case "A_CORRIGER":
      return "À CORRIGER";
    case "REFUSEE":
      return "REFUSÉE";
    case "PUBLIEE":
      return "PUBLIÉE";
    case "SUSPENDUE":
      return "SUSPENDUE";
    default:
      return status.replaceAll("_", " ");
  }
}

export default function AdDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<DemoListing | null>(null);
  const [property, setProperty] = useState<DemoProperty | null>(null);
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
      setError(
        bundle.listing
          ? null
          : "Cette annonce n’existe pas.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l’annonce.",
      );
      setListing(null);
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

  async function resubmit() {
    if (!listing) return;
    setBusy(true);
    try {
      const updated = await listingService.resubmit(listing.id, {
        actor: "PROPRIETAIRE",
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
      <>
        <OwnerPageHeader
          eyebrow="Détail de l’annonce"
          title="Chargement..."
          description="Chargement de l’annonce."
        />
        <p>Chargement...</p>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Détail de l’annonce"
          title="Annonce introuvable"
          description={error || "Cette annonce n’existe pas dans votre liste."}
        />
        <Link href={routes.ownerAds} className={styles.back}>
          <ArrowLeft size={15} />
          Retour aux annonces
        </Link>
      </>
    );
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Détail de l’annonce"
        title={listing.title}
        description="Consultez le statut, les performances et l’historique."
        action={
          <Link className={styles.action} href={routes.editOwnerAd(listing.id)}>
            <Edit3 size={16} />
            Modifier
          </Link>
        }
      />
      <Link href={routes.ownerAds} className={styles.back}>
        <ArrowLeft size={15} />
        Retour aux annonces
      </Link>
      {toast ? <div className={styles.notice}>{toast}</div> : null}
      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.main}`}>
          <div className={styles.status}>
            <span className={styles[listing.status.toLowerCase()] || ""}>
              {statusLabel(listing.status)}
            </span>
            <small>
              Dernière mise à jour :{" "}
              {new Date(listing.updatedAt).toLocaleString("fr-FR")}
            </small>
          </div>
          <h2>Résumé</h2>
          <p>
            Cette annonce est rattachée au bien{" "}
            <strong>{property?.title ?? listing.propertyId}</strong>.
            {listing.description ? ` ${listing.description}` : ""}
          </p>
          {(listing.rejectionReason || listing.moderationNote) ? (
            <div className={styles.rejection}>
              <strong>
                {listing.status === "A_CORRIGER"
                  ? "Correction demandée"
                  : listing.status === "REFUSEE"
                    ? "Motif du refus"
                    : "Note de modération"}
              </strong>
              <p>{listing.rejectionReason || listing.moderationNote}</p>
            </div>
          ) : null}
          {listing.status === "REFUSEE" && listing.canResubmit === false ? (
            <div className={styles.rejection}>
              <strong>Renvoi impossible</strong>
              <p>Cette annonce ne peut pas être renvoyée.</p>
            </div>
          ) : null}
          {listing.status === "A_CORRIGER" ||
          (listing.status === "REFUSEE" && listing.canResubmit) ? (
            <div className={styles.rowActions}>
              <Link href={routes.editOwnerAd(listing.id)}>
                <Edit3 size={14} />
                Modifier l’annonce
              </Link>
              <button type="button" onClick={() => void resubmit()} disabled={busy}>
                <RefreshCw size={14} />
                {busy ? "Renvoi…" : "Renvoyer pour validation"}
              </button>
            </div>
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
              Contacts
            </span>
            <strong>{listing.contacts}</strong>
          </div>
        </aside>
      </div>
    </>
  );
}
