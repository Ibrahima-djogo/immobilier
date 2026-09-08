import { FONCIERE_VERIFICATION_STATUS_LABELS } from "@/lib/verification-fonciere/constants";
import {
  formatFonciereDateTime,
  sortedFonciereHistory,
} from "@/lib/verification-fonciere/display";
import type { VerificationHistoryItem } from "@/lib/verification-fonciere/types";

import styles from "./FonciereHistory.module.css";

type Props = {
  history?: VerificationHistoryItem[];
};

export function FonciereHistory({ history }: Props) {
  const items = sortedFonciereHistory(history);

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Aucun historique n’est encore disponible pour ce dossier.
      </p>
    );
  }

  return (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <p className={styles.status}>
            {FONCIERE_VERIFICATION_STATUS_LABELS[item.status]}
          </p>
          <p className={styles.message}>{item.message}</p>
          <p className={styles.meta}>
            <time dateTime={item.createdAt}>
              {formatFonciereDateTime(item.createdAt)}
            </time>
            <span>{item.createdBy || "—"}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}
