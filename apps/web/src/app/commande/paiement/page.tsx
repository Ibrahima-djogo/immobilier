import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountCheckoutShell } from "../AccountCheckoutShell";
import { PaymentView } from "./PaymentView";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Paiement de votre commande | Demeure Guinée",
  description: "Choisissez votre moyen de paiement.",
};

export default function CheckoutPaymentPage() {
  return (
    <AccountCheckoutShell
      active="commandes"
      eyebrow="Commande matériaux"
      title="Paiement de votre commande"
      description="Choisissez votre moyen de paiement"
      icon="package-check"
    >
      <Suspense
        fallback={
          <p className={styles.status} role="status">
            Chargement du paiement…
          </p>
        }
      >
        <PaymentView />
      </Suspense>
    </AccountCheckoutShell>
  );
}
