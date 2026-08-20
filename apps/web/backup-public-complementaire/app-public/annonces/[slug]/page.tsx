import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CheckCircle,
  Clock,
  Compass,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { ContactAgentCard } from "@/components/property/ContactAgentCard";
import { PropertyShareButton } from "@/components/property/PropertyShareButton";
import { propertiesData } from "@/data/properties";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const property = propertiesData.find((p) => p.slug === slug);

  if (!property) {
    return (
      <main className={styles.page}>
        <Header />
        <div className={styles.container} style={{ padding: "80px 0", textAlign: "center" }}>
          <Building2 size={48} color="#2b6248" style={{ marginBottom: "16px" }} />
          <h1 style={{ fontSize: "1.6rem", color: "#0a2319", marginBottom: "12px" }}>
            Annonce introuvable
          </h1>
          <p style={{ color: "#5b6861", marginBottom: "24px" }}>
            L&apos;annonce que vous recherchez n&apos;existe pas ou a été retirée.
          </p>
          <Link
            href="/annonces"
            className={styles.actionHeaderButton}
            style={{ display: "inline-flex", textDecoration: "none" }}
          >
            <ArrowLeft size={16} />
            Retourner aux annonces
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Similar properties (same category or general)
  const similarProperties = propertiesData
    .filter((p) => p.id !== property.id)
    .slice(0, 3);

  const images = property.gallery && property.gallery.length > 0
    ? property.gallery
    : [property.image];

  return (
    <main className={styles.page}>
      <Header />

      <div className={styles.container}>
        {/* Top Header Bar */}
        <div className={styles.topHeaderBar}>
          <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <span>/</span>
            <Link href="/annonces">Annonces</Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>{property.title}</span>
          </nav>

          <div className={styles.headerActions}>
            <PropertyShareButton />
            <Link
              href="/annonces"
              className={styles.actionHeaderButton}
              style={{ textDecoration: "none" }}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Toutes les annonces
            </Link>
          </div>
        </div>

        {/* Hero Gallery */}
        <PropertyGallery
          title={property.title}
          images={images}
          operation={property.operation}
          verified={property.verified}
        />

        {/* Main 2-Column Details Layout */}
        <div className={styles.mainDetailsGrid}>
          {/* Left Main Content */}
          <div className={styles.contentColumn}>
            <div className={styles.titleSection}>
              <div className={styles.locationRow}>
                <MapPin size={16} aria-hidden="true" />
                <span>{property.location}</span>
              </div>

              <h1 className={styles.propertyMainTitle}>{property.title}</h1>

              <div className={styles.keySpecsGrid}>
                {property.rooms !== undefined && (
                  <div className={styles.specCard}>
                    <BedDouble size={22} aria-hidden="true" />
                    <div className={styles.specInfo}>
                      <strong>{property.rooms} chambres</strong>
                      <span>Pièces de nuit</span>
                    </div>
                  </div>
                )}

                {property.bathrooms !== undefined && (
                  <div className={styles.specCard}>
                    <Bath size={22} aria-hidden="true" />
                    <div className={styles.specInfo}>
                      <strong>{property.bathrooms} sdb</strong>
                      <span>Salles d&apos;eau</span>
                    </div>
                  </div>
                )}

                <div className={styles.specCard}>
                  <Ruler size={22} aria-hidden="true" />
                  <div className={styles.specInfo}>
                    <strong>{property.area}</strong>
                    <span>Surface habitable</span>
                  </div>
                </div>

                <div className={styles.specCard}>
                  <Building2 size={22} aria-hidden="true" />
                  <div className={styles.specInfo}>
                    <strong>{property.category}</strong>
                    <span>Type de bien</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <section className={styles.sectionBlock}>
              <h3>
                <Sparkles size={20} aria-hidden="true" />
                À propos de ce bien
              </h3>
              <p className={styles.descriptionText}>
                {property.description ||
                  "Superbe bien disponible dans un quartier calme et recherché de la Guinée. Proche de toutes les commodités, écoles, axes principaux et commerces. Contactez l'agent responsable pour organiser une visite guidée."}
              </p>
            </section>

            {/* Amenities Section */}
            {property.amenities && property.amenities.length > 0 && (
              <section className={styles.sectionBlock}>
                <h3>
                  <ShieldCheck size={20} aria-hidden="true" />
                  Équipements & Prestations
                </h3>
                <div className={styles.amenitiesGrid}>
                  {property.amenities.map((item, idx) => (
                    <div key={idx} className={styles.amenityItem}>
                      <CheckCircle size={17} aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location Box */}
            <section className={styles.sectionBlock}>
              <h3>
                <Compass size={20} aria-hidden="true" />
                Localisation & Quartier
              </h3>
              <div className={styles.locationBox}>
                <MapPin size={22} aria-hidden="true" />
                <div>
                  <strong style={{ color: "#0a2319", fontSize: "0.95rem" }}>
                    {property.district}, {property.city.toUpperCase()}
                  </strong>
                  <p>
                    L&apos;adresse exacte et les détails d&apos;accès précis vous seront communiqués lors de la confirmation de votre rendez-vous de visite avec l&apos;annonceur.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sticky Agent Sidebar */}
          <aside>
            <ContactAgentCard
              propertyTitle={property.title}
              price={property.price}
              agent={property.agent}
            />
          </aside>
        </div>

        {/* Similar Properties Section */}
        {similarProperties.length > 0 && (
          <section className={styles.similarSection}>
            <h2 className={styles.similarTitle}>Biens similaires qui pourraient vous intéresser</h2>
            <div className={styles.similarGrid}>
              {similarProperties.map((simProp) => (
                <PropertyCard key={simProp.id} property={simProp} viewMode="grid" />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}