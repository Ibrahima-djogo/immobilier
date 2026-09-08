"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BrickWall,
  Building2,
  FileText,
  Heart,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import styles from "@/components/dashboard/dashboardShell.module.css";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { routes } from "@/lib/routes/app-routes";

type OwnerShellProps = {
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
    key: "verifications-foncieres" as const,
    href: routes.ownerFonciereVerifications,
    label: "Mes vérifications foncières",
    icon: Landmark,
  },
  {
    key: "statistiques" as const,
    href: "/proprietaire/statistiques",
    label: "Statistiques",
    icon: BarChart3,
  },
];

const accountLinks = [
  {
    href: "/proprietaire/profil",
    label: "Mon profil",
    icon: UserRound,
  },
  {
    href: "/proprietaire/favoris",
    label: "Mes favoris",
    icon: Heart,
  },
  {
    href: "/proprietaire/notifications",
    label: "Notifications",
    icon: Bell,
  },
] as const;

const materialsLinks = [
  {
    href: routes.materials,
    label: "Catalogue matériaux",
    icon: BrickWall,
  },
  {
    href: routes.cart,
    label: "Mon panier",
    icon: ShoppingBag,
  },
  {
    href: routes.myOrders,
    label: "Mes commandes",
    icon: Package,
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/proprietaire/tableau-de-bord") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function OwnerShell({ children }: OwnerShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapsed(
    "demeure_guinee_owner_sidebar_collapsed",
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <span>
              <Home size={21} aria-hidden="true" />
            </span>
            <div>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </div>
          </Link>

          <div className={styles.headerActions}>
            <Link
              href="/proprietaire/notifications"
              className={styles.notification}
              aria-label="Notifications"
            >
              <Bell size={19} aria-hidden="true" />
              <span>4</span>
            </Link>

            <div className={`${styles.account} ${styles.accountVerified}`}>
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

      <div
        className={`${styles.layout} ${
          collapsed ? styles.layoutCollapsed : ""
        }`}
      >
        <aside
          className={`${styles.sidebar} ${
            mobileOpen ? styles.sidebarOpen : ""
          } ${collapsed ? styles.sidebarCollapsed : ""}`}
        >
          <div className={styles.mobileHead}>
            <strong>Espace Propriétaire</strong>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.sidebarContent}>
            <Link href="/" className={styles.sidebarBrand} title="Demeure Guinée">
              <span>
                <Home size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Demeure</strong>
                <small>Guinée</small>
              </div>
            </Link>

            <nav aria-label="Navigation Propriétaire">
              <span className={styles.navLabel}>Gestion immobilière</span>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={
                      isActive(pathname, item.href)
                        ? styles.activeLink
                        : styles.navLink
                    }
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className={styles.navText}>{item.label}</span>
                  </Link>
                );
              })}

              <span className={styles.navLabel}>Compte personnel</span>
              {accountLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive(pathname, item.href)
                        ? styles.activeLink
                        : styles.navLink
                    }
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className={styles.navText}>{item.label}</span>
                  </Link>
                );
              })}

              <span className={styles.navLabel}>Matériaux</span>
              {materialsLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive(pathname, item.href)
                        ? styles.activeLink
                        : styles.navLink
                    }
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className={styles.navText}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.roleCard} title="Rôle approuvé">
              <ShieldCheck size={18} aria-hidden="true" />
              <div>
                <strong>Rôle approuvé</strong>
                <small>Compte actif</small>
              </div>
            </div>
            <Link href="/" className={styles.logout} title="Se déconnecter">
              <LogOut size={17} aria-hidden="true" />
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
                <PanelLeftOpen size={18} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={18} aria-hidden="true" />
              )}
              <span className={styles.navText}>
                {collapsed ? "Agrandir" : "Réduire"}
              </span>
            </button>
          </div>
        </aside>

        <section className={styles.content}>{children}</section>
      </div>
    </main>
  );
}
