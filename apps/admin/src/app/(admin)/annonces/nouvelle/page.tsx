"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import ListingTermsFields from "@/components/listing/ListingTermsFields";
import { DemoToast } from "@/components/ui";
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
import styles from "../[id]/page.module.css";

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
        err instanceof Error ? err.message : "Création refusée par la Demo API.",
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

      <form className={styles.panel} onSubmit={onSubmit}>
        <header className={styles.panelHead}>
          <h2>Bien existant</h2>
        </header>
        <div className={styles.kv}>
          <div className={styles.full}>
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
                  {p.agencyId ? `Agence ${p.agencyId}` : `Proprio ${p.ownerId}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <header className={styles.panelHead} style={{ marginTop: 18 }}>
          <h2>Données commerciales</h2>
        </header>
        <div className={styles.kv}>
          <div className={styles.full}>
            <span>Titre public</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
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
          </div>
          {!config.sections.rentalTerms ? (
            <div>
              <span>{config.labels.priceLabel} (GNF)</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {termsErrors.price ? (
                <small className={styles.missing}>{termsErrors.price}</small>
              ) : null}
            </div>
          ) : null}
          <div className={styles.full}>
            <span>Description de l’annonce</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={styles.full}>
            <ListingTermsFields
              config={config}
              values={termsValues}
              errors={termsErrors}
              onChange={(patch) =>
                setTermsValues((current) => ({ ...current, ...patch }))
              }
              formatAmount={formatGnf}
            />
          </div>
          {canDirectPublish ? (
            <div className={styles.full}>
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: "0.8rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                />
                Publier directement (ANNONCES_PUBLICATION) — sans file EN_ATTENTE
              </label>
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="submit" className={styles.save} disabled={saving}>
            {saving
              ? "Création…"
              : publishNow && canDirectPublish
                ? "Créer et publier"
                : "Créer en brouillon"}
          </button>
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
