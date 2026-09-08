import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import styles from "../aboutSub.module.css";

export default function TeamGovernancePage() {
  return (
    <main className={styles.page}>
      <PublicPageHeader
        crumbs={[
          { href: "/", label: "Accueil" },
          { href: "/a-propos", label: "À propos" },
          { label: "Équipe & gouvernance" },
        ]}
        eyebrow="Organisation"
        title="Notre équipe & gouvernance"
        description="Demeure Guinée s’organise autour de responsabilités claires : produit, métier, administration, support et partenaires professionnels. Aucun nom personnel n’est inventé ici."
        containerClassName={styles.container}
      />

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Fonctions et responsabilités</h2>
          <div className={styles.roles}>
            <article>
              <strong>Équipe projet</strong>
              <p>
                Conception de l’expérience, coordination des espaces publics et
                connectés, évolution progressive de la plateforme.
              </p>
            </article>
            <article>
              <strong>Responsables métier</strong>
              <p>
                Cadrage des parcours annonces, rôles, contacts, favoris et
                conformité aux règles de publication.
              </p>
            </article>
            <article>
              <strong>Administration</strong>
              <p>
                Validation des rôles, modération des annonces, traitement des
                signalements, référentiels et audit des décisions.
              </p>
            </article>
            <article>
              <strong>Support</strong>
              <p>
                Assistance aux utilisateurs, orientation vers les guides et
                transmission des demandes nécessitant un suivi.
              </p>
            </article>
            <article>
              <strong>Partenaires professionnels</strong>
              <p>
                Agences et propriétaires dont le rôle a été validé, responsables
                de la qualité des informations publiées.
              </p>
            </article>
          </div>
          <div className={styles.actions}>
            <Link href="/contact" className={styles.primary}>
              Nous contacter
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/a-propos" className={styles.secondary}>
              Retour à la présentation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
