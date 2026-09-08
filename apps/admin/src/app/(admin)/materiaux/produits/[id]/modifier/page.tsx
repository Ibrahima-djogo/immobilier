"use client";

import { useParams, useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  MaterialProductForm,
  valuesFromProduct,
} from "@/components/materiaux/MaterialProductForm";
import { DemoToast, EmptyState } from "@/components/ui";
import type { MaterialCategory } from "@/lib/materiaux/categories";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import type { MaterialProduct } from "@/lib/materiaux/products";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import type { MaterialSupplier } from "@/lib/materiaux/suppliers";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import type { MaterialUnit } from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";

import styles from "../../form.module.css";

export default function EditMaterialProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<MaterialProduct | null>(null);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [suppliers, setSuppliers] = useState<MaterialSupplier[]>([]);
  const [existing, setExisting] = useState<MaterialProduct[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setCategories(materialCategoryStorage.list());
        setUnits(materialUnitStorage.list());
        setSuppliers(materialSupplierStorage.list());
        setExisting(materialProductStorage.list());
        setProduct(materialProductStorage.findById(params.id) ?? null);
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger cette fiche catalogue.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params.id]);

  if (ready && !product) {
    return (
      <AdminShell
        active="materiaux"
        eyebrow="Matériaux de construction"
        title="Matériau introuvable"
        icon={Package}
        backHref={routes.materialProducts}
        backLabel="Retour aux matériaux"
        heroVariant="compact"
      >
        <EmptyState
          title="Fiche introuvable"
          description="Ce matériau est introuvable."
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title={product ? `Modifier ${product.name}` : "Modifier le matériau"}
      icon={Package}
      backHref={product ? routes.materialProduct(product.id) : routes.materialProducts}
      backLabel="Retour à la fiche"
      heroVariant="compact"
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Chargement du formulaire…
        </div>
      ) : product ? (
        <MaterialProductForm
          mode="edit"
          initial={valuesFromProduct(product)}
          categories={categories}
          units={units}
          suppliers={suppliers}
          existing={existing}
          excludeId={product.id}
          busy={busy}
          onCancel={() => router.push(routes.materialProduct(product.id))}
          onSubmit={(values) => {
            setBusy(true);
            window.setTimeout(async () => {
              try {
                await materialProductStorage.update(product.id, {
                  name: values.name,
                  categoryId: values.categoryId,
                  brand: values.brand,
                  reference: values.reference,
                  description: values.description,
                  unit: values.unit,
                  supplierId: values.supplierId,
                  price: Number(values.price),
                  imageUrl: values.imageUrl,
                  status: values.active ? "ACTIF" : "INACTIF",
                });
                router.push(routes.materialProduct(product.id));
              } catch (error) {
                setToast(
                  error instanceof Error
                    ? error.message
                    : "Enregistrement impossible.",
                );
                setBusy(false);
              }
            }, 250);
          }}
        />
      ) : null}

      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
