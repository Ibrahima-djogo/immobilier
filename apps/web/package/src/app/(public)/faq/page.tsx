"use client";

import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  LifeBuoy,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import { faqItems } from "@/lib/public/demo-data";
import styles from "./page.module.css";

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const filtered = useMemo(
    () =>
      faqItems.filter((item) =>
        `${item.q} ${item.a}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <InstitutionalShell active="aide">
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Questions fréquentes</span>
          <h1>Comment pouvons-nous vous aider ?</h1>
          <p>Recherchez une réponse sur les comptes, les rôles, les annonces et la sécurité.</p>
          <div className={styles.search}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans la FAQ..." />
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.list}>
            {filtered.map((item, index) => {
              const isOpen = open === index;
              return (
                <article key={item.q} className={styles.card}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen}>
                    <span>{item.q}</span>
                    <ChevronDown className={isOpen ? styles.rotate : ""} size={20} />
                  </button>
                  {isOpen && <p>{item.a}</p>}
                </article>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className={styles.empty}>
              <CircleHelp size={39} />
              <h2>Aucune réponse trouvée</h2>
              <p>Essayez une formulation plus courte ou contactez l’assistance.</p>
            </div>
          )}

          <div className={styles.support}>
            <LifeBuoy size={27} />
            <div><strong>Besoin d’une réponse personnalisée ?</strong><p>Décrivez votre difficulté au service d’assistance.</p></div>
            <Link href="/contact">Nous contacter</Link>
          </div>
        </div>
      </section>
    </InstitutionalShell>
  );
}
