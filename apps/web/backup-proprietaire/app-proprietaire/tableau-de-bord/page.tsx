"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FilePenLine,
  FileText,
  Heart,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import styles from "./page.module.css";

type Period = "7j" | "30j" | "90j";
type AnnouncementStatus =
  | "Publiée"
  | "Brouillon"
  | "En attente"
  | "Rejetée";

type PropertyItem = {
  id: number;
  slug: string;
  title: string;
  location: string;
  type: string;
  price: string;
  status: AnnouncementStatus;
  views: number;
  contacts: number;
  image: string;
};

const properties: PropertyItem[] = [
  {
    id: 1,
    slug: "villa-contemporaine-kipe",
    title: "Villa contemporaine avec jardin",
    location: "Kipé, Ratoma, Conakry",
    type: "Villa · Location",
    price: "4 500 000 GNF / mois",
    status: "Publiée",
    views: 642,
    contacts: 9,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=86",
  },
  {
    id: 2,
    slug: "appartement-moderne-lambanyi",
    title: "Appartement moderne et lumineux",
    location: "Lambanyi, Ratoma, Conakry",
    type: "Appartement · Vente",
    price: "950 000 000 GNF",
    status: "En attente",
    views: 0,
    contacts: 0,
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=86",
  },
  {
    id: 3,
    slug: "terrain-residentiel-sonfonia",
    title: "Terrain résidentiel bien situé",
    location: "Sonfonia, Ratoma, Conakry",
    type: "Terrain · Vente",
    price: "680 000 000 GNF",
    status: "Brouillon",
    views: 0,
    contacts: 0,
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=86",
  },
];

const performanceByPeriod = {
  "7j": {
    views: "328",
    contacts: "6",
    favorites: "14",
    rate: "1,8 %",
    change: "+12 %",
    bars: [32, 46, 41, 58, 53, 78, 68],
  },
  "30j": {
    views: "1 284",
    contacts: "17",
    favorites: "48",
    rate: "1,3 %",
    change: "+18 %",
    bars: [38, 51, 43, 63, 56, 72, 86],
  },
  "90j": {
    views: "3 906",
    contacts: "41",
    favorites: "126",
    rate: "1,1 %",
    change: "+27 %",
    bars: [44, 56, 50, 67, 61, 78, 94],
  },
};

const leads = [
  {
    id: 1,
    name: "Aïssatou Camara",
    initials: "AC",
    property: "Villa contemporaine avec jardin",
    date: "Aujourd’hui à 10:42",
    status: "Nouveau",
  },
  {
    id: 2,
    name: "Abdoulaye Bah",
    initials: "AB",
    property: "Villa contemporaine avec jardin",
    date: "Hier à 16:20",
    status: "En cours",
  },
  {
    id: 3,
    name: "Mariam Diallo",
    initials: "MD",
    property: "Appartement moderne et lumineux",
    date: "31 juillet à 09:15",
    status: "Traité",
  },
];

function statusClass(status: AnnouncementStatus) {
  if (status === "Publiée") return styles.statusPublished;
  if (status === "En attente") return styles.statusPending;
  if (status === "Rejetée") return styles.statusRejected;
  return styles.statusDraft;
}

export default function OwnerDashboardPage() {
  const [period, setPeriod] = useState<Period>("30j");
  const currentPerformance = useMemo(
    () => performanceByPeriod[period],
    [period],
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <Home size={21} aria-hidden="true" />
            </span>

            <span className={styles.logoText}>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </span>
          </Link>

          <div className={styles.headerSearch}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un bien ou une annonce..."
              aria-label="Rechercher dans l’espace propriétaire"
            />
          </div>

          <div className={styles.headerActions}>
            <Link
              href="/notifications"
              className={styles.notificationButton}
              aria-label="Voir les notifications"
            >
              <Bell size={20} aria-hidden="true" />
              <span>4</span>
            </Link>

            <div className={styles.accountSummary}>
              <span className={styles.smallAvatar}>MD</span>
              <div>
                <strong>Mamadou Diallo</strong>
                <small>Propriétaire vérifié</small>
              </div>
            </div>

            <button
              type="button"
              className={styles.mobileMenuButton}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav aria-label="Navigation de l’espace propriétaire">
            <span className={styles.navigationLabel}>
              Espace Propriétaire
            </span>

            <Link
              href="/proprietaire/tableau-de-bord"
              className={styles.activeNavLink}
            >
              <LayoutDashboard size={19} aria-hidden="true" />
              Tableau de bord
            </Link>

            <Link href="/proprietaire/biens" className={styles.navLink}>
              <Building2 size={19} aria-hidden="true" />
              Mes biens
              <span className={styles.navBadge}>5</span>
            </Link>

            <Link
              href="/proprietaire/annonces"
              className={styles.navLink}
            >
              <FileText size={19} aria-hidden="true" />
              Mes annonces
              <span className={styles.navBadge}>4</span>
            </Link>

            <Link
              href="/proprietaire/contacts"
              className={styles.navLink}
            >
              <MessageSquareText size={19} aria-hidden="true" />
              Contacts reçus
              <span className={styles.alertBadge}>3</span>
            </Link>

            <Link
              href="/proprietaire/statistiques"
              className={styles.navLink}
            >
              <BarChart3 size={19} aria-hidden="true" />
              Statistiques
            </Link>

            <span className={styles.navigationLabel}>
              Compte personnel
            </span>

            <Link href="/profil" className={styles.navLink}>
              <UserRound size={19} aria-hidden="true" />
              Mon profil
            </Link>

            <Link href="/favoris" className={styles.navLink}>
              <Heart size={19} aria-hidden="true" />
              Mes favoris
            </Link>

            <Link href="/notifications" className={styles.navLink}>
              <Bell size={19} aria-hidden="true" />
              Notifications
            </Link>
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.verifiedRole}>
              <ShieldCheck size={19} aria-hidden="true" />
              <div>
                <strong>Rôle approuvé</strong>
                <small>Compte actif</small>
              </div>
            </div>

            <Link href="/" className={styles.logoutLink}>
              <LogOut size={18} aria-hidden="true" />
              Se déconnecter
            </Link>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <span className={styles.eyebrow}>
                Tableau de bord Propriétaire
              </span>
              <h1>Bonjour Mamadou 👋</h1>
              <p>
                Gérez vos biens, suivez vos annonces et consultez les
                performances limitées à votre propre compte.
              </p>
            </div>

            <Link
              href="/proprietaire/biens/nouveau"
              className={styles.primaryAction}
            >
              <Plus size={18} aria-hidden="true" />
              Ajouter un bien
            </Link>
          </div>

          <section className={styles.roleBanner}>
            <span className={styles.roleBannerIcon}>
              <BadgeCheck size={25} aria-hidden="true" />
            </span>

            <div>
              <span>Rôle validé</span>
              <strong>Propriétaire actif</strong>
              <p>
                Vous pouvez créer et gérer uniquement vos propres biens
                et annonces, sous réserve de leur validation et du statut
                actif de votre compte.
              </p>
            </div>

            <Link href="/demande-role/suivi">
              Voir la validation
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <section className={styles.statsGrid}>
            <article>
              <span className={styles.statIcon}>
                <Building2 size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Mes biens</small>
                <strong>5</strong>
                <p>3 actifs · 2 brouillons</p>
              </div>
              <span className={styles.positiveTrend}>
                +1 ce mois
              </span>
            </article>

            <article>
              <span className={styles.statIcon}>
                <FileText size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Annonces publiées</small>
                <strong>2</strong>
                <p>1 en attente · 1 brouillon</p>
              </div>
              <span className={styles.neutralTrend}>
                4 au total
              </span>
            </article>

            <article>
              <span className={styles.statIcon}>
                <Eye size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Consultations</small>
                <strong>{currentPerformance.views}</strong>
                <p>Période sélectionnée</p>
              </div>
              <span className={styles.positiveTrend}>
                {currentPerformance.change}
              </span>
            </article>

            <article>
              <span className={styles.statIcon}>
                <MessageSquareText size={22} aria-hidden="true" />
              </span>
              <div>
                <small>Contacts reçus</small>
                <strong>{currentPerformance.contacts}</strong>
                <p>3 nécessitent une action</p>
              </div>
              <span className={styles.warningTrend}>
                À traiter
              </span>
            </article>
          </section>

          <section className={styles.actionsRequired}>
            <div className={styles.sectionHeading}>
              <div>
                <span>Priorités</span>
                <h2>Actions requises</h2>
              </div>
              <strong>3 éléments</strong>
            </div>

            <div className={styles.actionsGrid}>
              <article className={styles.actionWarning}>
                <span>
                  <FilePenLine size={21} aria-hidden="true" />
                </span>
                <div>
                  <small>Brouillon incomplet</small>
                  <strong>Terrain résidentiel à Sonfonia</strong>
                  <p>
                    Ajoutez au moins une image et complétez la surface.
                  </p>
                </div>
                <Link href="/proprietaire/biens/terrain-sonfonia/modifier">
                  Compléter
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>

              <article className={styles.actionPending}>
                <span>
                  <Clock3 size={21} aria-hidden="true" />
                </span>
                <div>
                  <small>En attente de modération</small>
                  <strong>Appartement moderne à Lambanyi</strong>
                  <p>
                    L’annonce a été soumise et attend une décision.
                  </p>
                </div>
                <Link href="/proprietaire/annonces">
                  Consulter
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>

              <article className={styles.actionLead}>
                <span>
                  <Inbox size={21} aria-hidden="true" />
                </span>
                <div>
                  <small>Nouveaux contacts</small>
                  <strong>3 demandes non traitées</strong>
                  <p>
                    Consultez les coordonnées autorisées et mettez à jour
                    le statut des leads.
                  </p>
                </div>
                <Link href="/proprietaire/contacts">
                  Traiter
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>
            </div>
          </section>

          <div className={styles.dashboardGrid}>
            <section className={styles.performanceCard}>
              <div className={styles.sectionHeading}>
                <div>
                  <span>Performance</span>
                  <h2>Visibilité de mes annonces</h2>
                </div>

                <div
                  className={styles.periodSwitcher}
                  role="group"
                  aria-label="Sélectionner la période"
                >
                  {(["7j", "30j", "90j"] as Period[]).map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          period === item
                            ? styles.activePeriod
                            : styles.periodButton
                        }
                        onClick={() => setPeriod(item)}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className={styles.performanceSummary}>
                <div>
                  <small>Consultations</small>
                  <strong>{currentPerformance.views}</strong>
                </div>
                <div>
                  <small>Contacts</small>
                  <strong>{currentPerformance.contacts}</strong>
                </div>
                <div>
                  <small>Favoris</small>
                  <strong>{currentPerformance.favorites}</strong>
                </div>
                <div>
                  <small>Taux de contact</small>
                  <strong>{currentPerformance.rate}</strong>
                </div>
              </div>

              <div
                className={styles.chart}
                aria-label="Graphique indicatif des consultations"
              >
                {currentPerformance.bars.map((height, index) => (
                  <div key={`${period}-${index}`}>
                    <span style={{ height: `${height}%` }} />
                    <small>
                      {period === "7j"
                        ? ["L", "M", "M", "J", "V", "S", "D"][index]
                        : `S${index + 1}`}
                    </small>
                  </div>
                ))}
              </div>

              <div className={styles.performanceFooter}>
                <span>
                  <TrendingUp size={17} aria-hidden="true" />
                  Progression de {currentPerformance.change} par rapport
                  à la période précédente
                </span>

                <Link href="/proprietaire/statistiques">
                  Voir les statistiques
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </section>

            <section className={styles.quickActionsCard}>
              <div className={styles.sectionHeading}>
                <div>
                  <span>Raccourcis</span>
                  <h2>Actions rapides</h2>
                </div>
              </div>

              <div className={styles.quickActions}>
                <Link href="/proprietaire/biens/nouveau">
                  <span>
                    <Plus size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Ajouter un bien</strong>
                    <small>Créer une nouvelle fiche immobilière</small>
                  </div>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>

                <Link href="/proprietaire/annonces">
                  <span>
                    <FileText size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Gérer les annonces</strong>
                    <small>Modifier les statuts et contenus</small>
                  </div>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>

                <Link href="/proprietaire/contacts">
                  <span>
                    <MessageSquareText
                      size={20}
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <strong>Voir les contacts</strong>
                    <small>Suivre les demandes reçues</small>
                  </div>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>

                <Link href="/proprietaire/statistiques">
                  <span>
                    <BarChart3 size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Analyser les performances</strong>
                    <small>Comprendre la visibilité des annonces</small>
                  </div>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>

          <section className={styles.propertiesSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span>Portefeuille personnel</span>
                <h2>Biens et annonces récents</h2>
              </div>

              <Link href="/proprietaire/biens">
                Voir tous les biens
                <ChevronRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.propertiesGrid}>
              {properties.map((property) => (
                <article key={property.id} className={styles.propertyCard}>
                  <div className={styles.propertyImageWrapper}>
                    <div
                      className={styles.propertyImage}
                      style={{
                        backgroundImage: `url("${property.image}")`,
                      }}
                      role="img"
                      aria-label={property.title}
                    />

                    <span
                      className={`${styles.propertyStatus} ${statusClass(
                        property.status,
                      )}`}
                    >
                      {property.status}
                    </span>

                    <button
                      type="button"
                      aria-label={`Options pour ${property.title}`}
                    >
                      <MoreHorizontal size={19} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.propertyContent}>
                    <span className={styles.propertyType}>
                      {property.type}
                    </span>
                    <h3>{property.title}</h3>

                    <p className={styles.location}>
                      <MapPin size={14} aria-hidden="true" />
                      {property.location}
                    </p>

                    <strong className={styles.price}>
                      {property.price}
                    </strong>

                    <div className={styles.propertyMetrics}>
                      <span>
                        <Eye size={15} aria-hidden="true" />
                        {property.views} vues
                      </span>
                      <span>
                        <MessageSquareText
                          size={15}
                          aria-hidden="true"
                        />
                        {property.contacts} contacts
                      </span>
                    </div>

                    <div className={styles.propertyFooter}>
                      <Link
                        href={`/proprietaire/biens/${property.slug}`}
                      >
                        Gérer le bien
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className={styles.bottomGrid}>
            <section className={styles.leadsCard}>
              <div className={styles.sectionHeading}>
                <div>
                  <span>Prospects</span>
                  <h2>Contacts récents</h2>
                </div>

                <Link href="/proprietaire/contacts">
                  Tout afficher
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
              </div>

              <div className={styles.leadsList}>
                {leads.map((lead) => (
                  <article key={lead.id}>
                    <span className={styles.leadAvatar}>
                      {lead.initials}
                    </span>

                    <div className={styles.leadContent}>
                      <strong>{lead.name}</strong>
                      <p>{lead.property}</p>
                      <span>{lead.date}</span>
                    </div>

                    <span
                      className={
                        lead.status === "Nouveau"
                          ? styles.leadNew
                          : lead.status === "En cours"
                            ? styles.leadProgress
                            : styles.leadDone
                      }
                    >
                      {lead.status}
                    </span>

                    <Link
                      href={`/proprietaire/contacts/${lead.id}`}
                      aria-label={`Ouvrir le contact ${lead.name}`}
                    >
                      <ChevronRight size={17} aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.accountCard}>
              <span className={styles.accountCardIcon}>
                <ShieldCheck size={27} aria-hidden="true" />
              </span>

              <span className={styles.cardEyebrow}>
                Sécurité et conformité
              </span>

              <h2>Compte Propriétaire actif</h2>

              <p>
                Votre rôle est approuvé. La publication reste soumise aux
                règles de complétude, de modération et au statut général
                du compte.
              </p>

              <ul>
                <li>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Identité vérifiée
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Rôle Propriétaire approuvé
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Compte actuellement actif
                </li>
              </ul>

              <Link href="/securite">
                Vérifier la sécurité
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          </div>

          <section className={styles.discoveryBanner}>
            <div>
              <span>
                <Sparkles size={18} aria-hidden="true" />
                Optimiser mes annonces
              </span>
              <h2>
                Des annonces complètes obtiennent une meilleure visibilité
              </h2>
              <p>
                Ajoutez des photos de qualité, une description précise et
                des caractéristiques cohérentes avant la soumission.
              </p>
            </div>

            <Link href="/aide">
              Consulter le guide
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        </section>
      </div>
    </main>
  );
}