import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import styles from "../aboutSub.module.css";

const steps = [
  "Rechercher un bien depuis l’accueil ou la page annonces.",
  "Filtrer selon l’opération, le type, la localisation et le budget.",
  "Consulter une fiche détaillée pour comprendre le bien.",
  "Créer un compte lorsque des actions personnelles sont nécessaires.",
  "Ajouter un bien aux favoris ou contacter un annonceur.",
  "Demander un rôle Propriétaire ou Agence pour publier.",
  "Attendre la validation administrative du rôle.",
  "Gérer ensuite vos biens, annonces et demandes dans votre espace.",
];

export default function HowItWorksPage() {
  return (
    <main className={styles.page}>
      <PublicPageHeader
        crumbs={[
          { href: "/", label: "Accueil" },
          { href: "/a-propos", label: "À propos" },
          { label: "Comment ça marche" },
        ]}
        eyebrow="Parcours"
        title="Comment fonctionne Demeure Guinée ?"
        description="Un parcours simple, de la découverte publique à la gestion professionnelle après validation du rôle."
        containerClassName={styles.container}
      />

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Les étapes clés</h2>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            <Link href="/aide#guide-recherche" className={styles.primary}>
              Guide de recherche
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/demande-role" className={styles.secondary}>
              Demander un rôle
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
