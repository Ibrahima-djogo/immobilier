"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import {
  canChooseStorePayment,
  canPayOrder,
  chooseMaterialOrderPaymentIntent,
  formatDeliveryMode,
  formatPaymentIntent,
  isDeliveryFeePending,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import { OrderPayActions } from "./OrderPayActions";
import styles from "./confirmation/page.module.css";

type Props = {
  order: MaterialOrder;
  accessToken?: string;
  onOrderChange?: (order: MaterialOrder) => void;
  skipStandalonePay?: boolean;
};

function formatCartMoneySafeLocal(amount: number) {
  return formatCartMoney(amount);
}

export function PaymentChoiceCard({
  order,
  accessToken,
  onOrderChange,
  skipStandalonePay = false,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"online" | "store" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (order.status === "PAYEE") return null;
  if (isDeliveryFeePending(order) || !canPayOrder(order)) {
    return <OrderPayActions order={order} accessToken={accessToken} />;
  }

  const pickupChoices = canChooseStorePayment(order);
  const storeChosen = order.paymentIntent === "PAY_AT_STORE";
  const payHref = routes.checkoutPay(order.id, accessToken);

  async function recordIntent(intent: "PAY_ONLINE" | "PAY_AT_STORE") {
    if (order.paymentIntent === intent) return order;
    const next = await chooseMaterialOrderPaymentIntent(
      order.id,
      intent,
      accessToken,
    );
    onOrderChange?.(next);
    return next;
  }

  async function payOnline() {
    if (busy) return;
    setBusy("online");
    setError(null);
    try {
      await recordIntent("PAY_ONLINE");
      router.push(payHref);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d’ouvrir le paiement.",
      );
      setBusy(null);
    }
  }

  async function payAtStore() {
    if (busy) return;
    setBusy("store");
    setError(null);
    try {
      await recordIntent("PAY_AT_STORE");
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer ce choix.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (!pickupChoices) {
    if (skipStandalonePay) return null;
    return <OrderPayActions order={order} accessToken={accessToken} />;
  }

  if (storeChosen) {
    return (
      <section className={styles.card}>
        <span className={styles.badge}>Paiement au magasin</span>
        <h2>Vous avez choisi de payer au magasin.</h2>
        <p className={styles.note}>
          Présentez-vous au magasin avec votre référence de commande lors du
          retrait.
        </p>
        <dl className={styles.meta}>
          <div>
            <dt>Référence de commande</dt>
            <dd className={styles.reference}>{order.reference}</dd>
          </div>
          <div>
            <dt>Montant à régler</dt>
            <dd>{formatCartMoneySafeLocal(order.totalAmount)}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{formatDeliveryMode(order.deliveryMode)}</dd>
          </div>
          <div>
            <dt>Paiement</dt>
            <dd>À régler au magasin</dd>
          </div>
        </dl>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={busy !== null}
          onClick={() => void payOnline()}
        >
          {busy === "online" ? "Ouverture…" : "Finalement payer en ligne"}
        </Button>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <span className={styles.badge}>Paiement demandé</span>
      <h2>Choisissez comment payer</h2>
      <p className={styles.note}>
        Montant à payer :{" "}
        <strong>{formatCartMoneySafeLocal(order.totalAmount)}</strong>
        {order.paymentIntent === "PAY_ONLINE"
          ? ` · ${formatPaymentIntent(order.paymentIntent)}`
          : null}
      </p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.choiceGrid}>
        <article className={styles.choiceCard}>
          <h3>Payer en ligne</h3>
          <p>Réglez votre commande en ligne avec un moyen de paiement disponible.</p>
          <Button
            type="button"
            fullWidth
            disabled={busy !== null}
            onClick={() => void payOnline()}
          >
            {busy === "online" ? "Ouverture…" : "Procéder au paiement"}
          </Button>
        </article>
        <article className={styles.choiceCard}>
          <h3>Payer au magasin</h3>
          <p>
            Vous pouvez également régler votre commande directement au magasin
            lors du retrait.
          </p>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={busy !== null}
            onClick={() => void payAtStore()}
          >
            {busy === "store" ? "Enregistrement…" : "Payer au magasin"}
          </Button>
        </article>
      </div>
    </section>
  );
}
