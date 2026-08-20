"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard";
import styles from "@/components/dashboard/dashboardShell.module.css";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

export type AgencySection =
  | "dashboard"
  | "biens"
  | "annonces"
  | "prospects"
  | "statistiques"
  | "profil"
  | "activite";

type Props = {
  active: AgencySection;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

const links = [
  ["dashboard", "/agence/tableau-de-bord", "Tableau de bord", LayoutDashboard],
  ["biens", "/agence/biens", "Portefeuille de biens", Building2],
  ["annonces", "/agence/annonces", "Annonces", FileText],
  ["prospects", "/agence/prospects", "Prospects", MessageSquareText],
  ["statistiques", "/agence/statistiques", "Statistiques", BarChart3],
  ["profil", "/agence/profil-professionnel", "Profil professionnel", Store],
  ["activite", "/agence/activite", "Activité récente", Activity],
] as const;

export default function AgencyShell({
  active,
  eyebrow,
  title,
  description,
  action,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapsed(
    "demeure_guinee_agency_sidebar_collapsed",
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <span>
              <Home size={21} />
            </span>
            <div>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </div>
          </Link>

          <div className={styles.headerActions}>
            <Link
              href="/agence/activite"
              className={styles.notification}
              aria-label="Voir l’activité de l’agence"
            >
              <Bell size={19} />
              <span>6</span>
            </Link>
            <div className={`${styles.account} ${styles.accountVerified}`}>
              <span>HC</span>
              <div>
                <strong>Habitat Conakry</strong>
                <small>Agence vérifiée</small>
              </div>
            </div>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setOpen(true)}
              aria-label="Ouvrir la navigation"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setOpen(false)}
          aria-label="Fermer la navigation"
        />
      )}

      <div
        className={`${styles.layout} ${
          collapsed ? styles.layoutCollapsed : ""
        }`}
      >
        <aside
          className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""} ${
            collapsed ? styles.sidebarCollapsed : ""
          }`}
        >
          <div className={styles.mobileHead}>
            <strong>Espace Agence</strong>
            <button type="button" onClick={() => setOpen(false)}>
              <X size={19} />
            </button>
          </div>

          <div className={styles.sidebarContent}>
            <Link href="/" className={styles.sidebarBrand} title="Demeure Guinée">
              <span>
                <Home size={18} />
              </span>
              <div>
                <strong>Demeure</strong>
                <small>Guinée</small>
              </div>
            </Link>

            <nav>
              <span className={styles.navLabel}>Gestion professionnelle</span>
              {links.map(([key, href, label, Icon]) => (
                <Link
                  key={key}
                  href={href}
                  className={
                    active === key ? styles.activeLink : styles.navLink
                  }
                  title={label}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} />
                  <span className={styles.navText}>{label}</span>
                </Link>
              ))}

              <span className={styles.navLabel}>Compte personnel</span>
              <Link
                href="/agence/profil-professionnel"
                className={styles.navLink}
                title="Mon profil"
              >
                <UserRound size={18} />
                <span className={styles.navText}>Mon profil</span>
              </Link>
              <Link
                href="/agence/activite"
                className={styles.navLink}
                title="Activité"
              >
                <Bell size={18} />
                <span className={styles.navText}>Activité</span>
              </Link>
            </nav>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.roleCard} title="Agence validée">
              <ShieldCheck size={18} />
              <div>
                <strong>Agence validée</strong>
                <small>Identité professionnelle active</small>
              </div>
            </div>
            <Link href="/" className={styles.logout} title="Se déconnecter">
              <LogOut size={17} />
              <span className={styles.navText}>Se déconnecter</span>
            </Link>
            <button
              type="button"
              className={styles.collapseButton}
              onClick={toggleCollapsed}
              title={
                collapsed
                  ? "Agrandir la navigation"
                  : "Réduire la navigation"
              }
              aria-label={
                collapsed
                  ? "Agrandir la navigation"
                  : "Réduire la navigation"
              }
              aria-pressed={collapsed}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
              <span className={styles.navText}>
                {collapsed ? "Agrandir" : "Réduire"}
              </span>
            </button>
          </div>
        </aside>

        <section className={styles.content}>
          <DashboardPageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            action={action}
          />
          {children}
        </section>
      </div>
    </main>
  );
}
