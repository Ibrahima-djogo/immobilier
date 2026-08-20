"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import styles from "./DocumentPreviewLightbox.module.css";

type DocumentPreviewLightboxProps = {
  open: boolean;
  title: string;
  imageUrl: string | null;
  onClose: () => void;
};

export function DocumentPreviewLightbox({
  open,
  title,
  imageUrl,
  onClose,
}: DocumentPreviewLightboxProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !imageUrl || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className={styles.overlay}
        aria-label="Fermer l’aperçu"
        onClick={onClose}
      />
      <div className={styles.panel}>
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} />
      </div>
    </div>,
    document.body,
  );
}
