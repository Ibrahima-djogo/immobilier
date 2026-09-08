"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { AccountScopeExtensionDialog } from "@/components/account/AccountScopeExtensionDialog";
import ListingTermsFields from "@/components/listing/ListingTermsFields";
import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import {
  ConfirmationCheckbox,
  ConfirmationGroup,
  DemoToast,
} from "@/components/ui";
import { useAccountScope } from "@/hooks/useAccountScope";
import { useDemoListings } from "@/hooks/useDemoListings";
import { useDemoProperties } from "@/hooks/useDemoProperties";
import {
  labelOperation,
  scopeRestrictionMessage,
} from "@/lib/demo-api/account-scope";
import { DEMO_OWNER_ID } from "@/lib/demo-api/config";
import {
  listingService,
  type DemoListing,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import { demoPropertyLocationLabel } from "@/lib/demo-api/propertyPayload";
import {
  buildListingTermsPayload,
  createEmptyListingTerms,
  operationChoiceLabel,
  resolveListingFormConfig,
  validateListingTerms,
  type ListingTermsErrors,
  type ListingTermsFormValues,
} from "@/lib/listing/listingTerms";
import { formatGnf } from "@/lib/proprietaire/demo-data";
import { getPropertyTypeFields } from "@/lib/property/typeFields";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

function PublishForm({
  property,
  locked,
  blockingAd,
  allowedOperations,
  onRequestExtension,
  onSubmitted,
}: {
  property: DemoProperty;
  locked: boolean;
  blockingAd: DemoListing | null;
  /** `null` = compte sans scope configuré : ne pas restreindre l'interface. */
  allowedOperations: string[] | null;
  onRequestExtension: () => void;
  onSubmitted: (id: string, title: string) => void;
}) {
  const operationOptions = useMemo(() => {
    if (allowedOperations === null) return ["VENTE", "LOCATION"] as const;
    return allowedOperations
      .map((o) => String(o).toUpperCase())
      .filter(
        (o): o is "VENTE" | "LOCATION" => o === "VENTE" || o === "LOCATION",
      );
  }, [allowedOperations]);
  const locationAllowed = operationOptions.includes("LOCATION");
  const defaultOperation = (
    property.operation === "LOCATION" && locationAllowed
      ? "LOCATION"
      : operationOptions.includes("VENTE")
        ? "VENTE"
        : operationOptions[0] || "VENTE"
  ) as "VENTE" | "LOCATION";

  const [form, setForm] = useState({
    operation: defaultOperation,
    price: property.price ? String(property.price) : "",
    title: property.title,
    summary: "",
    terms: false,
  });
  const [termsValues, setTermsValues] = useState<ListingTermsFormValues>(
    createEmptyListingTerms,
  );
  const [termsErrors, setTermsErrors] = useState<ListingTermsErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scopeDenied, setScopeDenied] = useState(false);
  const location = demoPropertyLocationLabel(property);
  const typeFields = getPropertyTypeFields(property.type);
  const config = useMemo(
    () => resolveListingFormConfig(property.type, form.operation),
    [property.type, form.operation],
  );

  useEffect(() => {
    setForm((current) => {
      if (operationOptions.includes(current.operation)) return current;
      return { ...current, operation: defaultOperation };
    });
  }, [operationOptions, defaultOperation]);

  function patchTerms(patch: Partial<ListingTermsFormValues>) {
    setTermsValues((current) => ({ ...current, ...patch }));
  }

  const missingContent = !form.title.trim() || !form.summary.trim();
  const submitDisabled =
    submitting ||
    missingContent ||
    !form.terms ||
    operationOptions.length === 0 ||
    Boolean(blockingAd);
  const submitHint = !submitDisabled
    ? null
    : missingContent
      ? "Renseignez le titre et la description de l’annonce."
      : !form.terms
        ? "Confirmez les informations avant de continuer."
        : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (blockingAd) {
      onSubmitted(blockingAd.id, form.title);
      return;
    }
    const validation = validateListingTerms(config, termsValues, form.price);
    setTermsErrors(validation);
    if (Object.keys(validation).length > 0) {
      setError("Complétez les conditions commerciales de l’annonce.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setScopeDenied(false);
    const termsPayload = buildListingTermsPayload(config, termsValues);
    try {
      const created = await listingService.create({
        title: form.title,
        description: form.summary,
        summary: form.summary,
        operation: form.operation,
        price: Number(form.price) || property.price || 0,
        status: "EN_ATTENTE",
        advertiserType: "PROPRIETAIRE",
        ownerId: DEMO_OWNER_ID,
        type: property.type,
        images: property.images,
        videos: property.videos ?? [],
        ...termsPayload,
        property: {
          id: property.id,
          slug: property.slug,
          title: property.title,
          type: property.type,
          operation: form.operation,
          price: Number(form.price) || property.price || 0,
          area: property.area,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          city: property.city,
          commune: property.commune,
          quarter: property.district,
          district: property.district,
          landmark: property.landmark,
          latitude: property.coordinates?.lat ?? null,
          longitude: property.coordinates?.lng ?? null,
          locationLabel: property.locationLabel,
          locationConfirmed: property.locationConfirmed,
          images: property.images,
          videos: property.videos ?? [],
          description: property.description,
          ownerId: DEMO_OWNER_ID,
        },
      });
      onSubmitted(created.id, created.title);
    } catch (err) {
      const restricted = scopeRestrictionMessage(
        err,
        "/proprietaire/biens?extension=1",
      );
      setError(restricted.message);
      setScopeDenied(Boolean(restricted.kind));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className={`${styles.card} ${styles.summary}`}>
        <p className={styles.summaryEyebrow}>Bien concerné</p>
        <h2>{property.title}</h2>
        <ul>
          <li>{property.type}</li>
          <li>{location}</li>
          <li>
            {typeFields.bedrooms && property.bedrooms != null
              ? `${property.bedrooms} chambres · `
              : ""}
            {property.area} m²
          </li>
        </ul>
        <Link href={routes.ownerProperty(property.slug)}>Voir la fiche</Link>
      </section>

      <form className={`${styles.card} ${styles.form}`} onSubmit={onSubmit}>
        {locked ? (
          <input type="hidden" name="property" value={property.slug} />
        ) : null}

        {operationOptions.length > 1 ? (
          <fieldset className={styles.operation}>
            <legend>Que souhaitez-vous faire&nbsp;?</legend>
            {operationOptions.map((op) => (
              <label key={op}>
                <input
                  type="radio"
                  name="operation"
                  checked={form.operation === op}
                  onChange={() =>
                    setForm((v) => ({
                      ...v,
                      operation: op as "VENTE" | "LOCATION",
                    }))
                  }
                />
                {operationChoiceLabel(property.type, op)}
              </label>
            ))}
          </fieldset>
        ) : operationOptions.length === 1 ? (
          <p className={styles.hint} role="status">
            Opération : <strong>{labelOperation(form.operation)}</strong> — seule
            opération autorisée pour ce type de bien sur votre compte.
          </p>
        ) : (
          <p className={styles.warn} role="alert">
            Aucune opération n’est autorisée pour ce type de bien sur votre
            compte.{" "}
            <button
              type="button"
              className={styles.linkButton}
              onClick={onRequestExtension}
            >
              Demander une extension
            </button>
          </p>
        )}
        {operationOptions.length > 0 && !locationAllowed ? (
          <p className={styles.warn} role="status">
            La location n’est pas autorisée sur votre compte pour ce type de
            bien.{" "}
            <button
              type="button"
              className={styles.linkButton}
              onClick={onRequestExtension}
            >
              Demander une extension
            </button>
          </p>
        ) : null}

        {!config.sections.rentalTerms ? (
          <label>
            {config.labels.priceLabel}
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm((v) => ({ ...v, price: e.target.value }))}
            />
            {property.price ? (
              <small className={styles.hint}>
                Prix du bien : {formatGnf(property.price)}
              </small>
            ) : null}
            {termsErrors.price ? (
              <small className={styles.warn} role="alert">
                {termsErrors.price}
              </small>
            ) : null}
          </label>
        ) : null}

        <ListingTermsFields
          config={config}
          values={termsValues}
          errors={termsErrors}
          onChange={patchTerms}
          formatAmount={formatGnf}
        />

        <label>
          Titre de l’annonce
          <input
            value={form.title}
            onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
            placeholder="Villa contemporaine à louer à Kipé"
          />
        </label>

        <label>
          Description de l’annonce
          <textarea
            rows={8}
            value={form.summary}
            onChange={(e) =>
              setForm((v) => ({ ...v, summary: e.target.value }))
            }
            placeholder="Mettez en avant les atouts pour les acheteurs ou locataires."
          />
          <small className={styles.hint}>
            Texte commercial propre à l’annonce — la description technique du
            bien reste inchangée.
          </small>
        </label>

        <div className={styles.contactCard}>
          <span className={styles.contactIcon} aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className={styles.contactTitle}>Contact des visiteurs</p>
            <p className={styles.contactCopy}>
              Les demandes des visiteurs seront transmises à Demeure Guinée,
              qui assurera la mise en relation et le suivi. Vos coordonnées
              personnelles ne sont jamais publiées sur l’annonce.
            </p>
          </div>
        </div>

        <ConfirmationGroup title="Confirmation">
          <ConfirmationCheckbox
            checked={form.terms}
            onChange={(checked) => setForm((v) => ({ ...v, terms: checked }))}
            label="Je confirme que les informations de cette annonce correspondent au bien sélectionné."
          />
        </ConfirmationGroup>

        {error ? (
          <p className={styles.warn} role="alert">
            {error}
            {scopeDenied ? (
              <>
                {" "}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={onRequestExtension}
                >
                  Demander une extension
                </button>
              </>
            ) : null}
          </p>
        ) : null}

        {blockingAd ? (
          <p className={styles.warn}>
            Ce bien a déjà une annonce{" "}
            {blockingAd.status === "PUBLIEE" ? "publiée" : "en attente"}.{" "}
            <Link href={routes.ownerAd(blockingAd.id)}>Voir l’annonce</Link>
          </p>
        ) : null}

        <div className={styles.footer}>
          <button type="submit" disabled={submitDisabled}>
            <FileCheck2 size={16} />
            {submitting ? "Envoi…" : "Soumettre pour publication"}
          </button>
          {submitHint ? (
            <p className={styles.footerHint}>{submitHint}</p>
          ) : null}
        </div>
      </form>
    </>
  );
}

function NewAdForm() {
  const searchParams = useSearchParams();
  const presetBien = searchParams.get("bien") ?? "";
  const { items: properties, loading, error } = useDemoProperties(
    { ownerId: DEMO_OWNER_ID },
  );
  const { items: remoteAds, refresh: refreshRemote } = useDemoListings(
    { ownerId: DEMO_OWNER_ID },
    { poll: true },
  );
  const {
    userId,
    allowedPropertyScopes,
    operationsForType,
    pendingScopeRequests,
    refresh: refreshScope,
  } = useAccountScope({ userId: DEMO_OWNER_ID });
  const [done, setDone] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [doneTitle, setDoneTitle] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(presetBien);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const lockedProperty = useMemo(() => {
    if (!presetBien) return null;
    return properties.find((item) => item.slug === presetBien) ?? null;
  }, [presetBien, properties]);

  const effectiveSlug =
    lockedProperty?.slug || selectedSlug || properties[0]?.slug || "";

  const selectedProperty = useMemo(
    () => properties.find((item) => item.slug === effectiveSlug) ?? null,
    [properties, effectiveSlug],
  );

  // Opérations ouvertes pour CE type de bien (scope relationnel du compte).
  const operationsForProperty = useMemo(
    () => (selectedProperty ? operationsForType(selectedProperty.type) : null),
    [selectedProperty, operationsForType],
  );

  const blockingAd = useMemo(() => {
    if (!selectedProperty) return null;
    return (
      remoteAds.find((ad) => {
        const sameProperty =
          ad.propertyId === selectedProperty.id ||
          ad.slug.includes(selectedProperty.slug);
        if (!sameProperty) return false;
        if (
          ad.status === "PUBLIEE" ||
          ad.status === "EN_ATTENTE" ||
          ad.status === "A_CORRIGER" ||
          ad.status === "BROUILLON" ||
          ad.status === "SUSPENDUE"
        ) {
          return true;
        }
        if (ad.status === "REFUSEE" && ad.canResubmit !== false) return true;
        return false;
      }) ?? null
    );
  }, [remoteAds, selectedProperty]);

  if (loading) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Publication"
          title="Publier un bien"
          description="Chargement de vos biens..."
        />
        <section className={`${styles.card} ${styles.form}`}>
          <p>Chargement...</p>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Publication"
          title="Publier un bien"
          description="Impossible de charger vos biens."
        />
        <section className={`${styles.card} ${styles.form}`}>
          <p className={styles.warn} role="alert">
            {error}
          </p>
        </section>
      </>
    );
  }

  if (properties.length === 0) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Publication"
          title="Bien requis"
          description="Une annonce doit être rattachée à un bien existant."
        />
        <section className={`${styles.card} ${styles.success}`}>
          <FileCheck2 size={43} />
          <h2>Ajoutez d’abord un bien</h2>
          <p>
            Créez une fiche <strong>bien</strong>, puis revenez pour la
            publier.
          </p>
          <Link href="/proprietaire/biens/nouveau">
            Ajouter un bien
            <ArrowRight size={15} />
          </Link>
        </section>
      </>
    );
  }

  if (done) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Publication"
          title="Annonce soumise"
          description="Votre demande est en attente de contrôle."
        />
        <section className={`${styles.card} ${styles.success}`}>
          <CheckCircle2 size={43} />
          <h2>{doneTitle}</h2>
          <p>
            L’annonce a été soumise avec le statut <strong>EN_ATTENTE</strong>
            {selectedProperty
              ? `, rattachée au bien « ${selectedProperty.title} »`
              : ""}
            . L’administration la contrôlera avant diffusion.
          </p>
          <Link
            href={
              createdId
                ? `/proprietaire/annonces/${createdId}`
                : "/proprietaire/annonces"
            }
          >
            Voir l’annonce
            <ArrowRight size={15} />
          </Link>
        </section>
      </>
    );
  }

  if (blockingAd && lockedProperty) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Publication"
          title="Annonce déjà en cours"
          description="Ce bien dispose déjà d’une annonce active."
        />
        <section className={`${styles.card} ${styles.success}`}>
          <FileCheck2 size={43} />
          <h2>{lockedProperty.title}</h2>
          <p>
            Une annonce est déjà{" "}
            <strong>
              {blockingAd.status === "PUBLIEE" ? "publiée" : "en attente"}
            </strong>{" "}
            pour ce bien. Évitez de créer un doublon.
          </p>
          <div className={styles.successActions}>
            <Link href={routes.ownerAd(blockingAd.id)}>Voir l’annonce</Link>
            <Link href={routes.ownerProperty(lockedProperty.slug)}>
              Voir le bien
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Publication"
        title="Publier ce bien"
        description="Renseignez uniquement les informations commerciales de l’annonce."
      />

      {!lockedProperty ? (
        <section className={`${styles.card} ${styles.form}`}>
          <label>
            Bien rattaché
            <select
              value={effectiveSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {selectedProperty ? (
        <PublishForm
          key={selectedProperty.slug}
          property={selectedProperty}
          locked={Boolean(lockedProperty)}
          blockingAd={blockingAd}
          allowedOperations={operationsForProperty}
          onRequestExtension={() => setExtensionOpen(true)}
          onSubmitted={(id, title) => {
            setCreatedId(id);
            setDoneTitle(title);
            void refreshRemote();
            setDone(true);
          }}
        />
      ) : null}
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

export default function NewAdPage() {
  return (
    <Suspense
      fallback={
        <>
          <OwnerPageHeader
            eyebrow="Publication"
            title="Publier un bien"
            description="Chargement..."
          />
          <section className={`${styles.card} ${styles.form}`}>
            <p>Chargement...</p>
          </section>
        </>
      }
    >
      <NewAdForm />
    </Suspense>
  );
}
