import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  House,
  LandPlot,
  LucideIcon,
  MapPin,
  MapPinned,
  ShieldCheck,
  Store,
  UserRoundCheck,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard } from "@/components/property/PropertyCard";
import { HomeHeroSearch } from "@/components/search/HomeHeroSearch";
import { propertiesData, neighborhoodsData, agenciesData } from "@/data/properties";
import styles from "./page.module.css";

const categories = [
  {
    name: "Maisons",
    slug: "maison",
    description: "Maisons familiales et résidences privées",
    count: "128 annonces",
    icon: House,
  },
  {
    name: "Appartements",
    slug: "appartement",
    description: "Studios et appartements modernes",
    count: "96 annonces",
    icon: Building2,
  },
  {
    name: "Villas",
    slug: "villa",
    description: "Villas de standing et résidences de luxe",
    count: "54 annonces",
    icon: House,
  },
  {
    name: "Terrains",
    slug: "terrain",
    description: "Parcelles et terrains constructibles",
    count: "82 annonces",
    icon: LandPlot,
  },
  {
    name: "Bureaux",
    slug: "bureau",
    description: "Espaces professionnels et bureaux",
    count: "36 annonces",
    icon: BriefcaseBusiness,
  },
  {
    name: "Commerces",
    slug: "commerce",
    description: "Boutiques et locaux commerciaux",
    count: "41 annonces",
    icon: Store,
  },
];

function backgroundImage(url: string): CSSProperties {
  return { backgroundImage: `url("${url}")` };
}

export default function HomePage() {
  const featuredProperties = propertiesData.slice(0, 6);

  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.hero}>
        <div className={styles.heroPattern} />

        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              <BadgeCheck size={17} aria-hidden="true" />
              Bienvenue chez Demeure Guinée
            </span>

            <h1 className={styles.heroTitle}>
              Trouvez le bien qui vous ressemble
              <span> en Guinée</span>
            </h1>

            <p className={styles.heroDescription}>
              Maisons, appartements, terrains, bureaux… Découvrez des biens
              vérifiés et trouvez votre prochaine demeure en toute confiance.
            </p>

            <div className={styles.heroHighlights}>
              <span>
                <ShieldCheck size={19} aria-hidden="true" />
                <span>
                  <strong>Annonces vérifiées</strong>
                  <small>Biens contrôlés</small>
                </span>
              </span>

              <span>
                <UserRoundCheck size={19} aria-hidden="true" />
                <span>
                  <strong>Agences fiables</strong>
                  <small>Professionnels certifiés</small>
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Interactive Search Form */}
      <HomeHeroSearch />

      <section className={styles.statisticsSection}>
        <div className={styles.container}>
          <div className={styles.statisticsGrid}>
            {[
              [House, "450+", "Biens disponibles"],
              [UserRoundCheck, "120+", "Annonceurs vérifiés"],
              [Building2, "35+", "Agences partenaires"],
              [MapPinned, "15", "Villes couvertes"],
            ].map(([Icon, value, label]) => {
              const StatisticIcon = Icon as LucideIcon;
              return (
                <article key={String(label)} className={styles.statistic}>
                  <span className={styles.statisticIcon}>
                    <StatisticIcon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{String(value)}</strong>
                    <span>{String(label)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.categoriesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionLabel}>Types de biens</span>
              <h2 className={styles.sectionTitle}>
                Commencez par la catégorie qui vous intéresse
              </h2>
            </div>
            <Link href="/annonces" className={styles.sectionLink}>
              Voir toutes les annonces
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.categoriesGrid}>
            {categories.map(({ icon: Icon, ...category }) => (
              <Link
                key={category.slug}
                href={`/annonces?categorie=${category.slug}`}
                className={styles.categoryCard}
              >
                <span className={styles.categoryIcon}>
                  <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <small>{category.count}</small>
                </div>
                <ArrowRight className={styles.categoryArrow} size={20} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.propertiesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionLabel}>Annonces récentes</span>
              <h2 className={styles.sectionTitle}>
                Des biens présentés avec de vraies photographies
              </h2>
            </div>
            <Link href="/annonces" className={styles.sectionLink}>
              Explorer les annonces
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.propertiesGrid}>
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} viewMode="grid" />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.neighborhoodsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionLabel}>Recherche locale</span>
              <h2 className={styles.sectionTitle}>Quartiers populaires à découvrir</h2>
            </div>
            <Link href="/annonces" className={styles.sectionLink}>
              Parcourir les localités
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.neighborhoodsGrid}>
            {neighborhoodsData.map((neighborhood) => (
              <Link
                key={neighborhood.name}
                href={`/annonces?quartier=${neighborhood.name.toLowerCase()}`}
                className={styles.neighborhoodCard}
                style={backgroundImage(neighborhood.image)}
              >
                <span className={styles.neighborhoodShade} />
                <div className={styles.neighborhoodContent}>
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {neighborhood.city}
                  </span>
                  <h3>{neighborhood.name}</h3>
                  <p>{neighborhood.count}</p>
                </div>
                <span className={styles.neighborhoodArrow}>
                  <ArrowRight size={20} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.agenciesSection}>
        <div className={styles.container}>
          <div className={styles.agenciesIntro}>
            <span className={styles.sectionLabel}>Professionnels vérifiés</span>
            <h2 className={styles.sectionTitle}>
              Trouvez une agence immobilière de confiance
            </h2>
            <p>
              Les agences affichées disposent d’un profil validé sur la plateforme Demeure Guinée.
            </p>
            <Link href="/agences" className={styles.agenciesMainLink}>
              Voir toutes les agences
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.agenciesGrid}>
            {agenciesData.map((agency) => (
              <article key={agency.name} className={styles.agencyCard}>
                <div className={styles.agencyLogo}>{agency.initials}</div>
                <div className={styles.agencyIdentity}>
                  <span className={styles.agencyVerified}>
                    <BadgeCheck size={15} aria-hidden="true" />
                    Agence vérifiée
                  </span>
                  <h3>{agency.name}</h3>
                  <p>
                    <MapPin size={15} aria-hidden="true" />
                    {agency.location}
                  </p>
                </div>
                <div className={styles.agencyFooter}>
                  <span>{agency.propertiesCount} annonces actives</span>
                  <Link href="/agences/exemple" aria-label={agency.name}>
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.trustSection}>
        <div className={styles.container}>
          <div className={styles.trustLayout}>
            <div>
              <span className={styles.sectionLabel}>Notre engagement</span>
              <h2 className={styles.sectionTitle}>
                Une plateforme conçue pour renforcer la confiance
              </h2>
              <p className={styles.trustDescription}>
                Publier une annonce n’est pas automatiquement autorisé. Un compte
                doit d’abord être validé comme Propriétaire ou Agence immobilière.
              </p>
            </div>

            <div className={styles.trustCards}>
              <article>
                <UserRoundCheck size={25} aria-hidden="true" />
                <h3>Profils contrôlés</h3>
                <p>Les annonceurs passent par une demande de rôle.</p>
              </article>
              <article>
                <ShieldCheck size={25} aria-hidden="true" />
                <h3>Modération</h3>
                <p>Les annonces suspectes peuvent être suspendues.</p>
              </article>
              <article>
                <MapPinned size={25} aria-hidden="true" />
                <h3>Localisation protégée</h3>
                <p>L’adresse exacte n’est pas affichée publiquement.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.cta}>
            <div>
              <span>Propriétaire ou agence immobilière ?</span>
              <h2>Présentez vos biens à de futurs clients</h2>
              <p>
                Créez votre compte, demandez la validation de votre rôle et
                commencez à gérer vos annonces.
              </p>
            </div>
            <div className={styles.ctaButtons}>
              <Link href="/inscription" className={styles.ctaPrimary}>Créer un compte</Link>
              <Link href="/demande-role" className={styles.ctaSecondary}>Demander un rôle</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}