"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  Hash,
  Home,
  MapPin,
  Megaphone,
  Pencil,
  UserCog,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { InfoField } from "@/components/administration/InfoField";
import {
  PropertyLocationMap,
  type PropertyLocationValue,
} from "@/components/property/PropertyLocationMap";
import { EmptyState, StatusBadge } from "@/components/ui";
import {
  canWriteListings,
  canWriteProperties,
} from "@/lib/administration/admin-accounts";
import { formatGnf } from "@/lib/administration/demo-data";
import { useAdminSession } from "@/lib/auth/admin-session";
import { DemoApiError } from "@/lib/demo-api/client";
import {
  directoryService,
  listingService,
  propertyService,
  type DemoAdminAccount,
  type DemoAgency,
  type DemoListing,
  type DemoProperty,
  type DemoUser,
} from "@/lib/demo-api/listings";
import {
  PROPERTY_PLACEHOLDER,
  toGalleryMedia,
} from "@/lib/imageOptimization";
import {
  formatCoordinates,
  displayValue,
  isTerrainType,
  propertyAdminAddress,
  propertyLocationLabel,
} from "@/lib/property/display";
import { routes } from "@/lib/routes/app-routes";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import styles from "../../annonces/[id]/page.module.css";

type AdvertiserState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "owner"; user: DemoUser; propertiesCount: number; listingsCount: number }
  | {
      kind: "agency";
      agency: DemoAgency;
      propertiesCount: number;
      listingsCount: number;
      publishedCount: number;
    }
  | { kind: "missing"; message: string };

export default function AdminPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const { admin } = useAdminSession();
  const [property, setProperty] = useState<DemoProperty | null>(null);
  const [linkedListings, setLinkedListings] = useState<DemoListing[]>([]);
  const [advertiser, setAdvertiser] = useState<AdvertiserState>({ kind: "idle" });
  const [creatorAdmin, setCreatorAdmin] = useState<DemoAdminAccount | null>(null);
  const [updaterAdmin, setUpdaterAdmin] = useState<DemoAdminAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setAdvertiser({ kind: "loading" });
      setCreatorAdmin(null);
      setUpdaterAdmin(null);
      try {
        const data = await propertyService.get(params.id);
        if (cancelled) return;
        setProperty(data);
        setError(null);

        const allListings = await listingService.list(
          data.agencyId
            ? { agencyId: data.agencyId }
            : data.ownerId
              ? { ownerId: data.ownerId }
              : {},
        );
        const forProperty = allListings.filter(
          (l) => l.propertyId === data.id,
        );
        if (!cancelled) setLinkedListings(forProperty);

        if (data.agencyId) {
          try {
            const [agency, agencyProps, agencyListings] = await Promise.all([
              directoryService.agency(data.agencyId),
              propertyService.list({ agencyId: data.agencyId }),
              listingService.list({ agencyId: data.agencyId }),
            ]);
            if (cancelled) return;
            setAdvertiser({
              kind: "agency",
              agency,
              propertiesCount: agencyProps.length,
              listingsCount: agencyListings.length,
              publishedCount: agencyListings.filter((l) => l.status === "PUBLIEE")
                .length,
            });
          } catch (err) {
            if (cancelled) return;
            setAdvertiser({
              kind: "missing",
              message:
                err instanceof DemoApiError && err.status === 404
                  ? `Agence introuvable (${data.agencyId})`
                  : err instanceof Error
                    ? err.message
                    : "Agence introuvable",
            });
          }
        } else if (data.ownerId) {
          try {
            const [user, ownerProps, ownerListings] = await Promise.all([
              directoryService.user(data.ownerId),
              propertyService.list({ ownerId: data.ownerId }),
              listingService.list({ ownerId: data.ownerId }),
            ]);
            if (cancelled) return;
            setAdvertiser({
              kind: "owner",
              user,
              propertiesCount: ownerProps.length,
              listingsCount: ownerListings.length,
            });
          } catch (err) {
            if (cancelled) return;
            setAdvertiser({
              kind: "missing",
              message:
                err instanceof DemoApiError && err.status === 404
                  ? `Propriétaire introuvable (${data.ownerId})`
                  : err instanceof Error
                    ? err.message
                    : "Propriétaire introuvable",
            });
          }
        } else {
          setAdvertiser({
            kind: "missing",
            message: "Aucun annonceur rattaché à ce bien.",
          });
        }

        if (data.createdByAdminId || data.updatedByAdminId) {
          try {
            const admins = await directoryService.admins();
            const created =
              admins.find((a) => a.id === data.createdByAdminId) || null;
            const updated =
              admins.find((a) => a.id === data.updatedByAdminId) || null;
            if (!cancelled) {
              setCreatorAdmin(created);
              setUpdaterAdmin(updated);
            }
          } catch {
            if (!cancelled) {
              setCreatorAdmin(null);
              setUpdaterAdmin(null);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Bien introuvable");
          setProperty(null);
          setAdvertiser({ kind: "idle" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const canEdit = admin ? canWriteProperties(admin) : false;
  const canPublish = admin ? canWriteListings(admin) : false;

  const gallery = useMemo(
    () =>
      property
        ? toGalleryMedia(
            property.media?.length ? property.media : property.images,
            property.id,
          )
        : [],
    [property],
  );

  if (loading) {
    return (
      <AdminShell
        active="biens"
        eyebrow="Portefeuille immobilier"
        title="Chargement…"
        description="Lecture de la fiche bien en cours."
        icon={Home}
        heroVariant="compact"
        backHref={routes.properties}
        backLabel="Retour aux biens"
      >
        <p>Chargement du bien et de l’annonceur…</p>
      </AdminShell>
    );
  }

  if (!property) {
    return (
      <AdminShell
        active="biens"
        eyebrow="Portefeuille immobilier"
        title="Bien introuvable"
        description={error || "Ce bien n’existe pas dans la Demo API."}
        icon={Home}
        heroVariant="compact"
        backHref={routes.properties}
        backLabel="Retour aux biens"
      >
        <EmptyState
          title="Bien introuvable"
          description={error || "Ce bien n’existe pas dans la Demo API."}
        />
      </AdminShell>
    );
  }

  const primaryListing = linkedListings[0] || null;

  return (
    <AdminShell
      active="biens"
      eyebrow="Portefeuille immobilier"
      title={property.title}
      description={propertyLocationLabel(property) || undefined}
      icon={Home}
      heroVariant="detail"
      backHref={routes.properties}
      backLabel="Retour aux biens"
      badge={formatStatusLabel((property.status as string) || "ACTIF")}
      badgeTone={statusTone((property.status as string) || "ACTIF")}
      meta={[
        { label: "Référence", value: property.reference, icon: Hash },
        { label: "Type", value: property.type, icon: Home },
        {
          label: "Rattachement",
          value: property.agencyId ? "Agence" : "Propriétaire",
          icon: UserCog,
        },
      ]}
      stats={[{ label: "Annonces liées", value: linkedListings.length }]}
      actions={
        <>
          {canEdit ? (
            <Link
              href={routes.propertyEdit(property.id)}
              className={`${styles.save} ${styles.headerCta}`}
            >
              <Pencil size={14} aria-hidden="true" />
              Modifier
            </Link>
          ) : null}
          {canPublish ? (
            <Link
              href={`${routes.adNew}?propertyId=${encodeURIComponent(property.id)}`}
              className={`${styles.save} ${styles.headerCta}`}
            >
              <Megaphone size={14} aria-hidden="true" />
              Publier ce bien
            </Link>
          ) : null}
        </>
      }
    >

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Informations du bien</h2>
              <StatusBadge status={(property.status as never) || "ACTIF"} />
            </header>
            <div className={styles.kv}>
              <InfoField label="Référence" value={property.reference} />
              <InfoField label="Type" value={property.type} />
              <InfoField
                label="Surface"
                value={property.area ? `${property.area} m²` : null}
              />
              <InfoField
                label="Chambres"
                value={property.bedrooms}
                show={!isTerrainType(property.type)}
              />
              <InfoField
                label="Salles d’eau"
                value={property.bathrooms}
                show={!isTerrainType(property.type)}
              />
              <InfoField
                label="Description"
                value={property.description}
                full
              />
            </div>
            <p className={styles.note} style={{ marginTop: 10 }}>
              Le prix commercial et l’opération publique appartiennent à
              l’annonce (section Publication), pas à la fiche technique du bien.
              {typeof property.price === "number" && property.price > 0
                ? ` Prix indicatif stocké : ${formatGnf(property.price)}.`
                : ""}
            </p>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Localisation</h2>
              <MapPin size={16} aria-hidden="true" />
            </header>
            <div className={styles.kv}>
              <InfoField label="Ville" value={property.city} />
              <InfoField label="Commune" value={property.commune} />
              <InfoField label="Quartier" value={property.district} />
              <InfoField label="Repère" value={property.landmark} />
              <InfoField
                label="Adresse administrative"
                value={propertyAdminAddress(property)}
                full
              />
              <InfoField
                label="Libellé carte"
                value={propertyLocationLabel(property)}
                full
              />
              <InfoField
                label="Coordonnées"
                value={formatCoordinates(property.coordinates)}
                full
              />
            </div>
            {property.coordinates?.lat != null &&
            property.coordinates?.lng != null ? (
              <div style={{ marginTop: 14 }}>
                <PropertyLocationMap
                  value={
                    {
                      city: property.city || "",
                      commune: property.commune || "",
                      quarter: property.district || "",
                      landmark: property.landmark || "",
                      latitude: property.coordinates.lat,
                      longitude: property.coordinates.lng,
                      locationLabel: property.locationLabel ?? null,
                      locationDisplayName: property.locationLabel ?? null,
                      locationConfirmed: Boolean(property.locationConfirmed),
                    } satisfies PropertyLocationValue
                  }
                  onChange={() => undefined}
                  readOnly
                />
              </div>
            ) : (
              <p className={styles.note} style={{ marginTop: 12 }}>
                Position précise non enregistrée
              </p>
            )}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Médias</h2>
            </header>
            {gallery.length === 0 ||
            gallery.every((m) => m.url === PROPERTY_PLACEHOLDER) ? (
              <p className={styles.note}>
                Aucune photo enregistrée pour ce bien.
              </p>
            ) : (
              <div className={styles.mediaGrid}>
                {gallery
                  .filter((m) => m.url !== PROPERTY_PLACEHOLDER)
                  .map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.id}
                      src={m.url}
                      alt={`Média ${property.reference}`}
                    />
                  ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Publication / annonces liées</h2>
            </header>
            {linkedListings.length === 0 ? (
              <p className={styles.note}>Aucune annonce liée à ce bien.</p>
            ) : (
              <ul className={styles.checklist}>
                {linkedListings.map((listing) => (
                  <li key={listing.id}>
                    <span>
                      <StatusBadge status={listing.status} />
                      <strong style={{ marginLeft: 8 }}>{listing.title}</strong>
                      <small style={{ marginLeft: 8, color: "#7b8780" }}>
                        {listing.operation} · {formatGnf(listing.price)} ·{" "}
                        {listing.reference}
                      </small>
                    </span>
                    <Link href={routes.ad(listing.id)} className={styles.inlineLink}>
                      Voir l’annonce
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {canPublish && !primaryListing ? (
              <Link
                href={`${routes.adNew}?propertyId=${encodeURIComponent(property.id)}`}
                className={styles.accountLink}
                style={{ marginTop: 12 }}
              >
                <Megaphone size={15} aria-hidden="true" />
                Créer une annonce pour ce bien
              </Link>
            ) : null}
          </section>
        </div>

        <aside className={styles.sideCol}>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>
                {advertiser.kind === "agency"
                  ? "Agence propriétaire du bien"
                  : advertiser.kind === "owner"
                    ? "Propriétaire du bien"
                    : "Annonceur"}
              </h2>
            </header>

            {advertiser.kind === "loading" || advertiser.kind === "idle" ? (
              <p className={styles.note}>Chargement de l’annonceur…</p>
            ) : null}

            {advertiser.kind === "missing" ? (
              <p className={styles.note} role="alert">
                {advertiser.message}
              </p>
            ) : null}

            {advertiser.kind === "agency" ? (
              <>
                <div className={styles.identity}>
                  <span className={styles.avatar} aria-hidden="true">
                    {advertiser.agency.initials ||
                      advertiser.agency.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <strong>{advertiser.agency.name}</strong>
                    <small>ID {advertiser.agency.id}</small>
                  </div>
                </div>
                <div className={styles.kv}>
                  <div>
                    <span>Statut</span>
                    <strong>
                      <StatusBadge
                        status={
                          (advertiser.agency.status as never) ||
                          (advertiser.agency.verified ? "ACTIF" : "EN_ATTENTE")
                        }
                      />
                    </strong>
                  </div>
                  <div>
                    <span>Vérification</span>
                    <strong>
                      {advertiser.agency.verified ? "Vérifiée" : "Non vérifiée"}
                    </strong>
                  </div>
                  <div className={styles.full}>
                    <span>Téléphone</span>
                    <strong>{displayValue(advertiser.agency.phone)}</strong>
                  </div>
                  <div className={styles.full}>
                    <span>E-mail</span>
                    <strong>{displayValue(advertiser.agency.email)}</strong>
                  </div>
                  <div>
                    <span>Ville</span>
                    <strong>{displayValue(advertiser.agency.city)}</strong>
                  </div>
                  <div>
                    <span>Adresse</span>
                    <strong>{displayValue(advertiser.agency.address)}</strong>
                  </div>
                </div>
                {(advertiser.agency.managerName ||
                  advertiser.agency.managerEmail ||
                  advertiser.agency.managerPhone) && (
                  <>
                    <h3>Responsable</h3>
                    <div className={styles.kv}>
                      <div className={styles.full}>
                        <span>Nom</span>
                        <strong>{displayValue(advertiser.agency.managerName)}</strong>
                      </div>
                      <div className={styles.full}>
                        <span>E-mail</span>
                        <strong>{displayValue(advertiser.agency.managerEmail)}</strong>
                      </div>
                      <div className={styles.full}>
                        <span>Téléphone</span>
                        <strong>{displayValue(advertiser.agency.managerPhone)}</strong>
                      </div>
                    </div>
                  </>
                )}
                <div className={styles.activity}>
                  <span>
                    Biens <b>{advertiser.propertiesCount}</b>
                  </span>
                  <span>
                    Annonces <b>{advertiser.listingsCount}</b>
                  </span>
                  <span>
                    Publiées <b>{advertiser.publishedCount}</b>
                  </span>
                </div>
                <Link
                  href={routes.agency(advertiser.agency.id)}
                  className={styles.accountLink}
                >
                  <Building2 size={15} aria-hidden="true" />
                  Voir la fiche agence
                </Link>
              </>
            ) : null}

            {advertiser.kind === "owner" ? (
              <>
                <div className={styles.identity}>
                  <span className={styles.avatar} aria-hidden="true">
                    {advertiser.user.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div>
                    <strong>{advertiser.user.name}</strong>
                    <small>{advertiser.user.role || "PROPRIÉTAIRE"}</small>
                  </div>
                </div>
                <div className={styles.kv}>
                  <div>
                    <span>Statut compte</span>
                    <strong>
                      <StatusBadge
                        status={(advertiser.user.status as never) || "ACTIF"}
                      />
                    </strong>
                  </div>
                  <div>
                    <span>Vérification</span>
                    <strong>
                      {advertiser.user.roleVerified ||
                      advertiser.user.documentsVerified
                        ? "Vérifié"
                        : "Non vérifié"}
                    </strong>
                  </div>
                  <div className={styles.full}>
                    <span>Téléphone</span>
                    <strong>{displayValue(advertiser.user.phone)}</strong>
                  </div>
                  <div className={styles.full}>
                    <span>E-mail</span>
                    <strong>{displayValue(advertiser.user.email)}</strong>
                  </div>
                </div>
                <div className={styles.activity}>
                  <span>
                    Biens <b>{advertiser.propertiesCount}</b>
                  </span>
                  <span>
                    Annonces <b>{advertiser.listingsCount}</b>
                  </span>
                </div>
                <Link
                  href={routes.user(advertiser.user.id)}
                  className={styles.accountLink}
                >
                  <UserRound size={15} aria-hidden="true" />
                  Voir le profil utilisateur
                </Link>
              </>
            ) : null}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Informations administratives</h2>
            </header>
            <div className={styles.kv}>
              <div className={styles.full}>
                <span>ID technique</span>
                <strong>{property.id}</strong>
              </div>
              {property.createdByAdminId ? (
                <div className={styles.full}>
                  <span>Créé administrativement par</span>
                  <strong>
                    {creatorAdmin
                      ? `${creatorAdmin.name} — ${creatorAdmin.role}`
                      : property.createdByAdminId}
                  </strong>
                </div>
              ) : (
                <div className={styles.full}>
                  <span>Création</span>
                  <strong>Par l’annonceur (pas d’admin créateur)</strong>
                </div>
              )}
              {property.updatedByAdminId ? (
                <div className={styles.full}>
                  <span>Dernière MAJ admin</span>
                  <strong>
                    {updaterAdmin
                      ? `${updaterAdmin.name} — ${updaterAdmin.role}`
                      : property.updatedByAdminId}
                  </strong>
                </div>
              ) : null}
            </div>
            <p className={styles.note} style={{ marginTop: 10 }}>
              L’administrateur créateur n’est jamais propriétaire du bien.
            </p>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
