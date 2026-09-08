"use client";

import { useParams, useRouter } from "next/navigation";
import { Hash, Pencil } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  PropertyLocationMap,
  type PropertyLocationValue,
} from "@/components/property/PropertyLocationMap";
import { DemoToast, EmptyState, FieldError, fieldA11y } from "@/components/ui";
import { validatePropertyPublish } from "@/lib/validation";
import { canWriteProperties } from "@/lib/administration/admin-accounts";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  propertyService,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import { isTerrainType } from "@/lib/property/display";
import { routes } from "@/lib/routes/app-routes";
import styles from "../../../annonces/[id]/page.module.css";

const EMPTY_LOCATION: PropertyLocationValue = {
  city: "Conakry",
  commune: "",
  quarter: "",
  landmark: "",
  latitude: null,
  longitude: null,
  locationLabel: null,
  locationDisplayName: null,
  locationConfirmed: false,
};

export default function AdminPropertyEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { admin, ready } = useAdminSession();
  const [property, setProperty] = useState<DemoProperty | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Villa");
  const [operation, setOperation] = useState("VENTE");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIF");
  const [location, setLocation] =
    useState<PropertyLocationValue>(EMPTY_LOCATION);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready) return;
    if (!admin || !canWriteProperties(admin)) {
      router.replace(routes.accessDenied);
    }
  }, [admin, ready, router]);

  useEffect(() => {
    (async () => {
      try {
        const data = await propertyService.get(params.id);
        setProperty(data);
        setTitle(data.title);
        setType(data.type);
        setOperation(String(data.operation || "VENTE"));
        setPrice(String(data.price || ""));
        setArea(String(data.area || ""));
        setBedrooms(
          data.bedrooms == null ? "" : String(data.bedrooms),
        );
        setBathrooms(
          data.bathrooms == null ? "" : String(data.bathrooms),
        );
        setDescription(data.description || "");
        setStatus(data.status || "ACTIF");
        setLocation({
          city: data.city || "Conakry",
          commune: data.commune || "",
          quarter: data.district || "",
          landmark: data.landmark || "",
          latitude: data.coordinates?.lat ?? null,
          longitude: data.coordinates?.lng ?? null,
          locationLabel: data.locationLabel ?? null,
          locationDisplayName: data.locationLabel ?? null,
          locationConfirmed: Boolean(data.locationConfirmed),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bien introuvable");
      }
    })();
  }, [params.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!admin || !property) return;
    if (status !== "BROUILLON") {
      const parsed = validatePropertyPublish({
        type,
        operation,
        title,
        price,
        area,
        bedrooms,
        bathrooms,
        description,
        city: location.city,
        commune: location.commune,
        quarter: location.quarter,
        landmark: location.landmark,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (!parsed.ok) {
        setFieldErrors(parsed.errors);
        setToast(Object.values(parsed.errors)[0] || "Corrigez les champs indiqués.");
        return;
      }
    }
    setFieldErrors({});
    setSaving(true);
    try {
      console.log("PROPERTY FORM VALUES", {
        city: location.city,
        commune: location.commune,
        quarter: location.quarter,
        landmark: location.landmark,
        area,
        description,
      });
      console.log("PROPERTY PATCH PAYLOAD", {
        city: location.city.trim(),
        commune: location.commune.trim(),
        district: location.quarter.trim(),
        landmark: location.landmark.trim(),
        area: Number(area) || 0,
      });
      const updated = await propertyService.updateAsAdmin(
        property.id,
        {
          title: title.trim(),
          type,
          operation,
          price: Number(price) || 0,
          area: Number(area) || 0,
          bedrooms: isTerrainType(type)
            ? null
            : bedrooms === ""
              ? null
              : Number(bedrooms),
          bathrooms: isTerrainType(type)
            ? null
            : bathrooms === ""
              ? null
              : Number(bathrooms),
          description: description.trim(),
          status,
          city: location.city.trim(),
          commune: location.commune.trim(),
          district: location.quarter.trim(),
          landmark: location.landmark.trim(),
          locationLabel:
            location.locationLabel ||
            [location.quarter, location.commune, location.city]
              .filter(Boolean)
              .join(", "),
          adminAddress: [location.quarter, location.commune, location.city]
            .filter(Boolean)
            .join(", "),
          latitude: location.latitude,
          longitude: location.longitude,
          coordinates:
            location.latitude != null && location.longitude != null
              ? { lat: location.latitude, lng: location.longitude }
              : null,
          locationConfirmed: location.locationConfirmed,
          ownerId: property.ownerId ?? null,
          agencyId: property.agencyId ?? null,
        },
        admin,
      );
      setProperty(updated);
      setToast("Bien mis à jour.");
      router.push(routes.property(updated.id));
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Modification refusée (403?).",
      );
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <AdminShell
        active="biens"
        eyebrow="Modifier le bien"
        title="Impossible de charger le bien"
        description={error}
        icon={Pencil}
        heroVariant="compact"
        backHref={routes.properties}
        backLabel="Retour aux biens"
      >
        <EmptyState title="Impossible de charger" description={error} />
      </AdminShell>
    );
  }

  if (!property) {
    return (
      <AdminShell
        active="biens"
        eyebrow="Modifier le bien"
        title="Chargement…"
        description="Lecture du bien en cours."
        icon={Pencil}
        heroVariant="compact"
        backHref={routes.properties}
        backLabel="Retour aux biens"
      >
        <p>Chargement…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="biens"
      eyebrow="Modifier le bien"
      title={property.title}
      description="Mettez à jour les informations du bien."
      note="Les rattachements ownerId / agencyId sont conservés."
      icon={Pencil}
      heroVariant="detail"
      backHref={routes.property(property.id)}
      backLabel="Retour à la fiche"
      meta={[{ label: "Référence", value: property.reference, icon: Hash }]}
    >

      <form className={styles.panel} onSubmit={onSubmit}>
        <div className={styles.kv}>
          <div className={styles.full}>
            <span>Titre</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Villa</option>
              <option>Appartement</option>
              <option>Terrain</option>
              <option>Bureau</option>
              <option>Commerce</option>
            </select>
          </div>
          <div>
            <span>Opération</span>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
            >
              <option value="VENTE">Vente</option>
              <option value="LOCATION">Location</option>
            </select>
          </div>
          <div>
            <span>Prix (GNF)</span>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              {...fieldA11y("admin-price-error", fieldErrors.price)}
            />
            <FieldError id="admin-price-error" message={fieldErrors.price} />
          </div>
          <div>
            <span>Surface (m²)</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              {...fieldA11y("admin-area-error", fieldErrors.area)}
            />
            <FieldError id="admin-area-error" message={fieldErrors.area} />
          </div>
          {!isTerrainType(type) ? (
            <>
              <div>
                <span>Chambres</span>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div>
                <span>Salles d’eau</span>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>
            </>
          ) : null}
          <div>
            <span>Statut bien</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIF">Actif</option>
              <option value="ARCHIVE">Archivé</option>
              <option value="BROUILLON">Brouillon</option>
            </select>
          </div>
          <div className={styles.full}>
            <span>Description</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={styles.full}>
            <span>Annonceur (lecture seule)</span>
            <strong>
              {property.agencyId
                ? `Agence ${property.agencyId}`
                : `Propriétaire ${property.ownerId}`}
            </strong>
          </div>
        </div>

        <header className={styles.panelHead} style={{ marginTop: 18 }}>
          <h2>Localisation</h2>
        </header>
        <PropertyLocationMap value={location} onChange={setLocation} />

        <div style={{ marginTop: 16 }}>
          <button type="submit" className={styles.save} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>

      {toast ? (
        <DemoToast message={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </AdminShell>
  );
}
