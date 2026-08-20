"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import styles from "./RowOverflowMenu.module.css";

export type RowMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger" | "ok";
};

type RowOverflowMenuProps = {
  label: string;
  items: RowMenuItem[];
};

export function RowOverflowMenu({ label, items }: RowOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={17} aria-hidden="true" />
      </button>
      {open ? (
        <ul id={menuId} className={styles.menu} role="menu">
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={
                  item.tone === "danger"
                    ? styles.danger
                    : item.tone === "ok"
                      ? styles.ok
                      : undefined
                }
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
