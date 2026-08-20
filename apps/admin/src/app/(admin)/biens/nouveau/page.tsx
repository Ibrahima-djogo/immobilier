"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  PropertyLocationMap,
  type PropertyLocationValue,
} from "@/components/property/PropertyLocationMap";
import { DemoToast } from "@/components/ui";
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
import styles from "../../annonces/[id]/page.module.css";

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
        setToast("Impossible de charger les annonceurs (Demo API).");
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!admin) return;
    if (!title.trim()) {
      setToast("Le titre du bien est obligatoire.");
      return;
    }
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
        err instanceof Error ? err.message : "Création refusée par la Demo API.",
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

      <form className={styles.panel} onSubmit={onSubmit}>
        <header className={styles.panelHead}>
          <h2>Annonceur</h2>
        </header>
        <div className={styles.kv}>
          <div className={styles.full}>
            <span>Type d’annonceur</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as AdvertiserKind)}
              aria-label="Type d’annonceur"
            >
              <option value="PROPRIETAIRE">Propriétaire</option>
              <option value="AGENCE">Agence</option>
            </select>
          </div>
          {kind === "PROPRIETAIRE" ? (
            <div className={styles.full}>
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
            </div>
          ) : (
            <div className={styles.full}>
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
            </div>
          )}
        </div>

        <header className={styles.panelHead} style={{ marginTop: 18 }}>
          <h2>Informations du bien</h2>
        </header>
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
          </div>
          <div>
            <span>Prix indicatif (GNF)</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <span>Surface (m²)</span>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
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
          <div className={styles.full}>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <header className={styles.panelHead} style={{ marginTop: 18 }}>
          <h2>Localisation</h2>
        </header>
        <PropertyLocationMap value={location} onChange={setLocation} />

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="submit" className={styles.save} disabled={saving}>
            {saving ? "Création…" : "Créer le bien"}
          </button>
        </div>
      </form>

      {toast ? (
        <DemoToast message={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </AdminShell>
  );
}
