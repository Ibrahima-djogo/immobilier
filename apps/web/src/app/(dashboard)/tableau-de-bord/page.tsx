import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import UserShell from "@/components/compte/UserShell";
import { DashboardFavoritesStat } from "./DashboardFavoritesStat";
import { DashboardMaterialOrders } from "./DashboardMaterialOrders";
import { DashboardOrdersStat } from "./DashboardOrdersStat";
import { DashboardRecentFavorites } from "./DashboardRecentFavorites";
import { DashboardWelcome } from "./DashboardWelcome";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <UserShell active="dashboard">
      <section className={styles.content}>
          <DashboardWelcome />

          <div className={styles.mainGrid}>
            <div className={styles.mainColumn}>
              <DashboardMaterialOrders />

              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span>Votre sélection</span>
                    <h2>Biens récemment enregistrés</h2>
                  </div>

                  <Link href="/favoris" className={styles.sectionLink}>
                    Tous mes favoris
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>

                <DashboardRecentFavorites />
              </section>

              <section className={styles.statsGrid} aria-label="Résumé du compte">
                <DashboardOrdersStat />
                <DashboardFavoritesStat />

                <article className={styles.statCard}>
                  <span className={styles.statIcon}>
                    <MessageSquareText size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <small>Demandes de contact</small>
                    <Link href="/demandes-contact">Voir les demandes</Link>
                  </div>
                </article>

                <article className={styles.statCard}>
                  <span className={styles.statIcon}>
                    <BadgeCheck size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <small>Rôle professionnel</small>
                    <Link href="/demande-role">Faire une demande</Link>
                  </div>
                </article>
              </section>
            </div>

            <aside className={styles.sideColumn}>
              <section className={styles.completionCard}>
                <div className={styles.completionHeading}>
                  <div>
                    <span>Profil</span>
                    <strong>Compléter vos informations</strong>
                  </div>
                </div>

                <p>
                  Ajoutez une photo et vérifiez vos coordonnées pour
                  faciliter le suivi de vos commandes.
                </p>

                <Link href="/profil">
                  Compléter mon profil
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </section>

              <section className={styles.securityCard}>
                <span>
                  <ShieldCheck size={22} aria-hidden="true" />
                </span>

                <div>
                  <h2>Sécurité du compte</h2>
                  <p>
                    Consultez les connexions récentes et modifiez votre
                    mot de passe.
                  </p>
                  <Link href="/securite">
                    Ouvrir la sécurité
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </section>

              <section className={styles.roleCard}>
                <span className={styles.roleIcon}>
                  <Building2 size={27} aria-hidden="true" />
                </span>

                <span className={styles.roleEyebrow}>
                  Publier un bien
                </span>

                <h2>Devenir propriétaire ou agence</h2>

                <p>
                  Pour publier et gérer des annonces, votre rôle
                  professionnel doit d’abord être examiné et validé.
                </p>

                <ul>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Choisir le rôle demandé
                  </li>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Fournir les justificatifs nécessaires
                  </li>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Suivre la décision depuis votre espace
                  </li>
                </ul>

                <Link href="/demande-role" className={styles.primaryButton}>
                  Commencer la demande
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>

                <small>
                  La publication reste bloquée jusqu’à l’approbation.
                </small>
              </section>
            </aside>
          </div>

          <section className={styles.discoverBanner}>
            <div>
              <span>
                <Sparkles size={18} aria-hidden="true" />
                Continuer votre recherche
              </span>
              <h2>Biens immobiliers et matériaux de construction</h2>
              <p>
                Explorez les annonces publiées ou le catalogue de matériaux,
                depuis le même compte.
              </p>
            </div>

            <div className={styles.discoverActions}>
              <Link href="/annonces" className={styles.primaryButton}>
                Explorer les annonces
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/materiaux" className={styles.outlineButton}>
                Découvrir les matériaux
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </section>
    </UserShell>
  );
}
