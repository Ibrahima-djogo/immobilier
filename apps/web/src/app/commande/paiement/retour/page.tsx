import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountCheckoutShell } from "../../AccountCheckoutShell";
import confirmationStyles from "../../confirmation/page.module.css";
import { PaymentReturnView } from "./PaymentReturnView";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Retour de paiement | Demeure Guinée",
  description: "Vérification du paiement de votre commande de matériaux.",
};

export default function CheckoutPaymentReturnPage() {
  return (
    <AccountCheckoutShell
      active="commandes"
      eyebrow="Commande matériaux"
      title="Vérification du paiement"
      description="Le statut Payée n’est appliqué qu’après confirmation du prestataire."
      icon="package-check"
    >
      <Suspense
        fallback={
          <p className={confirmationStyles.status} role="status">
            Vérification du paiement…
          </p>
        }
      >
        <PaymentReturnView />
      </Suspense>
    </AccountCheckoutShell>
  );
}
