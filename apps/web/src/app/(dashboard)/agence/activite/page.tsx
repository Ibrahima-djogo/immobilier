"use client";

import {
  Activity,
  Building2,
  FileText,
  MessageSquareText,
  Search,
  Store,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AgencyShell from "@/components/agence/AgencyShell";
import { agencyActivity } from "@/lib/agence/demo-data";
import styles from "./page.module.css";

function iconFor(action: string) {
  if (action.includes("Annonce")) return FileText;
  if (action.includes("Prospect")) return MessageSquareText;
  if (action.includes("Profil")) return Store;
  if (action.includes("Bien")) return Building2;
  return Activity;
}

export default function AgencyActivityPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const filtered = useMemo(
    () =>
      agencyActivity.filter((i) =>
        `${i.action} ${i.target} ${i.actor}`
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase()),
      ),
    [debouncedQuery],
  );

  return (
    <AgencyShell
      active="activite"
      eyebrow="Traçabilité limitée"
      title="Activité récente"
      description="Consultez les principales actions du périmètre de l’agence."
    >
      <section className={`${styles.card} ${styles.search}`}>
        <Search size={17} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une action..."
          aria-label="Rechercher dans l’activité"
        />
      </section>

      <p className={styles.resultCount}>
        <strong>{filtered.length}</strong> action(s) affichée(s)
      </p>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <h2>Aucune activité trouvée</h2>
          <p>Modifiez les termes de recherche.</p>
          {query.trim() && (
            <button type="button" onClick={() => setQuery("")}>
              Réinitialiser la recherche
            </button>
          )}
        </section>
      ) : (
        <section className={`${styles.card} ${styles.timeline}`}>
          {filtered.map((item) => {
            const Icon = iconFor(item.action);
            return (
              <article key={item.id}>
                <span>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>{item.action}</strong>
                  <p>{item.target}</p>
                  <small>
                    {item.actor} · {item.date}
                  </small>
                </div>
              </article>
            );
          })}
        </section>
      )}
      <p className={styles.notice}>
        Cette vue est limitée au périmètre de l’agence. Le journal global reste
        réservé à l’administration.
      </p>
    </AgencyShell>
  );
}
