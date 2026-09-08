"use client";

import { Save } from "lucide-react";
import { useState } from "react";

import { FieldError, fieldA11y } from "@/components/ui";
import {
  MATERIAL_SUPPLIER_TYPES,
  uniqueSupplierSlug,
  type MaterialSupplier,
  type MaterialSupplierType,
} from "@/lib/materiaux/suppliers";
import { materialSupplierFormSchema, safeParseFields } from "@/lib/validation";

import styles from "./MaterialProductForm.module.css";

export type MaterialSupplierFormValues = {
  type: MaterialSupplierType | "";
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  description: string;
  active: boolean;
  verified: boolean;
};

type Props = {
  mode: "create" | "edit";
  initial: MaterialSupplierFormValues;
  existing: MaterialSupplier[];
  excludeId?: string;
  busy?: boolean;
  onCancel: () => void;
  onSubmit: (values: MaterialSupplierFormValues) => void;
};

export const emptySupplierForm = (): MaterialSupplierFormValues => ({
  type: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  district: "",
  description: "",
  active: true,
  verified: false,
});

export function valuesFromSupplier(
  supplier: MaterialSupplier,
): MaterialSupplierFormValues {
  return {
    type: supplier.type,
    name: supplier.name,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    city: supplier.city,
    district: supplier.district || "",
    description: supplier.description,
    active: supplier.status === "ACTIF",
    verified: supplier.verificationStatus === "VERIFIE",
  };
}

export function MaterialSupplierForm({
  mode,
  initial,
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
    ? uniqueSupplierSlug(form.name, existing, excludeId)
    : "";

  function patch<K extends keyof MaterialSupplierFormValues>(
    key: K,
    value: MaterialSupplierFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setFormError(null);
  }

  function submit() {
    const parsed = safeParseFields(materialSupplierFormSchema, form);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFormError(Object.values(parsed.errors)[0] || "Corrigez le formulaire.");
      return;
    }
    onSubmit({
      ...form,
      type: parsed.data.type,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      city: parsed.data.city,
      district: parsed.data.district,
      description: parsed.data.description,
      active: parsed.data.active,
      verified: form.verified,
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
              placeholder={
                form.type === "PARTICULIER"
                  ? "Ex. Mamadou Bah"
                  : "Ex. Société Matériaux Conakry"
              }
              {...fieldA11y("supplier-name-error", errors.name)}
            />
            <FieldError id="supplier-name-error" message={errors.name} />
          </label>
          <label>
            Type
            <select
              value={form.type}
              onChange={(event) =>
                patch("type", event.target.value as MaterialSupplierType | "")
              }
              {...fieldA11y("supplier-type-error", errors.type)}
            >
              <option value="">Sélectionner un type</option>
              {MATERIAL_SUPPLIER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "PROFESSIONNEL" ? "Professionnel" : "Particulier"}
                </option>
              ))}
            </select>
            <FieldError id="supplier-type-error" message={errors.type} />
          </label>
          <label>
            Slug
            <input
              type="text"
              value={generatedSlug}
              readOnly
              aria-describedby="supplier-slug-hint"
            />
            <p id="supplier-slug-hint" className={styles.hint}>
              Généré automatiquement à partir du nom.
            </p>
          </label>
          <label className={styles.wide}>
            Description
            <textarea
              value={form.description}
              onChange={(event) => patch("description", event.target.value)}
              placeholder="Optionnel — présentation du fournisseur"
              {...fieldA11y("supplier-description-error", errors.description)}
            />
            <FieldError
              id="supplier-description-error"
              message={errors.description}
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Contact</h2>
        <div className={styles.grid}>
          <label>
            Téléphone
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => patch("phone", event.target.value)}
              placeholder="Optionnel — +224 622 00 00 00"
              {...fieldA11y("supplier-phone-error", errors.phone)}
            />
            <FieldError id="supplier-phone-error" message={errors.phone} />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(event) => patch("email", event.target.value)}
              placeholder="Optionnel"
              {...fieldA11y("supplier-email-error", errors.email)}
            />
            <FieldError id="supplier-email-error" message={errors.email} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Localisation</h2>
        <div className={styles.grid}>
          <label>
            Ville
            <input
              type="text"
              value={form.city}
              onChange={(event) => patch("city", event.target.value)}
              placeholder="Ex. Conakry"
              {...fieldA11y("supplier-city-error", errors.city)}
            />
            <FieldError id="supplier-city-error" message={errors.city} />
          </label>
          <label>
            Quartier
            <input
              type="text"
              value={form.district}
              onChange={(event) => patch("district", event.target.value)}
              placeholder="Ex. Minière"
              {...fieldA11y("supplier-district-error", errors.district)}
            />
            <FieldError
              id="supplier-district-error"
              message={errors.district}
            />
          </label>
          <label className={styles.wide}>
            Adresse
            <input
              type="text"
              value={form.address}
              onChange={(event) => patch("address", event.target.value)}
              placeholder="Optionnel"
              {...fieldA11y("supplier-address-error", errors.address)}
            />
            <FieldError id="supplier-address-error" message={errors.address} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Vérification</h2>
        <label className={styles.status}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => patch("active", event.target.checked)}
          />
          Fournisseur actif
        </label>
        {mode === "edit" ? (
          <label className={styles.status}>
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(event) => patch("verified", event.target.checked)}
            />
            Fournisseur vérifié
          </label>
        ) : (
          <p className={styles.hint}>
            Un nouveau fournisseur est enregistré comme non vérifié. Le badge
            se définit ensuite depuis la fiche.
          </p>
        )}
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
              ? "Créer le fournisseur"
              : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
