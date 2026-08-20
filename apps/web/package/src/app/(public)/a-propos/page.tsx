import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPinned,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <InstitutionalShell active="a-propos">
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Notre mission</span>
          <h1>Rendre la recherche immobilière plus claire et plus fiable</h1>
          <p>
            Demeure Guinée rapproche les personnes qui recherchent un bien des
            propriétaires et agences dont le rôle professionnel a été validé.
          </p>
          <div className={styles.actions}>
            <Link href="/annonces">Explorer les annonces <ArrowRight size={16} /></Link>
            <Link href="/inscription">Créer un compte</Link>
          </div>
        </div>
      </section>

      <section className={styles.mission}>
        <div className={styles.container}>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>Pourquoi Demeure Guinée ?</span>
            <h2>Une plateforme structurée autour de la confiance</h2>
          </div>

          <div className={styles.values}>
            <article className={styles.card}>
              <span><Search size={25} /></span>
              <h3>Recherche accessible</h3>
              <p>Consulter et filtrer les annonces publiques sans créer de compte.</p>
            </article>
            <article className={styles.card}>
              <span><ShieldCheck size={25} /></span>
              <h3>Annonceurs contrôlés</h3>
              <p>La publication reste réservée aux rôles Propriétaire et Agence validés.</p>
            </article>
            <article className={styles.card}>
              <span><MapPinned size={25} /></span>
              <h3>Localisation protégée</h3>
              <p>L’adresse précise ne doit pas être exposée publiquement par défaut.</p>
            </article>
            <article className={styles.card}>
              <span><CheckCircle2 size={25} /></span>
              <h3>Modération traçable</h3>
              <p>Les décisions importantes utilisent des statuts, des motifs et un historique.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.roles}>
        <div className={styles.container}>
          <div className={styles.roleIntro}>
            <span className={styles.eyebrow}>Les acteurs</span>
            <h2>Des espaces adaptés à chaque profil</h2>
            <p>Les fonctions disponibles dépendent du rôle, du statut du compte et du périmètre autorisé.</p>
          </div>
          <div className={styles.roleGrid}>
            <article><Users size={24} /><strong>Utilisateur</strong><p>Profil, favoris et demandes de contact.</p></article>
            <article><Building2 size={24} /><strong>Propriétaire</strong><p>Gestion de ses propres biens et annonces.</p></article>
            <article><Building2 size={24} /><strong>Agence</strong><p>Gestion d’un portefeuille professionnel validé.</p></article>
            <article><ShieldCheck size={24} /><strong>Administration</strong><p>Contrôle, modération, référentiels et audit.</p></article>
          </div>
        </div>
      </section>
    </InstitutionalShell>
  );
}
