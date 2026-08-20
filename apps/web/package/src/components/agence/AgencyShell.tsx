"use client";

import Link from "next/link";
import {
  Activity, BarChart3, Bell, Building2, FileText, Home,
  LayoutDashboard, LogOut, Menu, MessageSquareText,
  ShieldCheck, Store, UserRound, X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import styles from "./AgencyShell.module.css";

export type AgencySection =
  | "dashboard" | "biens" | "annonces" | "prospects"
  | "statistiques" | "profil" | "activite";

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
  active, eyebrow, title, description, action, children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <span><Home size={21} /></span>
            <div><strong>Demeure</strong><small>Guinée</small></div>
          </Link>

          <div className={styles.headerActions}>
            <Link href="/notifications" className={styles.notification}>
              <Bell size={19} /><span>6</span>
            </Link>
            <div className={styles.account}>
              <span>HC</span>
              <div><strong>Habitat Conakry</strong><small>Agence vérifiée</small></div>
            </div>
            <button type="button" className={styles.menuButton} onClick={() => setOpen(true)}>
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {open && <button type="button" className={styles.overlay} onClick={() => setOpen(false)} />}

      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
          <div className={styles.mobileHead}>
            <strong>Espace Agence</strong>
            <button type="button" onClick={() => setOpen(false)}><X size={19} /></button>
          </div>

          <nav>
            <span className={styles.navLabel}>Gestion professionnelle</span>
            {links.map(([key, href, label, Icon]) => (
              <Link
                key={key}
                href={href}
                className={active === key ? styles.activeLink : styles.navLink}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />{label}
              </Link>
            ))}

            <span className={styles.navLabel}>Compte personnel</span>
            <Link href="/profil" className={styles.navLink}>
              <UserRound size={18} />Mon profil
            </Link>
            <Link href="/notifications" className={styles.navLink}>
              <Bell size={18} />Notifications
            </Link>
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.roleCard}>
              <ShieldCheck size={18} />
              <div><strong>Agence validée</strong><small>Identité professionnelle active</small></div>
            </div>
            <Link href="/" className={styles.logout}><LogOut size={17} />Se déconnecter</Link>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.pageHeader}>
            <div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
            {action && <div className={styles.pageAction}>{action}</div>}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
