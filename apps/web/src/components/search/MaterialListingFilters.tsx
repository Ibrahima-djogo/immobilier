"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { PublicCatalog } from "@/lib/materiaux/types";
import styles from "@/app/(public)/(site)/annonces/page.module.css";

type Props = {
  idPrefix: string;
  catalog: PublicCatalog | null;
};

type Draft = {
  query: string;
  famille: string;
  dispo: string;
  prixMin: string;
  prixMax: string;
};

function draftFromParams(searchParams: URLSearchParams): Draft {
  return {
    query: searchParams.get("q") || "",
    famille: searchParams.get("famille") || "",
    dispo: searchParams.get("dispo") || "",
    prixMin: searchParams.get("prixMin") || "",
    prixMax: searchParams.get("prixMax") || searchParams.get("budget") || "",
  };
}

export function MaterialListingFilters({ idPrefix, catalog }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<Draft>(() =>
    draftFromParams(new URLSearchParams(searchParams.toString())),
  );
  const skipDebounce = useRef(true);

  const debouncedQuery = useDebouncedValue(draft.query, 300);
  const debouncedPrixMin = useDebouncedValue(draft.prixMin, 300);
  const debouncedPrixMax = useDebouncedValue(draft.prixMax, 300);

  useEffect(() => {
    setDraft(draftFromParams(new URLSearchParams(searchParams.toString())));
    skipDebounce.current = true;
  }, [searchParams]);

  const commit = useCallback(
    (next: Draft) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("contenu", "materiaux");
      if (next.query.trim()) params.set("q", next.query.trim());
      else params.delete("q");
      if (next.famille) params.set("famille", next.famille);
      else params.delete("famille");
      if (next.dispo) params.set("dispo", next.dispo);
      else params.delete("dispo");
      if (next.prixMin) params.set("prixMin", next.prixMin);
      else params.delete("prixMin");
      if (next.prixMax) {
        params.set("prixMax", next.prixMax);
        params.delete("budget");
      } else {
        params.delete("prixMax");
        params.delete("budget");
      }
      params.set("page", "1");
      const qs = params.toString();
      router.replace(qs ? `/annonces?${qs}` : "/annonces?contenu=materiaux", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      return;
    }
    commit({
      ...draft,
      query: debouncedQuery,
      prixMin: debouncedPrixMin,
      prixMax: debouncedPrixMax,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when debounced fields settle
  }, [debouncedQuery, debouncedPrixMin, debouncedPrixMax]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        commit(draft);
      }}
    >
      <fieldset className={styles.filterGroup}>
        <legend>Recherche</legend>
        <div className={styles.filterField}>
          <label htmlFor={`${idPrefix}-material-q`}>Matériau</label>
          <input
            id={`${idPrefix}-material-q`}
            type="search"
            value={draft.query}
            placeholder="Ex. ciment, fer, peinture…"
            onChange={(event) =>
              setDraft((current) => ({ ...current, query: event.target.value }))
            }
          />
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Catégorie</legend>
        <div className={styles.filterField}>
          <label htmlFor={`${idPrefix}-famille`}>Famille</label>
          <select
            id={`${idPrefix}-famille`}
            value={draft.famille}
            onChange={(event) => {
              const next = { ...draft, famille: event.target.value };
              setDraft(next);
              commit(next);
            }}
          >
            <option value="">Toutes les catégories</option>
            {(catalog?.categories || []).map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Disponibilité</legend>
        <div className={styles.filterField}>
          <select
            id={`${idPrefix}-dispo`}
            aria-label="Disponibilité"
            value={draft.dispo}
            onChange={(event) => {
              const next = { ...draft, dispo: event.target.value };
              setDraft(next);
              commit(next);
            }}
          >
            <option value="">Toutes</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="STOCK_FAIBLE">Stock faible</option>
            <option value="RUPTURE">Rupture</option>
          </select>
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Prix (GNF)</legend>
        <div className={styles.priceGrid}>
          <div className={styles.filterField}>
            <label htmlFor={`${idPrefix}-mat-min`}>Minimum</label>
            <input
              id={`${idPrefix}-mat-min`}
              type="number"
              min="0"
              value={draft.prixMin}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  prixMin: event.target.value,
                }))
              }
            />
          </div>
          <div className={styles.filterField}>
            <label htmlFor={`${idPrefix}-mat-max`}>Maximum</label>
            <input
              id={`${idPrefix}-mat-max`}
              type="number"
              min="0"
              value={draft.prixMax}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  prixMax: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </fieldset>
    </form>
  );
}
