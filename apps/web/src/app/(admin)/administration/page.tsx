import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Flag,
  ShieldAlert,
  Users,
} from "lucide-react";

import AdminShell from "@/components/administration/AdminShell";
import { ChartCard, LineChart } from "@/components/charts";
import {
  DashboardList,
  DashboardListRow,
  DashboardPanel,
  KpiStrip,
} from "@/components/dashboard";
import {
  adminAds,
  adminUsers,
  reports,
  roleRequests,
} from "@/lib/administration/demo-data";
import { adminUsersTrend } from "@/lib/demo-charts";
import styles from "./page.module.css";

export default function AdministrationDashboard() {
  const pendingRoles = roleRequests.filter((r) =>
    ["SOUMISE", "EN_EXAMEN", "COMPLEMENT_REQUIS"].includes(r.status),
  ).length;
  const pendingAds = adminAds.filter((a) => a.status === "EN_ATTENTE").length;
  const activeReports = reports.filter((r) =>
    ["NOUVEAU", "EN_ANALYSE"].includes(r.status),
  ).length;

  return (
    <AdminShell
      active="dashboard"
      eyebrow="Back-office central"
      title="Administration"
      description="Pilotez les comptes, la modération, les référentiels et la traçabilité de la plateforme."
    >
      <section className={styles.alert}>
        <ShieldAlert size={22} />
        <div>
          <strong>Zone d’administration sensible</strong>
          <p>
            Chaque action destructive ou critique doit être confirmée, motivée
            et journalisée.
          </p>
        </div>
      </section>

      <KpiStrip
        highlightFirst
        items={[
          {
            label: "Utilisateurs",
            value: adminUsers.length,
            icon: Users,
            hint: "Comptes recensés",
          },
          {
            label: "Demandes de rôle",
            value: pendingRoles,
            icon: ClipboardCheck,
            tone: pendingRoles > 0 ? "warning" : "success",
            hint: "En attente",
          },
          {
            label: "Annonces à modérer",
            value: pendingAds,
            icon: FileText,
            tone: pendingAds > 0 ? "accent" : "default",
          },
          {
            label: "Signalements actifs",
            value: activeReports,
            icon: Flag,
            tone: activeReports > 0 ? "warning" : "success",
          },
        ]}
      />

      <div className={styles.chartsGrid}>
        <ChartCard
          title="Évolution des utilisateurs"
          value="8 500+"
          delta="+12,5 % ce mois"
          description="Inscriptions cumulées sur 6 mois (démonstration)."
        >
          <LineChart data={adminUsersTrend} format="locale" />
        </ChartCard>
        <DashboardPanel
          title="Priorités du jour"
          description="Éléments nécessitant une décision administrative."
        >
          <DashboardList>
            <DashboardListRow
              title="Demandes de rôle à examiner"
              subtitle="Propriétaires et agences en attente"
              meta="3"
              action={{
                href: "/administration/demandes-role",
                label: "Examiner",
                ariaLabel: "Examiner les demandes de rôle",
              }}
            />
            <DashboardListRow
              title="Annonce à risque élevé"
              subtitle="Suspension et preuves à vérifier"
              meta="1"
              action={{
                href: "/administration/moderation",
                label: "Examiner",
                ariaLabel: "Examiner les annonces à risque",
              }}
            />
            <DashboardListRow
              title="Signalements non qualifiés"
              subtitle="Identité du déclarant protégée"
              meta="2"
              action={{
                href: "/administration/signalements",
                label: "Examiner",
                ariaLabel: "Examiner les signalements",
              }}
            />
          </DashboardList>
        </DashboardPanel>
      </div>

      <div className={styles.grid}>
        <DashboardPanel
          title="État de la plateforme"
          description="Indicateurs front-end de démonstration."
        >
          {(
            [
              ["API", "À connecter", "warning"],
              ["Base de données", "À connecter", "warning"],
              ["Médias", "URLs de démonstration", "warning"],
              ["Audit", "Interface prête", "ok"],
            ] as const
          ).map(([label, value, state]) => (
            <div key={label} className={styles.healthRow}>
              <span>{label}</span>
              <strong className={styles[state]}>{value}</strong>
            </div>
          ))}
        </DashboardPanel>

        <DashboardPanel
          title="Accès rapides"
          description="Principaux modules administratifs."
        >
          <div className={styles.shortcutGrid}>
            {(
              [
                ["/administration/utilisateurs", "Gérer les utilisateurs"],
                ["/administration/annonces", "Contrôler les annonces"],
                ["/administration/referentiels", "Administrer les référentiels"],
                ["/administration/audit", "Consulter l’audit"],
              ] as const
            ).map(([href, label]) => (
              <Link key={href} href={href} className={styles.shortcut}>
                {label}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </AdminShell>
  );
}
