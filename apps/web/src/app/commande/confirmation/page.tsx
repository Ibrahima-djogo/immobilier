import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountCheckoutShell } from "../AccountCheckoutShell";
import { OrderConfirmationView } from "./OrderConfirmationView";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Commande confirmée | Demeure Guinée",
  description:
    "Votre demande de commande de matériaux a bien été enregistrée.",
};

type ConfirmationPageProps = {
  searchParams: Promise<{ commande?: string; id?: string }>;
};

export default async function CheckoutConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const orderId = String(params.commande || params.id || "").trim();

  return (
    <AccountCheckoutShell
      active="commandes"
      eyebrow="Commande matériaux"
      title="Commande confirmée"
      description="Votre demande de commande a bien été enregistrée."
      icon="package-check"
    >
      <Suspense
        fallback={
          <p className={styles.status} role="status">
            Chargement de votre commande…
          </p>
        }
      >
        <OrderConfirmationView orderId={orderId} />
      </Suspense>
    </AccountCheckoutShell>
  );
}
