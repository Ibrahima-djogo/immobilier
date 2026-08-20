import type { ReactNode } from "react";

import { displayValue } from "@/lib/property/display";

import styles from "./InfoField.module.css";

type InfoFieldProps = {
  label: string;
  value?: unknown;
  children?: ReactNode;
  full?: boolean;
  /** Si false, le champ n’est pas rendu (ex. chambres pour Terrain). */
  show?: boolean;
};

export function InfoField({
  label,
  value,
  children,
  full = false,
  show = true,
}: InfoFieldProps) {
  if (!show) return null;
  return (
    <div className={full ? `${styles.field} ${styles.full}` : styles.field}>
      <span className={styles.label}>{label}</span>
      {children != null ? (
        <div className={styles.value}>{children}</div>
      ) : (
        <strong className={styles.value}>{displayValue(value)}</strong>
      )}
    </div>
  );
}

type InfoGridProps = {
  children: ReactNode;
  className?: string;
};

export function InfoGrid({ children, className = "" }: InfoGridProps) {
  return (
    <div className={className ? `${styles.grid} ${className}` : styles.grid}>
      {children}
    </div>
  );
}
