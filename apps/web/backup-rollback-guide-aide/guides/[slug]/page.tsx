"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useParams } from "next/navigation";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import { guideItems } from "@/lib/public/demo-data";
import styles from "./page.module.css";

const steps: Record<string, string[]> = {
  "rechercher-un-bien": [
    "Ouvrez la page Annonces depuis l’accueil.",
    "Choisissez une ville, un quartier, une opération et un budget.",
    "Combinez les filtres puis triez les résultats.",
    "Ouvrez une fiche et vérifiez les informations publiques.",
  ],
  "creer-un-compte": [
    "Ouvrez la page Inscription.",
    "Renseignez des coordonnées exactes et un mot de passe robuste.",
    "Acceptez les conditions obligatoires séparément du marketing.",
    "Validez vos coordonnées lorsque l’API de vérification sera connectée.",
  ],
  "demander-role": [
    "Créez d’abord un compte standard.",
    "Choisissez Propriétaire ou Agence.",
    "Ajoutez les informations et justificatifs demandés.",
    "Soumettez puis suivez les statuts de la demande.",
  ],
  "publier-annonce": [
    "Créez la fiche du bien dans votre espace professionnel.",
    "Complétez les caractéristiques, médias et documents.",
    "Créez une annonce distincte rattachée au bien.",
    "Soumettez-la à la modération et corrigez-la si nécessaire.",
  ],
  "signaler-contenu": [
    "Ouvrez la fiche de l’annonce concernée.",
    "Choisissez un motif précis.",
    "Ajoutez des éléments factuels sans données excessives.",
    "Suivez la confirmation sans exposer votre identité à l’annonceur.",
  ],
};

export default function GuideDetailPage() {
  const params = useParams<{ slug: string }>();
  const guide = guideItems.find((item) => item.slug === params.slug) ?? guideItems[0];
  const guideSteps = steps[guide.slug] ?? steps["rechercher-un-bien"];

  return (
    <InstitutionalShell active="aide">
      <section className={styles.hero}>
        <div className={styles.container}>
          <Link href="/guides" className={styles.back}><ArrowLeft size={15} />Tous les guides</Link>
          <span className={styles.eyebrow}>{guide.profile}</span>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
          <span className={styles.duration}><Clock3 size={15} />Lecture estimée : {guide.duration}</span>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <article className={styles.card}>
            <h2>Étapes recommandées</h2>
            <ol>
              {guideSteps.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <div><strong>{step}</strong><p>Cette étape sera reliée aux données réelles lors de l’intégration de l’API.</p></div>
                </li>
              ))}
            </ol>

            <div className={styles.tip}>
              <CheckCircle2 size={20} />
              <p>
                Vérifiez toujours les informations affichées et ne transmettez
                jamais de mot de passe ou de code temporaire à un tiers.
              </p>
            </div>
          </article>

          <aside className={styles.next}>
            <strong>Continuer</strong>
            <p>Consultez le centre d’aide ou contactez l’assistance.</p>
            <Link href="/aide">Centre d’aide <ArrowRight size={14} /></Link>
            <Link href="/contact">Contacter l’assistance <ArrowRight size={14} /></Link>
          </aside>
        </div>
      </section>
    </InstitutionalShell>
  );
}
