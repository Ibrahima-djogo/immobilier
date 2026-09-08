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
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDemoListings } from "@/hooks/useDemoListings";

import AgencyShell from "@/components/agence/AgencyShell";
import { Button, ConfirmDialog, DemoToast } from "@/components/ui";
import { DEMO_AGENCY_ID } from "@/lib/demo-api/config";
import {
  listingService,
  type DemoListing,
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

function canResubmitListing(ad: DemoListing) {
  if (ad.status === "A_CORRIGER") return true;
  return ad.status === "REFUSEE" && ad.canResubmit === true;
}

export default function AgencyAdsPage() {
  const {
    items,
    loading,
    error,
    refresh,
  } = useDemoListings({ agencyId: DEMO_AGENCY_ID }, { poll: true });
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const [pendingDelete, setPendingDelete] = useState<DemoListing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const filtered = useMemo(
    () =>
      items.filter(
        (a) =>
          a.status !== "ARCHIVEE" &&
          a.title.toLowerCase().includes(debouncedQuery.toLowerCase()) &&
          (status === "TOUS" || a.status === status),
      ),
    [items, debouncedQuery, status],
  );

  const hasFilters = Boolean(query.trim()) || status !== "TOUS";

  function resetFilters() {
    setQuery("");
    setStatus("TOUS");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await listingService.setStatus(pendingDelete.id, {
        status: "ARCHIVEE",
        actor: "AGENCE",
      });
      setToast("L’annonce a été archivée.");
      await refresh();
    } catch (err) {
      setToast(
        err instanceof Error
          ? err.message
          : "Suppression impossible.",
      );
    } finally {
      setPendingDelete(null);
    }
  }

  async function resubmit(id: string) {
    setBusyId(id);
    try {
      await listingService.resubmit(id, { actor: "AGENCE" });
      setToast("Annonce renvoyée pour validation.");
      await refresh();
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Renvoi impossible.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AgencyShell
      active="annonces"
      eyebrow="Diffusion professionnelle"
      title="Annonces de l’agence"
      description="Suivez la diffusion publique du portefeuille et l’état de validation de chaque annonce."
      action={
        <Button href={routes.newAgencyAd}>
          <Plus size={17} aria-hidden="true" />
          Nouvelle annonce
        </Button>
      }
    >
      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une annonce..."
            aria-label="Rechercher une annonce"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="PUBLIEE">Publiées</option>
          <option value="BROUILLON">Brouillons</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="A_CORRIGER">À corriger</option>
          <option value="REFUSEE">Refusées</option>
          <option value="SUSPENDUE">Suspendues</option>
        </select>
        {hasFilters && (
          <button type="button" className={styles.reset} onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
      </section>

      {error ? (
        <p className={styles.errorBanner} role="alert">
          {error}
        </p>
      ) : null}

      <p className={styles.resultCount}>
        <strong>{loading ? "…" : filtered.length}</strong> annonce(s) affichée(s)
      </p>

      {filtered.length === 0 && !loading ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <h2>Aucune annonce trouvée</h2>
          <p>Modifiez la recherche ou réinitialisez les filtres.</p>
          {hasFilters && (
            <button type="button" className={styles.reset} onClick={resetFilters}>
              Réinitialiser les filtres
            </button>
          )}
        </section>
      ) : (
        <section className={`${styles.card} ${styles.table}`}>
          <div className={styles.head}>
            <span>Annonce</span>
            <span>Statut</span>
            <span>Performance</span>
            <span>Mise à jour</span>
            <span>Actions</span>
          </div>
          {filtered.map((a) => (
            <article key={a.id}>
              <div>
                <span className={styles.icon}>
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.reference}</small>
                  <small>
                    {a.operation === "VENTE" ? "À vendre" : "À louer"}
                  </small>
                </div>
              </div>
              <span
                className={
                  styles[a.status.toLowerCase()] ||
                  (a.status === "REFUSEE" ? styles.refusee : styles.brouillon)
                }
              >
                {statusLabel(a.status)}
              </span>
              <div className={styles.metrics}>
                <span>
                  <Eye size={14} aria-hidden="true" />
                  {a.views}
                </span>
                <span>
                  <Heart size={14} aria-hidden="true" />
                  {a.favorites}
                </span>
                <span>
                  <MessageSquareText size={14} aria-hidden="true" />
                  {a.contacts}
                </span>
              </div>
              <small>{new Date(a.updatedAt).toLocaleString("fr-FR")}</small>
              <div className={styles.rowActions}>
                <Link
                  href={routes.agencyAd(a.id)}
                  aria-label={`Voir l’annonce ${a.title}`}
                >
                  <Eye size={14} aria-hidden="true" />
                  Voir
                </Link>
                <Link
                  href={routes.editAgencyAd(a.id)}
                  aria-label={`Modifier l’annonce ${a.title}`}
                >
                  <Pencil size={14} aria-hidden="true" />
                  Modifier
                </Link>
                {canResubmitListing(a) ? (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => void resubmit(a.id)}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    {busyId === a.id ? "…" : "Renvoyer"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={() => setPendingDelete(a)}
                  aria-label={`Supprimer l’annonce ${a.title}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Archiver cette annonce ?"
        description="L’annonce sera marquée comme archivée."
        subject={pendingDelete?.title}
        confirmLabel="Archiver l’annonce"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AgencyShell>
  );
}
