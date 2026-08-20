"use client";

import { Eye, Heart, MessageSquareText, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartCard, DonutChart, LineChart } from "@/components/charts";
import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { ownerContactsTrend, ownerViews30d } from "@/lib/demo-charts";
import { useOwnerStorage } from "@/hooks/useOwnerStorage";
import styles from "./page.module.css";

export default function OwnerStatisticsPage() {
  const { ads } = useOwnerStorage();
  const [period, setPeriod] = useState("30j");
  const totals = useMemo(
    () => ({
      views: ads.reduce((s, a) => s + a.views, 0),
      favorites: ads.reduce((s, a) => s + a.favorites, 0),
      contacts: ads.reduce((s, a) => s + a.contacts, 0),
    }),
    [ads],
  );
  const ranking = useMemo(
    () => [...ads].sort((a, b) => b.views - a.views),
    [ads],
  );

  const statusSlices = useMemo(() => {
    const counts = {
      PUBLIEE: 0,
      EN_ATTENTE: 0,
      BROUILLON: 0,
      REJETEE: 0,
    };
    for (const ad of ads) {
      if (ad.status in counts) {
        counts[ad.status as keyof typeof counts] += 1;
      }
    }
    return [
      { label: "Publiées", value: counts.PUBLIEE, color: "#0f3d2e" },
      { label: "En attente", value: counts.EN_ATTENTE, color: "#285c45" },
      { label: "Brouillons", value: counts.BROUILLON, color: "#4f755e" },
      { label: "Rejetées", value: counts.REJETEE, color: "#d5aa35" },
    ].filter((s) => s.value > 0);
  }, [ads]);

  return (
    <>
      <OwnerPageHeader
        eyebrow="Analyse du portefeuille"
        title="Statistiques"
        description="Analysez uniquement les performances de vos propres annonces."
      />
      <div className={styles.periods}>
        {["7j", "30j", "90j", "12 mois"].map((p) => (
          <button
            key={p}
            type="button"
            className={period === p ? styles.active : ""}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <section className={styles.stats}>
        <article className={styles.card}>
          <Eye size={21} />
          <div>
            <small>Vues</small>
            <strong>{totals.views}</strong>
          </div>
        </article>
        <article className={styles.card}>
          <Heart size={21} />
          <div>
            <small>Favoris</small>
            <strong>{totals.favorites}</strong>
          </div>
        </article>
        <article className={styles.card}>
          <MessageSquareText size={21} />
          <div>
            <small>Contacts</small>
            <strong>{totals.contacts}</strong>
          </div>
        </article>
        <article className={styles.card}>
          <TrendingUp size={21} />
          <div>
            <small>Taux de contact</small>
            <strong>
              {totals.views
                ? `${((totals.contacts / totals.views) * 100).toFixed(1)} %`
                : "0 %"}
            </strong>
          </div>
        </article>
      </section>

      <div className={styles.chartsGrid}>
        <ChartCard
          title="Évolution des vues"
          value={totals.views.toLocaleString("fr-FR")}
          delta="+14,2 %"
          description={`Période sélectionnée : ${period}`}
        >
          <LineChart data={ownerViews30d} format="raw" />
        </ChartCard>

        <ChartCard
          title="Contacts reçus"
          value={totals.contacts}
          delta="+8 %"
          description="Volume hebdomadaire des demandes."
        >
          <LineChart data={ownerContactsTrend} />
        </ChartCard>
      </div>

      <div className={styles.grid}>
        <ChartCard
          title="Annonces par statut"
          description="Répartition de votre portefeuille publié."
        >
          <DonutChart
            data={
              statusSlices.length
                ? statusSlices
                : [{ label: "Aucune", value: 1, color: "#4f755e" }]
            }
            centerLabel="annonces"
            centerValue={ads.length}
          />
        </ChartCard>

        <section className={`${styles.card} ${styles.ranking}`}>
          <div className={styles.sectionTitle}>
            <div>
              <h2>Annonces les plus vues</h2>
              <p>Classement basé sur vos données locales.</p>
            </div>
          </div>
          {ranking.map((a, i) => (
            <article key={a.id}>
              <span>{i + 1}</span>
              <div>
                <strong>{a.title}</strong>
                <small>
                  {a.views} vues · {a.contacts} contacts
                </small>
              </div>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
