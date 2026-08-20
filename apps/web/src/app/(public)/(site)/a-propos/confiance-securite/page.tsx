import Link from "next/link";
import { ArrowRight } from "lucide-react";

import styles from "../aboutSub.module.css";

export default function ConfidenceSecurityPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.breadcrumb}>
            <Link href="/">Accueil</Link>
            <span>/</span>
            <Link href="/a-propos">À propos</Link>
            <span>/</span>
            <strong>Confiance & sécurité</strong>
          </p>
          <p className={styles.eyebrow}>Protection</p>
          <h1>Confiance & sécurité</h1>
          <p className={styles.lead}>
            La confiance sur Demeure Guinée repose sur la validation des rôles,
            la modération des contenus et la protection des informations
            sensibles.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Ce qui structure la confiance</h2>
          <ul className={styles.list}>
            <li>
              Vérification des comptes Propriétaire et Agence avant publication.
            </li>
            <li>
              Modération des annonces avec statuts, motifs et historique.
            </li>
            <li>
              Protection de certaines coordonnées : l’adresse exacte n’est pas
              exposée publiquement par défaut.
            </li>
            <li>
              Gestion transparente des statuts de compte, de bien et d’annonce.
            </li>
            <li>
              Possibilité de signaler un contenu problématique via un parcours
              dédié.
            </li>
          </ul>
          <div className={styles.actions}>
            <Link href="/signaler" className={styles.primary}>
              Signaler un contenu
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/charte-publication" className={styles.secondary}>
              Charte de publication
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
