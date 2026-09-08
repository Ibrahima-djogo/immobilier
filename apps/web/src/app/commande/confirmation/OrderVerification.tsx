import {
  formatVerificationStatus,
  type MaterialOrderVerification,
} from "@/lib/commande/orders";

import styles from "./page.module.css";

type Props = {
  verification?: MaterialOrderVerification | null;
};

export function OrderVerification({ verification }: Props) {
  if (!verification) return null;

  return (
    <section className={styles.card}>
      <h2>Vérification</h2>
      <dl className={styles.meta}>
        <div>
          <dt>Vérification</dt>
          <dd>
            <span className={styles.badgeSuccess}>
              {formatVerificationStatus(verification.status)}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
