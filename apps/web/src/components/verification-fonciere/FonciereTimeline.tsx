import { Check } from "lucide-react";

import {
  fonciereHistoryTitle,
  formatFonciereDateTime,
  sortedFonciereHistory,
} from "@/lib/verification-fonciere/display";
import type { VerificationHistoryItem } from "@/lib/verification-fonciere/types";

import styles from "./FonciereTimeline.module.css";

type Props = {
  history?: VerificationHistoryItem[];
};

export function FonciereTimeline({ history }: Props) {
  const items = sortedFonciereHistory(history);

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Aucune étape n’est encore enregistrée pour ce dossier.
      </p>
    );
  }

  return (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <span className={styles.marker} aria-hidden="true">
            <Check size={12} strokeWidth={2.6} />
          </span>
          <div className={styles.content}>
            <strong>{fonciereHistoryTitle(item)}</strong>
            <time dateTime={item.createdAt}>
              {formatFonciereDateTime(item.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
