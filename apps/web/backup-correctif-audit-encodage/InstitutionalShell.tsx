"use client";

import Link from "next/link";
import {
  Heart,
  Home,
  LogIn,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import styles from "./InstitutionalShell.module.css";

type Props = {
  children: ReactNode;
  active?: "agences" | "a-propos" | "aide" | "contact";
};

export default function InstitutionalShell({ children, active }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <span><Home size={22} aria-hidden="true" /></span>
            <div><strong>Demeure</strong><small>GuinÃ©e</small></div>
          </Link>

          <nav className={styles.desktopNav} aria-label="Navigation principale">
            <Link href="/" className={styles.navLink}>Accueil</Link>
            <Link href="/annonces" className={styles.navLink}>Annonces</Link>
            <Link href="/agences" className={active === "agences" ? styles.activeLink : styles.navLink}>
              Agences
            </Link>
            <Link href="/a-propos" className={active === "a-propos" ? styles.activeLink : styles.navLink}>
              Ã€ propos
            </Link>
            <Link href="/aide" className={active === "aide" ? styles.activeLink : styles.navLink}>
              Aide
            </Link>
            <Link href="/contact" className={active === "contact" ? styles.activeLink : styles.navLink}>
              Contact
            </Link>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/favoris" className={styles.iconButton} aria-label="Favoris">
              <Heart size={19} aria-hidden="true" />
            </Link>
            <Link href="/connexion" className={styles.login}>
              <LogIn size={17} aria-hidden="true" />
              Connexion
            </Link>
            <Link href="/inscription" className={styles.register}>CrÃ©er un compte</Link>
            <button type="button" className={styles.menuButton} onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <button type="button" className={styles.overlay} onClick={() => setOpen(false)} aria-label="Fermer le menu" />
          <aside className={styles.mobileMenu}>
            <div>
              <strong>Navigation</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <Link href="/" onClick={() => setOpen(false)}>Accueil</Link>
            <Link href="/annonces" onClick={() => setOpen(false)}>Annonces</Link>
            <Link href="/agences" onClick={() => setOpen(false)}>Agences</Link>
            <Link href="/a-propos" onClick={() => setOpen(false)}>Ã€ propos</Link>
            <Link href="/aide" onClick={() => setOpen(false)}>Centre dâ€™aide</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
            <Link href="/connexion" onClick={() => setOpen(false)}>Connexion</Link>
            <Link href="/inscription" className={styles.mobilePrimary} onClick={() => setOpen(false)}>
              CrÃ©er un compte
            </Link>
          </aside>
        </>
      )}

      {children}

      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.logo}>
              <span><Home size={22} /></span>
              <div><strong>Demeure</strong><small>GuinÃ©e</small></div>
            </Link>
            <p>Une plateforme immobiliÃ¨re pensÃ©e pour faciliter la recherche de biens et renforcer la confiance entre utilisateurs et annonceurs vÃ©rifiÃ©s.</p>
            <span className={styles.trust}><ShieldCheck size={17} />Profils professionnels contrÃ´lÃ©s</span>
          </div>

          <div>
            <strong>Navigation</strong>
            <Link href="/">Accueil</Link>
            <Link href="/annonces">Annonces</Link>
            <Link href="/agences">Agences</Link>
            <Link href="/a-propos">Ã€ propos</Link>
          </div>

          <div>
            <strong>Assistance</strong>
            <Link href="/aide">Centre dâ€™aide</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/aide">Guide d'utilisation</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <div>
            <strong>Informations lÃ©gales</strong>
            <Link href="/conditions-utilisation">Conditions dâ€™utilisation</Link>
            <Link href="/confidentialite">ConfidentialitÃ©</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/charte-publication">Charte de publication</Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>Â© 2026 Demeure GuinÃ©e. Tous droits rÃ©servÃ©s.</p>
          <Link href="/plan-du-site">Plan du site</Link>
        </div>
      </footer>
    </main>
  );
}

