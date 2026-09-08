"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Flag,
  Hash,
  Image as ImageIcon,
  MapPin,
  Play,
  Ruler,
  Save,
  ShieldAlert,
  Tag,
  UserCog,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { InfoField } from "@/components/administration/InfoField";
import {
  PropertyLocationMap,
  type PropertyLocationValue,
} from "@/components/property/PropertyLocationMap";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { formatGnf, type AdStatus } from "@/lib/administration/demo-data";
import {
  formatCoordinates,
  displayValue,
  isTerrainType,
  propertyAdminAddress,
  propertyLocationLabel,
} from "@/lib/property/display";
import {
  canModerateListings,
  canPublishListings,
} from "@/lib/administration/admin-accounts";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  listingService,
  type DemoBundle,
  type DemoListing,
} from "@/lib/demo-api/listings";
import { toGalleryMedia } from "@/lib/imageOptimization";
import {
  describeRentalTerms,
  formatAvailability,
  rentPeriodSuffix,
} from "@/lib/listing/listingTerms";
import { labelPropertyType } from "@/lib/property/typeFields";
import { routes } from "@/lib/routes/app-routes";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import styles from "./page.module.css";

type Decision =
  | "APPROUVER"
  | "REFUSER"
  | "SUSPENDRE"
  | "DEMANDER_CORRECTION"
  | "";

const REFUSAL_REASONS = [
  "Informations incorrectes",
  "Médias insuffisants",
  "Contenu non conforme",
  "Prix incohérent",
  "Annonceur non vérifié",
  "Doublon",
  "Autre",
] as const;

export default function AdminAdDetailPage() {
  const params = useParams<{ id: string }>();
  const { admin } = useAdminSession();
  const [bundle, setBundle] = useState<DemoBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<DemoListing | null>(null);

  const [decision, setDecision] = useState<Decision>("");
  const [refusalReason, setRefusalReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [allowResubmit, setAllowResubmit] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const loadBundle = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listingService.bundle(params.id);
      setBundle(data);
      setListing(data.listing);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l’annonce.",
      );
      setBundle(null);
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadBundle();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadBundle]);

  if (loading) {
    return (
      <AdminShell
        active="annonces"
        eyebrow="Modération"
        title="Chargement…"
        description="Lecture de l’annonce en cours."
        icon={FileText}
        heroVariant="compact"
        backHref={routes.ads}
        backLabel="Retour aux annonces"
      >
        <p>Chargement…</p>
      </AdminShell>
    );
  }

  if (loadError || !bundle?.listing || !listing) {
    return (
      <AdminShell
        active="annonces"
        eyebrow="Modération"
        title="Annonce introuvable"
        description="Cette annonce n’existe pas."
        icon={FileText}
        heroVariant="compact"
        backHref={routes.ads}
        backLabel="Retour aux annonces"
      >
        <EmptyState
          title="Annonce introuvable"
          description={
            loadError || "Vérifiez l’identifiant ou retournez à la liste."
          }
        />
      </AdminShell>
    );
  }

  const ad = listing;
  const property = bundle.property;
  const owner = bundle.owner as {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    roleVerified?: boolean;
    documentsVerified?: boolean;
    reportsCount?: number;
    createdAt?: string;
    lastLogin?: string;
    roleValidatedAt?: string;
    properties?: number;
    ads?: number;
    activeAds?: number;
    pendingAds?: number;
    rejectedAds?: number;
  } | null;
  const agency = bundle.agency as {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    verified?: boolean;
    documentsVerified?: boolean;
    reportsCount?: number;
    pendingAds?: number;
    rejectedAds?: number;
    userId?: string;
    initials?: string;
    city?: string;
    address?: string;
    validatedAt?: string;
    managerName?: string;
    managerEmail?: string;
    managerPhone?: string;
    propertiesManaged?: number;
    activeAds?: number;
  } | null;
  const currentStatus = ad.status as AdStatus;
  const gallery = toGalleryMedia(
    property?.media?.length
      ? property.media
      : property?.images ?? ad.images,
    listing?.id || ad.id || "ad",
  );
  const videos = property?.videos ?? ad.videos;

  const propertyLocation: PropertyLocationValue = {
    city: property?.city ?? "",
    commune: property?.commune ?? "",
    quarter: property?.district ?? "",
    landmark: property?.landmark ?? "",
    latitude: property?.coordinates?.lat ?? null,
    longitude: property?.coordinates?.lng ?? null,
    locationLabel: property?.locationLabel ?? null,
    locationDisplayName: property?.locationLabel ?? null,
    locationConfirmed: Boolean(property?.locationConfirmed),
  };

  const alerts: string[] = [];
  if (owner?.status === "EN_ATTENTE") alerts.push("Compte en attente");
  if (owner?.status === "SUSPENDU") alerts.push("Compte propriétaire suspendu");
  if (owner?.status === "BLOQUE") alerts.push("Compte propriétaire bloqué");
  if (owner && !owner.roleVerified) {
    alerts.push("Rôle propriétaire non validé");
  }
  if (agency && !agency.verified) alerts.push("Agence non vérifiée");
  if (agency && (agency.reportsCount ?? 0) > 0) {
    alerts.push("Agence concernée par des signalements");
  }
  if ((owner?.reportsCount ?? 0) > 0 || (ad.reports ?? 0) > 0) {
    alerts.push("Annonceur ou annonce déjà signalé(e)");
  }
  if (!owner?.phone && ad.advertiserType === "PROPRIETAIRE") {
    alerts.push("Aucun téléphone renseigné");
  }
  if (videos.length === 0 && ad.status === "EN_ATTENTE") {
    alerts.push("Bien sans vidéo");
  }
  if (bundle.propertyMissing) alerts.push("Bien rattaché introuvable");
  if (bundle.advertiserMissing) {
    alerts.push("Informations de l’annonceur indisponibles");
  }
  if (!property?.adminAddress) alerts.push("Adresse administrative incomplète");

  const reasonText =
    decision === "REFUSER"
      ? refusalReason === "Autre"
        ? customReason.trim()
        : refusalReason
      : decision === "DEMANDER_CORRECTION"
        ? correctionMessage.trim()
        : decision === "SUSPENDRE"
          ? customReason.trim() || refusalReason
          : "";

  const needsReason =
    decision === "REFUSER" ||
    decision === "SUSPENDRE" ||
    decision === "DEMANDER_CORRECTION";

  function requestSave() {
    if (!decision) return;
    if (needsReason && !reasonText) return;
    if (decision === "DEMANDER_CORRECTION" && !correctionMessage.trim()) return;
    setPendingSave(true);
  }

  async function confirmSave() {
    if (!decision || !listing || !admin) return;
    try {
      let nextStatus: AdStatus = listing.status as AdStatus;
      let note: string | undefined;
      let toastMessage = "";
      if (decision === "APPROUVER") {
        const updated = await listingService.approve(listing.id, admin);
        setListing(updated);
        setToast("Annonce approuvée et publiée.");
        return;
      } else if (decision === "REFUSER") {
        nextStatus = "REFUSEE";
        note = reasonText;
        toastMessage = allowResubmit
          ? "Annonce refusée (renvoi possible)."
          : "Annonce refusée définitivement.";
        const updated = await listingService.reject(listing.id, admin, {
          note: note || "",
          canResubmit: allowResubmit,
          resubmitRequiresVerifiedAdvertiser:
            reasonText === "Annonceur non vérifié",
        });
        setListing(updated);
        setToast(toastMessage);
        return;
      } else if (decision === "SUSPENDRE") {
        nextStatus = "SUSPENDUE";
        note = reasonText;
        toastMessage = "Annonce suspendue.";
      } else if (decision === "DEMANDER_CORRECTION") {
        const updated = await listingService.requestCorrection(
          listing.id,
          admin,
          reasonText,
        );
        setListing(updated);
        setToast("Correction demandée à l’annonceur.");
        return;
      }
      const updated = await listingService.setStatus(
        listing.id,
        {
          status: nextStatus,
          note,
        },
        admin,
      );
      setListing(updated);
      setToast(toastMessage);
    } catch (err) {
      setToast(
        err instanceof Error
          ? err.message
          : "Échec de la décision. Réessayez dans un instant.",
      );
    } finally {
      setPendingSave(false);
      setDecision("");
    }
  }

  async function publishDirectly() {
    if (!admin || !listing) return;
    try {
      const updated = await listingService.publishDirect(listing.id, admin);
      setListing(updated);
      setToast("Annonce publiée directement par administrateur.");
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Publication directe refusée.",
      );
    }
  }

  const canModerate = admin ? canModerateListings(admin) : false;
  const canPublish = admin ? canPublishListings(admin) : false;

  // Conditions commerciales saisies par l'annonceur (modèle Listing).
  const rentalRows = describeRentalTerms(ad.rentalTerms, formatGnf);

  const attachmentLabel =
    ad.advertiserType === "PROPRIETAIRE" && owner
      ? `Ce bien est rattaché au compte ${owner.name}`
      : ad.advertiserType === "AGENCE" && agency
        ? `Ce bien est géré par ${agency.name}`
        : null;

  return (
    <AdminShell
      active="annonces"
      eyebrow="Modération"
      title={ad.title}
      description="Contrôlez le contenu, l’annonceur et le bien avant toute décision."
      note={attachmentLabel || undefined}
      icon={FileText}
      heroVariant="detail"
      backHref={routes.ads}
      backLabel="Retour aux annonces"
      badge={formatStatusLabel(currentStatus)}
      badgeTone={statusTone(currentStatus)}
      meta={[{ label: "Référence", value: ad.reference, icon: Hash }]}
    >

      {alerts.length > 0 ? (
        <section className={styles.alerts} aria-label="Alertes administratives">
          {alerts.map((alert) => (
            <p key={alert}>
              <AlertTriangle size={15} aria-hidden="true" />
              {alert}
            </p>
          ))}
        </section>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          {/* 1. Résumé annonce */}
          <section className={styles.panel} id="annonce">
            <header className={styles.panelHead}>
              <h2>Résumé de l’annonce</h2>
              <StatusBadge status={currentStatus} />
            </header>
            <div className={styles.kv}>
              <div>
                <span>Référence</span>
                <strong>{ad.reference}</strong>
              </div>
              <div>
                <span>Opération</span>
                <strong>{ad.operation === "VENTE" ? "Vente" : "Location"}</strong>
              </div>
              <div>
                <span>{ad.operation === "LOCATION" ? "Loyer" : "Prix"}</span>
                <strong>
                  {formatGnf(ad.price)}
                  {ad.operation === "LOCATION"
                    ? ` ${rentPeriodSuffix(
                        ad.rentalTerms?.period ?? "MONTHLY",
                        ad.rentalTerms?.periodLabel,
                      )}`
                    : ""}
                </strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{labelPropertyType(ad.type)}</strong>
              </div>
              <div>
                <span>Création</span>
                <strong>{ad.createdAt}</strong>
              </div>
              <div>
                <span>Soumission</span>
                <strong>{ad.submittedAt}</strong>
              </div>
              <div>
                <span>Dernière modification</span>
                <strong>{ad.updatedAt}</strong>
              </div>
              <div>
                <span>Publication</span>
                <strong>{displayValue(ad.publishedAt)}</strong>
              </div>
              <div>
                <span>Vues</span>
                <strong>{ad.views}</strong>
              </div>
              <div>
                <span>Signalements</span>
                <strong>{ad.reports}</strong>
              </div>
              <div>
                <span>Risque</span>
                <strong>{ad.risk}/100</strong>
              </div>
            </div>
            <p className={styles.description}>{ad.description}</p>
            <div className={styles.quickStats}>
              <span>
                <Eye size={14} aria-hidden="true" /> {ad.views} vues
              </span>
              <span>
                <Flag size={14} aria-hidden="true" /> {ad.reports} signalement(s)
              </span>
              <span>
                <ShieldAlert size={14} aria-hidden="true" /> Risque {ad.risk}
              </span>
            </div>
          </section>

          {/* 2–4. Bien + localisation + caractéristiques */}
          <section className={styles.panel} id="bien">
            <header className={styles.panelHead}>
              <h2>Informations du bien</h2>
              {property ? (
                <a href="#bien" className={styles.inlineLink}>
                  Voir le bien
                </a>
              ) : null}
            </header>
            {bundle.propertyMissing || !property ? (
              <p className={styles.missing}>
                Informations du bien indisponibles. Aucun bien trouvé pour
                l’identifiant rattaché.
              </p>
            ) : (
              <>
                <div className={styles.kv}>
                  <div>
                    <span>Référence bien</span>
                    <strong>{property.reference}</strong>
                  </div>
                  <div>
                    <span>Titre</span>
                    <strong>{property.title}</strong>
                  </div>
                  <div>
                    <span>Type</span>
                    <strong>{property.type}</strong>
                  </div>
                  <div>
                    <span>État</span>
                    <strong>{displayValue(property.condition)}</strong>
                  </div>
                  <div>
                    <span>Disponibilité</span>
                    <strong>{displayValue(property.availability)}</strong>
                  </div>
                </div>

                <h3>Caractéristiques</h3>
                <div className={styles.features}>
                  <span>
                    <Ruler size={16} aria-hidden="true" />
                    {property.area} m²
                  </span>
                  {property.rooms !== undefined ? (
                    <span>
                      <Building2 size={16} aria-hidden="true" />
                      {property.rooms} pièces
                    </span>
                  ) : null}
                  {property.bedrooms != null && !isTerrainType(property.type) ? (
                    <span>
                      <BedDouble size={16} aria-hidden="true" />
                      {property.bedrooms} chambres
                    </span>
                  ) : null}
                  {property.bathrooms != null && !isTerrainType(property.type) ? (
                    <span>
                      <Bath size={16} aria-hidden="true" />
                      {property.bathrooms} sdb
                    </span>
                  ) : null}
                </div>
                {(property.amenities?.length ?? 0) > 0 ? (
                  <ul className={styles.tags}>
                    {property.amenities!.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}

                <h3>Localisation</h3>
                {property ? (
                  <>
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
                        label="Coordonnées GPS"
                        value={formatCoordinates(property.coordinates)}
                        full
                      />
                    </div>
                    {property.coordinates?.lat != null &&
                    property.coordinates?.lng != null ? (
                      <PropertyLocationMap
                        value={propertyLocation}
                        onChange={() => {}}
                        readOnly
                      />
                    ) : (
                      <p className={styles.attachment}>
                        Position précise non renseignée
                      </p>
                    )}
                  </>
                ) : (
                  <p className={styles.attachment}>
                    Bien rattaché introuvable — localisation indisponible.
                  </p>
                )}
                {attachmentLabel ? (
                  <p className={styles.attachment}>
                    <MapPin size={14} aria-hidden="true" />
                    {attachmentLabel}
                  </p>
                ) : null}
              </>
            )}
          </section>

          {/* 4bis. Conditions commerciales de l'annonce (≠ fiche bien) */}
          {rentalRows.length > 0 ? (
            <section className={styles.panel} id="conditions-location">
              <header className={styles.panelHead}>
                <h2>Conditions de location</h2>
                <span className={styles.inlineLink}>
                  {labelPropertyType(ad.type)} · Location
                </span>
              </header>
              <div className={styles.kv}>
                {rentalRows.map((row) => (
                  <InfoField
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    full={row.label === "Conditions particulières"}
                  />
                ))}
              </div>
              <p className={styles.attachment}>
                Usages déclarés par le bailleur dans l’annonce — sans valeur de
                validation juridique de l’usage du terrain.
              </p>
            </section>
          ) : null}

          {ad.operation === "LOCATION" && !ad.rentalTerms ? (
            <section className={styles.panel} id="conditions-location">
              <header className={styles.panelHead}>
                <h2>Conditions de location</h2>
              </header>
              <p className={styles.missing}>
                Aucune condition de location renseignée (annonce antérieure à
                cette version ou saisie incomplète).
              </p>
            </section>
          ) : null}

          {ad.saleTerms ? (
            <section className={styles.panel} id="conditions-vente">
              <header className={styles.panelHead}>
                <h2>Conditions de vente</h2>
              </header>
              <div className={styles.kv}>
                <InfoField
                  label="Prix de vente"
                  value={formatGnf(ad.price)}
                />
                <InfoField
                  label="Prix négociable"
                  value={ad.saleTerms.negotiable ? "Oui" : "Non"}
                />
                <InfoField
                  label="Disponible à partir du"
                  value={formatAvailability(ad.saleTerms.availableFrom)}
                />
                {ad.saleTerms.specialConditions ? (
                  <InfoField
                    label="Conditions particulières"
                    value={ad.saleTerms.specialConditions}
                    full
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {/* 5. Médias */}
          <section className={styles.panel} id="medias">
            <header className={styles.panelHead}>
              <h2>Photos et vidéos</h2>
            </header>

            <h3>Photos</h3>
            <div className={styles.media}>
              {gallery.length === 0 ? (
                <p className={styles.missing}>Aucune photo fournie.</p>
              ) : (
                gallery.map((media, index) => (
                  <button
                    key={media.id}
                    type="button"
                    className={styles.mediaThumb}
                    onClick={() => setPreviewImage(media.url)}
                    aria-label={`Prévisualiser la photo ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.url} alt="" />
                    <span>
                      <ImageIcon size={14} aria-hidden="true" /> Photo{" "}
                      {index + 1}
                    </span>
                  </button>
                ))
              )}
            </div>

            <h3>Vidéos</h3>
            <div className={styles.media}>
              {videos.length === 0 ? (
                <p className={styles.missing}>Aucune vidéo rattachée au bien.</p>
              ) : (
                videos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    className={styles.mediaThumb}
                    onClick={() =>
                      setPreviewVideo({
                        url: video.url,
                        title: video.title || "Vidéo du bien",
                      })
                    }
                    aria-label={`Lire la vidéo du bien : ${video.title}`}
                  >
                    <span className={styles.videoPlay}>
                      <Play size={20} aria-hidden="true" />
                    </span>
                    <span>{video.title}</span>
                    <small>Lecture avant validation</small>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* 7. Historique */}
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Historique de modération</h2>
            </header>
            <ol className={styles.timeline}>
              {ad.history.map((event) => (
                <li key={event.id}>
                  <strong>{event.date}</strong>
                  <span>{event.label}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className={styles.sideCol}>
          {/* 6. Annonceur */}
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Annonceur</h2>
              <StatusBadge
                status={ad.advertiserType}
                label={
                  ad.advertiserType === "AGENCE" ? "Agence" : "Propriétaire"
                }
              />
            </header>

            {bundle.advertiserMissing ? (
              <p className={styles.missing}>
                Informations de l’annonceur indisponibles. Aucun fallback
                appliqué.
              </p>
            ) : ad.advertiserType === "PROPRIETAIRE" && owner ? (
              <>
                <div className={styles.identity}>
                  <span className={styles.avatar} aria-hidden="true">
                    {(owner.name || "?")
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div>
                    <strong>{owner.name || "Non renseigné"}</strong>
                    <small>ID {owner.id || "—"}</small>
                  </div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.full}>
                    <span>E-mail</span>
                    <strong>{owner.email || "Non renseigné"}</strong>
                  </div>
                  <div className={styles.full}>
                    <span>Téléphone</span>
                    <strong>{owner.phone || "Non renseigné"}</strong>
                  </div>
                  <div>
                    <span>Statut compte</span>
                    <StatusBadge status={(owner.status as never) || "ACTIF"} />
                  </div>
                  <div>
                    <span>Rôle vérifié</span>
                    <strong>{owner.roleVerified ? "Oui" : "Non"}</strong>
                  </div>
                  <div>
                    <span>Inscription</span>
                    <strong>{owner.createdAt || "Non renseigné"}</strong>
                  </div>
                  <div>
                    <span>Dernière connexion</span>
                    <strong>{owner.lastLogin || "Non renseigné"}</strong>
                  </div>
                  <div>
                    <span>Validation rôle</span>
                    <strong>{displayValue(owner.roleValidatedAt)}</strong>
                  </div>
                </div>
                <div className={styles.activity}>
                  <span>
                    Biens <b>{owner.properties ?? 0}</b>
                  </span>
                  <span>
                    Annonces <b>{owner.ads ?? 0}</b>
                  </span>
                  <span>
                    Actives <b>{owner.activeAds ?? 0}</b>
                  </span>
                  <span>
                    Attente <b>{owner.pendingAds ?? 0}</b>
                  </span>
                  <span>
                    Refusées <b>{owner.rejectedAds ?? 0}</b>
                  </span>
                  <span>
                    Signalements <b>{owner.reportsCount ?? 0}</b>
                  </span>
                </div>
                {owner.id ? (
                <Link
                  href={routes.user(owner.id)}
                  className={styles.accountLink}
                >
                  <UserRound size={15} aria-hidden="true" />
                  Voir le compte propriétaire
                </Link>
                ) : null}
              </>
            ) : ad.advertiserType === "AGENCE" && agency ? (
              <>
                <div className={styles.identity}>
                  <span className={styles.avatar} aria-hidden="true">
                    {agency.initials ||
                      (agency.name || "?")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                  </span>
                  <div>
                    <strong>{agency.name || "Non renseigné"}</strong>
                    <small>ID {agency.id || "—"}</small>
                  </div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.full}>
                    <span>E-mail pro</span>
                    <strong>{agency.email || "Non renseigné"}</strong>
                  </div>
                  <div className={styles.full}>
                    <span>Téléphone pro</span>
                    <strong>{agency.phone || "Non renseigné"}</strong>
                  </div>
                  <div>
                    <span>Ville</span>
                    <strong>{agency.city || "Non renseigné"}</strong>
                  </div>
                  <div>
                    <span>Adresse</span>
                    <strong>{displayValue(agency.address)}</strong>
                  </div>
                  <div>
                    <span>Agence vérifiée</span>
                    <strong>{agency.verified ? "Oui" : "Non"}</strong>
                  </div>
                  <div>
                    <span>Validation</span>
                    <strong>{displayValue(agency.validatedAt)}</strong>
                  </div>
                </div>
                <h3>Responsable</h3>
                <div className={styles.kv}>
                  <div className={styles.full}>
                    <span>Nom</span>
                    <strong>{agency.managerName || "Non renseigné"}</strong>
                  </div>
                  <div className={styles.full}>
                    <span>E-mail</span>
                    <strong>{agency.managerEmail || "Non renseigné"}</strong>
                  </div>
                  <div className={styles.full}>
                    <span>Téléphone</span>
                    <strong>{agency.managerPhone || "Non renseigné"}</strong>
                  </div>
                </div>
                <div className={styles.activity}>
                  <span>
                    Biens <b>{agency.propertiesManaged ?? 0}</b>
                  </span>
                  <span>
                    Actives <b>{agency.activeAds ?? 0}</b>
                  </span>
                  <span>
                    Attente <b>{agency.pendingAds ?? 0}</b>
                  </span>
                  <span>
                    Refusées <b>{agency.rejectedAds ?? 0}</b>
                  </span>
                  <span>
                    Signalements <b>{agency.reportsCount ?? 0}</b>
                  </span>
                </div>
                {agency.id ? (
                <Link
                  href={routes.agency(agency.id)}
                  className={styles.accountLink}
                >
                  <Building2 size={15} aria-hidden="true" />
                  Voir la fiche agence
                </Link>
                ) : null}
              </>
            ) : null}
          </section>

          {/* Vérification */}
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Vérification de l’annonceur</h2>
            </header>
            <ul className={styles.checklist}>
              <CheckRow
                ok={
                  ad.advertiserType === "PROPRIETAIRE"
                    ? Boolean(owner?.roleVerified)
                    : Boolean(agency?.verified)
                }
                label="Rôle validé"
              />
              <CheckRow
                ok={
                  ad.advertiserType === "PROPRIETAIRE"
                    ? owner?.status === "ACTIF"
                    : (agency?.status as string | undefined) === "ACTIF" ||
                      Boolean(agency?.verified)
                }
                label="Compte actif"
              />
              <CheckRow
                ok={Boolean(
                  ad.advertiserType === "PROPRIETAIRE"
                    ? owner?.phone
                    : agency?.phone,
                )}
                label="Téléphone renseigné"
              />
              <CheckRow
                ok={Boolean(
                  ad.advertiserType === "PROPRIETAIRE"
                    ? owner?.email
                    : agency?.email,
                )}
                label="E-mail renseigné"
              />
              <CheckRow
                ok={
                  ad.advertiserType === "PROPRIETAIRE"
                    ? Boolean(owner?.documentsVerified)
                    : Boolean(agency?.documentsVerified)
                }
                label="Documents vérifiés"
                pending={
                  ad.advertiserType === "PROPRIETAIRE"
                    ? Boolean(owner && !owner.documentsVerified)
                    : Boolean(agency && !agency.documentsVerified)
                }
              />
              <CheckRow
                ok={
                  (owner?.reportsCount ?? 0) === 0 &&
                  (agency?.reportsCount ?? 0) === 0 &&
                  (ad.reports ?? 0) === 0
                }
                label="Compte / annonce signalé"
                invertOkLabel
              />
              <CheckRow
                ok={!bundle.propertyMissing && Boolean(property)}
                label="Bien rattaché au compte"
              />
            </ul>
          </section>

          {/* 8. Décision */}
          <section className={`${styles.panel} ${styles.decision}`}>
            <header className={styles.panelHead}>
              <h2>Décision administrative</h2>
            </header>
            {canPublish &&
            (listing.status === "BROUILLON" ||
              listing.status === "SUSPENDUE") ? (
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className={styles.save}
                  onClick={() => void publishDirectly()}
                >
                  Publier directement
                </button>
                <p className={styles.note}>
                  Publication admin (ANNONCES_PUBLICATION) — sans file
                  EN_ATTENTE.
                </p>
              </div>
            ) : null}
            {canModerate ? (
            <div className={styles.choices}>
              {listing.status === "EN_ATTENTE" ? (
                <>
              <button
                type="button"
                className={decision === "APPROUVER" ? styles.selected : ""}
                onClick={() => setDecision("APPROUVER")}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                Approuver
              </button>
              <button
                type="button"
                className={
                  decision === "REFUSER" ? styles.selectedDanger : ""
                }
                onClick={() => setDecision("REFUSER")}
              >
                <XCircle size={16} aria-hidden="true" />
                Refuser
              </button>
                </>
              ) : null}
              <button
                type="button"
                className={
                  decision === "SUSPENDRE" ? styles.selectedDanger : ""
                }
                onClick={() => setDecision("SUSPENDRE")}
              >
                <ShieldAlert size={16} aria-hidden="true" />
                Suspendre
              </button>
              <button
                type="button"
                className={
                  decision === "DEMANDER_CORRECTION" ? styles.selectedWarn : ""
                }
                onClick={() => setDecision("DEMANDER_CORRECTION")}
              >
                <AlertTriangle size={16} aria-hidden="true" />
                Demander une correction
              </button>
            </div>
            ) : (
              <p className={styles.note}>
                Actions de modération masquées : permission MODERATION requise.
              </p>
            )}

            {decision === "REFUSER" ? (
              <>
                <label className={styles.field}>
                  Motif de refus
                  <select
                    value={refusalReason}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRefusalReason(value);
                      if (value === "Annonceur non vérifié") {
                        setAllowResubmit(true);
                      }
                    }}
                  >
                    <option value="">Sélectionner…</option>
                    {REFUSAL_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allowResubmit}
                      onChange={(e) => setAllowResubmit(e.target.checked)}
                    />
                    Autoriser un renvoi après correction
                  </span>
                </label>
              </>
            ) : null}

            {decision === "REFUSER" && refusalReason === "Autre" ? (
              <label className={styles.field}>
                Précision
                <textarea
                  rows={4}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Décrire le motif…"
                />
              </label>
            ) : null}

            {decision === "SUSPENDRE" ? (
              <label className={styles.field}>
                Motif de suspension
                <textarea
                  rows={4}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Motif obligatoire…"
                />
              </label>
            ) : null}

            {decision === "DEMANDER_CORRECTION" ? (
              <label className={styles.field}>
                Message à l’annonceur (obligatoire)
                <textarea
                  rows={5}
                  value={correctionMessage}
                  onChange={(e) => setCorrectionMessage(e.target.value)}
                  placeholder="Ex. Ajoutez des photos plus claires."
                />
              </label>
            ) : null}

            {canModerate ? (
            <button
              type="button"
              className={styles.save}
              disabled={
                !decision ||
                (needsReason && !reasonText)
              }
              onClick={requestSave}
            >
              <Save size={15} aria-hidden="true" />
              Enregistrer la décision
            </button>
            ) : null}
            <p className={styles.note}>
              Modération (EN_ATTENTE) ≠ publication directe (BROUILLON →
              PUBLIEE). Une annonce refusée doit être renvoyée par l’annonceur.
            </p>
          </section>
        </aside>
      </div>

      {previewImage ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true">
          <div className={styles.lightboxInner}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setPreviewImage(null)}
              aria-label="Fermer la prévisualisation"
            >
              <X size={22} aria-hidden="true" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Prévisualisation photo" />
          </div>
        </div>
      ) : null}

      {previewVideo ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true">
          <div className={styles.lightboxInner}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setPreviewVideo(null)}
              aria-label="Fermer la vidéo"
            >
              <X size={22} aria-hidden="true" />
            </button>
            <p className={styles.lightboxTitle}>{previewVideo.title}</p>
            <video
              key={previewVideo.url}
              controls
              playsInline
              preload="metadata"
              className={styles.lightboxVideo}
              aria-label={`Lire la vidéo du bien : ${previewVideo.title}`}
            >
              <source src={previewVideo.url} />
            </video>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingSave}
        title="Confirmer la décision"
        description="Cette action sensible sera journalisée dans la simulation frontend."
        subject={decision}
        confirmLabel="Confirmer"
        onCancel={() => setPendingSave(false)}
        onConfirm={confirmSave}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}

function CheckRow({
  ok,
  label,
  pending,
  invertOkLabel,
}: {
  ok: boolean;
  label: string;
  pending?: boolean | null;
  invertOkLabel?: boolean;
}) {
  const positive = invertOkLabel ? ok : ok;
  const text = invertOkLabel
    ? positive
      ? "Non"
      : "Oui"
    : pending
      ? "En attente"
      : positive
        ? "Oui"
        : "Non";

  const tone = pending ? "warn" : positive ? "ok" : "bad";

  return (
    <li>
      <span>
        {tone === "warn" ? (
          <AlertTriangle size={14} aria-hidden="true" className={styles.warn} />
        ) : tone === "ok" ? (
          <CheckCircle2 size={14} aria-hidden="true" className={styles.ok} />
        ) : (
          <XCircle size={14} aria-hidden="true" className={styles.bad} />
        )}
        {label}
      </span>
      <strong>{text}</strong>
    </li>
  );
}
