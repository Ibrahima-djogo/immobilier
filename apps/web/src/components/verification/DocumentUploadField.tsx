"use client";

import {
  Eye,
  FileText,
  Image as ImageIcon,
  Replace,
  Trash2,
  Upload,
} from "lucide-react";
import { useId, useRef, useState } from "react";

import {
  formatMaxFileSizeLabel,
  isAllowedDocMime,
  isAllowedImageMime,
  VERIFICATION_MAX_FILE_BYTES,
} from "@/lib/demo-api/verification-limits";
import { extensionOf, validateUploadFile } from "@/lib/validation";
import styles from "./DocumentUploadField.module.css";

export type UploadedDocPreview = {
  id?: string;
  fileName: string;
  fileUrl: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

type DocumentUploadFieldProps = {
  title: string;
  description: string;
  required?: boolean;
  optionalLabel?: boolean;
  acceptImagesOnly?: boolean;
  value: UploadedDocPreview | null;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void> | void;
  onView?: () => void;
};

function formatBytes(size: number | null | undefined): string {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function isPdf(mime?: string | null, name?: string): boolean {
  if (mime === "application/pdf") return true;
  return Boolean(name?.toLowerCase().endsWith(".pdf"));
}

/** Les aperçus locaux sont des data URL, les documents stockés des chemins API. */
function resolveDocUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http") || fileUrl.startsWith("data:")) return fileUrl;
  return `${process.env.NEXT_PUBLIC_DEMO_API_URL || "http://localhost:4000"}${fileUrl}`;
}

/**
 * Zone d’upload documentaire (KYC) — image / PDF selon acceptImagesOnly.
 */
export function DocumentUploadField({
  title,
  description,
  required = false,
  optionalLabel = false,
  acceptImagesOnly = false,
  value,
  disabled,
  onUpload,
  onRemove,
  onView,
}: DocumentUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const accept = acceptImagesOnly
    ? "image/jpeg,image/png"
    : "image/jpeg,image/png,application/pdf";

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setLocalError("");

    const uploadError = validateUploadFile(
      file,
      acceptImagesOnly ? "image" : "document",
    );
    if (uploadError) {
      setLocalError(uploadError);
      return;
    }
    if (acceptImagesOnly && extensionOf(file.name) === ".webp") {
      setLocalError("Format non accepté. Utilisez JPG ou PNG.");
      return;
    }
    const mimeOk = acceptImagesOnly
      ? isAllowedImageMime(file.type) && file.type !== "image/webp"
      : isAllowedDocMime(file.type);
    if (!mimeOk || file.size > VERIFICATION_MAX_FILE_BYTES) {
      setLocalError(
        file.size > VERIFICATION_MAX_FILE_BYTES
          ? `Le fichier dépasse la taille maximale autorisée (${formatMaxFileSizeLabel()}).`
          : acceptImagesOnly
            ? "Format non accepté. Utilisez JPG ou PNG."
            : "Format non accepté. Utilisez JPG, PNG ou PDF.",
      );
      return;
    }

    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : "Impossible d’envoyer ce document. Réessayez.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const hasFile = Boolean(value?.fileName);
  const previewIsImage =
    hasFile &&
    !isPdf(value?.mimeType, value?.fileName) &&
    Boolean(value?.fileUrl);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3>
            {title}
            {required ? <small className={styles.required}>obligatoire</small> : null}
            {optionalLabel ? (
              <small className={styles.optional}>facultatif</small>
            ) : null}
          </h3>
          <p>{description}</p>
        </div>
      </div>

      {!hasFile ? (
        <label
          className={`${styles.dropzone} ${busy ? styles.dropzoneBusy : ""} ${dragging ? styles.dropzoneActive : ""}`}
          htmlFor={inputId}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            if (disabled || busy) return;
            void handleFiles(e.dataTransfer.files);
          }}
        >
          <span className={styles.dropIcon} aria-hidden="true">
            <Upload size={20} />
          </span>
          <strong>Déposez votre fichier ici</strong>
          <span>ou cliquez pour choisir un fichier</span>
          <small>
            {acceptImagesOnly ? "JPG, PNG" : "JPG, PNG ou PDF"} · max{" "}
            {formatMaxFileSizeLabel()}
          </small>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={accept}
            className={styles.hiddenInput}
            disabled={disabled || busy}
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </label>
      ) : (
        <div className={styles.preview}>
          <div className={styles.previewMain}>
            {previewIsImage && value?.fileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveDocUrl(value.fileUrl)}
                alt=""
                className={styles.thumb}
              />
            ) : (
              <span className={styles.fileIcon} aria-hidden="true">
                {isPdf(value?.mimeType, value?.fileName) ? (
                  <FileText size={22} />
                ) : (
                  <ImageIcon size={22} />
                )}
              </span>
            )}
            <div className={styles.previewCopy}>
              <strong>{value?.fileName}</strong>
              <span>
                Fichier ajouté
                {value?.fileSize ? ` · ${formatBytes(value.fileSize)}` : ""}
              </span>
            </div>
          </div>
          <div className={styles.previewActions}>
            {onView || value?.fileUrl ? (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => {
                  if (onView) onView();
                  else if (value?.fileUrl) {
                    window.open(
                      resolveDocUrl(value.fileUrl),
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }
                }}
                aria-label="Voir le document"
                title="Voir"
              >
                <Eye size={16} />
              </button>
            ) : null}
            <button
              type="button"
              className={styles.iconBtn}
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              aria-label="Remplacer le document"
              title="Remplacer"
            >
              <Replace size={16} />
            </button>
            {onRemove ? (
              <button
                type="button"
                className={styles.iconBtnDanger}
                disabled={disabled || busy}
                onClick={() => void onRemove()}
                aria-label="Supprimer le document"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
          <input
            id={`${inputId}-replace`}
            ref={inputRef}
            type="file"
            accept={accept}
            className={styles.hiddenInput}
            disabled={disabled || busy}
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>
      )}

      {localError ? (
        <p className={styles.error} role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
