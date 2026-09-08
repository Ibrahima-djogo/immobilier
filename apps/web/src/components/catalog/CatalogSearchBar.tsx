"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui";

import styles from "./catalog.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  searching?: boolean;
  onOpenFilters?: () => void;
  filtersLabel?: string;
  extra?: ReactNode;
};

export function CatalogSearchBar({
  value,
  onChange,
  placeholder,
  label,
  searching = false,
  onOpenFilters,
  filtersLabel = "Filtres",
  extra,
}: Props) {
  return (
    <section aria-label={label}>
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <Search size={20} aria-hidden="true" />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={label}
          />
          {value ? (
            <button
              type="button"
              className={styles.clearSearch}
              aria-label="Effacer la recherche"
              onClick={() => onChange("")}
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </label>
        {onOpenFilters ? (
          <Button
            type="button"
            variant="secondary"
            className={`${styles.filterButton} ${styles.mobileOnly}`}
            onClick={onOpenFilters}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            {filtersLabel}
          </Button>
        ) : null}
        {extra}
      </div>
      {searching ? (
        <p className={styles.searchStatus} role="status">
          Recherche…
        </p>
      ) : null}
    </section>
  );
}
