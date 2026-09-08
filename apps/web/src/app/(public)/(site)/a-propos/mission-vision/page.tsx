import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import styles from "../aboutSub.module.css";

export default function MissionVisionPage() {
  return (
    <main className={styles.page}>
      <PublicPageHeader
        crumbs={[
          { href: "/", label: "Accueil" },
          { href: "/a-propos", label: "À propos" },
          { label: "Mission & vision" },
        ]}
        eyebrow="Orientation"
        title="Mission & vision"
        description="Demeure Guinée vise une recherche immobilière claire, utile et digne de confiance, pour les particuliers comme pour les professionnels."
        containerClassName={styles.container}
      />

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Notre mission</h2>
          <ul className={styles.list}>
            <li>
              Permettre à chacun de trouver un bien pertinent grâce à une
              recherche publique simple et filtrable.
            </li>
            <li>
              Faciliter le contact avec des annonceurs dont le rôle
              Propriétaire ou Agence a été validé.
            </li>
            <li>
              Donner aux propriétaires et agences des outils de gestion clairs
              pour leurs biens, annonces et demandes.
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Notre vision</h2>
          <p>
            Une plateforme immobilière guinéenne centrée sur la confiance, la
            transparence des statuts et une expérience mobile-first, capable
            d’évoluer sans perdre sa lisibilité.
          </p>
          <ul className={styles.list}>
            <li>Simplicité d’usage pour consulter, filtrer et contacter.</li>
            <li>Confiance construite par la validation des rôles et la modération.</li>
            <li>Transparence des décisions, motifs et historiques utiles.</li>
            <li>Expérience pensée d’abord pour le mobile.</li>
            <li>Évolutivité progressive, sans complexité inutile en version 1.</li>
          </ul>
          <div className={styles.actions}>
            <Link href="/annonces" className={styles.primary}>
              Explorer les annonces
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/a-propos/confiance-securite" className={styles.secondary}>
              Confiance & sécurité
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
