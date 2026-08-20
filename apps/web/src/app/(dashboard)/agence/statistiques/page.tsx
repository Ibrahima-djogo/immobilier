"use client";

import { Eye, Heart, MessageSquareText, TrendingUp } from "lucide-react";
import { useState } from "react";

import AgencyShell from "@/components/agence/AgencyShell";
import { ChartCard, DonutChart, LineChart } from "@/components/charts";
import { agencyAds, agencyProspects } from "@/lib/agence/demo-data";
import {
  agencyAdsTrend,
  agencyDemandTrend,
} from "@/lib/demo-charts";
import styles from "./page.module.css";

export default function AgencyStatisticsPage() {
  const [period, setPeriod] = useState("30j");
  const totals = {
    views: agencyAds.reduce((s, a) => s + a.views, 0),
    favorites: agencyAds.reduce((s, a) => s + a.favorites, 0),
    contacts: agencyAds.reduce((s, a) => s + a.contacts, 0),
  };

  const statusSlices = [
    {
      label: "Nouveau",
      value: agencyProspects.filter((p) => p.status === "NOUVEAU").length,
      color: "#0f3d2e",
    },
    {
      label: "En suivi",
      value: agencyProspects.filter(
        (p) => p.status === "EN_COURS" || p.status === "QUALIFIE",
      ).length,
      color: "#285c45",
    },
    {
      label: "Converti",
      value: agencyProspects.filter((p) => p.status === "CLOTURE").length,
      color: "#d5aa35",
    },
  ];

  const conversion =
    agencyProspects.length === 0
      ? "0 %"
      : `${(
          (agencyProspects.filter((p) => p.status === "CLOTURE").length /
            agencyProspects.length) *
          100
        ).toFixed(0)} %`;

  return (
    <AgencyShell
      active="statistiques"
      eyebrow="Analyse professionnelle"
      title="Statistiques de l’agence"
      description="Analysez les performances du portefeuille de l’agence."
    >
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
            <small>Prospects</small>
            <strong>{totals.contacts}</strong>
          </div>
        </article>
        <article className={styles.card}>
          <TrendingUp size={21} />
          <div>
            <small>Conversion</small>
            <strong>{conversion}</strong>
          </div>
        </article>
      </section>

      <div className={styles.chartsGrid}>
        <ChartCard
          title="Évolution des demandes"
          description={`Période : ${period}`}
          value={agencyDemandTrend.at(-1)?.value}
          delta="+12 %"
        >
          <LineChart data={agencyDemandTrend} />
        </ChartCard>
        <ChartCard
          title="Évolution des annonces"
          description="Volume d’annonces actives sur 6 mois."
        >
          <LineChart data={agencyAdsTrend} />
        </ChartCard>
      </div>

      <div className={styles.grid}>
        <ChartCard
          title="Prospects → conversion"
          description="Pipeline commercial du portefeuille."
        >
          <DonutChart
            data={statusSlices}
            centerLabel="prospects"
            centerValue={agencyProspects.length}
          />
        </ChartCard>
        <section className={`${styles.card} ${styles.ranking}`}>
          <div className={styles.sectionTitle}>
            <div>
              <h2>Annonces performantes</h2>
              <p>Classement du portefeuille.</p>
            </div>
          </div>
          {[...agencyAds]
            .sort((a, b) => b.views - a.views)
            .map((a, i) => (
              <article key={a.id}>
                <span>{i + 1}</span>
                <div>
                  <strong>{a.title}</strong>
                  <small>
                    {a.views} vues · {a.contacts} prospects
                  </small>
                </div>
              </article>
            ))}
        </section>
      </div>
    </AgencyShell>
  );
}
