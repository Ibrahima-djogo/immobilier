"use client";

import {
  Building2,
  Check,
  Home,
  LandPlot,
  Store,
  Warehouse,
  X,
} from "lucide-react";
import type { PropertyTypeKey } from "@/lib/property/typeFields";
import { labelPropertyType } from "@/lib/property/typeFields";
import styles from "./DeclaredProjectFields.module.css";

export const DECLARED_PROPERTY_TYPES: PropertyTypeKey[] = [
  "TERRAIN",
  "MAISON",
  "VILLA",
  "APPARTEMENT",
  "BUREAU",
  "COMMERCE",
];

const TYPE_ICONS: Record<PropertyTypeKey, typeof Home> = {
  TERRAIN: LandPlot,
  MAISON: Home,
  VILLA: Home,
  APPARTEMENT: Building2,
  BUREAU: Warehouse,
  COMMERCE: Store,
};

export type DeclaredPortfolioSize = "ONE" | "TWO_TO_FIVE" | "MORE_THAN_FIVE";
export type DeclaredOperation = "VENTE" | "LOCATION";

export type DeclaredPropertyIntent = {
  propertyType: PropertyTypeKey;
  operations: DeclaredOperation[];
  quantityRange: DeclaredPortfolioSize | null;
};

const OPERATION_OPTIONS: [DeclaredOperation, string][] = [
  ["VENTE", "Vente"],
  ["LOCATION", "Location"],
];

const QUANTITY_OPTIONS: [DeclaredPortfolioSize, string, string][] = [
  ["ONE", "1 bien", "1 bien"],
  ["TWO_TO_FIVE", "2 à 5", "2 à 5 biens"],
  ["MORE_THAN_FIVE", "5+", "Plus de 5 biens"],
];

type Props = {
  intents: DeclaredPropertyIntent[];
  onChange: (intents: DeclaredPropertyIntent[]) => void;
  showQuantity?: boolean;
};

export function DeclaredProjectFields({
  intents,
  onChange,
  showQuantity = true,
}: Props) {
  function toggleType(key: PropertyTypeKey) {
    const existing = intents.find((intent) => intent.propertyType === key);
    if (existing) {
      onChange(intents.filter((intent) => intent.propertyType !== key));
      return;
    }
    onChange([
      ...intents,
      { propertyType: key, operations: [], quantityRange: null },
    ]);
  }

  function patchIntent(
    key: PropertyTypeKey,
    patch: Partial<DeclaredPropertyIntent>,
  ) {
    onChange(
      intents.map((intent) =>
        intent.propertyType === key ? { ...intent, ...patch } : intent,
      ),
    );
  }

  function toggleOperation(key: PropertyTypeKey, operation: DeclaredOperation) {
    const intent = intents.find((item) => item.propertyType === key);
    if (!intent) return;
    const operations = intent.operations.includes(operation)
      ? intent.operations.filter((op) => op !== operation)
      : [...intent.operations, operation];
    patchIntent(key, { operations });
  }

  return (
    <div className={styles.root}>
      <section className={styles.block}>
        <h3 className={styles.question}>
          Quels types de biens souhaitez-vous proposer ?
        </h3>
        <p className={styles.hint}>
          Déclaration indicative — la configuration finale est validée par
          Demeure Guinée.
        </p>
        <div className={styles.typeGrid}>
          {DECLARED_PROPERTY_TYPES.map((key) => {
            const Icon = TYPE_ICONS[key];
            const active = intents.some((intent) => intent.propertyType === key);
            return (
              <button
                key={key}
                type="button"
                className={`${styles.typeButton} ${active ? styles.typeButtonActive : ""}`}
                aria-pressed={active}
                onClick={() => toggleType(key)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{labelPropertyType(key)}</span>
                {active ? (
                  <Check size={14} className={styles.typeCheck} aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.block}>
        <h3 className={styles.question}>Vos biens déclarés</h3>
        {intents.length === 0 ? (
          <p className={styles.emptyHint}>
            Sélectionnez un type ci-dessus pour préciser les opérations et le
            volume correspondants.
          </p>
        ) : (
          <div className={styles.intentGrid}>
            {intents.map((intent) => {
              const Icon = TYPE_ICONS[intent.propertyType];
              const label = labelPropertyType(intent.propertyType);
              return (
                <article key={intent.propertyType} className={styles.intentCard}>
                  <header className={styles.intentHead}>
                    <span className={styles.intentTitle}>
                      <Icon size={16} aria-hidden="true" />
                      {label}
                    </span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => toggleType(intent.propertyType)}
                    >
                      <X size={13} aria-hidden="true" />
                      Retirer
                      <span className={styles.srOnly}> {label}</span>
                    </button>
                  </header>

                  <div className={styles.intentField}>
                    <span className={styles.fieldLabel}>Opérations</span>
                    <div className={styles.operationOptions}>
                      {OPERATION_OPTIONS.map(([value, optionLabel]) => {
                        const active = intent.operations.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`${styles.optionButton} ${active ? styles.optionButtonActive : ""}`}
                            aria-pressed={active}
                            onClick={() =>
                              toggleOperation(intent.propertyType, value)
                            }
                          >
                            <span className={styles.optionCheck} aria-hidden="true">
                              {active ? <Check size={11} /> : null}
                            </span>
                            {optionLabel}
                            <span className={styles.srOnly}> — {label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {showQuantity ? (
                    <div className={styles.intentField}>
                      <span className={styles.fieldLabel}>Quantité</span>
                      <div className={styles.quantityOptions}>
                        {QUANTITY_OPTIONS.map(([value, short, full]) => {
                          const active = intent.quantityRange === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              title={full}
                              className={`${styles.segButton} ${active ? styles.segButtonActive : ""}`}
                              aria-pressed={active}
                              onClick={() =>
                                patchIntent(intent.propertyType, {
                                  quantityRange: active ? null : value,
                                })
                              }
                            >
                              {short}
                              <span className={styles.srOnly}>
                                {" "}
                                {full} — {label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
