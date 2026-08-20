"use client";

/**
 * Sections commerciales conditionnelles d'une annonce.
 * Ce composant ne connaît pas les types de biens : il rend ce que
 * `resolveListingFormConfig(type, operation)` a déclaré.
 */

import {
  LAND_USE_OPTIONS,
  MIN_DURATION_OPTIONS,
  RENT_PERIOD_OPTIONS,
  rentPeriodSuffix,
  type LandUse,
  type ListingFormConfig,
  type ListingTermsErrors,
  type ListingTermsFormValues,
  type RentPeriod,
} from "@/lib/listing/listingTerms";
import styles from "./ListingTermsFields.module.css";

type Props = {
  config: ListingFormConfig;
  values: ListingTermsFormValues;
  errors: ListingTermsErrors;
  onChange: (patch: Partial<ListingTermsFormValues>) => void;
  formatAmount: (value: number) => string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className={styles.error} role="alert">
      {message}
    </span>
  );
}

export default function ListingTermsFields({
  config,
  values,
  errors,
  onChange,
  formatAmount,
}: Props) {
  const { sections, labels } = config;
  if (!sections.rentalTerms && !sections.allowedUses && !sections.saleTerms) {
    return null;
  }

  const rentAmount = Number(values.rentAmount);
  const rentPreview =
    sections.rentalTerms && Number.isFinite(rentAmount) && rentAmount > 0
      ? `${formatAmount(rentAmount)} ${rentPeriodSuffix(
          values.period || null,
          values.periodLabel,
        )}`.trim()
      : null;

  function toggleUse(use: LandUse) {
    const next = values.allowedUses.includes(use)
      ? values.allowedUses.filter((item) => item !== use)
      : [...values.allowedUses, use];
    onChange({ allowedUses: next });
  }

  return (
    <>
      {sections.rentalTerms ? (
        <fieldset className={styles.section}>
          <legend>{labels.sectionTitle}</legend>
          {labels.sectionHint ? (
            <p className={styles.hint}>{labels.sectionHint}</p>
          ) : null}

          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Loyer demandé *</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={values.rentAmount}
                onChange={(e) => onChange({ rentAmount: e.target.value })}
                placeholder="8000000"
              />
              {rentPreview ? (
                <small className={styles.assist}>{rentPreview}</small>
              ) : null}
              <FieldError message={errors.rentAmount} />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Périodicité du loyer *</span>
              <select
                value={values.period}
                onChange={(e) =>
                  onChange({ period: e.target.value as RentPeriod })
                }
              >
                {RENT_PERIOD_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.period} />
            </label>

            {values.period === "OTHER" ? (
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.label}>Précisez la périodicité *</span>
                <input
                  value={values.periodLabel}
                  onChange={(e) => onChange({ periodLabel: e.target.value })}
                  placeholder="Par saison agricole"
                />
                <FieldError message={errors.periodLabel} />
              </label>
            ) : null}

            <div className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.label}>Dépôt / caution demandée</span>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={values.depositRequired}
                  onChange={(e) =>
                    onChange({
                      depositRequired: e.target.checked,
                      depositAmount: e.target.checked
                        ? values.depositAmount
                        : "",
                    })
                  }
                />
                Une caution est demandée
              </label>
              {values.depositRequired ? (
                <>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={values.depositAmount}
                    onChange={(e) => onChange({ depositAmount: e.target.value })}
                    placeholder="2000000"
                  />
                  <FieldError message={errors.depositAmount} />
                </>
              ) : (
                <small className={styles.assist}>
                  Aucune caution ne sera affichée sur l’annonce.
                </small>
              )}
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Durée minimale de location</span>
              <select
                value={values.minimumDurationChoice}
                onChange={(e) =>
                  onChange({ minimumDurationChoice: e.target.value })
                }
              >
                {MIN_DURATION_OPTIONS.map((option) => (
                  <option key={option.key || "none"} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {values.minimumDurationChoice === "OTHER" ? (
              <label className={styles.field}>
                <span className={styles.label}>Durée en mois *</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={values.minimumDurationCustom}
                  onChange={(e) =>
                    onChange({ minimumDurationCustom: e.target.value })
                  }
                  placeholder="18"
                />
                <FieldError message={errors.minimumDurationCustom} />
              </label>
            ) : null}

            <label className={styles.field}>
              <span className={styles.label}>Disponible à partir du</span>
              <input
                type="date"
                value={values.availableFrom}
                onChange={(e) => onChange({ availableFrom: e.target.value })}
              />
              <FieldError message={errors.availableFrom} />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Loyer négociable&nbsp;?</span>
              <div className={styles.choices}>
                <label className={styles.checkbox}>
                  <input
                    type="radio"
                    name="rent-negotiable"
                    checked={values.negotiable}
                    onChange={() => onChange({ negotiable: true })}
                  />
                  Oui
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="radio"
                    name="rent-negotiable"
                    checked={!values.negotiable}
                    onChange={() => onChange({ negotiable: false })}
                  />
                  Non
                </label>
              </div>
            </div>
          </div>
        </fieldset>
      ) : null}

      {sections.allowedUses ? (
        <fieldset className={styles.section}>
          <legend>Usage(s) autorisé(s) du terrain</legend>
          <p className={styles.hint}>
            Usages que vous autorisez en tant que bailleur. Cette déclaration ne
            constitue pas une validation juridique de l’usage du terrain.
          </p>
          <div className={styles.uses}>
            {LAND_USE_OPTIONS.map((option) => {
              const active = values.allowedUses.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`${styles.useButton} ${
                    active ? styles.useButtonActive : ""
                  }`}
                  aria-pressed={active}
                  onClick={() => toggleUse(option.key)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <FieldError message={errors.allowedUses} />
          {values.allowedUses.includes("OTHER") ? (
            <label className={styles.field}>
              <span className={styles.label}>Précisez l’usage autorisé *</span>
              <input
                value={values.allowedUsesOther}
                onChange={(e) => onChange({ allowedUsesOther: e.target.value })}
                placeholder="Pépinière, atelier en plein air…"
              />
              <FieldError message={errors.allowedUsesOther} />
            </label>
          ) : null}
        </fieldset>
      ) : null}

      {sections.saleTerms ? (
        <fieldset className={styles.section}>
          <legend>{labels.sectionTitle}</legend>
          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>Prix négociable&nbsp;?</span>
              <div className={styles.choices}>
                <label className={styles.checkbox}>
                  <input
                    type="radio"
                    name="sale-negotiable"
                    checked={values.negotiable}
                    onChange={() => onChange({ negotiable: true })}
                  />
                  Oui
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="radio"
                    name="sale-negotiable"
                    checked={!values.negotiable}
                    onChange={() => onChange({ negotiable: false })}
                  />
                  Non
                </label>
              </div>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>Disponible à partir du</span>
              <input
                type="date"
                value={values.availableFrom}
                onChange={(e) => onChange({ availableFrom: e.target.value })}
              />
              <FieldError message={errors.availableFrom} />
            </label>
          </div>
        </fieldset>
      ) : null}

      {sections.rentalTerms || sections.saleTerms ? (
        <label className={styles.standalone}>
          <span className={styles.label}>Conditions particulières</span>
          <textarea
            rows={4}
            value={values.specialConditions}
            onChange={(e) => onChange({ specialConditions: e.target.value })}
            placeholder="Précisez les éventuelles conditions d’utilisation ou contraintes importantes."
          />
          <small className={styles.assist}>Facultatif.</small>
        </label>
      ) : null}
    </>
  );
}
