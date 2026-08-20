"use client";

/**
 * Sections commerciales conditionnelles d'une annonce.
 * Ce composant ne connaît pas les types de biens : il rend ce que
 * `resolveListingFormConfig(type, operation)` a déclaré.
 */

import { useId } from "react";

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

/** Groupe les milliers à l'affichage, la valeur stockée reste en chiffres bruts. */
function groupDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("fr-FR").format(Number(digits));
}

function AmountInput({
  value,
  onValueChange,
  placeholder,
}: {
  value: string;
  onValueChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <span className={styles.amountInput}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={groupDigits(value)}
        onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
      />
      <span className={styles.amountSuffix} aria-hidden="true">
        GNF
      </span>
    </span>
  );
}

function Segmented({
  name,
  value,
  onSelect,
  yesLabel = "Oui",
  noLabel = "Non",
}: {
  name: string;
  value: boolean;
  onSelect: (next: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={name}>
      <label
        className={`${styles.segment} ${!value ? styles.segmentActive : ""}`}
      >
        <input
          type="radio"
          name={name}
          checked={!value}
          onChange={() => onSelect(false)}
        />
        {noLabel}
      </label>
      <label
        className={`${styles.segment} ${value ? styles.segmentActive : ""}`}
      >
        <input
          type="radio"
          name={name}
          checked={value}
          onChange={() => onSelect(true)}
        />
        {yesLabel}
      </label>
    </div>
  );
}

export default function ListingTermsFields({
  config,
  values,
  errors,
  onChange,
  formatAmount,
}: Props) {
  const groupId = useId();
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

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Loyer demandé *</span>
              <AmountInput
                value={values.rentAmount}
                onValueChange={(next) => onChange({ rentAmount: next })}
                placeholder="8 000 000"
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
          </div>

          {values.period === "OTHER" ? (
            <label className={styles.field}>
              <span className={styles.label}>Précisez la périodicité *</span>
              <input
                value={values.periodLabel}
                onChange={(e) => onChange({ periodLabel: e.target.value })}
                placeholder="Par saison agricole"
              />
              <FieldError message={errors.periodLabel} />
            </label>
          ) : null}

          <div className={styles.inlineBlock}>
            <div className={styles.inlineRow}>
              <div className={styles.inlineCopy}>
                <span className={styles.label}>Dépôt / caution demandée</span>
                <small className={styles.assist}>
                  Indiquez si une caution est demandée pour cette location.
                </small>
              </div>
              <Segmented
                name={`${groupId}-deposit`}
                value={values.depositRequired}
                onSelect={(next) =>
                  onChange({
                    depositRequired: next,
                    depositAmount: next ? values.depositAmount : "",
                  })
                }
              />
            </div>

            {values.depositRequired ? (
              <div className={styles.row}>
                <label className={styles.field}>
                  <span className={styles.label}>Montant de la caution *</span>
                  <AmountInput
                    value={values.depositAmount}
                    onValueChange={(next) => onChange({ depositAmount: next })}
                    placeholder="2 000 000"
                  />
                  <FieldError message={errors.depositAmount} />
                </label>
              </div>
            ) : (
              <small className={styles.assist}>Aucune caution demandée.</small>
            )}
          </div>

          <div className={styles.row}>
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
              {!values.minimumDurationChoice ? (
                <small className={styles.assist}>
                  Non précisée — l’information n’apparaîtra pas sur l’annonce.
                </small>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Disponible à partir du</span>
              <input
                type="date"
                value={values.availableFrom}
                onChange={(e) => onChange({ availableFrom: e.target.value })}
              />
              <FieldError message={errors.availableFrom} />
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
          </div>

          <div className={styles.inlineRow}>
            <div className={styles.inlineCopy}>
              <span className={styles.label}>Loyer négociable</span>
              <small className={styles.assist}>
                Précisez si le montant peut être discuté.
              </small>
            </div>
            <Segmented
              name={`${groupId}-rent-negotiable`}
              value={values.negotiable}
              onSelect={(next) => onChange({ negotiable: next })}
            />
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
          <div className={styles.inlineRow}>
            <div className={styles.inlineCopy}>
              <span className={styles.label}>Prix négociable</span>
              <small className={styles.assist}>
                Précisez si le prix peut être discuté.
              </small>
            </div>
            <Segmented
              name={`${groupId}-sale-negotiable`}
              value={values.negotiable}
              onSelect={(next) => onChange({ negotiable: next })}
            />
          </div>
          <div className={styles.row}>
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
