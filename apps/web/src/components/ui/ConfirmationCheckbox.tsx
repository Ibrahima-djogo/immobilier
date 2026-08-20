"use client";

import { type ReactNode } from "react";

import styles from "./ConfirmationCheckbox.module.css";

type ConfirmationGroupProps = {
  /** Titre de section, ex. « Confirmations ». */
  title?: string;
  children: ReactNode;
};

/**
 * Conteneur des lignes de confirmation.
 *
 * Il est requis : c'est lui qui donne aux règles `.group .row` une
 * spécificité supérieure aux styles génériques de formulaire
 * (`.form label { display: grid }`), qui sinon empilent la case
 * au-dessus de son texte.
 */
export function ConfirmationGroup({ title, children }: ConfirmationGroupProps) {
  return (
    <div className={styles.group}>
      {title ? <p className={styles.groupTitle}>{title}</p> : null}
      <div className={styles.rows}>{children}</div>
    </div>
  );
}

type ConfirmationCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  name?: string;
  disabled?: boolean;
  error?: string;
};

/** Ligne de confirmation compacte : case et texte sur la même ligne. */
export function ConfirmationCheckbox({
  checked,
  onChange,
  label,
  description,
  name,
  disabled,
  error,
}: ConfirmationCheckboxProps) {
  return (
    <label
      className={`${styles.row} ${error ? styles.rowError : ""} ${
        disabled ? styles.rowDisabled : ""
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.copy}>
        <span className={styles.text}>{label}</span>
        {description ? (
          <span className={styles.description}>{description}</span>
        ) : null}
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </span>
    </label>
  );
}
