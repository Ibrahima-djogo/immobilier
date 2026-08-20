"use client";

import { Download, FileSearch, Search, ShieldCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AdminShell from "@/components/administration/AdminShell";
import { DemoToast, EmptyState, StatusBadge } from "@/components/ui";
import { auditLogs } from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AuditPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [result, setResult] = useState("TOUS");
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const filtered = useMemo(
    () =>
      auditLogs.filter(
        (l) =>
          `${l.actor} ${l.action} ${l.target} ${l.ip}`
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) &&
          (result === "TOUS" || l.result === result),
      ),
    [debouncedQuery, result],
  );

  const hasFilters = Boolean(query.trim()) || result !== "TOUS";

  function resetFilters() {
    setQuery("");
    setResult("TOUS");
  }

  return (
    <AdminShell
      active="audit"
      eyebrow="Traçabilité et sécurité"
      title="Journal d’activité"
      description="Filtrez les actions par auteur, action, cible et résultat."
      icon={FileSearch}
      stats={[
        { label: "Entrées", value: auditLogs.length },
        { label: "Résultats filtrés", value: filtered.length, tone: "info" },
      ]}
      actions={
        <button
          type="button"
          className={styles.export}
          onClick={() =>
            setToast(
              "Action simulée dans la démonstration frontend. L’export sera disponible avec le backend.",
            )
          }
        >
          <Download size={16} aria-hidden="true" />
          Exporter
        </button>
      }
    >
      <section className={styles.notice}>
        <ShieldCheck size={19} aria-hidden="true" />
        <p>
          Les entrées d’audit critiques doivent être immuables et accessibles
          uniquement selon les permissions.
        </p>
      </section>

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Auteur, action, cible ou IP..."
            aria-label="Rechercher dans le journal"
          />
        </div>
        <select
          value={result}
          onChange={(e) => setResult(e.target.value)}
          aria-label="Filtrer par résultat"
        >
          <option value="TOUS">Tous les résultats</option>
          <option value="SUCCES">Succès</option>
          <option value="AUTORISE">Autorisé</option>
          <option value="ECHEC">Échec</option>
        </select>
        {hasFilters && (
          <button type="button" className={styles.reset} onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
      </section>

      <p className={styles.resultCount}>
        <strong>{filtered.length}</strong> entrée(s) affichée(s)
      </p>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <EmptyState
            title="Aucune entrée trouvée"
            description="Aucune action ne correspond à vos critères."
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
            <span>Auteur</span>
            <span>Action</span>
            <span>Cible</span>
            <span>Résultat</span>
            <span>Date</span>
            <span className={styles.colIp}>Adresse IP</span>
          </div>
          {filtered.map((l) => (
            <article key={l.id} className={styles.row}>
              <div className={styles.primary}>
                <span>
                  <FileSearch size={17} aria-hidden="true" />
                </span>
                <strong>{l.actor}</strong>
              </div>
              <code className={styles.colAction}>{l.action}</code>
              <span className={styles.colTarget}>{l.target}</span>
              <div className={styles.colStatus}>
                <StatusBadge status={l.result} />
              </div>
              <small className={styles.colDate}>{l.date}</small>
              <code className={styles.colIp}>{l.ip}</code>
            </article>
          ))}
        </section>
      )}
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AdminShell>
  );
}
