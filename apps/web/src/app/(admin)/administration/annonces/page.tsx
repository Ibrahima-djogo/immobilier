"use client";

import Link from "next/link";
import { ArrowRight, Eye, Flag, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AdminShell from "@/components/administration/AdminShell";
import { adminAds } from "@/lib/administration/demo-data";
import { formatStatusLabel } from "@/lib/ui/status";
import styles from "./page.module.css";

export default function AdminAdsPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const [risk, setRisk] = useState("TOUS");

  const filtered = useMemo(
    () =>
      adminAds.filter((a) => {
        const textMatch = `${a.title} ${a.owner} ${a.type}`
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase());
        const statusMatch = status === "TOUS" || a.status === status;
        const riskMatch =
          risk === "TOUS" ||
          (risk === "ELEVE"
            ? a.risk >= 60
            : risk === "MOYEN"
              ? a.risk >= 30 && a.risk < 60
              : a.risk < 30);
        return textMatch && statusMatch && riskMatch;
      }),
    [debouncedQuery, status, risk],
  );

  const hasFilters =
    Boolean(query.trim()) || status !== "TOUS" || risk !== "TOUS";

  function resetFilters() {
    setQuery("");
    setStatus("TOUS");
    setRisk("TOUS");
  }

  return (
    <AdminShell
      active="annonces"
      eyebrow="Contrôle des publications"
      title="Gestion des annonces"
      description="Recherchez, filtrez et contrôlez toutes les annonces de la plateforme."
    >
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
          <option value="REJETEE">Rejetées</option>
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
        {hasFilters && (
          <button type="button" className={styles.reset} onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
      </section>

      <p className={styles.resultCount}>
        <strong>{filtered.length}</strong> annonce(s) affichée(s)
      </p>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <h2>Aucune annonce trouvée</h2>
          <p>Aucun résultat ne correspond à vos critères.</p>
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
            <span>Risque</span>
            <span>Performance</span>
            <span>Signalements</span>
            <span>Soumission</span>
            <span />
          </div>
          {filtered.map((a) => (
            <article key={a.id}>
              <div>
                <strong>{a.title}</strong>
                <small>
                  {a.owner} · {a.type}
                </small>
              </div>
              <b className={styles[a.status.toLowerCase()]}>
                {formatStatusLabel(a.status)}
              </b>
              <div className={styles.risk}>
                <span>
                  <i style={{ width: `${a.risk}%` }} />
                </span>
                <small>{a.risk}/100</small>
              </div>
              <span className={styles.views}>
                <Eye size={14} aria-hidden="true" />
                {a.views} vues
              </span>
              <span className={styles.reports}>
                <Flag size={14} aria-hidden="true" />
                {a.reports}
              </span>
              <small>{a.submittedAt}</small>
              <Link href={`/administration/annonces/${a.id}`}>
                Contrôler
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
