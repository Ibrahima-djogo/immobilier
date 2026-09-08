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
  ShieldCheck,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import AgencyShell from "@/components/agence/AgencyShell";
import { PropertyVideoUploader } from "@/components/property/PropertyVideoUploader";
import { Button, InfoField, InfoGrid } from "@/components/ui";
import { formatGnf } from "@/lib/agence/demo-data";
import {
  propertyService,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import {
  demoPropertyLocationLabel,
} from "@/lib/demo-api/propertyPayload";
import {
  PROPERTY_PLACEHOLDER,
  skipImageOptimization,
  toGalleryMedia,
} from "@/lib/imageOptimization";
import { displayValue } from "@/lib/property/display";
import { getPropertyTypeFields } from "@/lib/property/typeFields";
import type { PropertyVideo } from "@/lib/property/videos";
import styles from "./page.module.css";

export default function AgencyPropertyDetailPage() {
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
              : "Impossible de charger le bien.",
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
      <AgencyShell
        active="biens"
        eyebrow="Fiche professionnelle du bien"
        title="Chargement..."
        description="Récupération de la fiche bien."
      >
        <p>Chargement...</p>
      </AgencyShell>
    );
  }

  if (!property) {
    return (
      <AgencyShell
        active="biens"
        eyebrow="Fiche professionnelle du bien"
        title="Bien introuvable"
        description={error || "Cette fiche n’existe pas dans le portefeuille."}
      >
        <Link href="/agence/biens" className={styles.back}>
          <ArrowLeft size={15} />
          Retour au portefeuille
        </Link>
      </AgencyShell>
    );
  }

  const p = property;
  const location = demoPropertyLocationLabel(p);
  const typeFields = getPropertyTypeFields(p.type);
  const gallery = toGalleryMedia(
    p.media?.length ? p.media : p.images,
    p.id,
    PROPERTY_PLACEHOLDER,
  );
  const cover = gallery[0]?.url || PROPERTY_PLACEHOLDER;
  const videos = (p.videos ?? []) as PropertyVideo[];

  return (
    <AgencyShell
      active="biens"
      eyebrow="Fiche professionnelle du bien"
      title={p.title}
      description="Consultez les informations du portefeuille, le mandat et les performances."
      action={
        <Button href={`/agence/biens/${p.slug}/modifier`}>
          <Edit3 size={16} aria-hidden="true" />
          Modifier
        </Button>
      }
    >
      <Link href="/agence/biens" className={styles.back}>
        <ArrowLeft size={15} />
        Retour au portefeuille
      </Link>

      <section className={styles.gallery}>
        <div className={styles.galleryMain}>
          <Image
            src={cover}
            alt={p.title}
            fill
            sizes="(max-width:900px) 100vw, 66vw"
            className={styles.galleryImage}
            unoptimized={skipImageOptimization(cover)}
          />
        </div>
        <div>
          {gallery.slice(1).map((media) => (
            <div key={media.id} className={styles.galleryThumb}>
              <Image
                src={media.url}
                alt={`${p.title}`}
                fill
                sizes="(max-width:900px) 50vw, 280px"
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
                {p.reference} · {p.type}
              </span>
              <h2>{p.title}</h2>
              <p>
                <MapPin size={15} />
                {location}
              </p>
            </div>
            <strong>
              {formatGnf(p.price)}
              {p.operation === "LOCATION" ? " / mois" : ""}
            </strong>
          </div>
          <div className={styles.mandate}>
            <ShieldCheck size={20} />
            <div>
              <small>Mandat</small>
              <strong>{displayValue(p.mandateType)}</strong>
            </div>
            <div>
              <small>Client associé</small>
              <strong>{displayValue(p.clientDisplayName)}</strong>
            </div>
          </div>
          <div className={styles.features}>
            <span>
              <Ruler size={19} />
              <b>{p.area} m²</b>
              <small>Surface</small>
            </span>
            {typeFields.bedrooms && p.bedrooms != null ? (
              <span>
                <BedDouble size={19} />
                <b>{p.bedrooms}</b>
                <small>Chambres</small>
              </span>
            ) : null}
            {typeFields.bathrooms && p.bathrooms != null ? (
              <span>
                <Bath size={19} />
                <b>{p.bathrooms}</b>
                <small>Salles d’eau</small>
              </span>
            ) : null}
          </div>
          <h3>Description</h3>
          <p className={styles.description}>
            {p.description?.trim() ? p.description : "Non renseigné"}
          </p>
          <h3>Localisation</h3>
          <InfoGrid>
            <InfoField label="Ville" value={p.city} />
            <InfoField label="Commune" value={p.commune} />
            <InfoField label="Quartier" value={p.district} />
            <InfoField label="Repère" value={p.landmark} />
          </InfoGrid>
        </section>
        <aside>
          <section className={`${styles.card} ${styles.metrics}`}>
            <h2>Performance</h2>
            <div>
              <span>
                <Eye size={18} />
                Consultations
              </span>
              <strong>{p.views ?? 0}</strong>
            </div>
            <div>
              <span>
                <MessageSquareText size={18} />
                Contacts
              </span>
              <strong>{p.contacts ?? 0}</strong>
            </div>
            <Link href="/agence/statistiques">Voir les statistiques</Link>
          </section>
          <section className={`${styles.card} ${styles.adCard}`}>
            <FileText size={24} />
            <h2>Annonce liée</h2>
            <p>
              La fiche du bien et sa diffusion publique restent distinctes.
            </p>
            <Link href="/agence/annonces">Ouvrir les annonces</Link>
          </section>
        </aside>
      </div>
    </AgencyShell>
  );
}
