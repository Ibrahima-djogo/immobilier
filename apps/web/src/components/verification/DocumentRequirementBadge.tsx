"use client";

import styles from "./DocumentRequirementBadge.module.css";

export type RequirementBadgeKind =
  | "OBLIGATOIRE"
  | "FACULTATIF"
  | "CONDITIONNEL";

type DocumentRequirementBadgeProps = {
  kind: RequirementBadgeKind;
};

export function DocumentRequirementBadge({
  kind,
}: DocumentRequirementBadgeProps) {
  return <span className={`${styles.badge} ${styles[kind]}`}>{kind}</span>;
}
