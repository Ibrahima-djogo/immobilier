"use client";

import Link from "next/link";
import {
  Bell,
  BrickWall,
  ChevronRight,
  FileSpreadsheet,
  Heart,
  Landmark,
  HelpCircle,
  Home,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShoppingBag,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";
import { type ReactNode, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import styles from "@/components/dashboard/dashboardShell.module.css";
import userStyles from "@/components/compte/UserShell.module.css";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { clearPublicDemoSession } from "@/lib/auth/public-demo-session";
import { routes } from "@/lib/routes/app-routes";

export type UserSection =
  | "dashboard"
  | "profil"
  | "securite"
  | "commandes"
  | "devis"
  | "catalogue"
  | "panier"
  | "favoris"
  | "demandes"
  | "verifications-foncieres"
  | "notifications"
  | "demande-role"
  | "aide";

type UserShellProps = {
  active: UserSection;
  children: ReactNode;
  favoritesCount?: number;
  notificationsCount?: number;
};

type NavItem = {
  key: UserSection;
  href: string;
  label: string;
  icon: typeof Home;
  badgeKey?: "favorites" | "notifications";
};

const spaceNav: NavItem[] = [
  {
    key: "dashboard",
    href: "/tableau-de-bord",
    label: "Tableau de bord",
    icon: Home,
  },
  {
    key: "profil",
    href: "/profil",
    label: "Mon profil",
    icon: UserRound,
  },
  {
    key: "favoris",
    href: "/favoris",
    label: "Mes favoris",
    icon: Heart,
    badgeKey: "favorites",
  },
  {
    key: "commandes",
    href: routes.myOrders,
    label: "Mes commandes",
    icon: Package,
  },
  {
    key: "devis",
    href: routes.myQuotes,
    label: "Mes devis",
    icon: FileSpreadsheet,
  },
  {
    key: "demandes",
    href: "/demandes-contact",
    label: "Mes demandes",
    icon: MessageSquareText,
  },
  {
    key: "verifications-foncieres",
    href: routes.myFonciereVerifications,
    label: "Mes vérifications foncières",
    icon: Landmark,
  },
];

const materiauxNav: NavItem[] = [
  {
    key: "catalogue",
    href: routes.materials,
    label: "Catalogue matériaux",
    icon: BrickWall,
  },
  {
    key: "panier",
    href: routes.cart,
    label: "Mon panier",
    icon: ShoppingBag,
  },
];

const compteNav: NavItem[] = [
  {
    key: "securite",
    href: "/securite",
    label: "Sécurité",
    icon: LockKeyhole,
  },
  {
    key: "notifications",
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    badgeKey: "notifications",
  },
];

export default function UserShell({
  active,
  children,
  favoritesCount = 0,
  notificationsCount = 0,
}: UserShellProps) {
  const router = useRouter();
  const { session, ready, isLoggedIn } = usePublicDemoSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { collapsed, toggleCollapsed } = useSidebarCollapsed(
    "demeure_guinee_user_sidebar_collapsed",
  );

  const displayName = session?.name || "Compte";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "DG";
  const roleLabel =
    session?.role === "PROPRIETAIRE"
      ? "Propriétaire"
      : session?.role === "AGENCE"
        ? "Agence"
        : "Compte standard";

  function renderNavGroup(items: NavItem[]) {
    return items.map((item) => {
      const Icon = item.icon;
      const badge =
        item.badgeKey === "favorites"
          ? favoritesCount
          : item.badgeKey === "notifications"
            ? notificationsCount
            : null;
      const isActive = active === item.key;

      return (
        <Link
          key={item.key}
          href={item.href}
          className={isActive ? styles.activeLink : styles.navLink}
          title={item.label}
          onClick={() => setMobileOpen(false)}
        >
          <Icon size={18} aria-hidden="true" />
          <span className={styles.navText}>{item.label}</span>
          {badge != null && badge > 0 ? (
            <span className={styles.navBadge}>{badge}</span>
          ) : null}
        </Link>
      );
    });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = search.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(
      params.toString() ? `${routes.listings}?${params}` : routes.listings,
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div
          className={`${styles.headerInner} ${styles.headerInnerWithSearch}`}
        >
          <Link href={routes.userDashboard} className={styles.logo}>
            <span>
              <Home size={21} aria-hidden="true" />
            </span>
            <div>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </div>
          </Link>

          <form className={styles.headerSearch} onSubmit={submitSearch} role="search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un bien ou un matériau…"
              aria-label="Rechercher un bien ou un matériau"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>

          <div className={styles.headerActions}>
            <Link
              href="/notifications"
              className={styles.notification}
              aria-label="Voir les notifications"
            >
              <Bell size={19} aria-hidden="true" />
              {notificationsCount > 0 ? <span>{notificationsCount}</span> : null}
            </Link>

            <div className={styles.account}>
              <span>{initials}</span>
              <div>
                <strong>{ready && isLoggedIn ? displayName : "…"}</strong>
                <small>{ready && isLoggedIn ? roleLabel : "Chargement"}</small>
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
          className={`${styles.sidebar} ${userStyles.userSidebar} ${
            mobileOpen ? styles.sidebarOpen : ""
          } ${collapsed ? styles.sidebarCollapsed : ""}`}
        >
          <div className={styles.mobileHead}>
            <strong>Mon espace</strong>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.sidebarContent}>
            <Link href={routes.userDashboard} className={styles.sidebarBrand} title="Mon espace">
              <span>
                <Home size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Demeure</strong>
                <small>Guinée</small>
              </div>
            </Link>

            <nav aria-label="Navigation du compte">
              <span className={styles.navLabel}>Mon espace</span>
              {renderNavGroup(spaceNav)}

              <span className={styles.navLabel}>Matériaux</span>
              {renderNavGroup(materiauxNav)}

              <span className={styles.navLabel}>Compte</span>
              {renderNavGroup(compteNav)}

              <span className={styles.navLabel}>Évolution du compte</span>
              <Link
                href="/demande-role"
                className={`${styles.roleLink} ${
                  active === "demande-role" ? styles.roleLinkActive : ""
                }`}
                title="Demander un rôle"
                onClick={() => setMobileOpen(false)}
              >
                <UserRoundCog size={18} aria-hidden="true" />
                <span className={styles.navText}>Demander un rôle</span>
                <ChevronRight
                  size={16}
                  className={styles.roleChevron}
                  aria-hidden="true"
                />
              </Link>

              <span className={styles.navLabel}>Assistance</span>
              <Link
                href="/aide"
                className={
                  active === "aide" ? styles.activeLink : styles.navLink
                }
                title="Centre d’aide"
                onClick={() => setMobileOpen(false)}
              >
                <HelpCircle size={18} aria-hidden="true" />
                <span className={styles.navText}>Centre d’aide</span>
              </Link>
            </nav>
          </div>

          <div className={styles.sidebarFooter}>
            <button
              type="button"
              className={styles.logout}
              title="Se déconnecter"
              onClick={() => {
                clearPublicDemoSession();
                window.location.assign(routes.home);
              }}
            >
              <LogOut size={17} aria-hidden="true" />
              <span className={styles.navText}>Se déconnecter</span>
            </button>
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

        <section className={`${styles.content} ${styles.contentFlush}`}>
          {children}
        </section>
      </div>
    </main>
  );
}
