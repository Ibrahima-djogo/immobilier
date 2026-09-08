"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  FileText,
  Home,
  MapPin,
  Plus,
  UserRound,
} from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  WorkspaceFormCard,
  WorkspaceMeta,
} from "@/components/administration/WorkspaceForm";
import ListingTermsFields from "@/components/listing/ListingTermsFields";
import { Button, DemoToast } from "@/components/ui";
import {
  canPublishListings,
  canWriteListings,
} from "@/lib/administration/admin-accounts";
import { formatGnf } from "@/lib/administration/demo-data";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  listingService,
  propertyService,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import {
  buildListingTermsPayload,
  createEmptyListingTerms,
  resolveListingFormConfig,
  validateListingTerms,
  type ListingTermsErrors,
  type ListingTermsFormValues,
} from "@/lib/listing/listingTerms";
import { routes } from "@/lib/routes/app-routes";
import styles from "@/components/administration/WorkspaceForm.module.css";

function NewListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, ready } = useAdminSession();
  const presetPropertyId = searchParams.get("propertyId") || "";

  const [properties, setProperties] = useState<DemoProperty[]>([]);
  const [propertyId, setPropertyId] = useState(presetPropertyId);
  const [title, setTitle] = useState("");
  const [operation, setOperation] = useState<"VENTE" | "LOCATION">("VENTE");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [termsValues, setTermsValues] = useState<ListingTermsFormValues>(
    createEmptyListingTerms,
  );
  const [termsErrors, setTermsErrors] = useState<ListingTermsErrors>({});

  const selectedProperty = properties.find((p) => p.id === propertyId) ?? null;
  // L'admin saisit au nom de l'annonceur : mêmes sections, mêmes règles.
  const config = resolveListingFormConfig(
    selectedProperty?.type ?? "",
    operation,
  );

  useEffect(() => {
    if (!ready) return;
    if (!admin || !canWriteListings(admin)) {
      router.replace(routes.accessDenied);
    }
  }, [admin, ready, router]);

  useEffect(() => {
    (async () => {
      try {
        const list = await propertyService.list();
        setProperties(list);
        const selected =
          list.find((p) => p.id === presetPropertyId) || list[0];
        if (selected) {
          setPropertyId(selected.id);
          if (!title) setTitle(selected.title);
          setOperation(
            selected.operation === "LOCATION" ? "LOCATION" : "VENTE",
          );
          setPrice(String(selected.price || ""));
        }
      } catch {
        setToast("Impossible de charger les biens.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetPropertyId]);

  const canDirectPublish = admin ? canPublishListings(admin) : false;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!admin) return;
    if (!propertyId) {
      setToast("Sélectionnez un bien existant.");
      return;
    }
    if (!title.trim()) {
      setToast("Le titre public est obligatoire.");
      return;
    }
    const validation = validateListingTerms(config, termsValues, price);
    setTermsErrors(validation);
    if (Object.keys(validation).length > 0) {
      setToast("Complétez les conditions commerciales de l’annonce.");
      return;
    }

    setSaving(true);
    try {
      const created = await listingService.createAsAdmin(
        {
          propertyId,
          title: title.trim(),
          operation,
          price: Number(price) || 0,
          description: description.trim(),
          status: "BROUILLON",
          ...buildListingTermsPayload(config, termsValues),
        },
        admin,
      );

      if (publishNow && canDirectPublish) {
        const published = await listingService.publishDirect(created.id, admin);
        setToast("Annonce créée et publiée directement.");
        router.push(routes.ad(published.id));
        return;
      }

      setToast("Annonce créée en brouillon.");
      router.push(routes.ad(created.id));
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
      active="annonces"
      eyebrow="Modération"
      title="Créer une annonce"
      description="Publiez une annonce commerciale à partir d’un bien existant."
      note="Données commerciales uniquement — le bien (Property) reste la source des infos techniques."
      icon={Plus}
      heroVariant="compact"
      backHref={routes.ads}
      backLabel="Retour aux annonces"
    >

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.layout}>
          <div className={styles.main}>
            <WorkspaceFormCard
              icon={FileText}
              title="Données commerciales"
              subtitle="Ces informations concernent l’annonce. Le bien reste la source technique."
            >
              <div className={styles.grid}>
                <label className={`${styles.field} ${styles.wide}`}>
                  <span>Titre public</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Opération</span>
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
                {!config.sections.rentalTerms ? (
                  <label className={styles.field}>
                    <span>{config.labels.priceLabel} (GNF)</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    {termsErrors.price ? (
                      <small className={styles.error}>{termsErrors.price}</small>
                    ) : null}
                  </label>
                ) : null}
                <label className={`${styles.field} ${styles.wide}`}>
                  <span>Description de l’annonce</span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
              </div>
              <ListingTermsFields
                config={config}
                values={termsValues}
                errors={termsErrors}
                onChange={(patch) =>
                  setTermsValues((current) => ({ ...current, ...patch }))
                }
                formatAmount={formatGnf}
              />
              {canDirectPublish ? (
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={(e) => setPublishNow(e.target.checked)}
                  />
                  <span>
                    Publier directement (ANNONCES_PUBLICATION) — sans file
                    EN_ATTENTE
                  </span>
                </label>
              ) : null}
            </WorkspaceFormCard>
          </div>

          <aside className={styles.side}>
            <WorkspaceFormCard
              icon={Home}
              title="Bien existant"
              subtitle="Choisissez le bien à publier. Les données techniques restent inchangées."
              aside
            >
              <label className={styles.field}>
                <span>Bien (propriétaire ou agence)</span>
                <select
                  value={propertyId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setPropertyId(id);
                    const p = properties.find((x) => x.id === id);
                    if (p) {
                      setTitle(p.title);
                      setOperation(
                        p.operation === "LOCATION" ? "LOCATION" : "VENTE",
                      );
                      setPrice(String(p.price || ""));
                    }
                  }}
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.reference} ·{" "}
                      {p.agencyId
                        ? `Agence ${p.agencyId}`
                        : `Proprio ${p.ownerId}`}
                    </option>
                  ))}
                </select>
              </label>

              {selectedProperty ? (
                <div className={styles.summary}>
                  <div>
                    <h3 className={styles.summaryTitle}>
                      {selectedProperty.title}
                    </h3>
                    <p className={styles.summaryRef}>
                      {selectedProperty.reference}
                    </p>
                  </div>
                  <div className={styles.metaList}>
                    <WorkspaceMeta
                      icon={
                        selectedProperty.agencyId ? Building2 : UserRound
                      }
                      label={selectedProperty.agencyId ? "Agence" : "Propriétaire"}
                      value={
                        selectedProperty.agencyId
                          ? `Agence ${selectedProperty.agencyId}`
                          : selectedProperty.ownerId
                            ? `Proprio ${selectedProperty.ownerId}`
                            : null
                      }
                    />
                    <WorkspaceMeta
                      icon={Home}
                      label="Type"
                      value={selectedProperty.type}
                    />
                    <WorkspaceMeta
                      icon={BadgeCheck}
                      label="Opération"
                      value={
                        selectedProperty.operation === "LOCATION"
                          ? "Location"
                          : selectedProperty.operation === "VENTE"
                            ? "Vente"
                            : selectedProperty.operation
                      }
                    />
                    <WorkspaceMeta
                      icon={MapPin}
                      label="Localisation"
                      value={[
                        selectedProperty.district,
                        selectedProperty.commune,
                        selectedProperty.city,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    />
                    {selectedProperty.price ? (
                      <WorkspaceMeta
                        icon={FileText}
                        label="Prix indicatif"
                        value={formatGnf(selectedProperty.price)}
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </WorkspaceFormCard>
          </aside>
        </div>

        <div className={styles.actions}>
          <Button href={routes.ads} variant="secondary">
            Retour
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? "Création…"
              : publishNow && canDirectPublish
                ? "Créer et publier"
                : "Créer en brouillon"}
          </Button>
        </div>
      </form>

      {toast ? (
        <DemoToast message={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </AdminShell>
  );
}

export default function AdminNewListingPage() {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <NewListingForm />
    </Suspense>
  );
}
