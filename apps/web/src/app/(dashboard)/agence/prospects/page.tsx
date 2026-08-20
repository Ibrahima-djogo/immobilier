"use client";

import { Mail, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AgencyShell from "@/components/agence/AgencyShell";
import { RowAction, StatusBadge } from "@/components/ui";
import { agencyProspects } from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyProspectsPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");

  const filtered = useMemo(
    () =>
      agencyProspects.filter(
        (p) =>
          `${p.name} ${p.propertyTitle} ${p.subject} ${p.email} ${p.phone}`
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) &&
          (status === "TOUS" || p.status === status),
      ),
    [debouncedQuery, status],
  );

  const hasFilters = Boolean(query.trim()) || status !== "TOUS";

  function resetFilters() {
    setQuery("");
    setStatus("TOUS");
  }

  return (
    <AgencyShell
      active="prospects"
      eyebrow="Suivi commercial élémentaire"
      title="Prospects de l’agence"
      description="Consultez et qualifiez les demandes reçues pour le portefeuille."
    >
      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, téléphone, e-mail ou bien..."
            aria-label="Rechercher un prospect"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="NOUVEAU">Nouveaux</option>
          <option value="EN_COURS">En cours</option>
          <option value="QUALIFIE">Qualifiés</option>
          <option value="CLOTURE">Clôturés</option>
        </select>
        {hasFilters && (
          <button type="button" className={styles.reset} onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
      </section>

      <p className={styles.resultCount}>
        <strong>{filtered.length}</strong> prospect(s) affiché(s)
      </p>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <h2>Aucun prospect trouvé</h2>
          <p>Aucun résultat ne correspond à cette recherche.</p>
          {hasFilters && (
            <button type="button" className={styles.reset} onClick={resetFilters}>
              Réinitialiser les filtres
            </button>
          )}
        </section>
      ) : (
        <section className={`${styles.card} ${styles.list}`}>
          {filtered.map((p) => (
            <article key={p.id}>
              <span className={styles.avatar}>
                {p.name
                  .split(" ")
                  .map((v) => v[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <strong>{p.name}</strong>
                <small>
                  {p.subject} · {p.propertyTitle}
                </small>
                <p>{p.message}</p>
                <span>
                  {p.createdAt} · {p.source}
                </span>
              </div>
              <div className={styles.contact}>
                <span>
                  <Mail size={14} aria-hidden="true" />
                  {p.email}
                </span>
                <span>
                  <Phone size={14} aria-hidden="true" />
                  {p.phone}
                </span>
              </div>
              <StatusBadge status={p.status} />
              <RowAction
                label="Ouvrir"
                href={`/agence/prospects/${p.id}`}
                ariaLabel={`Ouvrir le prospect ${p.name}`}
              />
            </article>
          ))}
        </section>
      )}
    </AgencyShell>
  );
}
