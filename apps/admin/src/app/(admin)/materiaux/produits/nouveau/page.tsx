"use client";

import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  MaterialProductForm,
  emptyProductForm,
} from "@/components/materiaux/MaterialProductForm";
import { DemoToast } from "@/components/ui";
import type { MaterialCategory } from "@/lib/materiaux/categories";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import type { MaterialProduct } from "@/lib/materiaux/products";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import type { MaterialSupplier } from "@/lib/materiaux/suppliers";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import type { MaterialUnit } from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";

import styles from "../form.module.css";

export default function NewMaterialProductPage() {
  const router = useRouter();
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
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger les catégories.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const defaultCategoryId = categories[0]?.id ?? "";
  const defaultUnitId =
    units.find((unit) => unit.status === "ACTIF")?.id ?? "";

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Ajouter un matériau"
      icon={Package}
      backHref={routes.materialProducts}
      backLabel="Retour aux produits"
      heroVariant="compact"
    >

      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Préparation du formulaire…
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.error} role="alert">
          Créez d’abord une catégorie de matériaux avant d’ajouter un produit.
        </div>
      ) : defaultUnitId === "" ? (
        <div className={styles.error} role="alert">
          Créez ou activez une unité de vente avant d’ajouter un produit.
        </div>
      ) : (
        <MaterialProductForm
          key={`${defaultCategoryId}-${defaultUnitId}`}
          mode="create"
          initial={emptyProductForm(defaultCategoryId, defaultUnitId)}
          categories={categories}
          units={units}
          suppliers={suppliers}
          existing={existing}
          busy={busy}
          onCancel={() => router.push(routes.materialProducts)}
          onSubmit={(values) => {
            setBusy(true);
            window.setTimeout(async () => {
              try {
                const created = await materialProductStorage.create({
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
                router.push(routes.materialProduct(created.id));
              } catch (error) {
                setToast(
                  error instanceof Error
                    ? error.message
                    : "Création impossible.",
                );
                setBusy(false);
              }
            }, 250);
          }}
        />
      )}

      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
