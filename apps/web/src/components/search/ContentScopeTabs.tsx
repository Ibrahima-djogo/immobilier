"use client";

import { BrickWall, Building2, LandPlot, LayoutGrid } from "lucide-react";

import {
  applyContentScope,
  CONTENT_SCOPES,
  type ContentScope,
} from "@/lib/search/content-scope";

import styles from "@/app/(public)/(site)/annonces/page.module.css";

const ICONS: Record<ContentScope, typeof LayoutGrid> = {
  tous: LayoutGrid,
  biens: Building2,
  terrains: LandPlot,
  materiaux: BrickWall,
};

type Props = {
  scope: ContentScope;
  searchParams: URLSearchParams;
  onChange: (params: URLSearchParams) => void;
};

export function ContentScopeTabs({ scope, searchParams, onChange }: Props) {
  return (
    <div className={styles.contentScope} role="tablist" aria-label="Type de contenu">
      {CONTENT_SCOPES.map((item) => {
        const Icon = ICONS[item.value];
        const active = scope === item.value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? styles.contentScopeActive : styles.contentScopeTab}
            onClick={() => onChange(applyContentScope(searchParams, item.value))}
          >
            <Icon size={15} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
