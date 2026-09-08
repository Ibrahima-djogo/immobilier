import type { ReactNode } from "react";

import styles from "./catalog.module.css";

type Props = {
  view?: "grid" | "list";
  children: ReactNode;
};

export function CatalogResultGrid({ view = "grid", children }: Props) {
  return (
    <div className={view === "list" ? styles.list : styles.grid}>{children}</div>
  );
}
