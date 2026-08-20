import type { ReactNode } from "react";

import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty} role="status">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
