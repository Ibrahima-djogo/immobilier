"use client";

import {
  formatScopeOperations,
  type PropertyScope,
} from "@/lib/demo-api/account-scope";
import { labelPropertyType } from "@/lib/property/typeFields";
import styles from "./AccountScopeBanner.module.css";

type AccountScopeBannerProps = {
  allowedPropertyScopes: PropertyScope[];
  loading?: boolean;
  error?: string | null;
  onRequestExtension: () => void;
};

export function AccountScopeBanner({
  allowedPropertyScopes,
  loading,
  error,
  onRequestExtension,
}: AccountScopeBannerProps) {
  if (loading) {
    return (
      <section className={styles.banner} aria-busy="true">
        <p className={styles.muted}>Chargement de la configuration du compte…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.banner} data-tone="warn" role="status">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Périmètre du compte</p>
          <p className={styles.text}>{error}</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onRequestExtension}
          >
            Demander une extension
          </button>
        </div>
      </section>
    );
  }

  if (!allowedPropertyScopes.length) return null;

  return (
    <section className={styles.banner} aria-live="polite">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Périmètre du compte</p>
        <ul className={styles.scopeList}>
          {allowedPropertyScopes.map((scope) => (
            <li key={scope.propertyType} className={styles.scopeItem}>
              <strong>{labelPropertyType(scope.propertyType)}</strong>
              <span>{formatScopeOperations(scope.operations)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={onRequestExtension}
        >
          Demander une extension
        </button>
      </div>
    </section>
  );
}
