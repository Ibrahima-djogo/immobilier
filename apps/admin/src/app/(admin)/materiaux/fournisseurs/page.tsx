"use client";

import Link from "next/link";
import { Plus, Search, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import {
  labelSupplierType,
  type MaterialSupplier,
} from "@/lib/materiaux/suppliers";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

function locationLabel(item: MaterialSupplier) {
  return [item.city, item.district].filter(Boolean).join(" — ") || "—";
}

export default function MaterialSuppliersPage() {
  const [items, setItems] = useState<MaterialSupplier[]>([]);
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [typeFilter, setTypeFilter] = useState("TOUS");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [verificationFilter, setVerificationFilter] = useState("TOUS");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setItems(materialSupplierStorage.list());
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger les fournisseurs.");
      } finally {
        setStoreReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      const haystack =
        `${item.name} ${item.slug} ${item.phone} ${item.email} ${item.city} ${item.district ?? ""} ${labelSupplierType(item.type)}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesType = typeFilter === "TOUS" || item.type === typeFilter;
      const matchesStatus =
        statusFilter === "TOUS" || item.status === statusFilter;
      const matchesVerification =
        verificationFilter === "TOUS" ||
        item.verificationStatus === verificationFilter;
      return matchesQuery && matchesType && matchesStatus && matchesVerification;
    });
  }, [items, debouncedQuery, typeFilter, statusFilter, verificationFilter]);

  const hasFilters =
    Boolean(query.trim()) ||
    typeFilter !== "TOUS" ||
    statusFilter !== "TOUS" ||
    verificationFilter !== "TOUS";

  function resetFilters() {
    setQuery("");
    setTypeFilter("TOUS");
    setStatusFilter("TOUS");
    setVerificationFilter("TOUS");
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Fournisseurs"
      icon={Store}
      backHref={routes.materials}
      backLabel="Retour aux matériaux"
      heroVariant="compact"
      actions={
        <Link href={routes.materialSupplierNew} className={styles.action}>
          <Plus size={16} aria-hidden="true" />
          Ajouter un fournisseur
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
          Chargement des fournisseurs…
        </div>
      ) : null}

      <section className={styles.filters}>
        <div className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, ville, téléphone…"
            aria-label="Rechercher un fournisseur"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filtrer par type"
        >
          <option value="TOUS">Tous les types</option>
          <option value="PROFESSIONNEL">Professionnel</option>
          <option value="PARTICULIER">Particulier</option>
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
        <select
          value={verificationFilter}
          onChange={(event) => setVerificationFilter(event.target.value)}
          aria-label="Filtrer par vérification"
        >
          <option value="TOUS">Toutes les vérifications</option>
          <option value="VERIFIE">Fournisseur vérifié</option>
          <option value="EN_VERIFICATION">En vérification</option>
          <option value="NON_VERIFIE">Non vérifié</option>
        </select>
        <span className={styles.count}>{filtered.length}</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Fournisseur</div>
          <div>Type</div>
          <div>Localisation</div>
          <div>Statut</div>
          <div>Vérification</div>
          <div>Actions</div>
        </div>

        {storeReady && filtered.length === 0 ? (
          <EmptyState
            title={
              hasFilters
                ? "Aucun fournisseur correspondant"
                : "Aucun fournisseur"
            }
            description={
              hasFilters
                ? "Aucun résultat ne correspond à votre recherche ou à vos filtres."
                : "Ajoutez un premier fournisseur pour commencer."
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
                <Link href={routes.materialSupplierNew} className={styles.action}>
                  <Plus size={16} aria-hidden="true" />
                  Ajouter un fournisseur
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
                <span className={styles.thumb} aria-hidden="true">
                  <Store size={16} />
                </span>
                <strong title={item.name}>{item.name}</strong>
              </div>
            </div>
            <div className={`${styles.colType} ${styles.muted}`} data-label="Type">
              {labelSupplierType(item.type)}
            </div>
            <div
              className={`${styles.colCity} ${styles.muted}`}
              data-label="Localisation"
            >
              {locationLabel(item)}
            </div>
            <div className={styles.colStatus} data-label="Statut">
              <StatusBadge status={item.status} />
            </div>
            <div className={styles.colVerification} data-label="Vérification">
              <StatusBadge
                status={item.verificationStatus}
                label={
                  item.verificationStatus === "VERIFIE"
                    ? "Vérifié"
                    : undefined
                }
              />
            </div>
            <div className={styles.colActions}>
              <Link
                href={routes.materialSupplier(item.id)}
                className={styles.view}
                aria-label={`Voir ${item.name}`}
              >
                Voir
              </Link>
              <Link
                href={routes.materialSupplierEdit(item.id)}
                className={styles.view}
                aria-label={`Modifier ${item.name}`}
              >
                Modifier
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
