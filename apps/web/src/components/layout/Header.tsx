"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, House, Menu, X } from "lucide-react";
import {
  Suspense,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { useFavorites } from "@/context/FavoritesContext";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { Button } from "@/components/ui";
import { routes } from "@/lib/routes/app-routes";
import { BrandLogo } from "./BrandLogo";
import { MegaMenu, MobileMegaAccordion } from "./MegaMenu";
import { publicNavigation, type MegaMenuId } from "./mega-menus";
import styles from "./Header.module.css";

const MOBILE_NAV_ID = "public-mobile-navigation";

type NavKey =
  | "accueil"
  | "acheter"
  | "louer"
  | "annonces"
  | "materiaux"
  | "agences"
  | "a-propos"
  | "contact"
  | "aide"
  | null;

function resolveActive(
  pathname: string,
  operation: string | null,
): NavKey {
  if (pathname === "/") return "accueil";
  if (pathname === "/annonces") {
    if (operation === "vente") return "acheter";
    if (operation === "location") return "louer";
    return "annonces";
  }
  if (pathname.startsWith("/annonces/")) return "annonces";
  if (
    pathname === "/materiaux" ||
    pathname.startsWith("/materiaux/") ||
    pathname === "/panier" ||
    pathname.startsWith("/commande")
  ) {
    return "materiaux";
  }
  if (pathname === "/agences" || pathname.startsWith("/agences/")) {
    return "agences";
  }
  if (pathname === "/a-propos" || pathname.startsWith("/a-propos/")) {
    return "a-propos";
  }
  if (pathname === "/contact") return "contact";
  if (
    pathname === "/aide" ||
    pathname.startsWith("/aide/") ||
    pathname === "/faq"
  ) {
    return "aide";
  }
  return null;
}

function DesktopNavigation({
  active,
  openMega,
  setOpenMega,
}: {
  active: NavKey;
  openMega: MegaMenuId | null;
  setOpenMega: (id: MegaMenuId | null) => void;
}) {
  return (
    <nav className={styles.navigation} aria-label="Navigation principale">
      {publicNavigation.map((item) => {
        if (item.kind === "link") {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={
                active === item.navKey
                  ? styles.activeNavigationLink
                  : styles.navigationLink
              }
            >
              {item.label}
            </Link>
          );
        }
        return (
          <MegaMenu
            key={item.menu.id}
            menu={item.menu}
            isActive={active === item.menu.navKey}
            openId={openMega}
            onOpen={setOpenMega}
            onClose={() => setOpenMega(null)}
            onNavigate={() => setOpenMega(null)}
          />
        );
      })}
    </nav>
  );
}

function HeaderSearchSync({
  onChange,
}: {
  onChange: (operation: string | null, searchKey: string) => void;
}) {
  const searchParams = useSearchParams();
  const operation = searchParams.get("operation");
  const searchKey = searchParams.toString();

  useEffect(() => {
    onChange(operation, searchKey);
  }, [onChange, operation, searchKey]);

  return null;
}

function HeaderInner() {
  const pathname = usePathname();
  const [operation, setOperation] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState("");
  const { favoritesCount } = useFavorites();
  const { isLoggedIn, ready } = usePublicDemoSession();
  const accountHref = isLoggedIn || !ready ? routes.userDashboard : "/connexion";
  const accountLabel = isLoggedIn || !ready ? "Mon compte" : "Se connecter";
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMega, setOpenMega] = useState<MegaMenuId | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<MegaMenuId | null>(
    null,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const active = resolveActive(pathname, operation);

  const closeMenu = useEffectEvent(() => {
    setMenuOpen(false);
    setOpenMega(null);
    setMobileAccordion(null);
  });

  useEffect(() => {
    // Fermer menus mobile / mega à chaque navigation.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync chrome to route change
    closeMenu();
  }, [pathname, searchKey]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function toggleMobileAccordion(id: MegaMenuId) {
    setMobileAccordion((current) => (current === id ? null : id));
  }

  return (
    <header
      className={`${styles.header}${menuOpen ? ` ${styles.headerMenuOpen}` : ""}`}
    >
      <Suspense fallback={null}>
        <HeaderSearchSync
          onChange={(nextOperation, nextSearchKey) => {
            setOperation(nextOperation);
            setSearchKey(nextSearchKey);
          }}
        />
      </Suspense>
      <div className={styles.headerContainer}>
        <BrandLogo />

        <DesktopNavigation
          active={active}
          openMega={openMega}
          setOpenMega={setOpenMega}
        />

        <div className={styles.headerActions}>
          <Link
            href="/favoris"
            className={styles.headerFavorite}
            aria-label={`Voir mes favoris (${favoritesCount})`}
          >
            <Heart
              size={20}
              aria-hidden="true"
              fill={favoritesCount > 0 ? "rgba(220, 38, 38, 0.15)" : "none"}
              color={favoritesCount > 0 ? "#dc2626" : "currentColor"}
            />
            {favoritesCount > 0 ? (
              <span className={styles.favoriteBadge}>{favoritesCount}</span>
            ) : null}
          </Link>
          <Button
            href={accountHref}
            variant="secondary"
            size="sm"
            className={styles.loginButton}
          >
            {accountLabel}
          </Button>
          <Button
            href="/demande-role"
            variant="primary"
            size="sm"
            className={styles.publishButton}
          >
            Publier un bien
          </Button>
          <button
            ref={menuToggleRef}
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls={MOBILE_NAV_ID}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? (
              <X size={21} aria-hidden="true" />
            ) : (
              <Menu size={21} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className={styles.overlay}
            aria-label="Fermer le menu"
            tabIndex={-1}
            onClick={() => {
              setMenuOpen(false);
              menuToggleRef.current?.focus();
            }}
          />
          <aside
            id={MOBILE_NAV_ID}
            className={styles.mobileMenu}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
          >
            <div className={styles.mobileMenuHeader}>
              <BrandLogo size="sm" />
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.mobileClose}
                aria-label="Fermer le menu"
                onClick={() => {
                  setMenuOpen(false);
                  menuToggleRef.current?.focus();
                }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Navigation mobile">
              {publicNavigation.map((item) => {
                if (item.kind === "link") {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`${styles.mobileLink}${
                        active === item.navKey ? ` ${styles.mobileLinkActive}` : ""
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.id === "accueil" ? (
                        <House size={17} aria-hidden="true" />
                      ) : null}
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <MobileMegaAccordion
                    key={item.menu.id}
                    menu={item.menu}
                    openId={mobileAccordion}
                    onToggle={toggleMobileAccordion}
                    onNavigate={() => setMenuOpen(false)}
                  />
                );
              })}

              <Link
                href="/aide"
                className={`${styles.mobileLink}${
                  active === "aide" ? ` ${styles.mobileLinkActive}` : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Centre d’aide
              </Link>

              <Link
                href="/favoris"
                className={styles.mobileLink}
                onClick={() => setMenuOpen(false)}
              >
                <Heart size={17} aria-hidden="true" />
                Favoris
              </Link>

              <Link
                href={accountHref}
                className={styles.mobileLink}
                onClick={() => setMenuOpen(false)}
              >
                {accountLabel}
              </Link>
              {isLoggedIn ? (
                <>
                  <Link
                    href={routes.cart}
                    className={styles.mobileLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    Mon panier
                  </Link>
                  <Link
                    href={routes.myOrders}
                    className={styles.mobileLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    Mes commandes
                  </Link>
                </>
              ) : null}

              <Link
                href="/demande-role"
                className={`${styles.mobileLink} ${styles.mobilePrimary}`}
                onClick={() => setMenuOpen(false)}
              >
                Publier un bien
              </Link>
            </nav>
          </aside>
        </>
      ) : null}
    </header>
  );
}

export function Header() {
  return <HeaderInner />;
}
