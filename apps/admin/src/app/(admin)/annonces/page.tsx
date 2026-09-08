"use client";

import Link from "next/link";
import { ArrowRight, Eye, FileText, Flag, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDemoListings } from "@/hooks/useDemoListings";
import AdminShell from "@/components/administration/AdminShell";
import { Button, EmptyState, StatusBadge } from "@/components/ui";
import { canWriteListings } from "@/lib/administration/admin-accounts";
import { useAdminSession } from "@/lib/auth/admin-session";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

export default function AdminAdsPage() {
  const { admin } = useAdminSession();
  const { items: ads, loading, error } = useDemoListings({}, { poll: true });
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const [risk, setRisk] = useState("TOUS");

  const filtered = useMemo(
    () =>
      ads.filter((a) => {
        const textMatch = `${a.title} ${a.owner} ${a.type} ${a.reference}`
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase());
        const statusMatch = status === "TOUS" || a.status === status;
        const riskValue = a.risk ?? 0;
        const riskMatch =
          risk === "TOUS" ||
          (risk === "ELEVE"
            ? riskValue >= 60
            : risk === "MOYEN"
              ? riskValue >= 30 && riskValue < 60
              : riskValue < 30);
        return textMatch && statusMatch && riskMatch;
      }),
    [ads, debouncedQuery, status, risk],
  );

  const hasFilters =
    Boolean(query.trim()) || status !== "TOUS" || risk !== "TOUS";

  function resetFilters() {
    setQuery("");
    setStatus("TOUS");
    setRisk("TOUS");
  }

  const canCreate = admin ? canWriteListings(admin) : false;

  return (
    <AdminShell
      active="annonces"
      eyebrow="Modération"
      title="Annonces"
      description="Gérez et contrôlez les publications soumises à Demeure Guinée."
      note="Annonces synchronisées."
      icon={FileText}
      stats={[
        { label: "Annonces", value: ads.length },
        { label: "Résultats filtrés", value: filtered.length, tone: "info" },
      ]}
      actions={
        canCreate ? (
          <Button href={routes.adNew}>
            <Plus size={15} aria-hidden="true" />
            Créer une annonce
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <p className={styles.errorBanner} role="alert">
          {error}
        </p>
      ) : null}

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, annonceur ou catégorie..."
            aria-label="Rechercher une annonce"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="BROUILLON">Brouillons</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PUBLIEE">Publiées</option>
          <option value="REFUSEE">Refusées</option>
          <option value="A_CORRIGER">À corriger</option>
          <option value="SUSPENDUE">Suspendues</option>
        </select>
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          aria-label="Filtrer par risque"
        >
          <option value="TOUS">Tous les risques</option>
          <option value="FAIBLE">Faible</option>
          <option value="MOYEN">Moyen</option>
          <option value="ELEVE">Élevé</option>
        </select>
        {hasFilters ? (
          <button type="button" className={styles.reset} onClick={resetFilters}>
            Réinitialiser
          </button>
        ) : null}
      </section>

      <p className={styles.resultCount}>
        <strong>{loading ? "…" : filtered.length}</strong> annonce(s) affichée(s)
      </p>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <EmptyState
            title="Aucune annonce"
            description="Soumettez une annonce depuis immobilier (localhost:3000)."
          />
        </section>
      ) : (
        <section className={`${styles.card} ${styles.table} ${styles.tableAds}`}>
          <div className={styles.tableHead}>
            <span>Annonce</span>
            <span>Annonceur</span>
            <span>Statut</span>
            <span>Risque</span>
            <span className={styles.actionsCell}>Actions</span>
          </div>
          {filtered.map((ad) => {
            const riskValue = ad.risk ?? 0;
            return (
              <article key={ad.id} className={styles.tableRow}>
                <div className={styles.identityCell}>
                  <span className={styles.identityTitle}>{ad.title}</span>
                  <span className={styles.identityReference}>
                    {ad.reference}
                  </span>
                </div>
                <div className={styles.advertiserCell}>
                  <span className={styles.advertiserName}>{ad.owner}</span>
                  <span className={styles.advertiserMeta}>
                    {ad.advertiserType === "AGENCE"
                      ? "Agence"
                      : "Propriétaire"}
                  </span>
                </div>
                <div className={styles.statusCell}>
                  <StatusBadge status={ad.status} />
                </div>
                <div
                  className={styles.riskCell}
                  title={`Score de risque : ${riskValue}`}
                >
                  <Flag size={14} aria-hidden="true" />
                  <span>{riskValue}</span>
                </div>
                <div className={styles.actionsCell}>
                  <Link
                    href={routes.ad(ad.id)}
                    className={styles.actionLink}
                    aria-label={`Contrôler l’annonce ${ad.reference}`}
                  >
                    <Eye size={14} aria-hidden="true" />
                    Contrôler
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AdminShell>
  );
}
