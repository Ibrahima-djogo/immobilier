"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Flag,
  Gauge,
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
  canAccessSection,
  isSuperAdmin,
} from "@/lib/administration/admin-accounts";
import {
  adminAds,
  adminUsers,
  reports,
  roleRequests,
} from "@/lib/administration/demo-data";
import { useAdminSession } from "@/lib/auth/admin-session";
import { adminUsersTrend } from "@/lib/demo-charts";
import styles from "./page.module.css";

export default function AdministrationDashboard() {
  const { admin } = useAdminSession();
  const pendingRoles = roleRequests.filter((r) =>
    ["SOUMISE", "EN_EXAMEN", "COMPLEMENT_REQUIS"].includes(r.status),
  ).length;
  const pendingAds = adminAds.filter((a) => a.status === "EN_ATTENTE").length;
  const activeReports = reports.filter((r) =>
    ["NOUVEAU", "EN_ANALYSE"].includes(r.status),
  ).length;

  const canUsers = admin ? canAccessSection(admin, "utilisateurs") : false;
  const canRoles = admin ? canAccessSection(admin, "roles") : false;
  const canAds = admin ? canAccessSection(admin, "annonces") : false;
  const canBiens = admin ? canAccessSection(admin, "biens") : false;
  const canModeration = admin ? canAccessSection(admin, "moderation") : false;
  const canReports = admin ? canAccessSection(admin, "signalements") : false;
  const canRefs = admin ? canAccessSection(admin, "referentiels") : false;
  const canAudit = admin ? canAccessSection(admin, "audit") : false;
  const canStats = admin ? canAccessSection(admin, "statistiques") : false;
  const showUserChart = canUsers || canStats || (admin ? isSuperAdmin(admin) : false);

  const kpiItems = [
    canUsers
      ? {
          label: "Utilisateurs",
          value: adminUsers.length,
          icon: Users,
          hint: "Comptes recensés",
        }
      : null,
    canRoles
      ? {
          label: "Demandes de rôle",
          value: pendingRoles,
          icon: ClipboardCheck,
          tone: pendingRoles > 0 ? ("warning" as const) : ("success" as const),
          hint: "En attente",
        }
      : null,
    canAds || canModeration
      ? {
          label: "Annonces à modérer",
          value: pendingAds,
          icon: FileText,
          tone: pendingAds > 0 ? ("accent" as const) : ("default" as const),
        }
      : null,
    canReports
      ? {
          label: "Signalements actifs",
          value: activeReports,
          icon: Flag,
          tone: activeReports > 0 ? ("warning" as const) : ("success" as const),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const shortcuts: { href: string; label: string }[] = [];
  if (canUsers) {
    shortcuts.push({ href: "/utilisateurs", label: "Gérer les utilisateurs" });
  }
  if (canAds) {
    shortcuts.push({ href: "/annonces", label: "Contrôler les annonces" });
  }
  if (canRefs) {
    shortcuts.push({
      href: "/referentiels",
      label: "Administrer les référentiels",
    });
  }
  if (canAudit) {
    shortcuts.push({ href: "/audit", label: "Consulter l’audit" });
  }

  return (
    <AdminShell
      active="dashboard"
      eyebrow="Back-office central"
      title="Administration"
      description="Pilotez les comptes, la modération, les référentiels et la traçabilité de la plateforme."
      note={
        admin
          ? `Espace de ${admin.name} — accès selon le rôle ${admin.role} et ses permissions.`
          : undefined
      }
      icon={Gauge}
      stats={[
        {
          label: "Dossiers de rôle",
          value: pendingRoles,
          tone: "warning",
          icon: ClipboardCheck,
          hint: "À traiter",
        },
        {
          label: "Annonces",
          value: pendingAds,
          tone: "warning",
          icon: FileText,
          hint: "En attente",
        },
        {
          label: "Signalements",
          value: activeReports,
          tone: activeReports > 0 ? "danger" : "neutral",
          icon: Flag,
          hint: "Actifs",
        },
      ]}
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

      {kpiItems.length > 0 ? (
        <KpiStrip highlightFirst items={kpiItems} />
      ) : null}

      <div className={styles.chartsGrid}>
        {showUserChart ? (
          <ChartCard
            title="Évolution des utilisateurs"
            value="8 500+"
            delta="+12,5 % ce mois"
            description="Inscriptions cumulées sur 6 mois (démonstration)."
          >
            <LineChart data={adminUsersTrend} format="locale" />
          </ChartCard>
        ) : (
          <DashboardPanel
            title="Tableau de bord"
            description="Aucun indicateur statistique n’est associé à vos permissions actuelles."
          >
            <p style={{ margin: 0, color: "var(--text-body)", fontSize: "0.9rem" }}>
              Utilisez la navigation pour accéder aux modules autorisés.
            </p>
          </DashboardPanel>
        )}

        <DashboardPanel
          title="Priorités du jour"
          description="Éléments nécessitant une décision administrative."
        >
          <DashboardList>
            {canRoles ? (
              <DashboardListRow
                href="/demandes-role"
                ariaLabel="Ouvrir les demandes de rôle"
                title="Demandes de rôle à examiner"
                subtitle="Propriétaires et agences en attente"
                meta={String(pendingRoles)}
                action={{ label: "Examiner" }}
              />
            ) : null}
            {canModeration ? (
              <DashboardListRow
                href="/moderation"
                ariaLabel="Ouvrir la modération"
                title="Annonces en attente de modération"
                subtitle="Suspension et preuves à vérifier"
                meta={String(pendingAds)}
                action={{ label: "Examiner" }}
              />
            ) : null}
            {canReports ? (
              <DashboardListRow
                href="/signalements"
                ariaLabel="Ouvrir les signalements"
                title="Signalements non qualifiés"
                subtitle="Identité du déclarant protégée"
                meta={String(activeReports)}
                action={{ label: "Examiner" }}
              />
            ) : null}
          </DashboardList>
          {!canRoles && !canModeration && !canReports ? (
            <p style={{ margin: 0, color: "var(--text-body)", fontSize: "0.9rem" }}>
              Aucune priorité visible avec vos permissions actuelles.
            </p>
          ) : null}
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
          description="Modules autorisés pour votre compte."
        >
          <div className={styles.shortcutGrid}>
            {shortcuts.length > 0 ? (
              shortcuts.map(({ href, label }) => (
                <Link key={href} href={href} className={styles.shortcut}>
                  {label}
                  <ArrowRight size={14} />
                </Link>
              ))
            ) : (
              <p style={{ margin: 0, color: "var(--text-body)", fontSize: "0.9rem" }}>
                Aucun raccourci disponible.
              </p>
            )}
          </div>
        </DashboardPanel>
      </div>
    </AdminShell>
  );
}
