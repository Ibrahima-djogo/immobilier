import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import styles from "../aboutSub.module.css";

export default function ConfidenceSecurityPage() {
  return (
    <main className={styles.page}>
      <PublicPageHeader
        crumbs={[
          { href: "/", label: "Accueil" },
          { href: "/a-propos", label: "À propos" },
          { label: "Confiance & sécurité" },
        ]}
        eyebrow="Protection"
        title="Confiance & sécurité"
        description="La confiance sur Demeure Guinée repose sur la validation des rôles, la modération des contenus et la protection des informations sensibles."
        containerClassName={styles.container}
      />

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
