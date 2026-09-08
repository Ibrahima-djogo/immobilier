"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpenText,
  Boxes,
  BrickWall,
  ClipboardCheck,
  FileSearch,
  FileText,
  Flag,
  Gauge,
  Home,
  Inbox,
  KeyRound,
  Landmark,
  ListChecks,
  LockKeyhole,
  LogOut,
  type LucideIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { AdminPageHero } from "@/components/administration/AdminPageHero";
import type {
  AdminPageHeroMeta,
  AdminPageHeroStat,
  AdminPageHeroTone,
  AdminPageHeroVariant,
} from "@/components/administration/AdminPageHero";
import styles from "@/components/dashboard/dashboardShell.module.css";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import {
  canAccessSection,
  initials,
  isSuperAdmin,
  securityRoleLabel,
  type AdminSection,
} from "@/lib/administration/admin-accounts";
import { useAdminSession } from "@/lib/auth/admin-session";
import { routes } from "@/lib/routes/app-routes";

export type { AdminSection };

type Props = {
  active: AdminSection;
  /** Props de l’en-tête : voir AdminPageHero (source unique du h1). */
  eyebrow: string;
  title: string;
  description?: string;
  note?: string;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
  badge?: ReactNode;
  badgeTone?: AdminPageHeroTone;
  meta?: AdminPageHeroMeta[];
  /** Indicateurs chiffrés de l’en-tête : voir AdminPageHero. */
  stats?: AdminPageHeroStat[];
  actions?: ReactNode;
  heroVariant?: AdminPageHeroVariant;
  children: ReactNode;
  /** false pour /acces-refuse (évite boucle de redirection). */
  enforceAccess?: boolean;
};

const nav = [
  ["dashboard", "/", "Vue générale", Gauge],
  ["utilisateurs", "/utilisateurs", "Utilisateurs", Users],
  ["roles", "/demandes-role", "Demandes de rôle", ClipboardCheck],
  [
    "verifications-foncieres",
    "/administration/verifications-foncieres",
    "Vérifications foncières",
    Landmark,
  ],
  ["annonces", "/annonces", "Annonces", FileText],
  ["biens", "/biens", "Biens", Home],
  ["moderation", "/moderation", "File de modération", ListChecks],
  ["signalements", "/signalements", "Signalements", Flag],
  ["contacts", "/contacts", "Demandes contact", Inbox],
  ["referentiels", "/referentiels", "Référentiels", Boxes],
  ["materiaux", "/materiaux", "Matériaux", BrickWall],
  ["statistiques", "/statistiques", "Statistiques", BarChart3],
  ["audit", "/audit", "Journal d’audit", FileSearch],
  ["contenus", "/contenus", "Contenus publics", BookOpenText],
  ["parametres", "/parametres", "Paramètres", SlidersHorizontal],
  ["administrateurs", "/administrateurs", "Administrateurs", UserCog],
] as const;

export default function AdminShell({
  active,
  eyebrow,
  title,
  description,
  note,
  icon,
  backHref,
  backLabel,
  badge,
  badgeTone,
  meta,
  stats,
  actions,
  heroVariant = "compact",
  children,
  enforceAccess = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, ready, logout } = useAdminSession();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { collapsed, toggleCollapsed } = useSidebarCollapsed(
    "demeure_guinee_admin_sidebar_collapsed",
  );

  useEffect(() => {
    if (!ready) return;
    if (!admin) {
      router.replace(routes.login);
      return;
    }
    if (enforceAccess && !canAccessSection(admin, active)) {
      router.replace(routes.accessDenied);
    }
  }, [admin, ready, enforceAccess, active, router]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function handleLogout() {
    setOpen(false);
    setMenuOpen(false);
    logout();
    router.replace(routes.login);
  }

  if (!ready || !admin) {
    return (
      <main className={styles.page}>
        <div className={styles.content} style={{ padding: "2rem" }}>
          <p>Vérification de l’accès…</p>
        </div>
      </main>
    );
  }

  if (
    enforceAccess &&
    admin &&
    !canAccessSection(admin, active) &&
    pathname !== routes.accessDenied
  ) {
    return (
      <main className={styles.page}>
        <div className={styles.content} style={{ padding: "2rem" }}>
          <p>Accès non autorisé. Redirection…</p>
        </div>
      </main>
    );
  }

  const visibleNav = admin
    ? nav.filter(([key]) => canAccessSection(admin, key))
    : [];

  const privileged = admin ? isSuperAdmin(admin) : false;
  const displayName = admin?.name ?? "Administrateur";
  const displayRole = admin
    ? securityRoleLabel(admin.role)
    : "Non connecté";
  const avatar = admin ? initials(admin.name) : "?";
  const canSeeReports = admin
    ? canAccessSection(admin, "signalements")
    : false;

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
            {canSeeReports ? (
              <Link
                href="/signalements"
                className={styles.notification}
                aria-label="Voir les signalements"
              >
                <Bell size={19} />
              </Link>
            ) : null}

            <div className={styles.accountMenu} ref={menuRef}>
            <button
              type="button"
              className={`${styles.account} ${styles.accountTrigger} ${
                privileged ? styles.accountPrivileged : ""
              }`}
              aria-label={`Menu compte — ${displayName}`}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
                <span>{avatar}</span>
                <div>
                  <strong>{displayName}</strong>
                  <small>{displayRole}</small>
                </div>
              </button>

              {menuOpen ? (
                <div id={menuId} className={styles.accountDropdown} role="menu">
                  <Link
                    href={routes.account}
                    role="menuitem"
                    className={styles.accountMenuItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound size={16} aria-hidden="true" />
                    Mon compte
                  </Link>
                  <Link
                    href={`${routes.account}#securite`}
                    role="menuitem"
                    className={styles.accountMenuItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    <KeyRound size={16} aria-hidden="true" />
                    Sécurité
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.accountMenuItemDanger}
                    onClick={handleLogout}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Se déconnecter
                  </button>
                </div>
              ) : null}
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
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer la navigation"
              title="Fermer la navigation"
            >
              <X size={19} aria-hidden="true" />
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
              {visibleNav.map(([key, href, label, Icon]) => (
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
              className={`${styles.roleCard} ${
                privileged ? styles.roleCardDanger : ""
              }`}
              title={privileged ? "Zone sensible" : "Espace administratif"}
            >
              <LockKeyhole size={18} />
              <div>
                <strong>{privileged ? "Zone sensible" : "Compte limité"}</strong>
                <small>
                  {privileged
                    ? "Actions journalisées"
                    : "Accès selon permissions"}
                </small>
              </div>
            </div>
            <button
              type="button"
              className={styles.logout}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              onClick={handleLogout}
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
          <AdminPageHero
            eyebrow={eyebrow}
            title={title}
            description={description}
            note={note}
            icon={icon}
            backHref={backHref}
            backLabel={backLabel}
            badge={badge}
            badgeTone={badgeTone}
            meta={meta}
            stats={stats}
            actions={actions}
            variant={heroVariant}
          />
          {children}
        </section>
      </div>
    </main>
  );
}
