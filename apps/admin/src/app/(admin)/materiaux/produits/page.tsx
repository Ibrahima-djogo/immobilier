"use client";

import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { type MaterialCategory } from "@/lib/materiaux/categories";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import {
  formatCatalogPrice,
  productImageUrl,
  type MaterialProduct,
} from "@/lib/materiaux/products";
import { materialStockStorage } from "@/lib/materiaux/stock-storage";
import {
  availableQuantity,
  formatStockAmount,
  type MaterialStock,
} from "@/lib/materiaux/stocks";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import {
  labelSupplier,
  type MaterialSupplier,
} from "@/lib/materiaux/suppliers";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import { labelSaleUnit, type MaterialUnit } from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export default function MaterialProductsPage() {
  const [items, setItems] = useState<MaterialProduct[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [suppliers, setSuppliers] = useState<MaterialSupplier[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [stocks, setStocks] = useState<MaterialStock[]>([]);
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [categoryFilter, setCategoryFilter] = useState("TOUS");
  const [statusFilter, setStatusFilter] = useState("TOUS");

  function reloadFromStore() {
    setCategories(materialCategoryStorage.list());
    setSuppliers(materialSupplierStorage.list());
    setUnits(materialUnitStorage.list());
    setStocks(materialStockStorage.list());
    setItems(materialProductStorage.list());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reloadFromStore();
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger le catalogue.");
      } finally {
        setStoreReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const categoryName = useCallback(
    (categoryId: string) =>
      categories.find((category) => category.id === categoryId)?.name ??
      "Catégorie introuvable",
    [categories],
  );

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      const haystack =
        `${item.name} ${item.slug} ${item.brand} ${item.reference} ${categoryName(item.categoryId)} ${labelSupplier(item.supplierId, suppliers)}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesCategory =
        categoryFilter === "TOUS" || item.categoryId === categoryFilter;
      const matchesStatus =
        statusFilter === "TOUS" || item.status === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [items, debouncedQuery, categoryFilter, statusFilter, categoryName, suppliers]);

  const hasFilters =
    Boolean(query.trim()) ||
    categoryFilter !== "TOUS" ||
    statusFilter !== "TOUS";

  function resetFilters() {
    setQuery("");
    setCategoryFilter("TOUS");
    setStatusFilter("TOUS");
  }

  function availableLabel(productId: string) {
    const stock = stocks.find((item) => item.productId === productId);
    return stock ? formatStockAmount(availableQuantity(stock)) : "—";
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Produits"
      icon={Package}
      backHref={routes.materials}
      backLabel="Retour aux matériaux"
      heroVariant="compact"
      actions={
        <Link href={routes.materialProductNew} className={styles.action}>
          <Plus size={16} aria-hidden="true" />
          Ajouter un matériau
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
          Chargement des matériaux…
        </div>
      ) : null}

      <section className={styles.filters}>
        <div className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, référence, catégorie…"
            aria-label="Rechercher un matériau"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value="TOUS">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>
        <span className={styles.count}>{filtered.length}</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Produit</div>
          <div>Référence</div>
          <div>Catégorie</div>
          <div>Prix</div>
          <div>Disponibilité</div>
          <div>Statut</div>
          <div>Actions</div>
        </div>

        {storeReady && filtered.length === 0 ? (
          <EmptyState
            title={
              hasFilters
                ? "Aucun matériau correspondant"
                : "Aucun matériau"
            }
            description={
              hasFilters
                ? "Aucun résultat ne correspond à votre recherche ou à vos filtres."
                : "Ajoutez une première fiche catalogue pour commencer."
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
                <Link href={routes.materialProductNew} className={styles.action}>
                  <Plus size={16} aria-hidden="true" />
                  Ajouter un matériau
                </Link>
              )
            }
          />
        ) : null}

        {filtered.map((item) => (
          <article
            key={item.id}
            className={`${styles.tableGrid} ${styles.row}`}
          >
            <div className={styles.colName}>
              <div className={styles.identity}>
                <span className={styles.thumb}>
                  {productImageUrl(item) ? (
                    // Image locale / data URL de démonstration.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={productImageUrl(item)} alt="" />
                  ) : (
                    <Package size={16} aria-hidden="true" />
                  )}
                </span>
                <strong title={item.name}>{item.name}</strong>
              </div>
            </div>
            <div className={`${styles.colReference} ${styles.muted}`} data-label="Référence">
              {item.reference || item.slug}
            </div>
            <div className={`${styles.colCategory} ${styles.muted}`} data-label="Catégorie">
              {categoryName(item.categoryId)}
            </div>
            <div className={`${styles.colPrice} ${styles.price}`} data-label="Prix">
              {formatCatalogPrice(item.price, labelSaleUnit(item.unit, units))}
            </div>
            <div className={`${styles.colStock} ${styles.price}`} data-label="Disponibilité">
              {availableLabel(item.id)}
            </div>
            <div className={styles.colStatus} data-label="Statut">
              <StatusBadge status={item.status} />
            </div>
            <div className={styles.colActions}>
              <Link
                href={routes.materialProduct(item.id)}
                className={styles.view}
                aria-label={`Voir ${item.name}`}
              >
                Voir
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
