"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Edit3,
  Eye,
  FileText,
  MapPin,
  MessageSquareText,
  Ruler,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { PropertyVideoUploader } from "@/components/property/PropertyVideoUploader";
import { Button, InfoField, InfoGrid } from "@/components/ui";
import {
  propertyService,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import { demoPropertyLocationLabel } from "@/lib/demo-api/propertyPayload";
import {
  PROPERTY_PLACEHOLDER,
  skipImageOptimization,
  toGalleryMedia,
} from "@/lib/imageOptimization";
import { formatGnf } from "@/lib/proprietaire/demo-data";
import { getPropertyTypeFields } from "@/lib/property/typeFields";
import type { PropertyVideo } from "@/lib/property/videos";
import styles from "./page.module.css";

export default function PropertyDetailPage() {
  const params = useParams<{ slug: string }>();
  const [property, setProperty] = useState<DemoProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await propertyService.get(params.slug);
        if (!cancelled) setProperty(data);
      } catch (err) {
        if (!cancelled) {
          setProperty(null);
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger le bien (Demo API).",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Fiche du bien"
          title="Chargement..."
          description="Récupération de la fiche bien."
        />
        <p>Chargement...</p>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Fiche du bien"
          title="Bien introuvable"
          description={
            error || "Cette fiche n’existe pas dans votre portefeuille."
          }
        />
        <Link href="/proprietaire/biens" className={styles.back}>
          <ArrowLeft size={15} /> Retour à mes biens
        </Link>
      </>
    );
  }

  const location = demoPropertyLocationLabel(property);
  const typeFields = getPropertyTypeFields(property.type);
  const gallery = toGalleryMedia(
    property.media?.length ? property.media : property.images,
    property.id,
    PROPERTY_PLACEHOLDER,
  );
  const cover = gallery[0]?.url || PROPERTY_PLACEHOLDER;
  const videos = (property.videos ?? []) as PropertyVideo[];

  return (
    <>
      <OwnerPageHeader
        eyebrow="Fiche du bien"
        title={property.title}
        description="Consultez les informations techniques, les médias et les performances du bien."
        action={
          <Button href={`/proprietaire/biens/${property.slug}/modifier`}>
            <Edit3 size={16} aria-hidden="true" />
            Modifier
          </Button>
        }
      />
      <Link href="/proprietaire/biens" className={styles.back}>
        <ArrowLeft size={15} /> Retour à mes biens
      </Link>
      <section className={styles.gallery}>
        <div className={styles.galleryMain}>
          <Image
            src={cover}
            alt={property.title}
            fill
            sizes="(max-width: 900px) 100vw, 66vw"
            className={styles.galleryImage}
            unoptimized={skipImageOptimization(cover)}
          />
        </div>
        <div>
          {gallery.slice(1).map((media) => (
            <div key={media.id} className={styles.galleryThumb}>
              <Image
                src={media.url}
                alt={`${property.title}`}
                fill
                sizes="(max-width: 900px) 50vw, 280px"
                className={styles.galleryImage}
                unoptimized={skipImageOptimization(media.url)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.card} ${styles.mediaCard}`}>
        <PropertyVideoUploader
          videos={videos}
          onChange={() => undefined}
          readOnly
        />
      </section>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.details}`}>
          <div className={styles.top}>
            <div>
              <span>
                {property.type} ·{" "}
                {property.operation === "VENTE" ? "Vente" : "Location"}
              </span>
              <h2>{property.title}</h2>
              <p>
                <MapPin size={15} />
                {location}
              </p>
            </div>
            <strong>
              {formatGnf(property.price)}
              {property.operation === "LOCATION" ? " / mois" : ""}
            </strong>
          </div>
          <div className={styles.features}>
            <span>
              <Ruler size={19} />
              <b>{property.area} m²</b>
              <small>Surface</small>
            </span>
            {typeFields.bedrooms && property.bedrooms != null ? (
              <span>
                <BedDouble size={19} />
                <b>{property.bedrooms}</b>
                <small>Chambres</small>
              </span>
            ) : null}
            {typeFields.bathrooms && property.bathrooms != null ? (
              <span>
                <Bath size={19} />
                <b>{property.bathrooms}</b>
                <small>Salles d’eau</small>
              </span>
            ) : null}
          </div>
          <h3>Description</h3>
          <p className={styles.description}>
            {property.description?.trim()
              ? property.description
              : "Non renseigné"}
          </p>
          <h3>Localisation</h3>
          <InfoGrid>
            <InfoField label="Ville" value={property.city} />
            <InfoField label="Commune" value={property.commune} />
            <InfoField label="Quartier" value={property.district} />
            <InfoField label="Repère" value={property.landmark} />
          </InfoGrid>
          <p className={styles.locationHint}>
            <MapPin size={14} aria-hidden="true" />
            {location}
          </p>
        </section>

        <aside>
          <section className={`${styles.card} ${styles.metrics}`}>
            <h2>Performance</h2>
            <div>
              <span>
                <Eye size={18} />
                Consultations
              </span>
              <strong>{property.views ?? 0}</strong>
            </div>
            <div>
              <span>
                <MessageSquareText size={18} />
                Contacts
              </span>
              <strong>{property.contacts ?? 0}</strong>
            </div>
            <Link href="/proprietaire/statistiques">Voir les statistiques</Link>
          </section>
          <section className={`${styles.card} ${styles.adCard}`}>
            <FileText size={24} />
            <h2>Annonce liée</h2>
            <p>
              Gérez la diffusion publique séparément de la fiche du bien.
            </p>
            <Link href="/proprietaire/annonces">Ouvrir les annonces</Link>
          </section>
        </aside>
      </div>
    </>
  );
}
