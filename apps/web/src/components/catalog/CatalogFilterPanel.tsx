import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./catalog.module.css";

type Props = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function CatalogFilterPanel({
  title = "Filtres",
  eyebrow = "Recherche avancée",
  children,
}: Props) {
  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterPanelHead}>
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <SlidersHorizontal size={20} aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}
