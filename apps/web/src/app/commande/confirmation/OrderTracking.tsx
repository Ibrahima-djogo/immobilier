import { StatusBadge } from "@/components/ui";
import {
  formatOrderDate,
  formatOrderStatus,
  type MaterialOrderStatusHistory,
} from "@/lib/commande/orders";

import styles from "./page.module.css";

type Props = {
  history?: MaterialOrderStatusHistory[];
};

export function OrderTracking({ history = [] }: Props) {
  if (history.length === 0) return null;

  return (
    <section className={`${styles.card} ${styles.lightCard}`}>
      <h2>Suivi</h2>
      <ol className={styles.timeline}>
        {history.map((entry, index) => (
          <li key={`${entry.status}-${entry.changedAt}-${index}`}>
            <StatusBadge
              status={entry.status}
              label={formatOrderStatus(entry.status)}
            />
            <span>
              {entry.changedAt ? formatOrderDate(entry.changedAt) : ""}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
