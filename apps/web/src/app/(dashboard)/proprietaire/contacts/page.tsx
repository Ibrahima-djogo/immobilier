"use client";

import { Mail, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { RowAction, StatusBadge } from "@/components/ui";
import { useOwnerStorage } from "@/hooks/useOwnerStorage";
import styles from "./page.module.css";

export default function OwnerContactsPage() {
  const { contacts } = useOwnerStorage();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) =>
          `${c.name} ${c.propertyTitle} ${c.subject}`
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) &&
          (status === "TOUS" || c.status === status),
      ),
    [contacts, debouncedQuery, status],
  );

  const hasFilters = Boolean(query.trim()) || status !== "TOUS";

  function resetFilters() {
    setQuery("");
    setStatus("TOUS");
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Prospects et demandes"
        title="Contacts reçus"
        description="Consultez et suivez les demandes liées à vos annonces."
      />
      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, bien ou sujet..."
            aria-label="Rechercher un contact"
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
          <option value="TRAITE">Traités</option>
          <option value="ARCHIVE">Archivés</option>
        </select>
        {hasFilters && (
          <button type="button" onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
      </section>

      <p className={styles.resultCount}>
        <strong>{filtered.length}</strong> contact(s) affiché(s)
      </p>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <h2>Aucun contact trouvé</h2>
          <p>Aucun message ne correspond à vos critères.</p>
          {hasFilters && (
            <button type="button" onClick={resetFilters}>
              Réinitialiser les filtres
            </button>
          )}
        </section>
      ) : (
        <section className={`${styles.card} ${styles.list}`}>
          {filtered.map((c) => (
            <article key={c.id}>
              <span className={styles.avatar}>
                {c.name
                  .split(" ")
                  .map((v) => v[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <strong>{c.name}</strong>
                <small>
                  {c.subject} · {c.propertyTitle}
                </small>
                <p>{c.message}</p>
                <span>{c.createdAt}</span>
              </div>
              <div className={styles.contact}>
                <span>
                  <Mail size={14} aria-hidden="true" />
                  {c.email}
                </span>
                <span>
                  <Phone size={14} aria-hidden="true" />
                  {c.phone}
                </span>
              </div>
              <StatusBadge status={c.status} />
              <RowAction
                label="Ouvrir"
                href={`/proprietaire/contacts/${c.id}`}
                ariaLabel={`Ouvrir la demande de ${c.name}`}
              />
            </article>
          ))}
        </section>
      )}
    </>
  );
}
