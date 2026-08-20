"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import styles from "./OwnerShell.module.css";

export type OwnerSection =
  | "dashboard"
  | "biens"
  | "annonces"
  | "contacts"
  | "statistiques";

type OwnerShellProps = {
  active: OwnerSection;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

const navigation = [
  {
    key: "dashboard" as const,
    href: "/proprietaire/tableau-de-bord",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    key: "biens" as const,
    href: "/proprietaire/biens",
    label: "Mes biens",
    icon: Building2,
  },
  {
    key: "annonces" as const,
    href: "/proprietaire/annonces",
    label: "Mes annonces",
    icon: FileText,
  },
  {
    key: "contacts" as const,
    href: "/proprietaire/contacts",
    label: "Contacts reçus",
    icon: MessageSquareText,
  },
  {
    key: "statistiques" as const,
    href: "/proprietaire/statistiques",
    label: "Statistiques",
    icon: BarChart3,
  },
];

export default function OwnerShell({
  active,
  eyebrow,
  title,
  description,
  action,
  children,
}: OwnerShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <span><Home size={21} aria-hidden="true" /></span>
            <div>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </div>
          </Link>

          <div className={styles.headerActions}>
            <Link href="/notifications" className={styles.notification} aria-label="Notifications">
              <Bell size={19} aria-hidden="true" />
              <span>4</span>
            </Link>

            <div className={styles.account}>
              <span>MD</span>
              <div>
                <strong>Mamadou Diallo</strong>
                <small>Propriétaire vérifié</small>
              </div>
            </div>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir la navigation"
            >
              <Menu size={21} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer la navigation"
        />
      )}

      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.mobileSidebarHeader}>
            <strong>Espace Propriétaire</strong>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fermer">
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Navigation Propriétaire">
            <span className={styles.navLabel}>Gestion immobilière</span>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={active === item.key ? styles.activeLink : styles.navLink}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}

            <span className={styles.navLabel}>Compte personnel</span>
            <Link href="/profil" className={styles.navLink}>
              <UserRound size={18} aria-hidden="true" />
              Mon profil
            </Link>
            <Link href="/favoris" className={styles.navLink}>
              <Heart size={18} aria-hidden="true" />
              Mes favoris
            </Link>
            <Link href="/notifications" className={styles.navLink}>
              <Bell size={18} aria-hidden="true" />
              Notifications
            </Link>
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.roleCard}>
              <ShieldCheck size={18} aria-hidden="true" />
              <div>
                <strong>Rôle approuvé</strong>
                <small>Compte actif</small>
              </div>
            </div>
            <Link href="/" className={styles.logout}>
              <LogOut size={17} aria-hidden="true" />
              Se déconnecter
            </Link>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <span>{eyebrow}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {action && <div className={styles.pageAction}>{action}</div>}
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
