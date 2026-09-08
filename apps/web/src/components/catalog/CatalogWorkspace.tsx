import type { ReactNode } from "react";

import styles from "./catalog.module.css";

type Props = {
  filters: ReactNode;
  children: ReactNode;
};

export function CatalogWorkspace({ filters, children }: Props) {
  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>{filters}</aside>
      <div className={styles.results}>{children}</div>
    </div>
  );
}
