import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  CheckCircle2,
  Compass,
  Home,
  KeyRound,
  Layers3,
  MapPin,
  Car,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trees,
} from "lucide-react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { ContactAgentCard } from "@/components/property/ContactAgentCard";
import { PropertyShareButton } from "@/components/property/PropertyShareButton";
import { Button, InfoField, InfoGrid } from "@/components/ui";
import { DEMO_API_URL } from "@/lib/demo-api/config";
import {
  formatGnf,
  mapDemoListingToProperty,
} from "@/lib/demo-api/mapToProperty";
import {
  describeRentalTerms,
  listingKindLabel,
} from "@/lib/listing/listingTerms";
import type {
  DemoBundle,
  DemoListing,
} from "@/lib/demo-api/listings";
import type { Property } from "@/types/property";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function fetchPublicBundle(slug: string): Promise<DemoBundle | null> {
  try {
    const res = await fetch(
      `${DEMO_API_URL}/listings/${encodeURIComponent(slug)}/bundle`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as DemoBundle;
  } catch {
    return null;
  }
}

async function fetchPublicListings(): Promise<DemoListing[]> {
  try {
    const res = await fetch(`${DEMO_API_URL}/listings?public=1`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as DemoListing[];
  } catch {
    return [];
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await fetchPublicBundle(slug);
  const listing = bundle?.listing;

  if (!listing || listing.status !== "PUBLIEE") {
    return (
      <main className={styles.page}>
        <div className={styles.notFound}>
          <Building2 size={40} aria-hidden="true" />
          <h1>Annonce introuvable</h1>
          <p>
            L&apos;annonce recherchée n&apos;existe pas, n&apos;est pas encore
            publiée, ou a été retirée.
          </p>
          <Button href="/annonces" variant="secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            Retour aux annonces
          </Button>
        </div>
      </main>
    );
  }

  const property: Property = mapDemoListingToProperty(
    listing,
    bundle?.property,
  );

  const publicList = await fetchPublicListings();
  const similarProperties = publicList
    .filter((item) => item.id !== listing.id)
    .map((item) => mapDemoListingToProperty(item))
    .sort((a, b) => {
      const aScore = a.categorySlug === property.categorySlug ? 1 : 0;
      const bScore = b.categorySlug === property.categorySlug ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, 3);

  const images =
    property.gallery && property.gallery.length > 0
      ? property.gallery
      : [property.image];

  const descriptionParagraphs = (
    property.description ||
    "Bien disponible dans un quartier recherché. Contactez Demeure Guinée pour organiser une visite."
  ).split("\n\n");

  const isRental = property.operationValue === "location";
  const rentalRows = describeRentalTerms(property.rentalTerms, formatGnf);

  const characteristics = [
    property.category
      ? { label: "Type", value: property.category, icon: Building2 }
      : null,
    property.saleTerms?.negotiable
      ? { label: "Prix négociable", value: "Oui", icon: Sparkles }
      : null,
    property.rooms !== undefined
      ? { label: "Chambres", value: `${property.rooms}`, icon: BedDouble }
      : null,
    property.bathrooms !== undefined
      ? { label: "Salles d’eau", value: `${property.bathrooms}`, icon: Bath }
      : null,
    { label: "Surface", value: property.area, icon: Ruler },
    property.landArea
      ? { label: "Terrain", value: property.landArea, icon: Trees }
      : null,
    property.levels
      ? { label: "Niveaux", value: property.levels, icon: Layers3 }
      : null,
    property.garage
      ? { label: "Stationnement", value: property.garage, icon: Car }
      : null,
    property.propertyStatus
      ? { label: "État", value: property.propertyStatus, icon: Home }
      : null,
    property.yearBuilt
      ? { label: "Année", value: property.yearBuilt, icon: CalendarClock }
      : null,
    property.availability
      ? {
          label: "Disponibilité",
          value: property.availability,
          icon: CalendarClock,
        }
      : null,
    property.reference
      ? { label: "Référence", value: property.reference, icon: ShieldCheck }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof Building2;
  }>;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <span>/</span>
            <Link href="/annonces">Annonces</Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>{property.category}</span>
          </nav>

          <div className={styles.topActions}>
            <PropertyShareButton />
            <Link href="/annonces" className={styles.actionButton}>
              <ArrowLeft size={16} aria-hidden="true" />
              Catalogue
            </Link>
          </div>
        </div>

        <PropertyGallery
          slug={property.slug}
          title={property.title}
          images={images}
          videos={property.videos}
          operation={property.operation}
          verified={property.verified}
        />

        <section className={styles.summary} aria-label="Résumé du bien">
          <div className={styles.summaryMain}>
            <p className={styles.locationLine}>
              <MapPin size={16} aria-hidden="true" />
              {property.location}
            </p>
            <h1>{property.title}</h1>
            <div className={styles.summaryMeta}>
              <span>{listingKindLabel(property.category, property.operationValue)}</span>
              {property.verified ? <span>Vérifiée</span> : null}
              <span>Publiée le {property.publishedDate}</span>
            </div>
          </div>

          <div className={styles.summaryAside}>
            <p className={styles.summaryPriceLabel}>
              {isRental ? "Loyer" : "Prix"}
            </p>
            <p className={styles.summaryPrice}>
              {property.price}
              {property.pricePeriod ? (
                <span className={styles.summaryPricePeriod}>
                  {" "}
                  {property.pricePeriod}
                </span>
              ) : null}
            </p>
            <a href="#contact-agent" className={styles.summaryCta}>
              Contacter l’annonceur
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        <ul className={styles.keyFacts}>
          {property.rooms !== undefined ? (
            <li>
              <BedDouble size={18} aria-hidden="true" />
              <div>
                <strong>{property.rooms}</strong>
                <span>Chambres</span>
              </div>
            </li>
          ) : null}
          {property.bathrooms !== undefined ? (
            <li>
              <Bath size={18} aria-hidden="true" />
              <div>
                <strong>{property.bathrooms}</strong>
                <span>Salles d’eau</span>
              </div>
            </li>
          ) : null}
          <li>
            <Ruler size={18} aria-hidden="true" />
            <div>
              <strong>{property.area}</strong>
              <span>Surface</span>
            </div>
          </li>
          <li>
            <Building2 size={18} aria-hidden="true" />
            <div>
              <strong>{property.category}</strong>
              <span>Typologie</span>
            </div>
          </li>
        </ul>

        <div className={styles.layout}>
          <div className={styles.content}>
            <section className={styles.block}>
              <h2>
                <Sparkles size={18} aria-hidden="true" />
                Description
              </h2>
              <div className={styles.description}>
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </section>

            {rentalRows.length > 0 ? (
              <section className={styles.block}>
                <h2>
                  <KeyRound size={18} aria-hidden="true" />
                  Conditions de location
                </h2>
                <dl className={styles.features}>
                  {rentalRows.map(({ label, value }) => (
                    <div key={label} className={styles.featureItem}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className={styles.disclaimer}>
                  Conditions déclarées par l’annonceur. Les usages indiqués ne
                  valent pas validation juridique de l’usage du terrain.
                </p>
              </section>
            ) : null}

            <section className={styles.block}>
              <h2>
                <Layers3 size={18} aria-hidden="true" />
                Caractéristiques
              </h2>
              <dl className={styles.features}>
                {characteristics.map(({ label, value, icon: Icon }) => (
                  <div key={label} className={styles.featureItem}>
                    <dt>
                      <Icon size={16} aria-hidden="true" />
                      {label}
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {property.amenities && property.amenities.length > 0 ? (
              <section className={styles.block}>
                <h2>
                  <ShieldCheck size={18} aria-hidden="true" />
                  Équipements
                </h2>
                <ul className={styles.amenities}>
                  {property.amenities.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className={styles.block}>
              <h2>
                <Compass size={18} aria-hidden="true" />
                Localisation
              </h2>
              <div className={styles.locationPanel}>
                <MapPin size={20} aria-hidden="true" />
                <div>
                  <InfoGrid>
                    <InfoField label="Ville" value={property.city} />
                    <InfoField label="Quartier" value={property.district} />
                  </InfoGrid>
                  <p>
                    L’adresse exacte est communiquée après confirmation de
                    visite avec Demeure Guinée, pour préserver la confidentialité
                    du bien.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside id="contact-agent" className={styles.sidebar}>
            <ContactAgentCard
              propertyTitle={property.title}
              price={property.price}
              agent={
                property.agent
                  ? {
                      name: property.agent.name,
                      agencyName: property.agent.agencyName,
                      initials: property.agent.initials,
                      verified: property.agent.verified,
                      accountType: property.agent.accountType,
                      unavailable: property.agent.unavailable,
                    }
                  : undefined
              }
              listing={{
                id: listing.id,
                propertyId: listing.propertyId,
                slug: listing.slug,
                title: listing.title,
                reference: listing.reference,
                type: listing.type,
                operation:
                  listing.operation === "LOCATION" ? "Location" : "Vente",
                city: property.city,
                district: property.district,
              }}
            />
          </aside>
        </div>

        {similarProperties.length > 0 ? (
          <section className={styles.similar}>
            <div className={styles.similarHeader}>
              <div>
                <p className={styles.eyebrow}>À découvrir aussi</p>
                <h2>Biens similaires</h2>
              </div>
              <Button href="/annonces" variant="ghost" size="sm">
                Voir le catalogue
                <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </div>
            <div className={styles.similarGrid}>
              {similarProperties.map((item) => (
                <PropertyCard
                  key={item.id}
                  property={item}
                  viewMode="grid"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
