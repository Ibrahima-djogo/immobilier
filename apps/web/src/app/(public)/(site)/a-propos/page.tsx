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

import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <main>
      <PublicPageHeader
        crumbs={[
          { href: "/", label: "Accueil" },
          { label: "À propos" },
        ]}
        eyebrow="Notre mission"
        title="Rendre la recherche immobilière plus claire et plus fiable"
        description="Demeure Guinée rapproche les personnes qui recherchent un bien des propriétaires et agences dont le rôle professionnel a été validé."
        containerClassName={styles.container}
        actions={
          <div className={styles.actions}>
            <Link href="/annonces">
              Explorer les annonces <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/inscription">Créer un compte</Link>
          </div>
        }
      />

      <section className={styles.mission}>
        <div className={styles.container}>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>Pourquoi Demeure Guinée ?</span>
            <h2>Une plateforme structurée autour de la confiance</h2>
          </div>

          <div className={styles.values}>
            <article className={styles.card}>
              <span>
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <h3>Rôles vérifiés</h3>
              <p>
                Les profils propriétaire et agence passent par une vérification
                interne avant activation.
              </p>
            </article>
            <article className={styles.card}>
              <span>
                <Search size={20} aria-hidden="true" />
              </span>
              <h3>Recherche claire</h3>
              <p>
                Des fiches structurées pour comparer les biens sans confusion.
              </p>
            </article>
            <article className={styles.card}>
              <span>
                <Users size={20} aria-hidden="true" />
              </span>
              <h3>Intermédiation</h3>
              <p>
                Demeure Guinée reste l’intermédiaire commercial entre visiteurs
                et annonceurs.
              </p>
            </article>
            <article className={styles.card}>
              <span>
                <CheckCircle2 size={20} aria-hidden="true" />
              </span>
              <h3>Traçabilité</h3>
              <p>
                Un parcours documenté pour comprendre l’état d’un compte ou
                d’une demande.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.roles}>
        <div className={styles.container}>
          <div className={styles.roleIntro}>
            <span className={styles.eyebrow}>Les acteurs</span>
            <h2>Un écosystème pour chaque besoin</h2>
            <p>
              Chaque rôle dispose d’un espace adapté, sans mélanger les
              responsabilités.
            </p>
          </div>

          <div className={styles.roleGrid}>
            <article>
              <Building2 size={18} aria-hidden="true" />
              <strong>Agences</strong>
              <p>Publiez et suivez votre portefeuille professionnel.</p>
            </article>
            <article>
              <MapPinned size={18} aria-hidden="true" />
              <strong>Propriétaires</strong>
              <p>Valorisez vos biens après validation de votre compte.</p>
            </article>
            <article>
              <Search size={18} aria-hidden="true" />
              <strong>Acheteurs</strong>
              <p>Explorez, comparez et contactez via la plateforme.</p>
            </article>
            <article>
              <Users size={18} aria-hidden="true" />
              <strong>Locataires</strong>
              <p>Trouvez une location claire et un interlocuteur fiable.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
