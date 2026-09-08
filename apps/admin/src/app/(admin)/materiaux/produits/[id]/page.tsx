"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Package, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { InfoField, InfoGrid } from "@/components/administration/InfoField";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import {
  formatCategoryDate,
  type MaterialCategory,
} from "@/lib/materiaux/categories";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import { materialStockReservationStorage } from "@/lib/materiaux/reservation-storage";
import {
  formatCatalogPrice,
  presentMaterialProduct,
  productImages,
  type MaterialProduct,
} from "@/lib/materiaux/products";
import { materialStockStorage } from "@/lib/materiaux/stock-storage";
import {
  availableQuantity,
  formatStockWithUnit,
  stockLevel,
  type MaterialStock,
} from "@/lib/materiaux/stocks";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import {
  labelSupplier,
  type MaterialSupplier,
} from "@/lib/materiaux/suppliers";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import { labelSaleUnit, type MaterialUnit } from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

function hasText(value?: string | null) {
  return Boolean(value && String(value).trim());
}

export default function MaterialProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<MaterialProduct | null>(null);
  const [category, setCategory] = useState<MaterialCategory | null>(null);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [suppliers, setSuppliers] = useState<MaterialSupplier[]>([]);
  const [stock, setStock] = useState<MaterialStock | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const reload = useCallback(() => {
    const found = materialProductStorage.findById(params.id);
    setProduct(found ?? null);
    if (!found) {
      setCategory(null);
      setStock(null);
      return;
    }
    materialStockReservationStorage.list();
    setUnits(materialUnitStorage.list());
    setSuppliers(materialSupplierStorage.list());
    setStock(materialStockStorage.findByProductId(found.id) ?? null);
    setCategory(
      materialCategoryStorage.list().find((item) => item.id === found.categoryId) ??
        null,
    );
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reload();
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger cette fiche catalogue.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function toggleStatus() {
    if (!product) return;
    const nextStatus = product.status === "ACTIF" ? "INACTIF" : "ACTIF";
    try {
      await materialProductStorage.update(product.id, { status: nextStatus });
      reload();
      setToast(
        nextStatus === "ACTIF"
          ? `${product.name} activé.`
          : `${product.name} désactivé.`,
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

  async function removeProduct() {
    if (!product) return;
    try {
      await materialProductStorage.remove(product.id);
      router.push(routes.materialProducts);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
      setPendingDelete(false);
    }
  }

  const presented = product
    ? presentMaterialProduct(product, {
        category: category
          ? { id: category.id, slug: category.slug, name: category.name }
          : undefined,
        unitLabel: labelSaleUnit(product.unit, units),
        stock: stock
          ? {
              available: availableQuantity(stock),
              reserved: stock.reservedQuantity,
              sold: stock.soldQuantity,
              minimum: stock.minimumQuantity,
              location: stock.location,
            }
          : undefined,
        supplier: product.supplierId
          ? {
              id: product.supplierId,
              name:
                labelSupplier(product.supplierId, suppliers) ||
                "Fournisseur introuvable",
              location: suppliers.find((item) => item.id === product.supplierId)
                ?.city,
            }
          : undefined,
      })
    : null;

  const unitLabel = product ? labelSaleUnit(product.unit, units) : "";
  const gallery = presented ? productImages(presented) : [];
  const supplierName = presented?.supplier?.name;
  const supplierLocation = presented?.supplier?.location;
  const hasTechnical = Boolean(
    product &&
      (hasText(product.brand) ||
        hasText(product.model) ||
        hasText(product.technicalDetails)),
  );
  const hasDelivery = Boolean(
    presented?.delivery?.zones.length ||
      hasText(presented?.delivery?.delay) ||
      hasText(presented?.delivery?.conditions),
  );
  const hasSupplier = Boolean(hasText(supplierName) || hasText(supplierLocation));

  if (ready && !product) {
    return (
      <AdminShell
        active="materiaux"
        eyebrow="Matériaux de construction"
        title="Matériau introuvable"
        icon={Package}
        backHref={routes.materialProducts}
        backLabel="Retour aux produits"
        heroVariant="compact"
      >
        <EmptyState
          title="Fiche introuvable"
          description="Ce matériau est introuvable."
          action={
            <Link href={routes.materialProducts} className={styles.secondary}>
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
      eyebrow="Produit matériaux"
      title={product?.name ?? "Fiche matériau"}
      icon={Package}
      backHref={routes.materialProducts}
      backLabel="Retour aux produits"
      heroVariant="compact"
      badge={product ? <StatusBadge status={product.status} /> : undefined}
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

      {product ? (
        <div className={styles.stack}>
          <div className={styles.actions}>
            <Link
              href={routes.materialProductEdit(product.id)}
              className={styles.primary}
            >
              <Pencil size={16} aria-hidden="true" />
              Modifier
            </Link>
            <Link href={routes.materialStock} className={styles.secondary}>
              Voir le stock
            </Link>
            <button
              type="button"
              className={styles.secondary}
              onClick={() =>
                product.status === "ACTIF"
                  ? setPendingToggle(true)
                  : toggleStatus()
              }
            >
              {product.status === "ACTIF" ? (
                <ToggleRight size={16} aria-hidden="true" />
              ) : (
                <ToggleLeft size={16} aria-hidden="true" />
              )}
              {product.status === "ACTIF" ? "Désactiver" : "Activer"}
            </button>
            <button
              type="button"
              className={styles.danger}
              onClick={() => setPendingDelete(true)}
            >
              <Trash2 size={16} aria-hidden="true" />
              Supprimer
            </button>
          </div>

          <div className={styles.columns}>
            <div className={styles.column}>
              <section className={styles.card}>
                <h2>Informations générales</h2>
                {hasText(product.description) ? (
                  <p className={styles.note}>{product.description}</p>
                ) : null}
                <InfoGrid className={styles.compactGrid}>
                  <InfoField label="Nom" value={product.name} />
                  <InfoField label="Référence" value={product.reference || "—"} />
                  <InfoField
                    label="Catégorie"
                    value={category?.name ?? "Catégorie introuvable"}
                  />
                  <InfoField label="Statut">
                    <StatusBadge status={product.status} />
                  </InfoField>
                  <InfoField label="Slug" value={product.slug} />
                  <InfoField
                    label="Création"
                    value={formatCategoryDate(product.createdAt)}
                  />
                  <InfoField
                    label="Modification"
                    value={formatCategoryDate(product.updatedAt)}
                  />
                </InfoGrid>
              </section>

              <section className={styles.card}>
                <h2>Informations commerciales</h2>
                <InfoGrid className={styles.compactGrid}>
                  <InfoField
                    label="Prix"
                    value={formatCatalogPrice(product.price, unitLabel)}
                  />
                  <InfoField label="Unité" value={unitLabel} />
                  <InfoField
                    label="Conditionnement"
                    value={presented?.pricing?.packaging}
                    show={hasText(presented?.pricing?.packaging)}
                  />
                </InfoGrid>
              </section>

              {hasTechnical ? (
                <section className={styles.card}>
                  <h2>Informations techniques</h2>
                  <InfoGrid className={styles.compactGrid}>
                    <InfoField
                      label="Marque"
                      value={product.brand}
                      show={hasText(product.brand)}
                    />
                    <InfoField
                      label="Modèle"
                      value={product.model}
                      show={hasText(product.model)}
                    />
                    <InfoField
                      label="Détails techniques"
                      value={product.technicalDetails}
                      show={hasText(product.technicalDetails)}
                      full
                    />
                  </InfoGrid>
                </section>
              ) : null}

              {gallery.length > 0 ? (
                <section className={styles.card}>
                  <h2>Images</h2>
                  <div className={styles.gallery}>
                    {gallery.map((image) => (
                      <div key={image.id || image.url} className={styles.photo}>
                        {/* Image locale / data URL de démonstration. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={image.alt || product.name} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div className={styles.column}>
              <section className={styles.card}>
                <h2>Stock</h2>
                <InfoGrid className={styles.compactGrid}>
                  <InfoField label="État du stock">
                    <StatusBadge status={stock ? stockLevel(stock) : "RUPTURE"} />
                  </InfoField>
                  <InfoField
                    label="Disponibilité"
                    value={formatStockWithUnit(
                      stock ? availableQuantity(stock) : 0,
                      unitLabel,
                    )}
                  />
                  <InfoField
                    label="Localisation"
                    value={presented?.stock?.location || stock?.location}
                    show={hasText(presented?.stock?.location || stock?.location)}
                  />
                  <InfoField
                    label="Stock physique"
                    value={formatStockWithUnit(stock?.quantity ?? 0, unitLabel)}
                  />
                  <InfoField
                    label="Réservé"
                    value={formatStockWithUnit(
                      stock?.reservedQuantity ?? 0,
                      unitLabel,
                    )}
                  />
                  <InfoField
                    label="Vendu"
                    value={formatStockWithUnit(stock?.soldQuantity || 0, unitLabel)}
                  />
                  <InfoField
                    label="Seuil minimum"
                    value={formatStockWithUnit(
                      stock?.minimumQuantity ?? 0,
                      unitLabel,
                    )}
                  />
                </InfoGrid>
              </section>

              {hasSupplier ? (
                <section className={styles.card}>
                  <h2>Fournisseur</h2>
                  <InfoGrid className={styles.compactGrid}>
                    <InfoField label="Nom" value={supplierName} show={hasText(supplierName)} />
                    <InfoField
                      label="Localisation"
                      value={supplierLocation}
                      show={hasText(supplierLocation)}
                    />
                  </InfoGrid>
                </section>
              ) : null}

              {hasDelivery ? (
                <section className={styles.card}>
                  <h2>Livraison</h2>
                  <InfoGrid className={styles.compactGrid}>
                    <InfoField
                      label="Zones de livraison"
                      value={presented?.delivery?.zones.join(", ")}
                      show={Boolean(presented?.delivery?.zones.length)}
                    />
                    <InfoField
                      label="Délai de livraison"
                      value={presented?.delivery?.delay}
                      show={hasText(presented?.delivery?.delay)}
                    />
                    <InfoField
                      label="Conditions de livraison"
                      value={presented?.delivery?.conditions}
                      show={hasText(presented?.delivery?.conditions)}
                      full
                    />
                  </InfoGrid>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingToggle}
        title="Désactiver ce matériau ?"
        description="La fiche restera visible dans l’administration mais inactive dans le catalogue."
        subject={product?.name}
        confirmLabel="Désactiver"
        onCancel={() => setPendingToggle(false)}
        onConfirm={toggleStatus}
      />
      <ConfirmDialog
        open={pendingDelete}
        title="Supprimer ce matériau ?"
        description="La fiche catalogue sera retirée."
        subject={product?.name}
        confirmLabel="Supprimer"
        onCancel={() => setPendingDelete(false)}
        onConfirm={removeProduct}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
