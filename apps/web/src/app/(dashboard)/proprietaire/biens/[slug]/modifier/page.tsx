"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { FieldError, fieldA11y } from "@/components/ui";
import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { validatePropertyPublish } from "@/lib/validation";
import {
  PropertyLocationMap,
  type PropertyLocationValue,
} from "@/components/property/PropertyLocationMap";
import { PropertyVideoUploader } from "@/components/property/PropertyVideoUploader";
import { DEMO_OWNER_ID } from "@/lib/demo-api/config";
import {
  propertyService,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import {
  buildPropertyApiPayload,
  demoPropertyLocation,
  logPropertyTrace,
} from "@/lib/demo-api/propertyPayload";
import {
  getPropertyTypeFields,
  parseOptionalRooms,
} from "@/lib/property/typeFields";
import type { PropertyVideo } from "@/lib/property/videos";
import styles from "./page.module.css";

export default function EditPropertyPage() {
  const params = useParams<{ slug: string }>();
  const [property, setProperty] = useState<DemoProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await propertyService.get(params.slug);
        if (!cancelled) setProperty(data);
      } catch (err) {
        if (!cancelled) {
          setProperty(null);
          setLoadError(
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
      <>
        <OwnerPageHeader
          eyebrow="Modification"
          title="Modifier le bien"
          description="Chargement..."
        />
        <p>Chargement...</p>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Modification"
          title="Bien introuvable"
          description={loadError || "Impossible de modifier cette fiche."}
        />
        <Link href="/proprietaire/biens" className={styles.back}>
          <ArrowLeft size={15} /> Retour
        </Link>
      </>
    );
  }

  return (
    <EditPropertyForm
      key={property.id}
      property={property}
      onUpdated={setProperty}
    />
  );
}

function EditPropertyForm({
  property,
  onUpdated,
}: {
  property: DemoProperty;
  onUpdated: (p: DemoProperty) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [videos, setVideos] = useState<PropertyVideo[]>(
    () => (property.videos ?? []) as PropertyVideo[],
  );
  const [location, setLocation] = useState<PropertyLocationValue>(() =>
    demoPropertyLocation(property),
  );
  const typeFields = getPropertyTypeFields(property.type);
  const [form, setForm] = useState(() => ({
    title: property.title,
    price: String(property.price),
    area: String(property.area),
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    description: property.description,
  }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if ((property.status as string) !== "BROUILLON") {
      const parsed = validatePropertyPublish({
        type: property.type,
        operation: property.operation,
        title: form.title,
        price: form.price,
        area: form.area,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        description: form.description,
        city: location.city,
        commune: location.commune,
        quarter: location.quarter,
        landmark: location.landmark,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (!parsed.ok) {
        setFieldErrors(parsed.errors);
        setError("Corrigez les champs indiqués avant d’enregistrer.");
        return;
      }
    }
    setFieldErrors({});
    setSaving(true);
    setError(null);
    try {
      const payload = buildPropertyApiPayload({
        title: form.title,
        typeLabel: property.type,
        operation: property.operation,
        price: Number(form.price) || 0,
        area: Number(form.area) || 0,
        bedrooms: parseOptionalRooms(property.type, "bedrooms", form.bedrooms),
        bathrooms: parseOptionalRooms(
          property.type,
          "bathrooms",
          form.bathrooms,
        ),
        description: form.description,
        images: property.images ?? [],
        videos,
        location,
        status: (property.status as "ACTIF" | "BROUILLON") || "ACTIF",
        ownerId: DEMO_OWNER_ID,
        agencyId: null,
        completeness: property.completeness,
      });
      logPropertyTrace("PROPERTY FORM VALUES", location);
      logPropertyTrace("PROPERTY PATCH PAYLOAD", {
        city: payload.city,
        commune: payload.commune,
        district: payload.district,
        landmark: payload.landmark,
        adminAddress: payload.adminAddress,
        area: payload.area,
        description: payload.description,
      });
      const updated = await propertyService.update(
        property.id || property.slug,
        payload,
      );
      onUpdated(updated);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Enregistrement impossible. Réessayez dans un instant.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Modification"
        title="Modifier le bien"
        description="Mettez à jour les informations sans publier automatiquement l’annonce."
      />
      <Link href={`/proprietaire/biens/${property.slug}`} className={styles.back}>
        <ArrowLeft size={15} /> Retour à la fiche
      </Link>
      {saved && (
        <div className={styles.success}>
          <CheckCircle2 size={17} /> Modifications enregistrées.
        </div>
      )}
      {error ? (
        <p className={styles.warn} role="alert">
          {error}
        </p>
      ) : null}
      <form className={`${styles.card} ${styles.form}`} onSubmit={onSubmit}>
        <div className={styles.grid}>
          <label className={styles.full}>
            Titre
            <input
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
              {...fieldA11y("title-error", fieldErrors.title)}
            />
            <FieldError id="title-error" message={fieldErrors.title} />
          </label>
          <label>
            Prix (GNF)
            <input
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm((v) => ({ ...v, price: e.target.value }))}
              {...fieldA11y("price-error", fieldErrors.price)}
            />
            <FieldError id="price-error" message={fieldErrors.price} />
          </label>
          <label>
            Surface (m²)
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={form.area}
              onChange={(e) => setForm((v) => ({ ...v, area: e.target.value }))}
              {...fieldA11y("area-error", fieldErrors.area)}
            />
            <FieldError id="area-error" message={fieldErrors.area} />
          </label>
          {typeFields.bedrooms ? (
            <label>
              Chambres
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) =>
                  setForm((v) => ({ ...v, bedrooms: e.target.value }))
                }
              />
            </label>
          ) : null}
          {typeFields.bathrooms ? (
            <label>
              Salles d’eau
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) =>
                  setForm((v) => ({ ...v, bathrooms: e.target.value }))
                }
              />
            </label>
          ) : null}
          <label className={styles.full}>
            Description
            <textarea
              rows={8}
              value={form.description}
              onChange={(e) =>
                setForm((v) => ({ ...v, description: e.target.value }))
              }
            />
          </label>
        </div>

        <div className={styles.mediaSection}>
          <PropertyLocationMap value={location} onChange={setLocation} />
        </div>

        <div className={styles.mediaSection}>
          <PropertyVideoUploader videos={videos} onChange={setVideos} />
        </div>

        <div className={styles.footer}>
          <p>
            Les fichiers vidéo restent en aperçu jusqu’à l’enregistrement
            définitif.
          </p>
          <button type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </>
  );
}
