"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";

import type { PublicCatalog } from "@/lib/materiaux/types";
import { materialLocation, uniqueMaterialValues } from "@/lib/materiaux/catalog";

import { MaterialsListingConfig } from "./listing-configs";
import styles from "./listingSearch.module.css";

type Props = {
  catalog: PublicCatalog;
  values: {
    q: string;
    localisation: string;
  };
  onSubmit: (next: Props["values"]) => void;
};

export function MaterialsListingSearch({ catalog, values, onSubmit }: Props) {
  const [draft, setDraft] = useState(values);

  useEffect(() => {
    setDraft(values);
  }, [values]);

  const locations = uniqueMaterialValues(catalog.materials, materialLocation);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(draft);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.searchForm} ${styles.searchFormCompact}`}
      aria-label={MaterialsListingConfig.searchLabel}
    >
      <div className={styles.searchField}>
        <label htmlFor="materials-search-q">Mot-clé</label>
        <div className={styles.searchControl}>
          <Search size={18} aria-hidden="true" />
          <input
            id="materials-search-q"
            type="search"
            placeholder="Ex. ciment, fer à béton, peinture…"
            value={draft.q}
            onChange={(event) =>
              setDraft((current) => ({ ...current, q: event.target.value }))
            }
          />
        </div>
      </div>

      <div className={`${styles.searchField} ${styles.mainLocationField}`}>
        <label htmlFor="materials-search-location">Localisation</label>
        <div className={styles.searchControl}>
          <MapPin size={18} aria-hidden="true" />
          {locations.length > 0 ? (
            <select
              id="materials-search-location"
              value={draft.localisation}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  localisation: event.target.value,
                }))
              }
            >
              <option value="tous">Toutes les localisations</option>
              {locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="materials-search-location"
              type="text"
              placeholder="Ville ou quartier"
              value={draft.localisation === "tous" ? "" : draft.localisation}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  localisation: event.target.value,
                }))
              }
            />
          )}
          {locations.length > 0 ? (
            <ChevronDown className={styles.searchChevron} size={16} aria-hidden="true" />
          ) : null}
        </div>
      </div>

      <button type="submit" className={styles.searchButton}>
        <Search size={19} aria-hidden="true" />
        Rechercher
      </button>
    </form>
  );
}
