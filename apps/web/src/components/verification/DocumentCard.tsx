"use client";

import { Eye, FileText, Image as ImageIcon, Pencil, Plus } from "lucide-react";

import {
  DocumentRequirementBadge,
  type RequirementBadgeKind,
} from "./DocumentRequirementBadge";
import {
  DocumentStatusBadge,
  type DocCardStatus,
} from "./DocumentStatusBadge";
import styles from "./DocumentCard.module.css";

export type DocumentCardLine = {
  label: string;
  value?: string;
  ok?: boolean;
};

type DocumentCardProps = {
  title: string;
  subtitle?: string;
  reason?: string;
  requirement?: RequirementBadgeKind;
  status: DocCardStatus;
  lines?: DocumentCardLine[];
  thumbnailUrl?: string | null;
  thumbnailIsPdf?: boolean;
  fileHint?: string | null;
  onAdd?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  canView?: boolean;
  correctionReason?: string | null;
};

export function DocumentCard({
  title,
  subtitle,
  reason,
  requirement,
  status,
  lines = [],
  thumbnailUrl,
  thumbnailIsPdf,
  fileHint,
  onAdd,
  onEdit,
  onView,
  canView,
  correctionReason,
}: DocumentCardProps) {
  const primaryMissing =
    status === "A_FOURNIR" ||
    (status === "FACULTATIF" && !lines.some((l) => l.ok));
  const actionLabel = primaryMissing
    ? "Ajouter"
    : status === "A_CORRIGER"
      ? "Remplacer"
      : "Modifier";
  const actionHandler = primaryMissing ? onAdd || onEdit : onEdit || onAdd;

  return (
    <article
      className={`${styles.card}${status === "A_CORRIGER" ? ` ${styles.needsCorrection}` : ""}`}
    >
      <header className={styles.head}>
        <div className={styles.headCopy}>
          <div className={styles.titleRow}>
            <h3>{title}</h3>
            {requirement ? (
              <DocumentRequirementBadge kind={requirement} />
            ) : null}
          </div>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          {reason ? <p className={styles.reason}>{reason}</p> : null}
          {correctionReason ? (
            <p className={styles.correctionReason}>{correctionReason}</p>
          ) : null}
        </div>
        <DocumentStatusBadge status={status} />
      </header>

      {(thumbnailUrl || fileHint || thumbnailIsPdf) && (
        <div className={styles.previewRow}>
          {thumbnailUrl && !thumbnailIsPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className={styles.thumb} />
          ) : (
            <span className={styles.fileIcon} aria-hidden="true">
              {thumbnailIsPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
            </span>
          )}
          {fileHint ? <span className={styles.fileHint}>{fileHint}</span> : null}
        </div>
      )}

      {lines.length > 0 ? (
        <ul className={styles.lines}>
          {lines.map((line) => (
            <li key={`${line.label}-${line.value || ""}`}>
              <span className={styles.lineLabel}>{line.label}</span>
              <span
                className={
                  line.ok === true
                    ? styles.lineOk
                    : line.ok === false
                      ? styles.lineMissing
                      : styles.lineValue
                }
              >
                {line.ok === true
                  ? `✓ ${line.value || "ajouté"}`
                  : line.ok === false
                    ? line.value && line.value !== "ajouté"
                      ? line.value
                      : "manquant"
                    : line.value || "—"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className={styles.actions}>
        {canView && onView ? (
          <button type="button" className={styles.ghostBtn} onClick={onView}>
            <Eye size={14} aria-hidden="true" />
            Voir
          </button>
        ) : (
          <span />
        )}
        {actionHandler ? (
          <button
            type="button"
            className={styles.mainBtn}
            onClick={actionHandler}
          >
            {primaryMissing ? (
              <Plus size={14} aria-hidden="true" />
            ) : (
              <Pencil size={14} aria-hidden="true" />
            )}
            {actionLabel}
          </button>
        ) : null}
      </footer>
    </article>
  );
}

export function shortenFileName(name: string, max = 22): string {
  if (!name) return "";
  if (name.length <= max) return name;
  const extIdx = name.lastIndexOf(".");
  const ext = extIdx > 0 ? name.slice(extIdx) : "";
  const base = name.slice(0, Math.max(8, max - ext.length - 1));
  return `${base}…${ext}`;
}

export function maskDocumentNumber(value: string): string {
  const v = value.trim();
  if (!v) return "—";
  if (v.length <= 4) return v;
  return `${"•".repeat(Math.min(6, v.length - 4))}${v.slice(-4)}`;
}
