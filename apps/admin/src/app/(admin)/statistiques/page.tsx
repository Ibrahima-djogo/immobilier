"use client";

import { BarChart3, ClipboardCheck, Eye, Flag, Users } from "lucide-react";
import { useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { ChartCard, DonutChart, LineChart } from "@/components/charts";
import {
  adminAds,
  adminUsers,
  reports,
  roleRequests,
} from "@/lib/administration/demo-data";
import { adminUsersTrend } from "@/lib/demo-charts";
import styles from "./page.module.css";

export default function AdminStatisticsPage() {
  const [period, setPeriod] = useState("30j");

  const roleSlices = [
    {
      label: "Utilisateurs",
      value: adminUsers.filter((u) => u.role === "UTILISATEUR").length,
      color: "#0f3d2e",
    },
    {
      label: "Propriétaires",
      value: adminUsers.filter((u) => u.role === "PROPRIETAIRE").length,
      color: "#285c45",
    },
    {
      label: "Agences",
      value: adminUsers.filter((u) => u.role === "AGENCE").length,
      color: "#d5aa35",
    },
  ];

  return (
    <AdminShell
      active="statistiques"
      eyebrow="Vision globale"
      title="Statistiques de la plateforme"
      description="Suivez les utilisateurs, demandes, annonces, publications et signalements."
      icon={BarChart3}
      badge={`Période ${period}`}
      badgeTone="info"
    >
      <div className={styles.periods} role="group" aria-label="Période">
        {["7j", "30j", "90j", "12 mois"].map((p) => (
          <button
            key={p}
            type="button"
            className={period === p ? styles.active : ""}
            aria-pressed={period === p}
            title={`Afficher la période ${p} (données démo inchangées)`}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <p className={styles.periodNote}>
        Période sélectionnée : <strong>{period}</strong> — les séries affichées
        restent des données de démonstration (non recalculées).
      </p>
      <section className={styles.stats}>
        <article className={styles.card}>
          <Users size={21} />
          <div>
            <small>Utilisateurs</small>
            <strong>{adminUsers.length}</strong>
          </div>
        </article>
        <article className={styles.card}>
          <ClipboardCheck size={21} />
          <div>
            <small>Demandes de rôle</small>
            <strong>{roleRequests.length}</strong>
          </div>
        </article>
        <article className={styles.card}>
          <Eye size={21} />
          <div>
            <small>Annonces</small>
            <strong>{adminAds.length}</strong>
          </div>
        </article>
        <article className={styles.card}>
          <Flag size={21} />
          <div>
            <small>Signalements</small>
            <strong>{reports.length}</strong>
          </div>
        </article>
      </section>

      <div className={styles.chartsGrid}>
        <ChartCard
          title="Évolution des utilisateurs"
          value="8 500+"
          delta="+12,5 %"
          description={`Période : ${period}`}
        >
          <LineChart data={adminUsersTrend} format="locale" />
        </ChartCard>
        <ChartCard
          title="Répartition des comptes"
          description="Par rôle principal."
        >
          <DonutChart
            data={roleSlices}
            centerLabel="comptes"
            centerValue={adminUsers.length}
          />
        </ChartCard>
      </div>

      <section className={`${styles.card} ${styles.events}`}>
        <div className={styles.sectionTitle}>
          <div>
            <h2>Événements à mesurer</h2>
            <p>Plan analytique à connecter.</p>
          </div>
          <BarChart3 size={20} />
        </div>
        <div>
          {[
            "Recherches lancées",
            "Annonces consultées",
            "Favoris ajoutés",
            "Contacts initiés",
            "Demandes de rôle soumises",
            "Annonces publiées ou rejetées",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
