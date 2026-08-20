"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

import {
  formatAccessCountLabel,
  formatPermissionLabel,
  isAllPermissions,
} from "@/lib/ui/permissions";

import { PermissionBadge } from "./PermissionBadge";
import styles from "./PermissionSummary.module.css";

type PermissionSummaryProps = {
  permissions: string[];
  maxVisible?: number;
  variant?: "chips" | "count";
  name?: string;
  role?: string;
  onEdit?: () => void;
};

export function PermissionSummary({
  permissions,
  maxVisible = 2,
  variant = "chips",
  name,
  role,
  onEdit,
}: PermissionSummaryProps) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function placePanel() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
      left: "auto",
    });
  }

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
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open]);

  if (variant === "count") {
    const all = role === "SUPER_ADMIN" || isAllPermissions(permissions);
    const listed = all ? ["TOUTES"] : permissions;
    const label = formatAccessCountLabel(permissions, role);

    return (
      <div className={styles.countWrap} ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          className={`${styles.count} ${all ? styles.countAll : ""}`}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          title={label}
          onClick={() => {
            placePanel();
            setOpen((value) => !value);
          }}
        >
          {label}
        </button>
        {open ? (
          <div
            id={panelId}
            className={`${styles.popover} ${styles.popoverFixed}`}
            role="dialog"
            style={panelStyle}
          >
            <strong>
              Permissions{name ? ` — ${name}` : ""}
            </strong>
            {listed.length === 0 ? (
              <p className={styles.empty}>Aucune permission</p>
            ) : (
              <ul className={styles.countList}>
                {listed.map((permission) => (
                  <li key={permission}>
                    <Check size={14} aria-hidden="true" />
                    <span>{formatPermissionLabel(permission)}</span>
                  </li>
                ))}
              </ul>
            )}
            {onEdit ? (
              <button
                type="button"
                className={styles.edit}
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                Modifier les permissions
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (permissions.length === 0) {
    return <span className={styles.empty}>Aucune</span>;
  }

  if (isAllPermissions(permissions)) {
    return (
      <div className={styles.wrap}>
        <PermissionBadge permission="TOUTES" />
      </div>
    );
  }

  const visible = permissions.slice(0, maxVisible);
  const rest = permissions.slice(maxVisible);

  return (
    <div className={styles.wrap} ref={rootRef}>
      {visible.map((permission) => (
        <PermissionBadge key={permission} permission={permission} />
      ))}
      {rest.length > 0 ? (
        <button
          type="button"
          className={styles.more}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          aria-label={`Voir ${rest.length} permission(s) supplémentaire(s)`}
          title={`Voir ${rest.length} permission(s) supplémentaire(s)`}
          onClick={() => setOpen((value) => !value)}
        >
          +{rest.length}
        </button>
      ) : null}
      {open && rest.length > 0 ? (
        <div id={panelId} className={styles.popover} role="dialog">
          <strong>Autres permissions</strong>
          <ul>
            {rest.map((permission) => (
              <li key={permission}>
                <PermissionBadge permission={permission} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
