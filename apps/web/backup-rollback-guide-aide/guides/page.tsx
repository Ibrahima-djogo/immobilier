"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Clock3,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import { guideItems } from "@/lib/public/demo-data";
import styles from "./page.module.css";

export default function GuidesPage() {
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState("TOUS");

  const profiles = ["TOUS", ...Array.from(new Set(guideItems.map((guide) => guide.profile)))];
  const filtered = useMemo(
    () =>
      guideItems.filter(
        (guide) =>
          `${guide.title} ${guide.summary}`.toLowerCase().includes(query.toLowerCase()) &&
          (profile === "TOUS" || guide.profile === profile),
      ),
    [profile, query],
  );

  return (
    <InstitutionalShell active="aide">
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Documentation utilisateur</span>
          <h1>Guides pratiques par parcours</h1>
          <p>Découvrez les étapes essentielles selon votre profil et votre objectif.</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <section className={`${styles.card} ${styles.filters}`}>
            <div>
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un guide..." />
            </div>
            <div className={styles.tabs}>
              {profiles.map((item) => (
                <button key={item} className={profile === item ? styles.active : ""} onClick={() => setProfile(item)}>
                  {item === "TOUS" ? "Tous" : item}
                </button>
              ))}
            </div>
          </section>

          <div className={styles.grid}>
            {filtered.map((guide, index) => (
              <article key={guide.slug} className={styles.card}>
                <div className={styles.top}>
                  <span><BookOpenText size={23} /></span>
                  <small>Guide {String(index + 1).padStart(2, "0")}</small>
                </div>
                <span className={styles.profile}>{guide.profile}</span>
                <h2>{guide.title}</h2>
                <p>{guide.summary}</p>
                <div className={styles.footer}>
                  <span><Clock3 size={14} />{guide.duration}</span>
                  <Link href={`/guides/${guide.slug}`}>Lire <ArrowRight size={14} /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </InstitutionalShell>
  );
}
