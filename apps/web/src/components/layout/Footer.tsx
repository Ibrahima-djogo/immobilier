import Link from "next/link";

import { BrandLogo } from "./BrandLogo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <BrandLogo tone="dark" />
            <p>
              Une plateforme dédiée à la recherche et à la publication
              d’annonces immobilières fiables en Guinée.
            </p>
          </div>

          <div className={styles.footerColumn}>
            <h3>Navigation</h3>
            <Link href="/">Accueil</Link>
            <Link href="/annonces">Toutes les annonces</Link>
            <Link href="/annonces?operation=vente">Biens à vendre</Link>
            <Link href="/annonces?operation=location">Biens à louer</Link>
            <Link href="/agences">Agences</Link>
            <Link href="/a-propos">À propos</Link>
          </div>

          <div className={styles.footerColumn}>
            <h3>Assistance</h3>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">Questions fréquentes</Link>
            <Link href="/aide">Centre d’aide</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </div>

          <div className={styles.footerColumn}>
            <h3>Votre espace</h3>
            <Link href="/connexion">Se connecter</Link>
            <Link href="/inscription">Créer un compte</Link>
            <Link href="/demande-role">Publier un bien</Link>
            <Link href="/favoris">Mes favoris</Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2026 Demeure Guinée. Tous droits réservés.</p>
          <div>
            <Link href="/conditions-utilisation">Conditions d’utilisation</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
