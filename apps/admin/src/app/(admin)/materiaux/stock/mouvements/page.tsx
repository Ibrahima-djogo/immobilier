"use client";

import Link from "next/link";
import { History, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { materialStockMovementStorage } from "@/lib/materiaux/movement-storage";
import {
  formatMovementDate,
  formatSignedQuantity,
  labelMovementType,
  movementDelta,
  type MaterialStockMovement,
} from "@/lib/materiaux/movements";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import type { MaterialProduct } from "@/lib/materiaux/products";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export default function MaterialStockMovementsPage() {
  const [items, setItems] = useState<MaterialStockMovement[]>([]);
  const [products, setProducts] = useState<MaterialProduct[]>([]);
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [typeFilter, setTypeFilter] = useState("TOUS");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const reloadFromStore = useCallback(() => {
    setProducts(materialProductStorage.list());
    setItems(materialStockMovementStorage.list());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reloadFromStore();
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger l’historique des mouvements.");
      } finally {
        setStoreReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reloadFromStore]);

  const productName = useCallback(
    (productId: string) =>
      products.find((item) => item.id === productId)?.name ??
      "Matériau introuvable",
    [products],
  );

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      const name = productName(item.productId);
      const haystack = `${name} ${item.reason} ${item.note} ${item.type} ${item.createdBy}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesType = typeFilter === "TOUS" || item.type === typeFilter;
      const day = item.createdAt.slice(0, 10);
      const matchesFrom = !fromDate || day >= fromDate;
      const matchesTo = !toDate || day <= toDate;
      return matchesQuery && matchesType && matchesFrom && matchesTo;
    });
  }, [items, debouncedQuery, typeFilter, fromDate, toDate, productName]);

  const hasFilters =
    Boolean(query.trim()) ||
    typeFilter !== "TOUS" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  function resetFilters() {
    setQuery("");
    setTypeFilter("TOUS");
    setFromDate("");
    setToDate("");
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Mouvements de stock"
      icon={History}
      backHref={routes.materialStock}
      backLabel="Retour au stock"
      heroVariant="compact"
      actions={
        <Link href={routes.materialStockMovementNew} className={styles.action}>
          <Plus size={16} aria-hidden="true" />
          Nouveau mouvement
        </Link>
      }
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!storeReady ? (
        <div className={styles.loading} role="status">
          Chargement de l’historique…
        </div>
      ) : null}

      <section className={styles.filters}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un matériau, un motif..."
            aria-label="Rechercher un mouvement"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filtrer par type"
        >
          <option value="TOUS">Tous les types</option>
          <option value="ENTREE">Entrée</option>
          <option value="SORTIE">Sortie</option>
          <option value="AJUSTEMENT">Ajustement</option>
          <option value="PERTE">Perte</option>
          <option value="INVENTAIRE">Inventaire</option>
          <option value="RETOUR">Retour</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          aria-label="Période : depuis"
        />
        <input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          aria-label="Période : jusqu’à"
        />
        <span className={styles.count}>{filtered.length} élément(s)</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Date</div>
          <div>Produit</div>
          <div>Type mouvement</div>
          <div>Quantité</div>
          <div>Utilisateur</div>
          <div>Motif</div>
        </div>

        {storeReady && filtered.length === 0 ? (
          <EmptyState
            title={
              hasFilters
                ? "Aucun mouvement correspondant"
                : "Aucun mouvement"
            }
            description={
              hasFilters
                ? "Aucun résultat ne correspond à votre recherche ou à vos filtres."
                : "L’historique commence avec le premier mouvement enregistré. Les quantités déjà présentes ne sont pas reconstituées."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <Link
                  href={routes.materialStockMovementNew}
                  className={styles.action}
                >
                  <Plus size={16} aria-hidden="true" />
                  Nouveau mouvement
                </Link>
              )
            }
          />
        ) : null}

        {filtered.map((item) => {
          const delta = movementDelta(item);
          return (
            <article
              key={item.id}
              className={`${styles.tableGrid} ${styles.row}`}
            >
              <div className={`${styles.colDate} ${styles.muted}`} data-label="Date">
                {formatMovementDate(item.createdAt)}
              </div>
              <div className={`${styles.colProduct} ${styles.product}`} data-label="Produit">
                {productName(item.productId)}
              </div>
              <div className={styles.colType} data-label="Type mouvement">
                <StatusBadge status={item.type} label={labelMovementType(item.type)} />
              </div>
              <div
                className={`${styles.colQty} ${delta < 0 ? styles.deltaMinus : styles.deltaPlus}`}
                data-label="Quantité"
              >
                {formatSignedQuantity(delta)}
              </div>
              <div className={`${styles.colUser} ${styles.muted}`} data-label="Utilisateur">
                {item.createdBy || "—"}
              </div>
              <div className={`${styles.colReason} ${styles.muted}`} data-label="Motif">
                {item.reason}
              </div>
            </article>
          );
        })}
      </section>
    </AdminShell>
  );
}
