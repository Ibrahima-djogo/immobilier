import type { ReactNode } from "react";

import styles from "./catalog.module.css";

type Props = {
  eyebrow?: string;
  title: string;
  extra?: ReactNode;
};

export function CatalogToolbar({
  eyebrow = "Résultats",
  title,
  extra,
}: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarCount}>
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      {extra ? <div className={styles.toolbarExtra}>{extra}</div> : null}
    </div>
  );
}
