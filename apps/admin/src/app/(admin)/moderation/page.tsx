"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Flag,
  ListChecks,
  ShieldAlert,
} from "lucide-react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState } from "@/components/ui";
import { useDemoListings } from "@/hooks/useDemoListings";
import { reports, roleRequests } from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function ModerationQueuePage() {
  const { items: ads, loading, error } = useDemoListings({}, { poll: true });

  const queue = [
    ...ads
      .filter(
        (a) =>
          a.status === "EN_ATTENTE" ||
          a.status === "SUSPENDUE" ||
          a.status === "A_CORRIGER",
      )
      .map((a) => ({
        id: a.id,
        type: "ANNONCE" as const,
        title: a.title,
        subtitle: a.owner,
        risk: a.risk ?? 20,
        age: a.submittedAt
          ? new Date(a.submittedAt).toLocaleString("fr-FR")
          : "Non renseigné",
        href: `/annonces/${a.id}`,
      })),
    ...reports
      .filter((r) => r.status === "NOUVEAU" || r.status === "EN_ANALYSE")
      .map((r) => ({
        id: r.id,
        type: "SIGNALEMENT" as const,
        title: r.target,
        subtitle: r.reason,
        risk: r.risk === "ELEVE" ? 90 : r.risk === "MOYEN" ? 55 : 20,
        age: r.createdAt,
        href: `/signalements/${r.id}`,
      })),
    ...roleRequests
      .filter((r) => r.status === "SOUMISE" || r.status === "EN_EXAMEN")
      .map((r) => ({
        id: r.id,
        type: "IDENTITE" as const,
        title: r.name,
        subtitle: r.requestedRole,
        risk: r.risk === "ELEVE" ? 85 : r.risk === "MOYEN" ? 50 : 15,
        age: r.submittedAt,
        href: `/demandes-role/${r.id}`,
      })),
  ].sort((a, b) => b.risk - a.risk);

  return (
    <AdminShell
      active="moderation"
      eyebrow="File centralisée"
      title="File de modération"
      description="Traitez en priorité les éléments les plus risqués soumis à Demeure Guinée."
      note="Annonces issues de la Demo API partagée, signalements et demandes de rôle."
      icon={ListChecks}
      stats={[
        { label: "En file", value: queue.length, icon: Clock3 },
        {
          label: "Risque élevé",
          value: queue.filter((entry) => entry.risk >= 70).length,
          tone: "danger",
          icon: AlertTriangle,
        },
      ]}
    >
      {error ? (
        <p role="alert" style={{ color: "#9d6b10", marginBottom: 12 }}>
          {error} — lancez `npm start` dans immo-demo-api.
        </p>
      ) : null}

      <section className={styles.legend}>
        <span>
          <i className={styles.high} />
          Risque élevé
        </span>
        <span>
          <i className={styles.medium} />
          Risque moyen
        </span>
        <span>
          <i className={styles.low} />
          Risque faible
        </span>
      </section>

      {!loading && queue.length === 0 ? (
        <EmptyState
          title="Aucun dossier en file"
          description="Les annonces, signalements et demandes prioritaires apparaîtront ici."
        />
      ) : (
        <section className={`${styles.card} ${styles.queue}`}>
          {queue.map((item, index) => (
            <article key={`${item.type}-${item.id}`} className={styles.row}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.icon}>
                {item.type === "ANNONCE" ? (
                  <Clock3 size={16} aria-hidden="true" />
                ) : item.type === "SIGNALEMENT" ? (
                  <Flag size={16} aria-hidden="true" />
                ) : (
                  <ShieldAlert size={16} aria-hidden="true" />
                )}
              </span>
              <div className={styles.primary}>
                <small>{item.type}</small>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>
              <div className={styles.risk}>
                <span>
                  <i style={{ width: `${Math.min(100, item.risk)}%` }} />
                </span>
                <strong>Risque {item.risk}</strong>
              </div>
              <div className={styles.age}>
                <Clock3 size={13} aria-hidden="true" />
                {item.age}
              </div>
              <Link href={item.href} className={styles.actionLink}>
                Traiter
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
