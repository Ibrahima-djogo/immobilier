import type { ReactNode } from "react";

import styles from "./PublicationPanel.module.css";

export type PublicationTone =
  | "published"
  | "pending"
  | "rejected"
  | "draft"
  | "none";

export const publicationActionClasses = {
  secondary: styles.secondary,
  primary: styles.primary,
  danger: styles.danger,
} as const;

type PublicationPanelProps = {
  label: string;
  tone: PublicationTone;
  note?: string | null;
  noteLabel?: string;
  children?: ReactNode;
};

export function PublicationPanel({
  label,
  tone,
  note,
  noteLabel = "Motif",
  children,
}: PublicationPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>Publication</span>
        <span className={styles.status} data-tone={tone}>
          {label}
        </span>
      </div>
      {note ? (
        <p className={styles.note}>
          <span className={styles.noteLabel}>{noteLabel}</span>
          {note}
        </p>
      ) : null}
      <div className={styles.actions}>{children}</div>
    </div>
  );
}
