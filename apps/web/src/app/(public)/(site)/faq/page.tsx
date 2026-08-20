"use client";

import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  LifeBuoy,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHero } from "@/components/layout/PageHero";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { faqItems } from "@/lib/public/demo-data";
import styles from "./page.module.css";

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [open, setOpen] = useState<number | null>(0);

  const filtered = useMemo(
    () =>
      faqItems.filter((item) =>
        `${item.q} ${item.a}`
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase()),
      ),
    [debouncedQuery],
  );

  return (
    <main>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <PageHero
            variant="public"
            eyebrow="Questions fréquentes"
            title="Comment pouvons-nous vous aider ?"
            description="Recherchez une réponse sur les comptes, les rôles, les annonces et la sécurité."
            icon={<CircleHelp size={16} aria-hidden="true" />}
          >
            <div className={styles.search}>
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher dans la FAQ..."
                aria-label="Rechercher dans la FAQ"
              />
            </div>
          </PageHero>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.list}>
            {filtered.map((item, index) => {
              const isOpen = open === index;
              return (
                <article key={item.q} className={styles.card}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className={isOpen ? styles.rotate : undefined}
                    />
                  </button>
                  {isOpen ? <p>{item.a}</p> : null}
                </article>
              );
            })}
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <h2>Aucun résultat</h2>
                <p>Essayez un autre mot-clé.</p>
              </div>
            ) : null}
          </div>

          <div className={styles.support}>
            <LifeBuoy size={22} aria-hidden="true" />
            <div>
              <strong>Besoin d’assistance ?</strong>
              <p>Notre équipe peut vous orienter si la FAQ ne suffit pas.</p>
            </div>
            <Link href="/contact">Nous contacter</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
