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
  useEffect,
  useMemo,
  useState,
} from "react";

import { AccountScopeExtensionDialog } from "@/components/account/AccountScopeExtensionDialog";
import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
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
import { DEMO_OWNER_ID } from "@/lib/demo-api/config";
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

type ImageItem = { id: string; name: string; url: string };

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

export default function NewPropertyPage() {
  const {
    userId,
    loading: scopeLoading,
    allowedPropertyTypes,
    allowedPropertyScopes,
    operationsForType,
    pendingScopeRequests,
    refresh: refreshScope,
  } = useAccountScope({ userId: DEMO_OWNER_ID });
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [savedMode, setSavedMode] = useState<"complete" | "draft">("complete");
  const [createdSlug, setCreatedSlug] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [legalDone, setLegalDone] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [videos, setVideos] = useState<PropertyVideo[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scopeDenied, setScopeDenied] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [location, setLocation] = useState<PropertyLocationValue>(() =>
    emptyPropertyLocation("Conakry"),
  );
  const [form, setForm] = useState({
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
  // Les opérations suivent le type sélectionné : un compte peut être autorisé
  // à vendre un terrain sans être autorisé à le louer.
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

  function buildLocationLabel() {
    return (
      [location.quarter, location.commune, location.city]
        .filter(Boolean)
        .join(", ") || location.city
    );
  }

  function buildPayload(status: "BROUILLON" | "ACTIF") {
    const imageUrls = images.map((img) => img.url);
    const locLabel = buildLocationLabel();
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
      ownerId: DEMO_OWNER_ID,
      agencyId: null,
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

  async function addImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 12 - images.length);
    const next: ImageItem[] = [];
    for (const file of files) {
      const url = await fileToDataUrl(file);
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        url,
      });
    }
    setImages((current) => [...current, ...next]);
    e.target.value = "";
  }

  async function persist(status: "BROUILLON" | "ACTIF") {
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
        "/proprietaire/biens?extension=1",
      );
      setSubmitError(restricted.message);
      setScopeDenied(Boolean(restricted.kind));
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    await persist("BROUILLON");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await persist("ACTIF");
  }

  if (done) {
    const title = form.title.trim();
    const isDraft = savedMode === "draft";
    // Tant qu'on est sur le Property, on nomme le bien par son type :
    // l'opération commerciale n'existe qu'au moment de l'annonce.
    const headline = isDraft
      ? "Brouillon enregistré"
      : `${labelPropertyType(form.type)} enregistré`;
    return (
      <>
        <OwnerPageHeader
          eyebrow="Mes biens"
          title="Création terminée"
          description="Dernière étape avant la publication : la situation juridique du bien."
        />
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
                  : "Votre bien a été ajouté à votre portefeuille. Vous pouvez maintenant compléter sa situation juridique et créer une annonce."}
              </p>
              {title ? (
                <p className={styles.successSubject}>{title}</p>
              ) : null}
            </div>
          </header>

          <p className={styles.successNotice}>
            Votre compte est vérifié, mais chaque bien fait l’objet d’un
            contrôle juridique séparé avant sa publication.
          </p>

          {createdId ? (
            <PropertyLegalSection
              propertyId={createdId}
              onSaved={() => setLegalDone(true)}
            />
          ) : null}

          <div className={styles.successBar}>
            <p>
              {legalDone
                ? "Justificatif transmis — il sera examiné avant publication."
                : isDraft
                  ? "Votre brouillon est enregistré."
                  : "Votre bien est enregistré."}
            </p>
            <div className={styles.successBarActions}>
              <Link
                href={
                  createdSlug
                    ? `/proprietaire/biens/${createdSlug}`
                    : "/proprietaire/biens"
                }
                className={styles.successSecondary}
              >
                Voir le bien
              </Link>
              {!isDraft ? (
                <Link
                  href={
                    createdSlug
                      ? `/proprietaire/annonces/nouvelle?bien=${encodeURIComponent(createdSlug)}`
                      : "/proprietaire/annonces/nouvelle"
                  }
                  className={styles.successPrimary}
                >
                  Publier ce bien
                </Link>
              ) : (
                <Link
                  href="/proprietaire/biens"
                  className={styles.successPrimary}
                >
                  Retour aux biens
                </Link>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Nouveau bien"
        title={pageTitle}
        description="Créez la fiche du bien avant de préparer son annonce."
      />
      <div className={styles.steps}>
        {["Type et prix", "Localisation", "Caractéristiques", "Médias", "Vérification"].map(
          (label, index) => (
            <span
              key={label}
              className={
                step === index + 1
                  ? styles.current
                  : step > index + 1
                    ? styles.done
                    : ""
              }
            >
              <b>{step > index + 1 ? <Check size={14} /> : index + 1}</b>
              <small>{label}</small>
            </span>
          ),
        )}
      </div>
      <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
        {step === 1 && (
          <section>
            <h2>Type et prix</h2>
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
                {singleType ? "Type de bien autorisé" : "Type de bien"}
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
                Titre
                <input
                  name="title"
                  value={form.title}
                  onChange={update}
                  placeholder="Villa contemporaine à Kipé"
                />
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
                Surface (m²)
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
                  name="description"
                  rows={7}
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
              <ImagePlus size={33} />
              <strong>Ajouter des images</strong>
              <small>JPG, PNG ou WebP — maximum 12</small>
              <input type="file" accept="image/*" multiple onChange={addImages} />
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
                  >
                    <Trash2 size={15} />
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
                <span>Localisation</span>
                <strong>{buildLocationLabel()}</strong>
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
                label="Je confirme être autorisé à gérer ce bien."
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
                <ArrowLeft size={16} />
                Précédent
              </button>
            )}
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || !form.title}
            >
              <Save size={16} />
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
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className={styles.primary}
              disabled={saving || !form.accurate || !form.authorized}
            >
              {saving ? (
                <Loader2 className={styles.spin} />
              ) : (
                <FileCheck2 size={16} />
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
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
