"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck2,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AccountScopeExtensionDialog } from "@/components/account/AccountScopeExtensionDialog";
import AgencyShell from "@/components/agence/AgencyShell";
import {
  emptyPropertyLocation,
  PropertyLocationMap,
  type PropertyLocationValue,
} from "@/components/property/PropertyLocationMap";
import { PropertyVideoUploader } from "@/components/property/PropertyVideoUploader";
import {
  ConfirmationCheckbox,
  ConfirmationGroup,
  DemoToast,
} from "@/components/ui";
import { useAccountScope } from "@/hooks/useAccountScope";
import {
  addPropertyCtaLabel,
  labelOperation,
  scopeRestrictionMessage,
} from "@/lib/demo-api/account-scope";
import { DEMO_AGENCY_ID, DEMO_AGENCY_USER_ID } from "@/lib/demo-api/config";
import { propertyService } from "@/lib/demo-api/listings";
import { buildPropertyApiPayload, logPropertyTrace } from "@/lib/demo-api/propertyPayload";
import { PropertyLegalSection } from "@/components/property/PropertyLegalSection";
import {
  getPropertyTypeFields,
  labelPropertyType,
  normalizePropertyTypeKey,
  parseOptionalRooms,
  type PropertyTypeKey,
} from "@/lib/property/typeFields";
import type { PropertyVideo } from "@/lib/property/videos";
import { PROPERTY_PLACEHOLDER } from "@/lib/imageOptimization";
import { fileToDataUrl } from "@/lib/proprietaire/storage";
import styles from "./page.module.css";

type Img = { id: string; name: string; url: string };

function computeCompleteness(input: {
  title: string;
  location: string;
  price: number;
  area: number;
  description: string;
  imagesCount: number;
}) {
  let score = 0;
  if (input.title.trim()) score += 20;
  if (input.location.trim()) score += 20;
  if (input.price > 0) score += 15;
  if (input.area > 0) score += 15;
  if (input.description.trim().length > 20) score += 15;
  if (input.imagesCount > 0) score += 15;
  return Math.min(100, score);
}

export default function NewAgencyPropertyPage() {
  const {
    userId,
    loading: scopeLoading,
    allowedPropertyTypes,
    allowedPropertyScopes,
    operationsForType,
    pendingScopeRequests,
    refresh: refreshScope,
  } = useAccountScope({ userId: DEMO_AGENCY_USER_ID });
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [savedMode, setSavedMode] = useState<"complete" | "draft">("complete");
  const [createdSlug, setCreatedSlug] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [legalDone, setLegalDone] = useState(false);
  const [images, setImages] = useState<Img[]>([]);
  const [videos, setVideos] = useState<PropertyVideo[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scopeDenied, setScopeDenied] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const dismissToast = useCallback(() => setToast(null), []);
  const [location, setLocation] = useState<PropertyLocationValue>(() =>
    emptyPropertyLocation("Conakry"),
  );
  const [form, setForm] = useState({
    mandateType: "SIMPLE",
    clientReference: "",
    clientDisplayName: "",
    operation: "VENTE",
    type: "VILLA" as PropertyTypeKey | string,
    title: "",
    price: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    description: "",
    accurate: false,
    authorized: false,
  });

  const typeOptions = useMemo(
    () =>
      allowedPropertyTypes.length
        ? allowedPropertyTypes.map((t) => normalizePropertyTypeKey(t))
        : ([] as PropertyTypeKey[]),
    [allowedPropertyTypes],
  );
  // Les opérations suivent le type sélectionné : un mandat de vente sur un
  // terrain n'ouvre pas automatiquement la location.
  const operationOptions = useMemo(
    () => operationsForType(form.type) ?? [],
    [operationsForType, form.type],
  );
  const singleType = typeOptions.length === 1 ? typeOptions[0] : null;
  const typeFields = getPropertyTypeFields(form.type);
  const pageTitle = addPropertyCtaLabel(allowedPropertyTypes);

  useEffect(() => {
    if (scopeLoading) return;
    setForm((current) => {
      let nextType = current.type;
      let nextOp = current.operation;
      if (typeOptions.length) {
        const normalized = normalizePropertyTypeKey(current.type);
        if (!typeOptions.includes(normalized)) {
          nextType = typeOptions[0];
        } else {
          nextType = normalized;
        }
      }
      if (operationOptions.length && !operationOptions.includes(current.operation)) {
        nextOp = operationOptions[0];
      }
      if (nextType === current.type && nextOp === current.operation) {
        return current;
      }
      return { ...current, type: nextType, operation: nextOp };
    });
  }, [scopeLoading, typeOptions, operationOptions]);

  function update(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const t = e.target;
    setForm((v) => ({
      ...v,
      [t.name]:
        t instanceof HTMLInputElement && t.type === "checkbox"
          ? t.checked
          : t.value,
    }));
  }

  async function addImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 12 - images.length);
    const next: Img[] = [];
    for (const file of files) {
      const url = await fileToDataUrl(file);
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        url,
      });
    }
    setImages((v) => [...v, ...next]);
    e.target.value = "";
  }

  function locationSummary() {
    return (
      [location.quarter, location.commune, location.city]
        .filter(Boolean)
        .join(", ") || location.city
    );
  }

  function buildPayload(status: "ACTIF" | "BROUILLON") {
    const imageUrls = images.map((img) => img.url);
    const locLabel = locationSummary();
    return buildPropertyApiPayload({
      title:
        form.title ||
        (status === "BROUILLON" ? "Bien en brouillon" : "Nouveau bien"),
      typeLabel: labelPropertyType(form.type),
      operation: form.operation,
      price: Number(form.price) || 0,
      area: Number(form.area) || 0,
      bedrooms: parseOptionalRooms(form.type, "bedrooms", form.bedrooms),
      bathrooms: parseOptionalRooms(form.type, "bathrooms", form.bathrooms),
      description: form.description,
      images: imageUrls.length ? imageUrls : [PROPERTY_PLACEHOLDER],
      videos,
      location,
      status,
      ownerId: null,
      agencyId: DEMO_AGENCY_ID,
      mandateType: form.mandateType,
      clientDisplayName: form.clientDisplayName || null,
      clientReference: form.clientReference || null,
      completeness: computeCompleteness({
        title: form.title,
        location: locLabel,
        price: Number(form.price) || 0,
        area: Number(form.area) || 0,
        description: form.description,
        imagesCount: imageUrls.length,
      }),
    });
  }

  async function persist(status: "ACTIF" | "BROUILLON") {
    setSaving(true);
    setSubmitError(null);
    setScopeDenied(false);
    try {
      const payload = buildPayload(status);
      logPropertyTrace("PROPERTY FORM VALUES", {
        city: location.city,
        commune: location.commune,
        quarter: location.quarter,
        landmark: location.landmark,
        area: form.area,
        description: form.description,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      logPropertyTrace("PROPERTY CREATE PAYLOAD", {
        city: payload.city,
        commune: payload.commune,
        district: payload.district,
        landmark: payload.landmark,
        adminAddress: payload.adminAddress,
        locationLabel: payload.locationLabel,
        area: payload.area,
        description: payload.description,
        coordinates: payload.coordinates,
        ownerId: payload.ownerId,
        agencyId: payload.agencyId,
      });
      const created = await propertyService.create(payload);
      setCreatedSlug(created.slug || created.id);
      setCreatedId(created.id);
      setSavedMode(status === "BROUILLON" ? "draft" : "complete");
      setDone(true);
    } catch (err) {
      const restricted = scopeRestrictionMessage(
        err,
        "/agence/biens?extension=1",
      );
      setSubmitError(restricted.message);
      setScopeDenied(Boolean(restricted.kind));
      setToast(restricted.message);
    } finally {
      setSaving(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await persist("ACTIF");
  }

  async function saveDraft() {
    await persist("BROUILLON");
  }

  if (done) {
    const title = form.title.trim();
    const isDraft = savedMode === "draft";
    // Le bien est nommé par son type : l'opération commerciale n'existe
    // qu'au moment de l'annonce.
    const headline = isDraft
      ? "Brouillon enregistré"
      : `${labelPropertyType(form.type)} enregistré`;
    return (
      <AgencyShell
        active="biens"
        eyebrow="Portefeuille"
        title="Création terminée"
        description="Dernière étape avant la publication : la situation juridique du bien."
      >
        <section className={`${styles.card} ${styles.success}`}>
          <header className={styles.successHero}>
            <span className={styles.successIcon} aria-hidden="true">
              <FileCheck2 size={26} />
            </span>
            <div className={styles.successCopy}>
              <h2>{headline}</h2>
              <p>
                {isDraft
                  ? "Cette fiche est conservée en brouillon. Vous pourrez la compléter et la publier plus tard."
                  : "Le bien a été ajouté au portefeuille de l’agence. Vous pouvez maintenant compléter sa situation juridique et créer une annonce."}
              </p>
              {title ? (
                <p className={styles.successSubject}>{title}</p>
              ) : null}
            </div>
          </header>

          <p className={styles.successNotice}>
            Votre agence est vérifiée, mais chaque bien fait l’objet d’un
            contrôle juridique séparé avant sa publication. Joignez le mandat
            si vous agissez pour un tiers.
          </p>

          {createdId ? (
            <PropertyLegalSection
              propertyId={createdId}
              agencyCapacity
              onSaved={() => setLegalDone(true)}
            />
          ) : null}

          <div className={styles.successBar}>
            <p>
              {legalDone
                ? "Justificatif transmis — il sera examiné avant publication."
                : isDraft
                  ? "Votre brouillon est enregistré."
                  : "Le bien est enregistré."}
            </p>
            <div className={styles.successActions}>
              <Link
                href={
                  createdSlug ? `/agence/biens/${createdSlug}` : "/agence/biens"
                }
                className={styles.successSecondary}
              >
                Voir le bien
              </Link>
              {!isDraft ? (
                <Link
                  href={`/agence/annonces/nouvelle?bien=${encodeURIComponent(createdSlug || "nouveau")}`}
                  className={styles.successPrimary}
                >
                  Publier ce bien
                </Link>
              ) : (
                <Link href="/agence/biens" className={styles.successPrimary}>
                  Retour au portefeuille
                </Link>
              )}
            </div>
          </div>
        </section>
      </AgencyShell>
    );
  }

  return (
    <AgencyShell
      active="biens"
      eyebrow="Nouveau bien professionnel"
      title={pageTitle}
      description="Créez la fiche et associez-la à un mandat ou une autorisation."
    >
      <div className={styles.steps}>
        {[
          "Mandat et bien",
          "Localisation",
          "Caractéristiques",
          "Médias",
          "Vérification",
        ].map((l, i) => (
          <span
            key={l}
            className={
              step === i + 1 ? styles.current : step > i + 1 ? styles.done : ""
            }
          >
            <b>{step > i + 1 ? <Check size={14} aria-hidden="true" /> : i + 1}</b>
            <small>{l}</small>
          </span>
        ))}
      </div>
      <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
        {step === 1 && (
          <section>
            <h2>Mandat, client et informations commerciales</h2>
            {scopeLoading ? (
              <p className={styles.warn}>Chargement des types autorisés…</p>
            ) : null}
            {!scopeLoading && typeOptions.length === 0 ? (
              <p className={styles.warn} role="status">
                Aucun type de bien n’est actuellement autorisé sur votre compte.{" "}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setExtensionOpen(true)}
                >
                  Demander une extension
                </button>
              </p>
            ) : null}
            <div className={styles.grid2}>
              <label>
                Type de mandat
                <select
                  name="mandateType"
                  value={form.mandateType}
                  onChange={update}
                >
                  <option value="EXCLUSIF">Exclusif</option>
                  <option value="SIMPLE">Simple</option>
                  <option value="INTERNE">Bien propre à l’agence</option>
                </select>
              </label>
              <label>
                Référence client
                <input
                  name="clientReference"
                  value={form.clientReference}
                  onChange={update}
                />
              </label>
              <label className={styles.full}>
                Nom d’affichage du client
                <input
                  name="clientDisplayName"
                  value={form.clientDisplayName}
                  onChange={update}
                />
              </label>
              <label>
                Opération
                {operationOptions.length === 1 ? (
                  <input
                    value={labelOperation(operationOptions[0])}
                    readOnly
                    aria-label="Opération autorisée"
                  />
                ) : (
                  <select
                    name="operation"
                    value={form.operation}
                    onChange={update}
                    disabled={!operationOptions.length}
                  >
                    {(operationOptions.length
                      ? operationOptions
                      : ["VENTE", "LOCATION"]
                    ).map((op) => (
                      <option key={op} value={op}>
                        {labelOperation(op)}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label>
                {singleType ? "Type de bien autorisé" : "Type"}
                {singleType ? (
                  <input
                    value={labelPropertyType(singleType)}
                    readOnly
                    aria-label="Type de bien autorisé"
                  />
                ) : (
                  <select
                    name="type"
                    value={form.type}
                    onChange={update}
                    disabled={!typeOptions.length}
                  >
                    {(typeOptions.length
                      ? typeOptions
                      : ([
                          "VILLA",
                          "APPARTEMENT",
                          "MAISON",
                          "TERRAIN",
                          "BUREAU",
                          "COMMERCE",
                        ] as PropertyTypeKey[])
                    ).map((type) => (
                      <option key={type} value={type}>
                        {labelPropertyType(type)}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className={styles.full}>
                Titre interne
                <input name="title" value={form.title} onChange={update} />
              </label>
              <label>
                Prix
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={update}
                />
              </label>
            </div>
          </section>
        )}
        {step === 2 && (
          <section>
            <h2>Localisation</h2>
            <PropertyLocationMap value={location} onChange={setLocation} />
          </section>
        )}
        {step === 3 && (
          <section>
            <h2>Caractéristiques</h2>
            <div className={styles.grid3}>
              <label>
                Surface
                <input
                  name="area"
                  type="number"
                  value={form.area}
                  onChange={update}
                />
              </label>
              {typeFields.bedrooms ? (
                <label>
                  Chambres
                  <input
                    name="bedrooms"
                    type="number"
                    value={form.bedrooms}
                    onChange={update}
                  />
                </label>
              ) : null}
              {typeFields.bathrooms ? (
                <label>
                  Salles d’eau
                  <input
                    name="bathrooms"
                    type="number"
                    value={form.bathrooms}
                    onChange={update}
                  />
                </label>
              ) : null}
              <label className={styles.full}>
                Description
                <textarea
                  rows={7}
                  name="description"
                  value={form.description}
                  onChange={update}
                />
              </label>
            </div>
          </section>
        )}
        {step === 4 && (
          <section>
            <h2>Photos</h2>
            <label className={styles.upload}>
              <ImagePlus size={33} aria-hidden="true" />
              <strong>Ajouter des images</strong>
              <small>Maximum 12</small>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={addImages}
              />
            </label>
            <div className={styles.images}>
              {images.map((img) => (
                <article key={img.id}>
                  {/* Aperçu local data URL généré par l’utilisateur : non optimisé par next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((v) => v.filter((x) => x.id !== img.id))
                    }
                    aria-label={`Retirer ${img.name}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
            <div className={styles.videoBlock}>
              <PropertyVideoUploader videos={videos} onChange={setVideos} />
            </div>
          </section>
        )}
        {step === 5 && (
          <section>
            <h2>Vérification</h2>
            <div className={styles.review}>
              <p>
                <span>Titre</span>
                <strong>{form.title || "Non renseigné"}</strong>
              </p>
              <p>
                <span>Client</span>
                <strong>{form.clientDisplayName || "Non renseigné"}</strong>
              </p>
              <p>
                <span>Mandat</span>
                <strong>{form.mandateType}</strong>
              </p>
              <p>
                <span>Localisation</span>
                <strong>{locationSummary()}</strong>
              </p>
              <p>
                <span>Position précise</span>
                <strong>
                  {location.locationConfirmed
                    ? "Confirmée"
                    : location.latitude != null
                      ? "Sélectionnée (non confirmée)"
                      : "Non renseignée"}
                </strong>
              </p>
              <p>
                <span>Surface</span>
                <strong>{form.area || 0} m²</strong>
              </p>
              {typeFields.bedrooms ? (
                <p>
                  <span>Chambres</span>
                  <strong>{form.bedrooms || "Non renseigné"}</strong>
                </p>
              ) : null}
              {typeFields.bathrooms ? (
                <p>
                  <span>Salles d’eau</span>
                  <strong>{form.bathrooms || "Non renseigné"}</strong>
                </p>
              ) : null}
              <p>
                <span>Photos</span>
                <strong>{images.length}</strong>
              </p>
              <p>
                <span>Vidéos</span>
                <strong>{videos.length}</strong>
              </p>
            </div>
            <ConfirmationGroup title="Confirmations">
              <ConfirmationCheckbox
                name="accurate"
                checked={form.accurate}
                onChange={(checked) =>
                  setForm((v) => ({ ...v, accurate: checked }))
                }
                label="Je confirme l’exactitude des informations."
              />
              <ConfirmationCheckbox
                name="authorized"
                checked={form.authorized}
                onChange={(checked) =>
                  setForm((v) => ({ ...v, authorized: checked }))
                }
                label="Je confirme que l’agence dispose d’une autorisation valable."
              />
              {!form.accurate || !form.authorized ? (
                <p className={styles.confirmHint}>
                  Cochez les deux confirmations pour pouvoir créer le bien.
                </p>
              ) : null}
            </ConfirmationGroup>
          </section>
        )}
        {submitError ? (
          <p className={styles.warn} role="alert">
            {submitError}
            {scopeDenied ? (
              <>
                {" "}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setExtensionOpen(true)}
                >
                  Demander une extension
                </button>
              </>
            ) : null}
          </p>
        ) : null}
        <div className={styles.actions}>
          <div>
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={16} aria-hidden="true" />
                Précédent
              </button>
            )}
            <button type="button" onClick={saveDraft} disabled={saving}>
              <Save size={16} aria-hidden="true" />
              {saving ? "Enregistrement..." : "Brouillon"}
            </button>
          </div>
          {step < 5 ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep((s) => s + 1)}
            >
              Continuer
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className={styles.primary}
              disabled={saving || !form.accurate || !form.authorized}
            >
              {saving ? (
                <Loader2 className={styles.spin} size={16} aria-hidden="true" />
              ) : (
                <FileCheck2 size={16} aria-hidden="true" />
              )}
              Créer le bien
            </button>
          )}
        </div>
      </form>
      <AccountScopeExtensionDialog
        open={extensionOpen}
        userId={userId}
        allowedPropertyScopes={allowedPropertyScopes}
        pendingRequests={pendingScopeRequests}
        onClose={() => setExtensionOpen(false)}
        onSubmitted={() => {
          void refreshScope();
          setToast("Votre demande d’extension a été envoyée.");
        }}
      />
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AgencyShell>
  );
}
