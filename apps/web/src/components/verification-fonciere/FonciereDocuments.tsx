import type { VerificationDocument } from "@/lib/verification-fonciere/types";

import { FonciereDocumentStatusBadge } from "./FonciereStatusBadge";
import styles from "./FonciereDocuments.module.css";

type Props = {
  documents?: VerificationDocument[];
};

export function FonciereDocuments({ documents }: Props) {
  const items = documents ?? [];

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Aucun document n’est associé à ce dossier pour le moment.
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {items.map((document) => (
        <li key={document.id} className={styles.item}>
          <div>
            <strong>{document.name}</strong>
            <span>{document.type}</span>
          </div>
          <FonciereDocumentStatusBadge status={document.status} />
        </li>
      ))}
    </ul>
  );
}
