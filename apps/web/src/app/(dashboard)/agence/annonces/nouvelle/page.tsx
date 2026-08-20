"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AccountScopeExtensionDialog } from "@/components/account/AccountScopeExtensionDialog";
import AgencyShell from "@/components/agence/AgencyShell";
import ListingTermsFields from "@/components/listing/ListingTermsFields";
import {
  ConfirmationCheckbox,
  ConfirmationGroup,
  DemoToast,
} from "@/components/ui";
import { useAccountScope } from "@/hooks/useAccountScope";
import { useDemoListings } from "@/hooks/useDemoListings";
import { useDemoProperties } from "@/hooks/useDemoProperties";
import { formatGnf } from "@/lib/agence/demo-data";
import {
  labelOperation,
  scopeRestrictionMessage,
} from "@/lib/demo-api/account-scope";
import { DEMO_AGENCY_ID, DEMO_AGENCY_USER_ID } from "@/lib/demo-api/config";
import {
  listingService,
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
import { getPropertyTypeFields } from "@/lib/property/typeFields";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

function NewAgencyAdForm() {
  const searchParams = useSearchParams();
  const presetBien = searchParams.get("bien") ?? "";
  const { items: properties, loading, error: loadError } = useDemoProperties({
    agencyId: DEMO_AGENCY_ID,
  });
  const { items: remoteAds, refresh: refreshRemote } = useDemoListings(
    { agencyId: DEMO_AGENCY_ID },
    { poll: true },
  );
  const {
    userId,
    allowedPropertyScopes,
    operationsForType,
    pendingScopeRequests,
    refresh: refreshScope,
  } = useAccountScope({ userId: DEMO_AGENCY_USER_ID });
  const [done, setDone] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scopeDenied, setScopeDenied] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const lockedProperty = useMemo(() => {
    if (!presetBien) return null;
    return properties.find((item) => item.slug === presetBien) ?? null;
  }, [presetBien, properties]);

  const defaultProperty =
    lockedProperty?.slug ?? properties[0]?.slug ?? "";

  const [form, setForm] = useState({
    property: "",
    operation: "VENTE" as "VENTE" | "LOCATION",
    price: "",
    title: "",
    summary: "",
    terms: false,
  });
  const [termsValues, setTermsValues] = useState<ListingTermsFormValues>(
    createEmptyListingTerms,
  );
  const [termsErrors, setTermsErrors] = useState<ListingTermsErrors>({});

  const selectedProperty = useMemo(() => {
    const slug = lockedProperty?.slug || form.property || defaultProperty;
    return properties.find((item) => item.slug === slug) ?? null;
  }, [lockedProperty, form.property, defaultProperty, properties]);

  // Opérations ouvertes pour CE type de bien (scope relationnel du compte).
  const operationOptions = useMemo(() => {
    const allowed = selectedProperty
      ? operationsForType(selectedProperty.type)
      : null;
    if (allowed === null) {
      return ["VENTE", "LOCATION"] as ("VENTE" | "LOCATION")[];
    }
    return allowed
      .map((o) => String(o).toUpperCase())
      .filter(
        (o): o is "VENTE" | "LOCATION" => o === "VENTE" || o === "LOCATION",
      );
  }, [selectedProperty, operationsForType]);
  const locationAllowed = operationOptions.includes("LOCATION");

  const config = useMemo(
    () =>
      resolveListingFormConfig(selectedProperty?.type ?? "", form.operation),
    [selectedProperty?.type, form.operation],
  );

  useEffect(() => {
    const seed = lockedProperty ?? properties[0] ?? null;
    if (!seed) return;
    setForm((v) => {
      if (v.property) return v;
      const seedOp =
        seed.operation === "LOCATION" && locationAllowed
          ? "LOCATION"
          : operationOptions.includes("VENTE")
            ? "VENTE"
            : operationOptions[0] || "VENTE";
      return {
        ...v,
        property: seed.slug,
        operation: seedOp,
        price: seed.price ? String(seed.price) : "",
        title: seed.title,
      };
    });
  }, [lockedProperty, properties, locationAllowed, operationOptions]);

  useEffect(() => {
    setForm((current) => {
      if (operationOptions.includes(current.operation)) return current;
      return {
        ...current,
        operation: (operationOptions[0] || "VENTE") as "VENTE" | "LOCATION",
      };
    });
  }, [operationOptions]);

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
        // REFUSEE révisable : réutiliser la même annonce (pas de doublon)
        if (ad.status === "REFUSEE" && ad.canResubmit !== false) return true;
        return false;
      }) ?? null
    );
  }, [remoteAds, selectedProperty]);

  const typeFields = selectedProperty
    ? getPropertyTypeFields(selectedProperty.type)
    : null;
  const selectedLocation = selectedProperty
    ? demoPropertyLocationLabel(selectedProperty)
    : "";

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
    if (!selectedProperty) return;
    if (blockingAd) {
      setCreatedId(blockingAd.id);
      setDone(true);
      return;
    }
    const validation = validateListingTerms(config, termsValues, form.price);
    setTermsErrors(validation);
    if (Object.keys(validation).length > 0) {
      setSubmitError("Complétez les conditions commerciales de l’annonce.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setScopeDenied(false);
    const termsPayload = buildListingTermsPayload(config, termsValues);
    try {
      const created = await listingService.create({
        title: form.title,
        description: form.summary,
        summary: form.summary,
        operation: form.operation,
        price: Number(form.price) || selectedProperty.price || 0,
        status: "EN_ATTENTE",
        advertiserType: "AGENCE",
        agencyId: DEMO_AGENCY_ID,
        ownerId: null,
        type: selectedProperty.type,
        images: selectedProperty.images,
        videos: selectedProperty.videos ?? [],
        ...termsPayload,
        property: {
          id: selectedProperty.id,
          slug: selectedProperty.slug,
          title: selectedProperty.title,
          type: selectedProperty.type,
          operation: form.operation,
          price: Number(form.price) || selectedProperty.price || 0,
          area: selectedProperty.area,
          bedrooms: selectedProperty.bedrooms,
          bathrooms: selectedProperty.bathrooms,
          city: selectedProperty.city,
          commune: selectedProperty.commune,
          quarter: selectedProperty.district,
          district: selectedProperty.district,
          landmark: selectedProperty.landmark,
          latitude: selectedProperty.coordinates?.lat ?? null,
          longitude: selectedProperty.coordinates?.lng ?? null,
          locationLabel: selectedProperty.locationLabel,
          locationConfirmed: selectedProperty.locationConfirmed,
          images: selectedProperty.images,
          videos: selectedProperty.videos ?? [],
          description: selectedProperty.description,
          agencyId: DEMO_AGENCY_ID,
        },
      });
      setCreatedId(created.id);
      void refreshRemote();
      setDone(true);
    } catch (err) {
      const restricted = scopeRestrictionMessage(
        err,
        "/agence/biens?extension=1",
      );
      setSubmitError(restricted.message);
      setScopeDenied(Boolean(restricted.kind));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AgencyShell
        active="annonces"
        eyebrow="Publication"
        title="Publier un bien"
        description="Chargement..."
      >
        <section className={`${styles.card} ${styles.form}`}>
          <p>Chargement...</p>
        </section>
      </AgencyShell>
    );
  }

  if (loadError) {
    return (
      <AgencyShell
        active="annonces"
        eyebrow="Publication"
        title="Publier un bien"
        description="Impossible de charger le portefeuille."
      >
        <section className={`${styles.card} ${styles.form}`}>
          <p className={styles.warn} role="alert">
            {loadError} — lancez `npm start` dans immo-demo-api.
          </p>
        </section>
      </AgencyShell>
    );
  }

  if (properties.length === 0) {
    return (
      <AgencyShell
        active="annonces"
        eyebrow="Publication"
        title="Bien requis"
        description="Une annonce doit être rattachée à un bien du portefeuille."
      >
        <section className={`${styles.card} ${styles.success}`}>
          <FileCheck2 size={43} aria-hidden="true" />
          <h2>Ajoutez d’abord un bien</h2>
          <p>
            Créez une fiche bien, puis revenez pour la publier.
          </p>
          <Link href="/agence/biens/nouveau">
            Ajouter un bien
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </AgencyShell>
    );
  }

  if (done) {
    return (
      <AgencyShell
        active="annonces"
        eyebrow="Publication"
        title="Annonce soumise"
        description="Votre demande est en attente de contrôle."
      >
        <section className={`${styles.card} ${styles.success}`}>
          <CheckCircle2 size={43} aria-hidden="true" />
          <h2>{form.title}</h2>
          <p>
            L’annonce a été soumise avec le statut <strong>EN_ATTENTE</strong>
            {selectedProperty
              ? `, rattachée au bien « ${selectedProperty.title} »`
              : ""}
            . L’administration la contrôlera avant diffusion.
          </p>
          <Link
            href={
              createdId ? `/agence/annonces/${createdId}` : "/agence/annonces"
            }
          >
            Voir les annonces
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </AgencyShell>
    );
  }

  if (blockingAd && lockedProperty) {
    return (
      <AgencyShell
        active="annonces"
        eyebrow="Publication"
        title="Annonce déjà en cours"
        description="Ce bien dispose déjà d’une annonce active."
      >
        <section className={`${styles.card} ${styles.success}`}>
          <FileCheck2 size={43} aria-hidden="true" />
          <h2>{lockedProperty.title}</h2>
          <p>
            Une annonce est déjà{" "}
            <strong>
              {blockingAd.status === "PUBLIEE" ? "publiée" : "en attente"}
            </strong>{" "}
            pour ce bien. Évitez de créer un doublon.
          </p>
          <div className={styles.successActions}>
            <Link href={routes.agencyAd(blockingAd.id)}>Voir l’annonce</Link>
            <Link href={routes.agencyProperty(lockedProperty.slug)}>
              Voir le bien
            </Link>
          </div>
        </section>
      </AgencyShell>
    );
  }

  return (
    <AgencyShell
      active="annonces"
      eyebrow="Publication professionnelle"
      title="Publier ce bien"
      description="Renseignez uniquement les informations commerciales de l’annonce."
    >
      {selectedProperty ? (
        <section className={`${styles.card} ${styles.summary}`}>
          <p className={styles.summaryEyebrow}>Bien concerné</p>
          <h2>{selectedProperty.title}</h2>
          <ul>
            <li>{selectedProperty.type}</li>
            <li>{selectedLocation}</li>
            <li>
              {typeFields?.bedrooms && selectedProperty.bedrooms != null
                ? `${selectedProperty.bedrooms} chambres · `
                : ""}
              {selectedProperty.area} m²
            </li>
          </ul>
          <Link href={routes.agencyProperty(selectedProperty.slug)}>
            Voir la fiche
          </Link>
        </section>
      ) : null}

      <form className={`${styles.card} ${styles.form}`} onSubmit={onSubmit}>
        {!lockedProperty ? (
          <label>
            Bien rattaché
            <select
              value={form.property || defaultProperty}
              onChange={(e) => {
                const slug = e.target.value;
                const next =
                  properties.find((item) => item.slug === slug) ?? null;
                const nextOp =
                  next?.operation === "LOCATION" && locationAllowed
                    ? "LOCATION"
                    : operationOptions.includes("VENTE")
                      ? "VENTE"
                      : operationOptions[0] || "VENTE";
                setForm((v) => ({
                  ...v,
                  property: slug,
                  operation: nextOp,
                  price: next?.price ? String(next.price) : v.price,
                  title: v.title || next?.title || "",
                }));
              }}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.reference} — {p.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="property" value={lockedProperty.slug} />
        )}

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
                      operation: op,
                    }))
                  }
                />
                {operationChoiceLabel(selectedProperty?.type ?? "", op)}
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
              onClick={() => setExtensionOpen(true)}
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
              onClick={() => setExtensionOpen(true)}
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
            {selectedProperty?.price ? (
              <small className={styles.hint}>
                Prix du bien : {formatGnf(selectedProperty.price)}
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
              qui assurera la mise en relation et le suivi. Les coordonnées de
              l’agence ne sont pas publiées sur l’annonce.
            </p>
          </div>
        </div>

        <ConfirmationGroup title="Confirmation">
          <ConfirmationCheckbox
            checked={form.terms}
            onChange={(checked) => setForm((v) => ({ ...v, terms: checked }))}
            label="Je confirme que les informations de cette annonce correspondent au bien sélectionné et au mandat détenu."
          />
        </ConfirmationGroup>

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

        {blockingAd && !lockedProperty ? (
          <p className={styles.warn}>
            Ce bien a déjà une annonce{" "}
            {blockingAd.status === "PUBLIEE" ? "publiée" : "en attente"}.{" "}
            <Link href={routes.agencyAd(blockingAd.id)}>Voir l’annonce</Link>
          </p>
        ) : null}

        <div className={styles.footer}>
          <button type="submit" disabled={submitDisabled}>
            <FileCheck2 size={16} aria-hidden="true" />
            {submitting ? "Envoi…" : "Soumettre pour publication"}
          </button>
          {submitHint ? (
            <p className={styles.footerHint}>{submitHint}</p>
          ) : null}
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
    </AgencyShell>
  );
}

export default function NewAgencyAdPage() {
  return (
    <Suspense
      fallback={
        <AgencyShell
          active="annonces"
          eyebrow="Publication"
          title="Publier un bien"
          description="Chargement..."
        >
          <section className={`${styles.card} ${styles.form}`}>
            <p>Chargement...</p>
          </section>
        </AgencyShell>
      }
    >
      <NewAgencyAdForm />
    </Suspense>
  );
}
