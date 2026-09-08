"use client";

import { useRouter } from "next/navigation";
import {
  AlignLeft,
  Building2,
  Home,
  Mail,
  MapPin,
  Phone,
  Plus,
  Ruler,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  WorkspaceFormCard,
  WorkspaceMeta,
  initialsFromName,
} from "@/components/administration/WorkspaceForm";
import {
  PropertyLocationMap,
  type PropertyLocationValue,
} from "@/components/property/PropertyLocationMap";
import { Button, DemoToast, FieldError, fieldA11y } from "@/components/ui";
import { validatePropertyPublish } from "@/lib/validation";
import { canWriteProperties } from "@/lib/administration/admin-accounts";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  directoryService,
  propertyService,
  type DemoAgency,
  type DemoUser,
} from "@/lib/demo-api/listings";
import { isTerrainType } from "@/lib/property/display";
import { routes } from "@/lib/routes/app-routes";
import styles from "@/components/administration/WorkspaceForm.module.css";

type AdvertiserKind = "PROPRIETAIRE" | "AGENCE";

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

export default function AdminNewPropertyPage() {
  const router = useRouter();
  const { admin, ready } = useAdminSession();
  const [kind, setKind] = useState<AdvertiserKind>("PROPRIETAIRE");
  const [owners, setOwners] = useState<DemoUser[]>([]);
  const [agencies, setAgencies] = useState<DemoAgency[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Villa");
  const [operation, setOperation] = useState<"VENTE" | "LOCATION">("VENTE");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<PropertyLocationValue>(EMPTY_LOCATION);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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
        const [users, ags] = await Promise.all([
          directoryService.users(),
          directoryService.agencies(),
        ]);
        setOwners(users.filter((u) => u.role === "PROPRIETAIRE" || !u.role));
        setAgencies(ags);
        if (users[0]) setOwnerId(users[0].id);
        if (ags[0]) setAgencyId(ags[0].id);
      } catch {
        setToast("Impossible de charger les annonceurs.");
      }
    })();
  }, []);

  const selectedOwner = owners.find((item) => item.id === ownerId) ?? null;
  const selectedAgency = agencies.find((item) => item.id === agencyId) ?? null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!admin) return;
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
    setFieldErrors({});
    if (!location.city.trim() || !location.commune.trim()) {
      setToast("Ville et commune sont obligatoires.");
      return;
    }
    if (kind === "PROPRIETAIRE" && !ownerId) {
      setToast("Sélectionnez un propriétaire.");
      return;
    }
    if (kind === "AGENCE" && !agencyId) {
      setToast("Sélectionnez une agence.");
      return;
    }

    const payload = {
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
      ownerId: kind === "PROPRIETAIRE" ? ownerId : null,
      agencyId: kind === "AGENCE" ? agencyId : null,
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=86",
      ],
    };

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
      console.log("PROPERTY CREATE PAYLOAD", {
        city: payload.city,
        commune: payload.commune,
        district: payload.district,
        landmark: payload.landmark,
        adminAddress: payload.adminAddress,
        locationLabel: payload.locationLabel,
        area: payload.area,
        coordinates: payload.coordinates,
        ownerId: payload.ownerId,
        agencyId: payload.agencyId,
      });
      const created = await propertyService.createAsAdmin(payload, admin);
      setToast("Bien créé pour l’annonceur (vous n’êtes pas propriétaire).");
      router.push(routes.property(created.id));
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Création refusée.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      active="biens"
      eyebrow="Portefeuille immobilier"
      title="Créer un bien"
      description="Renseignez le bien puis rattachez-le à son annonceur."
      note="Le bien appartient au propriétaire ou à l’agence sélectionné — jamais à l’administrateur."
      icon={Plus}
      heroVariant="compact"
      backHref={routes.properties}
      backLabel="Retour aux biens"
    >

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.layout}>
          <div className={styles.main}>
            <WorkspaceFormCard
              icon={Home}
              title="Informations du bien"
              subtitle="Identifiez le bien avant de préciser ses caractéristiques."
            >
              <div className={styles.grid}>
                <label className={`${styles.field} ${styles.wide}`}>
                  <span>Titre</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    {...fieldA11y("admin-title-error", fieldErrors.title)}
                  />
                  <FieldError id="admin-title-error" message={fieldErrors.title} />
                </label>
                <label className={styles.field}>
                  <span>Type</span>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option>Villa</option>
                    <option>Appartement</option>
                    <option>Terrain</option>
                    <option>Bureau</option>
                    <option>Commerce</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Opération indicative</span>
                  <select
                    value={operation}
                    onChange={(e) =>
                      setOperation(e.target.value as "VENTE" | "LOCATION")
                    }
                  >
                    <option value="VENTE">Vente</option>
                    <option value="LOCATION">Location</option>
                  </select>
                </label>
              </div>
            </WorkspaceFormCard>

            <WorkspaceFormCard
              icon={MapPin}
              title="Localisation"
              subtitle="Ville, commune et position enregistrées pour le bien."
            >
              <PropertyLocationMap value={location} onChange={setLocation} />
            </WorkspaceFormCard>

            <WorkspaceFormCard
              icon={Ruler}
              title="Caractéristiques"
              subtitle="Valeurs indicatives reprises ensuite dans l’annonce."
            >
              <div className={styles.grid}>
                <label className={styles.field}>
                  <span>Prix indicatif (GNF)</span>
                  <input
                    type="number"
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    {...fieldA11y("admin-price-error", fieldErrors.price)}
                  />
                  <FieldError id="admin-price-error" message={fieldErrors.price} />
                </label>
                <label className={styles.field}>
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
                </label>
                {!isTerrainType(type) ? (
                  <>
                    <label className={styles.field}>
                      <span>Chambres</span>
                      <input
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Salles d’eau</span>
                      <input
                        type="number"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                      />
                    </label>
                  </>
                ) : null}
              </div>
            </WorkspaceFormCard>

            <WorkspaceFormCard
              icon={AlignLeft}
              title="Description"
              subtitle="Présentez le bien avec les informations déjà collectées."
            >
              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </label>
            </WorkspaceFormCard>
          </div>

          <aside className={styles.side}>
            <WorkspaceFormCard
              icon={kind === "AGENCE" ? Building2 : UserRound}
              title="Annonceur"
              subtitle="Le bien appartient au compte sélectionné, jamais à l’administrateur."
              aside
            >
              <div className={styles.segment} role="group" aria-label="Type d’annonceur">
                <button
                  type="button"
                  className={
                    kind === "PROPRIETAIRE"
                      ? styles.segmentActive
                      : styles.segmentBtn
                  }
                  aria-pressed={kind === "PROPRIETAIRE"}
                  onClick={() => setKind("PROPRIETAIRE")}
                >
                  Propriétaire
                </button>
                <button
                  type="button"
                  className={
                    kind === "AGENCE" ? styles.segmentActive : styles.segmentBtn
                  }
                  aria-pressed={kind === "AGENCE"}
                  onClick={() => setKind("AGENCE")}
                >
                  Agence
                </button>
              </div>

              {kind === "PROPRIETAIRE" ? (
                <label className={styles.field}>
                  <span>Compte propriétaire</span>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    aria-label="Propriétaire"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.id})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className={styles.field}>
                  <span>Compte agence</span>
                  <select
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                    aria-label="Agence"
                  >
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.id})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {kind === "PROPRIETAIRE" && selectedOwner ? (
                <>
                  <div className={styles.identity}>
                    <span className={styles.avatar} aria-hidden="true">
                      {initialsFromName(selectedOwner.name)}
                    </span>
                    <div>
                      <strong>{selectedOwner.name}</strong>
                      <small>{selectedOwner.id}</small>
                    </div>
                  </div>
                  <div className={styles.metaList}>
                    <WorkspaceMeta
                      icon={Phone}
                      label="Téléphone"
                      value={selectedOwner.phone}
                    />
                    <WorkspaceMeta
                      icon={Mail}
                      label="Email"
                      value={selectedOwner.email}
                    />
                  </div>
                </>
              ) : null}

              {kind === "AGENCE" && selectedAgency ? (
                <>
                  <div className={styles.identity}>
                    <span className={styles.avatar} aria-hidden="true">
                      {selectedAgency.initials ||
                        initialsFromName(selectedAgency.name)}
                    </span>
                    <div>
                      <strong>{selectedAgency.name}</strong>
                      <small>{selectedAgency.id}</small>
                    </div>
                  </div>
                  <div className={styles.metaList}>
                    <WorkspaceMeta
                      icon={Phone}
                      label="Téléphone"
                      value={selectedAgency.phone}
                    />
                    <WorkspaceMeta
                      icon={Mail}
                      label="Email"
                      value={selectedAgency.email}
                    />
                    <WorkspaceMeta
                      icon={MapPin}
                      label="Ville"
                      value={selectedAgency.city}
                    />
                    <WorkspaceMeta
                      icon={UserRound}
                      label="Responsable"
                      value={selectedAgency.managerName}
                    />
                  </div>
                </>
              ) : null}
            </WorkspaceFormCard>
          </aside>
        </div>

        <div className={styles.actions}>
          <Button href={routes.properties} variant="secondary">
            Retour
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Création…" : "Créer le bien"}
          </Button>
        </div>
      </form>

      {toast ? (
        <DemoToast message={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </AdminShell>
  );
}
