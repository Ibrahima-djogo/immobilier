"use client";

import Link from "next/link";
import {
  Eye,
  FileText,
  Heart,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDemoListings } from "@/hooks/useDemoListings";
import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { Button } from "@/components/ui";
import { DEMO_OWNER_ID } from "@/lib/demo-api/config";
import { listingService } from "@/lib/demo-api/listings";
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
    case "BROUILLON":
      return "BROUILLON";
    default:
      return status.replaceAll("_", " ");
  }
}

function canResubmitListing(ad: { status: string; canResubmit?: boolean }) {
  if (ad.status === "A_CORRIGER") return true;
  return ad.status === "REFUSEE" && ad.canResubmit === true;
}

export default function OwnerAdsPage() {
  const { items: ads, loading, error, refresh } = useDemoListings(
    { ownerId: DEMO_OWNER_ID },
    { poll: true },
  );
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      ads.filter(
        (ad) =>
          ad.title.toLowerCase().includes(debouncedQuery.toLowerCase()) &&
          (status === "TOUS" || ad.status === status),
      ),
    [ads, debouncedQuery, status],
  );

  async function resubmit(id: string) {
    setBusyId(id);
    try {
      await listingService.resubmit(id, { actor: "PROPRIETAIRE" });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Diffusion publique"
        title="Mes annonces"
        description="Suivez la diffusion publique de vos biens et l’état de validation de chaque annonce."
        action={
          <Button href={routes.newOwnerAd}>
            <Plus size={17} aria-hidden="true" />
            Nouvelle annonce
          </Button>
        }
      />
      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une annonce..."
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="TOUS">Tous les statuts</option>
          <option value="PUBLIEE">Publiées</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="A_CORRIGER">À corriger</option>
          <option value="REFUSEE">Refusées</option>
          <option value="SUSPENDUE">Suspendues</option>
          <option value="BROUILLON">Brouillons</option>
        </select>
      </section>

      {error ? (
        <p className={styles.errorBanner} role="alert">
          {error}
        </p>
      ) : null}

      <section className={`${styles.card} ${styles.table}`}>
        <div className={styles.head}>
          <span>Annonce</span>
          <span>Statut</span>
          <span>Performance</span>
          <span>Mise à jour</span>
          <span>Actions</span>
        </div>
        {filtered.map((ad) => (
          <article key={ad.id}>
            <div>
              <span className={styles.icon}>
                <FileText size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>{ad.title}</strong>
                <small>{ad.reference}</small>
                <small>
                  {ad.operation === "VENTE" ? "À vendre" : "À louer"}
                  {ad.moderationNote ? ` · ${ad.moderationNote}` : ""}
                </small>
              </div>
            </div>
            <span
              className={
                styles[ad.status.toLowerCase()] || styles.brouillon
              }
            >
              {statusLabel(ad.status)}
            </span>
            <div className={styles.metrics}>
              <span>
                <Eye size={14} aria-hidden="true" />
                {ad.views}
              </span>
              <span>
                <Heart size={14} aria-hidden="true" />
                {ad.favorites}
              </span>
              <span>
                <MessageSquareText size={14} aria-hidden="true" />
                {ad.contacts}
              </span>
            </div>
            <small>{new Date(ad.updatedAt).toLocaleString("fr-FR")}</small>
            <div className={styles.rowActions}>
              <Link href={routes.ownerAd(ad.id)}>
                <Eye size={14} aria-hidden="true" />
                Voir
              </Link>
              <Link href={routes.editOwnerAd(ad.id)}>
                <Pencil size={14} aria-hidden="true" />
                {ad.status === "A_CORRIGER" ? "Modifier l’annonce" : "Modifier"}
              </Link>
              {canResubmitListing(ad) ? (
                <button
                  type="button"
                  disabled={busyId === ad.id}
                  onClick={() => void resubmit(ad.id)}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  {busyId === ad.id ? "…" : "Renvoyer"}
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {!loading && filtered.length === 0 && (
          <p className={styles.emptyRow}>Aucune annonce pour ces filtres.</p>
        )}
      </section>
    </>
  );
}
