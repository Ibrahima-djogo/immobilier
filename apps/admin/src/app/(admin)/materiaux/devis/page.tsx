"use client";

import Link from "next/link";
import { FileSpreadsheet, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatGnf } from "@/lib/administration/demo-data";
import { fetchMaterialQuotes } from "@/lib/materiaux/material-api";
import {
  formatQuoteDate,
  friendlyQuoteLoadError,
  matchesQuoteSearch,
  quoteAmount,
  QUOTE_STATUS_FILTERS,
  type MaterialQuote,
} from "@/lib/materiaux/quotes";
import { routes } from "@/lib/routes/app-routes";
import { formatStatusLabel } from "@/lib/ui/status";

import styles from "./page.module.css";

export default function MaterialQuotesPage() {
  const [items, setItems] = useState<MaterialQuote[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [statusFilter, setStatusFilter] = useState("TOUS");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchMaterialQuotes()
        .then((quotes) => {
          if (cancelled) return;
          setItems(Array.isArray(quotes) ? quotes : []);
          setLoadError(null);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setItems([]);
          setLoadError(friendlyQuoteLoadError(error));
        })
        .finally(() => {
          if (!cancelled) setReady(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "TOUS" || item.status === statusFilter;
      return matchesStatus && matchesQuoteSearch(item, debouncedQuery);
    });
  }, [items, debouncedQuery, statusFilter]);

  const hasFilters = Boolean(query.trim()) || statusFilter !== "TOUS";

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Devis"
      icon={FileSpreadsheet}
      backHref={routes.materials}
      backLabel="Retour aux matériaux"
      heroVariant="compact"
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Chargement des devis…
        </div>
      ) : null}

      <section className={styles.filters}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Référence, client ou fournisseur…"
            aria-label="Rechercher un devis"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous</option>
          {QUOTE_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
        <span className={styles.count}>{filtered.length} élément(s)</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Référence</div>
          <div>Client</div>
          <div>Produits</div>
          <div>Montant</div>
          <div>Statut</div>
          <div>Date</div>
          <div>Action</div>
        </div>

        {ready && !loadError && filtered.length === 0 ? (
          <EmptyState
            title="Aucun devis trouvé"
            description={
              hasFilters
                ? "Aucune demande ne correspond à votre recherche."
                : "Les demandes de devis des professionnels apparaîtront ici."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("TOUS");
                  }}
                >
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        ) : null}

        {filtered.map((item) => {
          const amount = quoteAmount(item);
          const count = item.items?.length ?? 0;
          return (
            <article
              key={item.id}
              className={`${styles.tableGrid} ${styles.row}`}
            >
              <div className={`${styles.colReference} ${styles.reference}`}>
                {item.reference}
              </div>
              <div className={`${styles.colClient} ${styles.muted}`} data-label="Client">
                {item.customer?.company || item.customer?.name || "—"}
              </div>
              <div className={`${styles.colCount} ${styles.muted}`} data-label="Produits">
                {count} produit{count > 1 ? "s" : ""}
              </div>
              <div className={`${styles.colAmount} ${styles.amount}`} data-label="Montant">
                {amount == null ? "—" : formatGnf(amount)}
              </div>
              <div className={styles.colStatus} data-label="Statut">
                <StatusBadge
                  status={item.status}
                  label={formatStatusLabel(item.status)}
                />
              </div>
              <div className={`${styles.colDate} ${styles.muted}`} data-label="Date">
                {formatQuoteDate(item.createdAt)}
              </div>
              <div className={styles.colActions}>
                <Link
                  href={routes.materialQuote(item.id)}
                  className={styles.view}
                  aria-label={`Voir le devis ${item.reference}`}
                >
                  Voir
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </AdminShell>
  );
}
