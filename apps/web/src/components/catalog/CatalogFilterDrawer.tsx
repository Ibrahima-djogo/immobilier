"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import styles from "./catalog.module.css";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function CatalogFilterDrawer({
  open,
  title = "Filtres",
  onClose,
  children,
  footer,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.drawer} role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className={styles.overlay}
        aria-label="Fermer les filtres"
        onClick={onClose}
      />
      <aside className={styles.drawerPanel}>
        <div className={styles.drawerHead}>
          <h2>{title}</h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Fermer"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
        {footer}
      </aside>
    </div>
  );
}
