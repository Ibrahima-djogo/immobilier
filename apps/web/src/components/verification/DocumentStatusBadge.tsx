"use client";

import { AlertCircle, CheckCircle2, CircleDashed, Info } from "lucide-react";

import styles from "./DocumentStatusBadge.module.css";

export type DocCardStatus =
  | "A_FOURNIR"
  | "INCOMPLET"
  | "COMPLET"
  | "FACULTATIF"
  | "A_CORRIGER";

const LABELS: Record<DocCardStatus, string> = {
  A_FOURNIR: "À fournir",
  INCOMPLET: "Incomplet",
  COMPLET: "Complet",
  FACULTATIF: "Facultatif",
  A_CORRIGER: "À corriger",
};

type DocumentStatusBadgeProps = {
  status: DocCardStatus;
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const Icon =
    status === "COMPLET"
      ? CheckCircle2
      : status === "INCOMPLET" || status === "A_CORRIGER"
        ? AlertCircle
        : status === "FACULTATIF"
          ? Info
          : CircleDashed;

  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <Icon size={13} aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}
