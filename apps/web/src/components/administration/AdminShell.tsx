"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  BookOpenText,
  Boxes,
  ClipboardCheck,
  FileSearch,
  FileText,
  Flag,
  Gauge,
  Home,
  ListChecks,
  LockKeyhole,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard";
import styles from "@/components/dashboard/dashboardShell.module.css";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

export type AdminSection =
  | "dashboard"
  | "utilisateurs"
  | "roles"
  | "annonces"
  | "moderation"
  | "signalements"
  | "referentiels"
  | "statistiques"
  | "audit"
  | "contenus"
  | "parametres"
  | "administrateurs";

type Props = {
  active: AdminSection;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

const nav = [
  ["dashboard", "/administration", "Vue générale", Gauge],
  ["utilisateurs", "/administration/utilisateurs", "Utilisateurs", Users],
  ["roles", "/administration/demandes-role", "Demandes de rôle", ClipboardCheck],
  ["annonces", "/administration/annonces", "Annonces", FileText],
  ["moderation", "/administration/moderation", "File de modération", ListChecks],
  ["signalements", "/administration/signalements", "Signalements", Flag],
  ["referentiels", "/administration/referentiels", "Référentiels", Boxes],
  ["statistiques", "/administration/statistiques", "Statistiques", BarChart3],
  ["audit", "/administration/audit", "Journal d’audit", FileSearch],
  ["contenus", "/administration/contenus", "Contenus publics", BookOpenText],
  ["parametres", "/administration/parametres", "Paramètres", SlidersHorizontal],
  ["administrateurs", "/administration/administrateurs", "Administrateurs", UserCog],
] as const;

export default function AdminShell({
  active,
  eyebrow,
  title,
  description,
  action,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapsed(
    "demeure_guinee_admin_sidebar_collapsed",
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
              <small>Administration</small>
            </div>
          </Link>

          <div className={styles.headerActions}>
            <Link
              href="/administration/signalements"
              className={styles.notification}
              aria-label="Voir les signalements"
            >
              <Bell size={19} />
            </Link>
            <div className={`${styles.account} ${styles.accountPrivileged}`}>
              <span>SA</span>
              <div>
                <strong>Super Administrateur</strong>
                <small>Accès privilégié</small>
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
            <strong>Administration</strong>
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
                <small>Admin</small>
              </div>
            </Link>

            <nav>
              <span className={styles.navLabel}>Pilotage</span>
              {nav.map(([key, href, label, Icon]) => (
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
            </nav>
          </div>

          <div className={styles.sidebarFooter}>
            <div
              className={`${styles.roleCard} ${styles.roleCardDanger}`}
              title="Zone sensible"
            >
              <LockKeyhole size={18} />
              <div>
                <strong>Zone sensible</strong>
                <small>Actions journalisées</small>
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
