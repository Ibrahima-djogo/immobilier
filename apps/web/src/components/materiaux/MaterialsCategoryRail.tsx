"use client";

import { useMemo, useState } from "react";

import type { PublicCatalog } from "@/lib/materiaux/types";

import styles from "./MaterialsCategoryRail.module.css";

const VISIBLE_COUNT = 8;

type MaterialsCategoryRailProps = {
  catalog: PublicCatalog;
  activeSlug: string;
  onSelect: (slug: string) => void;
};

export function MaterialsCategoryRail({
  catalog,
  activeSlug,
  onSelect,
}: MaterialsCategoryRailProps) {
  const [expanded, setExpanded] = useState(false);

  const ranked = useMemo(() => {
    return catalog.categories
      .map((category) => ({
        ...category,
        count: catalog.materials.filter(
          (item) => item.categorySlug === category.slug,
        ).length,
      }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.name.localeCompare(right.name, "fr"),
      );
  }, [catalog.categories, catalog.materials]);

  const visible = expanded ? ranked : ranked.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, ranked.length - VISIBLE_COUNT);

  if (ranked.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="materials-popular-categories">
      <div className={styles.heading}>
        <h2 id="materials-popular-categories">Catégories</h2>
        {hiddenCount > 0 ? (
          <button
            type="button"
            className={styles.more}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Réduire" : "Voir toutes"}
          </button>
        ) : null}
      </div>
      <div className={styles.rail} role="list">
        <button
          type="button"
          role="listitem"
          className={`${styles.chip}${activeSlug === "tous" || !activeSlug ? ` ${styles.active}` : ""}`}
          onClick={() => onSelect("tous")}
        >
          Toutes
        </button>
        {visible.map((category) => {
          const active = activeSlug === category.slug;
          return (
            <button
              key={category.slug}
              type="button"
              role="listitem"
              className={`${styles.chip}${active ? ` ${styles.active}` : ""}`}
              onClick={() => onSelect(category.slug)}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
