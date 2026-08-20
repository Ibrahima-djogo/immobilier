"use client";

import Link from "next/link";
import {
  BarChart3, Bell, BookOpenText, Boxes, ClipboardCheck,
  FileSearch, FileText, Flag, Gauge, Home, ListChecks, LockKeyhole,
  LogOut, Menu, SlidersHorizontal, UserCog,
  Users, X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import styles from "./AdminShell.module.css";

export type AdminSection =
  | "dashboard" | "utilisateurs" | "roles" | "annonces" | "moderation"
  | "signalements" | "referentiels" | "statistiques" | "audit"
  | "contenus" | "parametres" | "administrateurs";

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
  active, eyebrow, title, description, action, children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <span><Home size={21} /></span>
            <div><strong>Demeure</strong><small>Administration</small></div>
          </Link>

          <div className={styles.headerActions}>
            <Link href="/notifications" className={styles.notification}>
              <Bell size={19} /><span>12</span>
            </Link>
            <div className={styles.account}>
              <span>SA</span>
              <div><strong>Super Administrateur</strong><small>Accès privilégié</small></div>
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
            <strong>Administration</strong>
            <button type="button" onClick={() => setOpen(false)}><X size={19} /></button>
          </div>

          <nav>
            <span className={styles.navLabel}>Pilotage</span>
            {nav.map(([key, href, label, Icon]) => (
              <Link
                key={key}
                href={href}
                className={active === key ? styles.activeLink : styles.navLink}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />{label}
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.securityCard}>
              <LockKeyhole size={18} />
              <div><strong>Zone sensible</strong><small>Actions journalisées</small></div>
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
