import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  BriefcaseBusiness,
  Building2,
  House,
  LandPlot,
  MapPin,
  Quote,
  Ruler,
  ShieldCheck,
  Store,
  UserRoundCheck,
} from "lucide-react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { HomeHeroSearch } from "@/components/search/HomeHeroSearch";
import { Button, Chip, SectionHeading } from "@/components/ui";
import {
  agenciesData,
  neighborhoodsData,
  propertiesData,
} from "@/data/properties";
import { skipImageOptimization } from "@/lib/imageOptimization";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85";

const categories = [
  { name: "Maisons", slug: "maison", count: "128", icon: House },
  { name: "Appartements", slug: "appartement", count: "96", icon: Building2 },
  { name: "Villas", slug: "villa", count: "54", icon: House },
  { name: "Terrains", slug: "terrain", count: "82", icon: LandPlot },
  { name: "Bureaux", slug: "bureau", count: "36", icon: BriefcaseBusiness },
  { name: "Commerces", slug: "commerce", count: "41", icon: Store },
];

const reasons = [
  {
    title: "Annonceurs contrôlés",
    text: "La publication exige une validation de rôle Propriétaire ou Agence.",
  },
  {
    title: "Biens présentés clairement",
    text: "Photos, critères et localisation utiles pour comparer sans confusion.",
  },
  {
    title: "Recherche locale précise",
    text: "Filtrez par opération, typologie, quartier et budget en quelques gestes.",
  },
];

const testimonials = [
  {
    quote:
      "J’ai trouvé une villa à Kipé en moins d’une semaine. Les fiches sont claires et les contacts réactifs.",
    name: "Aïssatou Bah",
    role: "Locataire à Conakry",
  },
  {
    quote:
      "En tant qu’agence, la demande de rôle rassure nos clients. La plateforme met en avant des professionnels sérieux.",
    name: "Mamadou Camara",
    role: "Directeur, Horizon Immobilier",
  },
];

export default function HomePage() {
  const [spotlight, ...rest] = propertiesData;
  const featuredGrid = rest.slice(0, 3);
  const [leadAgency, ...otherAgencies] = agenciesData;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.heroImage}
          unoptimized={skipImageOptimization(HERO_IMAGE)}
        />
        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={styles.heroContainer}>
          <p className={styles.heroBrand}>Demeure Guinée</p>
          <h1 className={styles.heroTitle}>
            L’immobilier de confiance,
            <span> au rythme de la Guinée</span>
          </h1>
          <p className={styles.heroDescription}>
            Maisons, appartements, terrains et bureaux — des annonces claires
            pour acheter ou louer en toute sérénité.
          </p>
        </div>
      </section>

      <HomeHeroSearch />

      <section className={styles.statsBand} aria-label="Chiffres clés">
        <div className={styles.container}>
          <ul className={styles.statsList}>
            <li>
              <strong>450+</strong>
              <span>Biens disponibles</span>
            </li>
            <li>
              <strong>120+</strong>
              <span>Annonceurs vérifiés</span>
            </li>
            <li>
              <strong>35+</strong>
              <span>Agences partenaires</span>
            </li>
            <li>
              <strong>15</strong>
              <span>Villes couvertes</span>
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Biens en vedette"
            title="Sélection récente à découvrir"
            action={
              <Button href="/annonces" variant="ghost" size="sm">
                Toutes les annonces
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            }
          />

          {spotlight ? (
            <Link
              href={`/annonces/${spotlight.slug}`}
              className={styles.spotlight}
            >
              <div className={styles.spotlightMedia}>
                <Image
                  src={spotlight.image}
                  alt={spotlight.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 58vw"
                  className={styles.spotlightImage}
                  unoptimized={skipImageOptimization(spotlight.image)}
                />
                <span className={styles.spotlightShade} aria-hidden="true" />
                <span className={styles.spotlightOp}>{spotlight.operation}</span>
              </div>
              <div className={styles.spotlightBody}>
                <span className={styles.spotlightKicker}>
                  {spotlight.verified ? (
                    <>
                      <BadgeCheck size={15} aria-hidden="true" />
                      Annonce vérifiée
                    </>
                  ) : (
                    spotlight.category
                  )}
                </span>
                <h3>{spotlight.title}</h3>
                <p className={styles.spotlightLocation}>
                  <MapPin size={15} aria-hidden="true" />
                  {spotlight.location}
                </p>
                <p className={styles.spotlightPrice}>{spotlight.price}</p>
                <ul className={styles.spotlightMeta}>
                  <li>
                    <BedDouble size={15} aria-hidden="true" />
                    {spotlight.rooms} ch.
                  </li>
                  <li>
                    <Bath size={15} aria-hidden="true" />
                    {spotlight.bathrooms} sdb
                  </li>
                  <li>
                    <Ruler size={15} aria-hidden="true" />
                    {spotlight.area}
                  </li>
                </ul>
                <span className={styles.spotlightCta}>
                  Voir le bien
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ) : null}

          <div className={styles.featuredGrid}>
            {featuredGrid.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                viewMode="grid"
              />
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.whySection}`}>
        <div className={styles.container}>
          <div className={styles.whyLayout}>
            <div className={styles.whyCopy}>
              <SectionHeading
                eyebrow="Pourquoi Demeure Guinée"
                title="Une plateforme conçue pour la confiance"
                description="Moins de bruit, plus de clarté : des parcours simples pour les chercheurs de biens et des garde-fous pour les professionnels."
              />
              <ol className={styles.reasonList}>
                {reasons.map((reason, index) => (
                  <li key={reason.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{reason.title}</strong>
                      <p>{reason.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <aside className={styles.whyAside} aria-label="Engagements">
              <article>
                <ShieldCheck size={22} aria-hidden="true" />
                <h3>Modération active</h3>
                <p>Les contenus douteux peuvent être suspendus.</p>
              </article>
              <article>
                <UserRoundCheck size={22} aria-hidden="true" />
                <h3>Profils validés</h3>
                <p>Propriétaires et agences passent par une demande de rôle.</p>
              </article>
              <article>
                <MapPin size={22} aria-hidden="true" />
                <h3>Localisation utile</h3>
                <p>Quartier visible, adresse exacte protégée.</p>
              </article>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Explorer"
            title="Par type de bien ou par quartier"
            description="Commencez large, affinez ensuite. Les filtres restent disponibles sur la page annonces."
            action={
              <Button href="/annonces" variant="secondary" size="sm">
                Ouvrir la recherche
              </Button>
            }
          />

          <div className={styles.typeRow} role="list">
            {categories.map(({ icon: Icon, ...category }) => (
              <Chip
                key={category.slug}
                href={`/annonces?categorie=${category.slug}`}
                variant="forest"
                className={styles.typeChip}
              >
                <Icon size={16} aria-hidden="true" />
                {category.name}
                <small>{category.count}</small>
              </Chip>
            ))}
          </div>

          <div className={styles.neighborhoods}>
            {neighborhoodsData.map((neighborhood, index) => (
              <Link
                key={neighborhood.name}
                href={`/annonces?quartier=${neighborhood.name.toLowerCase()}`}
                className={`${styles.place} ${
                  index === 0 ? styles.placeLead : ""
                }`}
              >
                <Image
                  src={neighborhood.image}
                  alt={neighborhood.name}
                  fill
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  className={styles.placeImage}
                  unoptimized={skipImageOptimization(neighborhood.image)}
                />
                <span className={styles.placeShade} aria-hidden="true" />
                <div className={styles.placeCopy}>
                  <span>
                    <MapPin size={14} aria-hidden="true" />
                    {neighborhood.city}
                  </span>
                  <h3>{neighborhood.name}</h3>
                  <p>{neighborhood.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.agenciesSection}`}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Professionnels"
            title="Agences et experts à suivre"
            action={
              <Button href={routes.agencies} variant="ghost" size="sm">
                Toutes les agences
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            }
          />

          <div className={styles.agenciesLayout}>
            {leadAgency ? (
              <article className={styles.agencyLead}>
                <div className={styles.agencyLeadMark}>{leadAgency.initials}</div>
                <div>
                  <span className={styles.agencyVerified}>
                    <BadgeCheck size={15} aria-hidden="true" />
                    Agence vérifiée
                  </span>
                  <h3>{leadAgency.name}</h3>
                  <p>
                    <MapPin size={15} aria-hidden="true" />
                    {leadAgency.location}
                  </p>
                  <strong>{leadAgency.propertiesCount} annonces actives</strong>
                </div>
                <Button
                  href={routes.agency(leadAgency.slug)}
                  variant="secondary"
                  size="sm"
                >
                  Voir le profil
                </Button>
              </article>
            ) : null}

            <ul className={styles.agencyList}>
              {otherAgencies.map((agency) => (
                <li key={agency.slug}>
                  <span className={styles.agencyListMark}>{agency.initials}</span>
                  <div>
                    <strong>{agency.name}</strong>
                    <small>{agency.location}</small>
                  </div>
                  <span>{agency.propertiesCount} biens</span>
                  <Link
                    href={routes.agency(agency.slug)}
                    aria-label={`Voir le profil de ${agency.name}`}
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.trustSection}`}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Ils nous font confiance"
            title="La réassurance, en quelques mots"
            align="center"
          />

          <div className={styles.quotes}>
            {testimonials.map((item) => (
              <blockquote key={item.name} className={styles.quote}>
                <Quote size={28} aria-hidden="true" />
                <p>{item.quote}</p>
                <footer>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.cta}>
            <div>
              <p className={styles.ctaEyebrow}>Propriétaire ou agence ?</p>
              <h2>Présentez vos biens au bon public</h2>
              <p>
                Créez un compte, demandez la validation de votre rôle, puis
                publiez vos annonces en toute maîtrise.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Button href="/inscription" variant="primary" size="lg">
                Créer un compte
              </Button>
              <Button
                href="/demande-role"
                variant="secondary"
                size="lg"
                className={styles.ctaSecondary}
              >
                Demander un rôle
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
