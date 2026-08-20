"use client";

import Link from "next/link";
import { ArrowRight, Flag, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { reports } from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function ReportsPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const [risk, setRisk] = useState("TOUS");

  const filtered = useMemo(
    () =>
      reports.filter(
        (r) =>
          `${r.reference} ${r.target} ${r.reason}`
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) &&
          (status === "TOUS" || r.status === status) &&
          (risk === "TOUS" || r.risk === risk),
      ),
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
      active="signalements"
      eyebrow="Protection et confiance"
      title="Signalements"
      description="Qualifiez les signalements sans exposer l’identité du déclarant."
      icon={Flag}
      stats={[
        { label: "Signalements", value: reports.length },
        { label: "Résultats filtrés", value: filtered.length, tone: "info" },
      ]}
    >
      <section className={styles.privacy}>
        <ShieldCheck size={19} aria-hidden="true" />
        <p>
          L’identité du déclarant reste protégée et ne doit pas être communiquée
          au propriétaire ou à l’agence.
        </p>
      </section>

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Référence, annonce ou motif..."
            aria-label="Rechercher un signalement"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="NOUVEAU">Nouveaux</option>
          <option value="EN_ANALYSE">En analyse</option>
          <option value="ACTION_PRISE">Action prise</option>
          <option value="REJETE">Rejetés</option>
          <option value="CLOTURE">Clôturés</option>
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
        <strong>{filtered.length}</strong> signalement(s) affiché(s)
      </p>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <EmptyState
            title="Aucun signalement trouvé"
            description="Aucun dossier ne correspond à vos critères."
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={styles.reset}
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        </section>
      ) : (
        <section className={`${styles.card} ${styles.table}`}>
          <div className={styles.head}>
            <span>Dossier</span>
            <span>Motif</span>
            <span>Statut</span>
            <span>Risque</span>
            <span className={styles.colCount}>Occurrences</span>
            <span className={styles.colDate}>Date</span>
            <span className={styles.colActions}>Actions</span>
          </div>
          {filtered.map((r) => (
            <article key={r.id} className={styles.row}>
              <div className={styles.primary}>
                <span>
                  <Flag size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>{r.reference}</strong>
                  <small>{r.target}</small>
                  <small className={styles.metaStacked}>
                    {r.count} occurrence(s) · {r.createdAt}
                  </small>
                </div>
              </div>
              <span className={styles.colReason}>{r.reason}</span>
              <div className={styles.colStatus}>
                <StatusBadge status={r.status} />
              </div>
              <i
                className={`${styles.colRisk} ${styles[r.risk.toLowerCase()]}`}
              >
                {r.risk}
              </i>
              <small className={styles.colCount}>{r.count}</small>
              <small className={styles.colDate}>{r.createdAt}</small>
              <Link
                href={`/signalements/${r.id}`}
                className={styles.actionLink}
                aria-label={`Traiter le signalement ${r.reference}`}
              >
                Traiter
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
