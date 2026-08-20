import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Heart,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { DashboardRecentFavorites } from "./DashboardRecentFavorites";
import styles from "./page.module.css";

const favoriteProperties = [
  {
    slug: "villa-contemporaine-kipe",
    title: "Villa contemporaine avec jardin",
    location: "Kipé, Conakry",
    price: "4 500 000 GNF / mois",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=84",
  },
  {
    slug: "appartement-moderne-lambanyi",
    title: "Appartement moderne et lumineux",
    location: "Lambanyi, Conakry",
    price: "950 000 000 GNF",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=84",
  },
];

const recentActivities = [
  {
    icon: Heart,
    title: "Bien ajouté aux favoris",
    description: "Villa contemporaine avec jardin à Kipé",
    date: "Aujourd’hui, 10:42",
  },
  {
    icon: MessageSquareText,
    title: "Demande de contact envoyée",
    description: "Appartement moderne à Lambanyi",
    date: "Hier, 16:18",
  },
  {
    icon: ShieldCheck,
    title: "Coordonnées vérifiées",
    description: "Votre e-mail et votre téléphone sont confirmés",
    date: "29 juillet 2026",
  },
];

export default function DashboardPage() {
  return (
    <UserShell active="dashboard">
      <section className={styles.content}>
          <PageHero
            variant="dashboard"
            eyebrow="Espace personnel"
            title="Bonjour Mamadou"
            description="Retrouvez vos favoris, vos demandes et les actions importantes liées à votre compte."
            icon={<Sparkles size={16} aria-hidden="true" />}
            actions={
              <div className={styles.currentDate}>
                <CalendarDays size={20} aria-hidden="true" />
                <div>
                  <small>Aujourd’hui</small>
                  <strong>31 juillet 2026</strong>
                </div>
              </div>
            }
          />

          <section className={styles.statusBanner}>
            <div className={styles.statusIcon}>
              <CheckCircle2 size={25} aria-hidden="true" />
            </div>

            <div className={styles.statusContent}>
              <span>État du compte</span>
              <h2>Votre compte standard est actif</h2>
              <p>
                Vous pouvez gérer votre profil, enregistrer des favoris
                et envoyer des demandes de contact.
              </p>
            </div>

            <Link href="/profil" className={styles.outlineButton}>
              Vérifier mon profil
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>

          <section className={styles.statsGrid} aria-label="Résumé du compte">
            <article className={styles.statCard}>
              <span className={styles.statIcon}>
                <Heart size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Biens favoris</small>
                <strong>2</strong>
                <Link href="/favoris">Voir mes favoris</Link>
              </div>
            </article>

            <article className={styles.statCard}>
              <span className={styles.statIcon}>
                <MessageSquareText size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Demandes envoyées</small>
                <strong>1</strong>
                <Link href="/demandes-contact">Voir les demandes</Link>
              </div>
            </article>

            <article className={styles.statCard}>
              <span className={styles.statIcon}>
                <Bell size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Nouvelles notifications</small>
                <strong>3</strong>
                <Link href="/notifications">Les consulter</Link>
              </div>
            </article>

            <article className={styles.statCard}>
              <span className={styles.statIcon}>
                <BadgeCheck size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Rôle professionnel</small>
                <strong className={styles.statusText}>Non demandé</strong>
                <Link href="/demande-role">Faire une demande</Link>
              </div>
            </article>
          </section>

          <div className={styles.mainGrid}>
            <div className={styles.mainColumn}>
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

                <DashboardRecentFavorites items={favoriteProperties} />
              </section>

              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span>Historique récent</span>
                    <h2>Activité de votre compte</h2>
                  </div>
                </div>

                <div className={styles.activityList}>
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon;

                    return (
                      <article key={activity.title} className={styles.activityItem}>
                        <span className={styles.activityIcon}>
                          <Icon size={19} aria-hidden="true" />
                        </span>

                        <div>
                          <strong>{activity.title}</strong>
                          <p>{activity.description}</p>
                        </div>

                        <time>{activity.date}</time>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className={styles.sideColumn}>
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

              <section className={styles.completionCard}>
                <div className={styles.completionHeading}>
                  <div>
                    <span>Profil</span>
                    <strong>75 % complété</strong>
                  </div>
                  <span className={styles.completionCircle}>75%</span>
                </div>

                <div
                  className={styles.progressBar}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={75}
                  aria-label="Profil complété à 75 pour cent"
                >
                  <span />
                </div>

                <ul>
                  <li className={styles.completedItem}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    Coordonnées vérifiées
                  </li>
                  <li className={styles.completedItem}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    Informations personnelles
                  </li>
                  <li>
                    <Clock3 size={16} aria-hidden="true" />
                    Ajouter une photo de profil
                  </li>
                </ul>

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
            </aside>
          </div>

          <section className={styles.discoverBanner}>
            <div>
              <span>
                <Sparkles size={18} aria-hidden="true" />
                Continuer votre recherche
              </span>
              <h2>Découvrez les dernières annonces disponibles</h2>
              <p>
                Explorez les biens publiés à Conakry et dans les autres
                villes couvertes.
              </p>
            </div>

            <Link href="/annonces" className={styles.primaryButton}>
              Explorer les annonces
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        </section>
    </UserShell>
  );
}