"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Eye,
  FileText,
  Grid2X2,
  List,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AccountScopeBanner } from "@/components/account/AccountScopeBanner";
import { AccountScopeExtensionDialog } from "@/components/account/AccountScopeExtensionDialog";
import AgencyShell from "@/components/agence/AgencyShell";
import {
  PublicationPanel,
  publicationActionClasses,
} from "@/components/property/PublicationPanel";
import { Button, ConfirmDialog, DemoToast } from "@/components/ui";
import { useAccountScope } from "@/hooks/useAccountScope";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDemoListings } from "@/hooks/useDemoListings";
import { useDemoProperties } from "@/hooks/useDemoProperties";
import { formatGnf } from "@/lib/agence/demo-data";
import { addPropertyCtaLabel } from "@/lib/demo-api/account-scope";
import { DEMO_AGENCY_ID, DEMO_AGENCY_USER_ID } from "@/lib/demo-api/config";
import {
  listingService,
  propertyService,
  type DemoListing,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import { demoPropertyLocationLabel } from "@/lib/demo-api/propertyPayload";
import { displayValue } from "@/lib/property/display";
import {
  getSafeCoverImage,
  PROPERTY_PLACEHOLDER,
  skipImageOptimization,
} from "@/lib/imageOptimization";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

function publicationFor(property: DemoProperty, ads: DemoListing[]) {
  const related = ads.filter(
    (ad) =>
      ad.propertyId === property.id ||
      ad.slug.includes(property.slug) ||
      property.slug.includes(ad.slug),
  );
  if (related.some((ad) => ad.status === "PUBLIEE")) {
    const ad = related.find((a) => a.status === "PUBLIEE")!;
    return { label: "PUBLIÉE", tone: "published" as const, ad };
  }
  if (related.some((ad) => ad.status === "EN_ATTENTE")) {
    const ad = related.find((a) => a.status === "EN_ATTENTE")!;
    return { label: "EN ATTENTE", tone: "pending" as const, ad };
  }
  if (related.some((ad) => ad.status === "A_CORRIGER")) {
    const ad = related.find((a) => a.status === "A_CORRIGER")!;
    return { label: "À CORRIGER", tone: "pending" as const, ad };
  }
  if (related.some((ad) => ad.status === "REFUSEE")) {
    const ad = related.find((a) => a.status === "REFUSEE")!;
    return { label: "REFUSÉE", tone: "rejected" as const, ad };
  }
  if (related.some((ad) => ad.status === "SUSPENDUE")) {
    const ad = related.find((a) => a.status === "SUSPENDUE")!;
    return { label: "SUSPENDUE", tone: "rejected" as const, ad };
  }
  if (related.some((ad) => ad.status === "BROUILLON")) {
    const ad = related.find((a) => a.status === "BROUILLON")!;
    return { label: "BROUILLON", tone: "draft" as const, ad };
  }
  return {
    label: "NON PUBLIÉ",
    tone: "none" as const,
    ad: null as DemoListing | null,
  };
}

function AgencyPropertiesPageInner() {
  const searchParams = useSearchParams();
  const {
    items,
    loading,
    error,
    refresh,
  } = useDemoProperties({ agencyId: DEMO_AGENCY_ID }, { poll: true });
  const { items: ads, refresh: refreshAds } = useDemoListings(
    { agencyId: DEMO_AGENCY_ID },
    { poll: true },
  );
  const {
    userId,
    loading: scopeLoading,
    error: scopeError,
    allowedPropertyTypes,
    allowedPropertyScopes,
    pendingScopeRequests,
    refresh: refreshScope,
  } = useAccountScope({ userId: DEMO_AGENCY_USER_ID });
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("TOUS");
  const [mandate, setMandate] = useState("TOUS");
  const [pendingDelete, setPendingDelete] = useState<DemoProperty | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [busyResubmitId, setBusyResubmitId] = useState<string | null>(null);
  const [extensionOpen, setExtensionOpen] = useState(false);

  const dismissToast = useCallback(() => setToast(null), []);
  const openExtension = useCallback(() => setExtensionOpen(true), []);
  const closeExtension = useCallback(() => setExtensionOpen(false), []);
  const addCtaLabel = addPropertyCtaLabel(allowedPropertyTypes);

  useEffect(() => {
    if (searchParams.get("extension") === "1") {
      setExtensionOpen(true);
    }
  }, [searchParams]);

  async function resubmitAd(adId: string) {
    setBusyResubmitId(adId);
    try {
      await listingService.resubmit(adId, { actor: "AGENCE" });
      setToast("Annonce renvoyée pour validation.");
      await refreshAds();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Renvoi impossible.");
    } finally {
      setBusyResubmitId(null);
    }
  }

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const location = demoPropertyLocationLabel(p);
        const client = p.clientDisplayName || "";
        const matchText = `${p.title} ${location} ${p.reference} ${client}`
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase());
        const statusValue = p.status || "ACTIF";
        const mandateValue = p.mandateType || "";
        return (
          matchText &&
          (status === "TOUS" || statusValue === status) &&
          (mandate === "TOUS" || mandateValue === mandate)
        );
      }),
    [items, debouncedQuery, status, mandate],
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await propertyService.remove(pendingDelete.id || pendingDelete.slug);
      await refresh();
      setToast("Le bien a été supprimé.");
    } catch (err) {
      setToast(
        err instanceof Error
          ? err.message
          : "Suppression impossible — Demo API indisponible.",
      );
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <AgencyShell
      active="biens"
      eyebrow="Portefeuille professionnel"
      title="Biens de l’agence"
      description="Gérez les biens confiés à l’agence et leurs mandats."
      action={
        <Button href={routes.newAgencyProperty}>
          <Plus size={17} aria-hidden="true" />
          {addCtaLabel}
        </Button>
      }
    >
      <AccountScopeBanner
        allowedPropertyScopes={allowedPropertyScopes}
        loading={scopeLoading}
        error={scopeError}
        onRequestExtension={openExtension}
      />
      <section className={`${styles.card} ${styles.filters}`}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, référence, client..."
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="BROUILLON">Brouillons</option>
          <option value="ARCHIVE">Archivés</option>
        </select>
        <select value={mandate} onChange={(e) => setMandate(e.target.value)}>
          <option value="TOUS">Tous les mandats</option>
          <option value="EXCLUSIF">Exclusifs</option>
          <option value="SIMPLE">Simples</option>
          <option value="INTERNE">Internes</option>
        </select>
        <div className={styles.views}>
          <button
            type="button"
            className={view === "grid" ? styles.active : ""}
            onClick={() => setView("grid")}
            aria-label="Vue grille"
            title="Vue grille"
          >
            <Grid2X2 size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={view === "list" ? styles.active : ""}
            onClick={() => setView("list")}
            aria-label="Vue liste"
            title="Vue liste"
          >
            <List size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      {error ? (
        <p className={styles.errorBanner} role="alert">
          {error} — lancez `npm start` dans immo-demo-api.
        </p>
      ) : null}

      <p className={styles.resultCount}>
        <strong>{loading ? "…" : filtered.length}</strong> bien(s) affiché(s)
      </p>
      <section className={view === "grid" ? styles.grid : styles.list}>
        {filtered.map((p) => {
          const location = demoPropertyLocationLabel(p);
          const statusKey = (p.status || "ACTIF").toLowerCase();
          const cover = getSafeCoverImage(p.images, PROPERTY_PLACEHOLDER);
          const completeness = p.completeness ?? 0;
          const publication = publicationFor(p, ads);
          return (
            <article key={p.id} className={`${styles.card} ${styles.property}`}>
              <div className={styles.imageWrap}>
                <Image
                  src={cover}
                  alt={p.title}
                  fill
                  sizes="(max-width:700px) 100vw, (max-width:1100px) 50vw, 33vw"
                  className={styles.image}
                  unoptimized={skipImageOptimization(cover)}
                />
                <span className={styles[statusKey]} title="État du bien">
                  {p.status || "ACTIF"}
                </span>
              </div>
              <div className={styles.body}>
                <h2>{p.title}</h2>
                <div className={styles.reference}>
                  <span>{p.reference}</span>
                  <strong>{displayValue(p.mandateType)}</strong>
                </div>
                <p>
                  <MapPin size={14} aria-hidden="true" />
                  {location}
                </p>
                <strong className={styles.price}>
                  {formatGnf(p.price)}
                  {p.operation === "LOCATION" ? " / mois" : ""}
                </strong>
                <div className={styles.client}>
                  <small>Client associé</small>
                  <strong>{displayValue(p.clientDisplayName)}</strong>
                </div>
                <div className={styles.metrics}>
                  <span>
                    <Eye size={14} aria-hidden="true" />
                    {p.views ?? 0} vues
                  </span>
                  <span>
                    <MessageSquareText size={14} aria-hidden="true" />
                    {p.contacts ?? 0} contacts
                  </span>
                </div>
                <div className={styles.completion}>
                  <div>
                    <small>Complétude</small>
                    <b>{completeness}%</b>
                  </div>
                  <span>
                    <i style={{ width: `${completeness}%` }} />
                  </span>
                </div>
                <PublicationPanel
                  label={publication.label}
                  tone={publication.tone}
                  note={
                    publication.ad?.rejectionReason ||
                    publication.ad?.moderationNote ||
                    null
                  }
                >
                  <Link
                    href={routes.agencyProperty(p.slug)}
                    className={publicationActionClasses.secondary}
                  >
                    <Eye size={14} aria-hidden="true" />
                    Voir
                  </Link>
                  <Link
                    href={routes.editAgencyProperty(p.slug)}
                    className={publicationActionClasses.secondary}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Modifier
                  </Link>
                  {(() => {
                    const ad = publication.ad;
                    if (!ad) {
                      if ((p.status || "ACTIF") === "ACTIF") {
                        return (
                          <Link
                            href={`${routes.newAgencyAd}?bien=${encodeURIComponent(p.slug)}`}
                            className={publicationActionClasses.primary}
                          >
                            <Send size={14} aria-hidden="true" />
                            Publier ce bien
                          </Link>
                        );
                      }
                      return null;
                    }
                    if (ad.status === "BROUILLON") {
                      return (
                        <Link
                          href={routes.editAgencyAd(ad.id)}
                          className={publicationActionClasses.primary}
                        >
                          <Send size={14} aria-hidden="true" />
                          Continuer la publication
                        </Link>
                      );
                    }
                    if (
                      ad.status === "A_CORRIGER" ||
                      (ad.status === "REFUSEE" && ad.canResubmit)
                    ) {
                      return (
                        <>
                          <Link
                            href={routes.editAgencyAd(ad.id)}
                            className={publicationActionClasses.secondary}
                          >
                            <FileText size={14} aria-hidden="true" />
                            Modifier l’annonce
                          </Link>
                          <button
                            type="button"
                            className={publicationActionClasses.primary}
                            disabled={busyResubmitId === ad.id}
                            onClick={() => void resubmitAd(ad.id)}
                          >
                            <RefreshCw size={14} aria-hidden="true" />
                            {busyResubmitId === ad.id
                              ? "…"
                              : "Renvoyer pour validation"}
                          </button>
                        </>
                      );
                    }
                    return (
                      <Link
                        href={routes.agencyAd(ad.id)}
                        className={publicationActionClasses.secondary}
                      >
                        <FileText size={14} aria-hidden="true" />
                        Voir l’annonce
                      </Link>
                    );
                  })()}
                  <button
                    type="button"
                    className={publicationActionClasses.danger}
                    onClick={() => setPendingDelete(p)}
                    aria-label={`Supprimer ${p.title}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Supprimer
                  </button>
                </PublicationPanel>
              </div>
            </article>
          );
        })}
      </section>
      {!loading && filtered.length === 0 && (
        <section className={`${styles.card} ${styles.empty}`}>
          <Building2 size={37} aria-hidden="true" />
          <h2>Aucun bien trouvé</h2>
          <p>Modifiez les filtres ou ajoutez un bien.</p>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Supprimer ce bien ?"
        description="Cette action supprimera le bien via la Demo API."
        subject={pendingDelete?.title}
        confirmLabel="Supprimer le bien"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <AccountScopeExtensionDialog
        open={extensionOpen}
        userId={userId}
        allowedPropertyScopes={allowedPropertyScopes}
        pendingRequests={pendingScopeRequests}
        onClose={closeExtension}
        onSubmitted={() => {
          void refreshScope();
          setToast("Votre demande d’extension a été envoyée.");
        }}
      />
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AgencyShell>
  );
}

export default function AgencyPropertiesPage() {
  return (
    <Suspense fallback={null}>
      <AgencyPropertiesPageInner />
    </Suspense>
  );
}
