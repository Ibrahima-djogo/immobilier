import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  BrickWall,
  BriefcaseBusiness,
  Building2,
  Handshake,
  House,
  LandPlot,
  MapPin,
  Quote,
  Ruler,
  ShieldCheck,
  Store,
} from "lucide-react";

import { MaterialCard } from "@/components/materiaux/MaterialCard";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyPhoto } from "@/components/property/PropertyPhoto";
import { HomeHeroSearch } from "@/components/search/HomeHeroSearch";
import { Button, Chip, SectionHeading } from "@/components/ui";
import { agenciesData, neighborhoodsData } from "@/data/properties";
import { pickHomeListings } from "@/lib/home/featured-listings";
import { listingService } from "@/lib/demo-api/listings";
import { skipImageOptimization } from "@/lib/imageOptimization";
import { loadPublicCatalog } from "@/lib/materiaux/catalog-source";
import type { PublicMaterial } from "@/lib/materiaux/types";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85";

const HOME_MATERIAL_SLUGS = [
  "ciment-42-5",
  "fer-a-beton-12-mm",
  "peinture-interieure-20-l",
  "tuyau-pvc-100-mm",
] as const;

const categories = [
  { name: "Maisons", slug: "maison", count: "128", icon: House },
  { name: "Appartements", slug: "appartement", count: "96", icon: Building2 },
  { name: "Villas", slug: "villa", count: "54", icon: House },
  { name: "Terrains", slug: "terrain", count: "82", icon: LandPlot },
  { name: "Bureaux", slug: "bureau", count: "36", icon: BriefcaseBusiness },
  { name: "Commerces", slug: "commerce", count: "41", icon: Store },
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Vérification des biens",
    text: "Des parcours de contrôle pour renforcer la confiance avant de s’engager.",
  },
  {
    icon: House,
    title: "Large choix immobilier",
    text: "Maisons, terrains et appartements présentés clairement, à vendre ou à louer.",
  },
  {
    icon: BrickWall,
    title: "Matériaux sélectionnés",
    text: "Un catalogue utile pour accompagner les constructions et les chantiers.",
  },
  {
    icon: Handshake,
    title: "Accompagnement local",
    text: "Une plateforme pensée pour les projets habitat en Guinée.",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Trouver votre terrain ou logement",
    text: "Explorez les annonces vérifiées pour acheter ou louer.",
  },
  {
    step: "02",
    title: "Vérifier votre projet",
    text: "Comparez les fiches, la localisation et les informations utiles.",
  },
  {
    step: "03",
    title: "Choisir vos matériaux",
    text: "Consultez le catalogue pour préparer votre chantier.",
  },
  {
    step: "04",
    title: "Construire votre habitat",
    text: "Passez de la recherche à la réalisation, au même endroit.",
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

function pickHomeMaterials(materials: PublicMaterial[]) {
  const featured = HOME_MATERIAL_SLUGS.map((slug) =>
    materials.find((item) => item.slug === slug),
  ).filter((item): item is PublicMaterial => Boolean(item));
  return featured.length > 0 ? featured : materials.slice(0, 4);
}

export default async function HomePage() {
  const [listingsResult, catalogResult] = await Promise.allSettled([
    listingService.list({ publicOnly: true }),
    loadPublicCatalog(),
  ]);

  const featuredProperties =
    listingsResult.status === "fulfilled"
      ? pickHomeListings(listingsResult.value)
      : [];
  const [spotlight, ...featuredGrid] = featuredProperties;

  const homeMaterials =
    catalogResult.status === "fulfilled"
      ? pickHomeMaterials(catalogResult.value.materials)
      : [];

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
            Votre plateforme pour trouver, construire
            <span> et sécuriser votre habitat en Guinée</span>
          </h1>
          <p className={styles.heroDescription}>
            Immobilier et matériaux de construction, réunis pour accompagner
            tout votre projet habitat — de la recherche du bien jusqu’au
            chantier.
          </p>

          <div className={styles.heroEntries}>
            <Link href={routes.listings} className={styles.heroEntry}>
              <span className={styles.heroEntryIcon} aria-hidden="true">
                <House size={22} />
              </span>
              <div>
                <strong>Trouver un bien</strong>
                <p>Maison · Terrain · Appartement</p>
              </div>
              <span className={styles.heroEntryLinks}>
                <span>Acheter</span>
                <span>Louer</span>
              </span>
            </Link>
            <Link href={routes.materials} className={styles.heroEntry}>
              <span className={styles.heroEntryIcon} aria-hidden="true">
                <BrickWall size={22} />
              </span>
              <div>
                <strong>Construire mon projet</strong>
                <p>Matériaux · Fournisseurs · Solutions construction</p>
              </div>
              <span className={styles.heroEntryLinks}>
                <span>Catalogue</span>
              </span>
            </Link>
          </div>
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
            eyebrow="Immobilier"
            title="Les biens immobiliers populaires"
            description="Une sélection récente issue des annonces publiées."
            action={
              <Button href={routes.listings} variant="ghost" size="sm">
                Toutes les annonces
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            }
          />

          {spotlight ? (
            <Link
              href={routes.publicProperty(spotlight.slug)}
              className={styles.spotlight}
            >
              <div className={styles.spotlightMedia}>
                <PropertyPhoto
                  imageUrl={spotlight.image}
                  alt={spotlight.title}
                  sizes="(max-width: 900px) 100vw, 58vw"
                  className={styles.spotlightImage}
                />
                <span className={styles.spotlightShade} aria-hidden="true" />
                <span className={styles.spotlightOp}>{spotlight.operation}</span>
              </div>
              <div className={styles.spotlightBody}>
                <span className={styles.spotlightKicker}>
                  {spotlight.category}
                  {spotlight.verified ? (
                    <>
                      <BadgeCheck size={15} aria-hidden="true" />
                      Annonce vérifiée
                    </>
                  ) : null}
                </span>
                <h3>{spotlight.title}</h3>
                <p className={styles.spotlightLocation}>
                  <MapPin size={15} aria-hidden="true" />
                  {spotlight.location}
                </p>
                <p className={styles.spotlightPrice}>{spotlight.price}</p>
                <ul className={styles.spotlightMeta}>
                  {spotlight.rooms ? (
                    <li>
                      <BedDouble size={15} aria-hidden="true" />
                      {spotlight.rooms} ch.
                    </li>
                  ) : null}
                  {spotlight.bathrooms ? (
                    <li>
                      <Bath size={15} aria-hidden="true" />
                      {spotlight.bathrooms} sdb
                    </li>
                  ) : null}
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
          ) : (
            <p className={styles.emptyNote}>
              Les annonces publiées apparaîtront ici dès qu’elles seront
              disponibles.
            </p>
          )}

          {featuredGrid.length > 0 ? (
            <div className={styles.featuredGrid}>
              {featuredGrid.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  viewMode="grid"
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${styles.section} ${styles.materialsSection}`}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Construction"
            title="Matériaux disponibles pour vos projets"
            description="Une lecture du catalogue actuel, sans commande à ce stade."
            action={
              <Button href={routes.materials} variant="ghost" size="sm">
                Voir tous les matériaux
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            }
          />

          {homeMaterials.length > 0 ? (
            <div className={styles.materialsGrid}>
              {homeMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>
              Le catalogue matériaux n’est pas disponible pour le moment.
            </p>
          )}

          <div className={styles.materialsCta}>
            <Button href={routes.materials} variant="secondary">
              Voir tous les matériaux
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.whySection}`}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Confiance"
            title="Pourquoi choisir Demeure Guinée ?"
            description="Une plateforme habitat : trouver un bien, sécuriser son projet, puis préparer la construction."
            align="center"
          />
          <div className={styles.trustGrid}>
            {trustItems.map(({ icon: Icon, title, text }) => (
              <article key={title} className={styles.trustCard}>
                <span className={styles.trustIcon} aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Parcours"
            title="Votre projet habitat de A à Z"
            description="Quatre étapes simples, du premier bien jusqu’au chantier."
          />
          <ol className={styles.journey}>
            {journeySteps.map((item) => (
              <li key={item.step}>
                <span>{item.step}</span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Explorer"
            title="Par type de bien ou par quartier"
            description="Commencez large, affinez ensuite. Les filtres restent disponibles sur la page annonces."
            action={
              <Button href={routes.listings} variant="secondary" size="sm">
                Ouvrir la recherche
              </Button>
            }
          />

          <div className={styles.typeRow} role="list">
            {categories.map(({ icon: Icon, ...category }) => (
              <Chip
                key={category.slug}
                href={`${routes.listings}?categorie=${category.slug}`}
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
                href={`${routes.listings}?quartier=${neighborhood.name.toLowerCase()}`}
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

      <section className={`${styles.section} ${styles.quotesSection}`}>
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
