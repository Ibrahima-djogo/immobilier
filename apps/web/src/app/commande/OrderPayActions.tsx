"use client";

import { Button } from "@/components/ui";
import {
  canPayOrder,
  isDeliveryFeePending,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { routes } from "@/lib/routes/app-routes";

import styles from "./confirmation/page.module.css";

type Props = {
  order: MaterialOrder;
  accessToken?: string;
};

export function OrderPayActions({ order, accessToken }: Props) {
  if (order.status === "PAYEE") return null;
  if (isDeliveryFeePending(order)) {
    return (
      <p className={styles.note} role="status">
        Les frais de livraison doivent encore être confirmés.
      </p>
    );
  }
  if (!canPayOrder(order)) return null;
  return (
    <section className={styles.card}>
      <h2>Paiement</h2>
      <p className={styles.note}>Réglez votre commande pour lancer le traitement.</p>
      <Button href={routes.checkoutPay(order.id, accessToken)} fullWidth>
        Procéder au paiement
      </Button>
    </section>
  );
}
