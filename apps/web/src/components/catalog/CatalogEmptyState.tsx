import { Search } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./catalog.module.css";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function CatalogEmptyState({ title, description, action }: Props) {
  return (
    <div className={styles.empty} role="status">
      <div className={styles.emptyIcon}>
        <Search size={22} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
