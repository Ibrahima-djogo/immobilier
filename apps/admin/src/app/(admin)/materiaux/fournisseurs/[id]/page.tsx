"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Store, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { InfoField, InfoGrid } from "@/components/administration/InfoField";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { formatCategoryDate } from "@/lib/materiaux/categories";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import { fetchMaterialQuotes } from "@/lib/materiaux/material-api";
import { getOrders } from "@/lib/materiaux/order-api";
import {
  formatOrderWorkflowLabel,
  type MaterialOrder,
} from "@/lib/materiaux/orders";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import {
  formatCatalogPrice,
  type MaterialProduct,
} from "@/lib/materiaux/products";
import type { MaterialQuote } from "@/lib/materiaux/quotes";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import {
  labelSupplierType,
  type MaterialSupplier,
} from "@/lib/materiaux/suppliers";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import { labelSaleUnit, type MaterialUnit } from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

function hasText(value?: string | null) {
  return Boolean(value && String(value).trim());
}

function quoteLinkedToSupplier(quote: MaterialQuote, supplierId: string) {
  return (
    (quote.items ?? []).some((item) => item.supplierId === supplierId) ||
    (quote.proposals ?? []).some((proposal) => proposal.supplierId === supplierId)
  );
}

export default function MaterialSupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<MaterialSupplier | null>(null);
  const [linked, setLinked] = useState<MaterialProduct[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [quotes, setQuotes] = useState<MaterialQuote[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const reload = useCallback(() => {
    const found = materialSupplierStorage.findById(params.id);
    setSupplier(found ?? null);
    setLinked(found ? materialProductStorage.listBySupplier(found.id) : []);
    setUnits(materialUnitStorage.list());
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reload();
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger cette fiche fournisseur.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  useEffect(() => {
    const supplierId = String(params.id || "").trim();
    if (!supplierId) return;
    let cancelled = false;
    void Promise.allSettled([getOrders(), fetchMaterialQuotes()]).then(
      ([orderResult, quoteResult]) => {
        if (cancelled) return;
        if (orderResult.status === "fulfilled") {
          setOrders(
            (Array.isArray(orderResult.value) ? orderResult.value : []).filter(
              (item) => item.supplierId === supplierId,
            ),
          );
        }
        if (quoteResult.status === "fulfilled") {
          setQuotes(
            (Array.isArray(quoteResult.value) ? quoteResult.value : []).filter(
              (item) => quoteLinkedToSupplier(item, supplierId),
            ),
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const categoryName = useCallback((categoryId: string) => {
    return (
      materialCategoryStorage.list().find((item) => item.id === categoryId)
        ?.name ?? "—"
    );
  }, []);

  const offeredCategories = useMemo(() => {
    const names = new Set(
      linked.map((product) => categoryName(product.categoryId)).filter(Boolean),
    );
    return [...names];
  }, [linked, categoryName]);

  const activeProductCount = linked.filter(
    (product) => product.status === "ACTIF",
  ).length;

  async function toggleStatus() {
    if (!supplier) return;
    const nextStatus = supplier.status === "ACTIF" ? "INACTIF" : "ACTIF";
    try {
      await materialSupplierStorage.update(supplier.id, { status: nextStatus });
      reload();
      setToast(
        nextStatus === "ACTIF"
          ? `${supplier.name} activé.`
          : `${supplier.name} désactivé. Les matériaux existants conservent ce fournisseur.`,
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Impossible de changer le statut.",
      );
    }
    setPendingToggle(false);
  }

  async function removeSupplier() {
    if (!supplier) return;
    const used = materialProductStorage.countBySupplier(supplier.id);
    if (used > 0) {
      setLoadError(
        `Impossible de supprimer « ${supplier.name} » : ${used} matériau(x) y sont encore associés.`,
      );
      setPendingDelete(false);
      return;
    }
    try {
      await materialSupplierStorage.remove(supplier.id);
      router.push(routes.materialSuppliers);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
      setPendingDelete(false);
    }
  }

  const location = supplier
    ? [supplier.city, supplier.district].filter(Boolean).join(" — ") || "—"
    : "—";

  if (ready && !supplier) {
    return (
      <AdminShell
        active="materiaux"
        eyebrow="Matériaux de construction"
        title="Fournisseur introuvable"
        icon={Store}
        backHref={routes.materialSuppliers}
        backLabel="Retour aux fournisseurs"
        heroVariant="compact"
      >
        <EmptyState
          title="Fiche introuvable"
          description="Ce fournisseur est introuvable."
          action={
            <Link href={routes.materialSuppliers} className={styles.secondary}>
              Retour à la liste
            </Link>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Fournisseur matériaux"
      title={supplier?.name ?? "Fiche fournisseur"}
      icon={Store}
      backHref={routes.materialSuppliers}
      backLabel="Retour aux fournisseurs"
      heroVariant="compact"
      badge={
        supplier ? (
          <span className={styles.headerBadges}>
            <StatusBadge status={supplier.status} />
            {supplier.verificationStatus === "VERIFIE" ? (
              <StatusBadge status="VERIFIE" label="Vérifié" />
            ) : (
              <StatusBadge status={supplier.verificationStatus} />
            )}
          </span>
        ) : undefined
      }
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Chargement de la fiche…
        </div>
      ) : null}

      {supplier ? (
        <div className={styles.stack}>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={async () => {
                const next =
                  supplier.verificationStatus === "VERIFIE"
                    ? "NON_VERIFIE"
                    : "VERIFIE";
                try {
                  await materialSupplierStorage.update(supplier.id, {
                    verificationStatus: next,
                  });
                  reload();
                  setToast(
                    next === "VERIFIE"
                      ? "Fournisseur marqué comme vérifié."
                      : "Badge Fournisseur vérifié retiré.",
                  );
                } catch (error) {
                  setLoadError(
                    error instanceof Error
                      ? error.message
                      : "Impossible de mettre à jour la vérification.",
                  );
                }
              }}
            >
              {supplier.verificationStatus === "VERIFIE"
                ? "Retirer la vérification"
                : "Marquer comme vérifié"}
            </button>
            <Link
              href={routes.materialSupplierEdit(supplier.id)}
              className={styles.primary}
            >
              <Pencil size={16} aria-hidden="true" />
              Modifier
            </Link>
            <button
              type="button"
              className={styles.secondary}
              onClick={() =>
                supplier.status === "ACTIF"
                  ? setPendingToggle(true)
                  : toggleStatus()
              }
            >
              {supplier.status === "ACTIF" ? (
                <ToggleRight size={16} aria-hidden="true" />
              ) : (
                <ToggleLeft size={16} aria-hidden="true" />
              )}
              {supplier.status === "ACTIF" ? "Désactiver" : "Activer"}
            </button>
            <button
              type="button"
              className={styles.danger}
              onClick={() => {
                if (linked.length > 0) {
                  setLoadError(
                    `Impossible de supprimer « ${supplier.name} » : ${linked.length} matériau(x) y sont encore associés.`,
                  );
                  return;
                }
                setPendingDelete(true);
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Supprimer
            </button>
          </div>

          <div className={styles.columns}>
            <div className={styles.column}>
              <section className={styles.card}>
                <h2>Informations générales</h2>
                {hasText(supplier.description) ? (
                  <p className={styles.note}>{supplier.description}</p>
                ) : null}
                <InfoGrid className={styles.compactGrid}>
                  <InfoField label="Nom" value={supplier.name} />
                  <InfoField label="Type" value={labelSupplierType(supplier.type)} />
                  <InfoField label="Téléphone" value={supplier.phone || "—"} />
                  <InfoField label="E-mail" value={supplier.email || "—"} />
                  <InfoField label="Localisation" value={location} />
                  <InfoField
                    label="Adresse"
                    value={supplier.address}
                    show={hasText(supplier.address)}
                    full
                  />
                  <InfoField label="Slug" value={supplier.slug} />
                  <InfoField
                    label="Création"
                    value={formatCategoryDate(supplier.createdAt)}
                  />
                  <InfoField
                    label="Modification"
                    value={formatCategoryDate(supplier.updatedAt)}
                  />
                </InfoGrid>
              </section>

              <section className={styles.card}>
                <h2>Produits associés</h2>
                {linked.length === 0 ? (
                  <p className={styles.note}>
                    Aucun matériau n’est associé à ce fournisseur.
                  </p>
                ) : (
                  <div className={styles.lines}>
                    <div className={`${styles.lineGrid} ${styles.lineHead}`}>
                      <div>Produit</div>
                      <div>Catégorie</div>
                      <div>Prix</div>
                      <div>Statut</div>
                    </div>
                    {linked.map((product) => (
                      <article key={product.id} className={styles.lineGrid}>
                        <strong>
                          <Link href={routes.materialProduct(product.id)}>
                            {product.name}
                          </Link>
                        </strong>
                        <span data-label="Catégorie">
                          {categoryName(product.categoryId)}
                        </span>
                        <span data-label="Prix" className={styles.amount}>
                          {formatCatalogPrice(
                            product.price,
                            labelSaleUnit(product.unit, units),
                          )}
                        </span>
                        <span data-label="Statut">
                          <StatusBadge status={product.status} />
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className={styles.column}>
              <section className={styles.card}>
                <h2>Activité matériaux</h2>
                <InfoGrid className={styles.compactGrid}>
                  <InfoField
                    label="Produits associés"
                    value={String(linked.length)}
                  />
                  <InfoField
                    label="Catégories proposées"
                    value={
                      offeredCategories.length
                        ? offeredCategories.join(", ")
                        : "—"
                    }
                    full={offeredCategories.length > 1}
                  />
                  <InfoField
                    label="Disponibilité"
                    value={`${activeProductCount} produit(s) actif(s)`}
                  />
                </InfoGrid>
              </section>

              <section className={styles.card}>
                <h2>Commandes liées</h2>
                {orders.length === 0 ? (
                  <p className={styles.note}>
                    Aucune commande n’est associée à ce fournisseur.
                  </p>
                ) : (
                  <div className={styles.lines}>
                    <div className={`${styles.orderGrid} ${styles.lineHead}`}>
                      <div>Commande</div>
                      <div>Statut</div>
                    </div>
                    {orders.map((order) => (
                      <article key={order.id} className={styles.orderGrid}>
                        <strong>
                          <Link href={routes.materialOrder(order.id)}>
                            {order.reference}
                          </Link>
                        </strong>
                        <span data-label="Statut">
                          <StatusBadge
                            status={order.status}
                            label={formatOrderWorkflowLabel(order)}
                          />
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.card}>
                <h2>Devis liés</h2>
                {quotes.length === 0 ? (
                  <p className={styles.note}>
                    Aucune demande de devis n’est associée à ce fournisseur.
                  </p>
                ) : (
                  <div className={styles.lines}>
                    <div className={`${styles.orderGrid} ${styles.lineHead}`}>
                      <div>Devis</div>
                      <div>Statut</div>
                    </div>
                    {quotes.map((quote) => (
                      <article key={quote.id} className={styles.orderGrid}>
                        <strong>
                          <Link href={routes.materialQuote(quote.id)}>
                            {quote.reference}
                          </Link>
                        </strong>
                        <span data-label="Statut">
                          <StatusBadge status={quote.status} />
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          {(supplier.history || []).length > 0 ? (
            <section className={styles.card}>
              <h2>Historique</h2>
              <ul className={styles.history}>
                {(supplier.history || [])
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <li key={`${entry.changedAt}-${index}`}>
                      {entry.action} · {formatCategoryDate(entry.changedAt)} ·{" "}
                      {entry.changedBy}
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingToggle}
        title="Désactiver ce fournisseur ?"
        description="Il ne sera plus proposé pour un nouveau matériau. Les fiches existantes conservent ce fournisseur."
        subject={supplier?.name}
        confirmLabel="Désactiver"
        onCancel={() => setPendingToggle(false)}
        onConfirm={toggleStatus}
      />
      <ConfirmDialog
        open={pendingDelete}
        title="Supprimer ce fournisseur ?"
        description="Le fournisseur sera retiré du catalogue."
        subject={supplier?.name}
        confirmLabel="Supprimer"
        onCancel={() => setPendingDelete(false)}
        onConfirm={removeSupplier}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
