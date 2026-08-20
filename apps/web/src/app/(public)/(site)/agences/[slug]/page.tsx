import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui";
import { propertiesData } from "@/data/properties";
import {
  siteContact,
  sitePhoneHref,
} from "@/lib/config/site-contact";
import { skipImageOptimization } from "@/lib/imageOptimization";
import { publicAgencies } from "@/lib/public/demo-data";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgencyPublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const agency = publicAgencies.find((item) => item.slug === slug);

  if (!agency) {
    notFound();
  }

  const matchedListings = propertiesData.filter(
    (property) =>
      property.agent?.name.toLowerCase() === agency.name.toLowerCase(),
  );

  const listings =
    matchedListings.length > 0
      ? matchedListings.slice(0, 3)
      : propertiesData.slice(0, 3);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image
          src={agency.image}
          alt=""
          fill
          sizes="100vw"
          className={styles.heroImage}
          unoptimized={skipImageOptimization(agency.image)}
          priority
        />
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.container}>
          <Link href="/agences" className={styles.back}>
            <ArrowLeft size={15} aria-hidden="true" />
            Toutes les agences
          </Link>

          <div className={styles.heroIdentity}>
            <span className={styles.mark}>{agency.initials}</span>
            <div>
              {agency.verified ? (
                <span className={styles.verified}>
                  <ShieldCheck size={14} aria-hidden="true" />
                  Agence vérifiée
                </span>
              ) : null}
              <h1>{agency.name}</h1>
              <p>
                <MapPin size={16} aria-hidden="true" />
                {agency.address}, {agency.city}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <ul className={styles.stats}>
            <li>
              <strong>{agency.ads}</strong>
              <span>Annonces publiques</span>
            </li>
            <li>
              <strong>{agency.properties}</strong>
              <span>Biens gérés</span>
            </li>
            <li>
              <strong>{agency.yearsActive}+</strong>
              <span>Années d’activité</span>
            </li>
            <li>
              <strong>{agency.specialties.length}</strong>
              <span>Spécialités</span>
            </li>
          </ul>

          <div className={styles.layout}>
            <div className={styles.main}>
              <section className={styles.panel}>
                <p className={styles.eyebrow}>Présentation</p>
                <h2>À propos de l’agence</h2>
                <p className={styles.about}>{agency.description}</p>
                <div className={styles.tags}>
                  {agency.specialties.map((specialty) => (
                    <span key={specialty}>{specialty}</span>
                  ))}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.listingsHead}>
                  <div>
                    <p className={styles.eyebrow}>Portefeuille</p>
                    <h2>Annonces de l’agence</h2>
                  </div>
                  <Button href="/annonces" variant="ghost" size="sm">
                    Voir le catalogue
                    <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                </div>

                <div className={styles.listingsGrid}>
                  {listings.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      viewMode="grid"
                    />
                  ))}
                </div>

                {matchedListings.length === 0 ? (
                  <p className={styles.listingsNote}>
                    Sélection illustrative issue du catalogue de démonstration.
                    Les annonces liées à l’agence seront branchées via l’API.
                  </p>
                ) : null}
              </section>
            </div>

            <aside className={styles.sidebar}>
              <section className={styles.contactCard}>
                <h2>Contacter via Demeure Guinée</h2>
                <p>
                  Les échanges et la mise en relation passent par Demeure Guinée.
                  Ne versez jamais d&apos;argent hors cadre contractuel.
                </p>

                {sitePhoneHref() ? (
                  <a href={sitePhoneHref()!}>
                    <Phone size={16} aria-hidden="true" />
                    {siteContact.phone || "Appeler Demeure Guinée"}
                  </a>
                ) : (
                  <span className={styles.contactUnavailable}>
                    <Phone size={16} aria-hidden="true" />
                    Contact momentanément indisponible
                  </span>
                )}
                {siteContact.email ? (
                  <a href={`mailto:${siteContact.email}`}>
                    <Mail size={16} aria-hidden="true" />
                    {siteContact.email}
                  </a>
                ) : null}

                <div className={styles.infoRow}>
                  <Clock3 size={16} aria-hidden="true" />
                  <div>
                    <strong>Horaires</strong>
                    <span>{agency.hours}</span>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <MapPin size={16} aria-hidden="true" />
                  <div>
                    <strong>Zone d&apos;activité</strong>
                    <span>
                      {agency.address}, {agency.city}
                    </span>
                  </div>
                </div>

                <Button href="/contact" variant="primary" fullWidth>
                  Contacter Demeure Guinée
                </Button>
              </section>

              <section className={styles.trustCard}>
                <ShieldCheck size={20} aria-hidden="true" />
                <h3>Confiance plateforme</h3>
                <p>
                  Le badge vérifié atteste que le rôle Agence a été validé sur
                  Demeure Guinée. Vérifiez toujours les documents officiels lors
                  d’une transaction.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
