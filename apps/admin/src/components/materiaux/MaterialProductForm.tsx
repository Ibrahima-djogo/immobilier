"use client";

import { Save } from "lucide-react";
import { useMemo, useState } from "react";

import { FieldError, fieldA11y } from "@/components/ui";
import type { MaterialCategory } from "@/lib/materiaux/categories";
import { uniqueProductSlug } from "@/lib/materiaux/products";
import type { MaterialProduct } from "@/lib/materiaux/products";
import {
  selectableSuppliers,
  type MaterialSupplier,
} from "@/lib/materiaux/suppliers";
import {
  labelSaleUnit,
  selectableUnits,
  type MaterialUnit,
} from "@/lib/materiaux/units";
import { materialProductFormSchema, safeParseFields } from "@/lib/validation";
import { validateUploadFile } from "@/lib/validation/common";

import styles from "./MaterialProductForm.module.css";

export type MaterialProductFormValues = {
  name: string;
  categoryId: string;
  brand: string;
  reference: string;
  description: string;
  unit: string;
  supplierId: string;
  price: string;
  imageUrl: string;
  active: boolean;
};

type Props = {
  mode: "create" | "edit";
  initial: MaterialProductFormValues;
  categories: MaterialCategory[];
  units: MaterialUnit[];
  suppliers: MaterialSupplier[];
  existing: MaterialProduct[];
  excludeId?: string;
  busy?: boolean;
  onCancel: () => void;
  onSubmit: (values: MaterialProductFormValues) => void;
};

export const emptyProductForm = (
  categoryId = "",
  unitId = "",
): MaterialProductFormValues => ({
  name: "",
  categoryId,
  brand: "",
  reference: "",
  description: "",
  unit: unitId,
  supplierId: "",
  price: "",
  imageUrl: "",
  active: true,
});

export function valuesFromProduct(
  product: MaterialProduct,
): MaterialProductFormValues {
  return {
    name: product.name,
    categoryId: product.categoryId,
    brand: product.brand,
    reference: product.reference,
    description: product.description,
    unit: product.unit,
    supplierId: product.supplierId ?? "",
    price: String(product.price),
    imageUrl: product.imageUrl,
    active: product.status === "ACTIF",
  };
}

export function MaterialProductForm({
  mode,
  initial,
  categories,
  units,
  suppliers,
  existing,
  excludeId,
  busy = false,
  onCancel,
  onSubmit,
}: Props) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const generatedSlug = form.name.trim()
    ? uniqueProductSlug(form.name, existing, excludeId)
    : "";
  const unitChoices = useMemo(
    () => selectableUnits(units, mode === "edit" ? initial.unit : undefined),
    [units, mode, initial.unit],
  );
  const unitLabel = useMemo(
    () => labelSaleUnit(form.unit, units),
    [form.unit, units],
  );
  const supplierChoices = useMemo(
    () =>
      selectableSuppliers(
        suppliers,
        mode === "edit" ? initial.supplierId : undefined,
      ),
    [suppliers, mode, initial.supplierId],
  );

  function patch<K extends keyof MaterialProductFormValues>(
    key: K,
    value: MaterialProductFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setFormError(null);
  }

  function handleImage(file: File | undefined) {
    if (!file) return;
    const invalid = validateUploadFile(file, "image");
    if (invalid) {
      setErrors((current) => ({ ...current, imageUrl: invalid }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patch("imageUrl", String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  }

  function submit() {
    const parsed = safeParseFields(materialProductFormSchema, form);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFormError(Object.values(parsed.errors)[0] || "Corrigez le formulaire.");
      return;
    }
    if (!categories.some((category) => category.id === parsed.data.categoryId)) {
      setErrors((current) => ({
        ...current,
        categoryId: "Choisissez une catégorie existante.",
      }));
      setFormError("Choisissez une catégorie existante.");
      return;
    }
    if (!unitChoices.some((unit) => unit.id === parsed.data.unit)) {
      setErrors((current) => ({
        ...current,
        unit: "Choisissez une unité de vente existante.",
      }));
      setFormError("Choisissez une unité de vente existante.");
      return;
    }
    if (
      parsed.data.supplierId &&
      !supplierChoices.some((supplier) => supplier.id === parsed.data.supplierId)
    ) {
      setErrors((current) => ({
        ...current,
        supplierId: "Choisissez un fournisseur actif.",
      }));
      setFormError("Choisissez un fournisseur actif.");
      return;
    }
    onSubmit({
      ...form,
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      brand: parsed.data.brand,
      reference: parsed.data.reference,
      description: parsed.data.description,
      unit: parsed.data.unit,
      supplierId: parsed.data.supplierId ?? "",
      price: String(parsed.data.price),
      imageUrl: parsed.data.imageUrl ?? form.imageUrl,
      active: parsed.data.active,
    });
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {formError ? (
        <div className={styles.error} role="alert">
          {formError}
        </div>
      ) : null}

      <section className={styles.section}>
        <h2>Informations principales</h2>
        <div className={styles.grid}>
          <label>
            Nom
            <input
              type="text"
              value={form.name}
              onChange={(event) => patch("name", event.target.value)}
              placeholder="Ex. Ciment 42.5"
              {...fieldA11y("product-name-error", errors.name)}
            />
            <FieldError id="product-name-error" message={errors.name} />
          </label>
          <label>
            Catégorie
            <select
              value={form.categoryId}
              onChange={(event) => patch("categoryId", event.target.value)}
              {...fieldA11y("product-category-error", errors.categoryId)}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.status === "INACTIF" ? " (inactive)" : ""}
                </option>
              ))}
            </select>
            <FieldError
              id="product-category-error"
              message={errors.categoryId}
            />
          </label>
          <label>
            Référence
            <input
              type="text"
              value={form.reference}
              onChange={(event) => patch("reference", event.target.value)}
              placeholder="Optionnel"
              {...fieldA11y("product-reference-error", errors.reference)}
            />
            <FieldError
              id="product-reference-error"
              message={errors.reference}
            />
          </label>
          <label>
            Slug
            <input
              type="text"
              value={generatedSlug}
              readOnly
              aria-describedby="product-slug-hint"
            />
            <p id="product-slug-hint" className={styles.hint}>
              Généré automatiquement à partir du nom.
            </p>
          </label>
          <label>
            Fournisseur
            <select
              value={form.supplierId}
              onChange={(event) => patch("supplierId", event.target.value)}
              {...fieldA11y("product-supplier-error", errors.supplierId)}
            >
              <option value="">Aucun fournisseur</option>
              {supplierChoices.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                  {supplier.status === "INACTIF" ? " (inactif)" : ""}
                </option>
              ))}
            </select>
            <FieldError
              id="product-supplier-error"
              message={errors.supplierId}
            />
          </label>
          <label className={styles.wide}>
            Description
            <textarea
              value={form.description}
              onChange={(event) => patch("description", event.target.value)}
              placeholder="Présentation catalogue du matériau"
              {...fieldA11y("product-description-error", errors.description)}
            />
            <FieldError
              id="product-description-error"
              message={errors.description}
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Prix et vente</h2>
        <div className={styles.grid}>
          <label>
            Unité de vente
            <select
              value={form.unit}
              onChange={(event) => patch("unit", event.target.value)}
              {...fieldA11y("product-unit-error", errors.unit)}
            >
              <option value="">Sélectionner une unité</option>
              {unitChoices.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name}
                  {unit.status === "INACTIF" ? " (inactive)" : ""}
                </option>
              ))}
            </select>
            <FieldError id="product-unit-error" message={errors.unit} />
          </label>
          <label>
            Prix catalogue (GNF)
            <div className={styles.priceRow}>
              <input
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => patch("price", event.target.value)}
                placeholder="100000"
                {...fieldA11y("product-price-error", errors.price)}
              />
              <span className={styles.priceUnit}>/ {unitLabel}</span>
            </div>
            <FieldError id="product-price-error" message={errors.price} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Informations techniques</h2>
        <div className={styles.grid}>
          <label>
            Marque
            <input
              type="text"
              value={form.brand}
              onChange={(event) => patch("brand", event.target.value)}
              placeholder="Optionnel"
              {...fieldA11y("product-brand-error", errors.brand)}
            />
            <FieldError id="product-brand-error" message={errors.brand} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Images</h2>
        <div className={styles.media}>
          <div className={styles.preview}>
            {form.imageUrl ? (
              // Image locale / data URL de démonstration.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="" />
            ) : (
              <span>Aucune</span>
            )}
          </div>
          <label>
            Image principale
            <div className={styles.fileRow}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleImage(event.target.files?.[0])}
              />
              {form.imageUrl ? (
                <button
                  type="button"
                  className={styles.removeImage}
                  onClick={() => patch("imageUrl", "")}
                >
                  Retirer
                </button>
              ) : null}
            </div>
            <FieldError id="product-image-error" message={errors.imageUrl} />
            <p className={styles.hint}>JPG, PNG ou WEBP, 5 Mo maximum.</p>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Stock</h2>
        <p className={styles.hint}>
          Les quantités et la localisation se gèrent depuis Stock. Aucune
          modification de stock n’est faite ici.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Statut</h2>
        <label className={styles.status}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => patch("active", event.target.checked)}
          />
          Matériau actif
        </label>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          disabled={busy}
          onClick={onCancel}
        >
          Annuler
        </button>
        <button type="submit" className={styles.primary} disabled={busy}>
          <Save size={16} aria-hidden="true" />
          {busy
            ? "Enregistrement..."
            : mode === "create"
              ? "Créer le matériau"
              : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
