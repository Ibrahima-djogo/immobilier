"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui";
import { getGuestOrderAccess } from "@/lib/commande/guest-order-access";
import {
  formatDeliveryFee,
  friendlyConfirmationError,
  friendlyPaymentError,
  loadMaterialOrder,
  orderSubtotal,
  readAccessTokenFromSearch,
  readOrderIdFromSearch,
  verifyMaterialOrderPayment,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import styles from "../../confirmation/page.module.css";

export function PaymentReturnView() {
  const searchParams = useSearchParams();
  const requestedId = readOrderIdFromSearch(searchParams);
  const accessToken =
    readAccessTokenFromSearch(searchParams) ||
    getGuestOrderAccess(requestedId)?.accessToken ||
    "";
  const paymentId = String(
    searchParams.get("paymentId") || searchParams.get("transactionId") || "",
  ).trim();
  const [order, setOrder] = useState<MaterialOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!requestedId) {
        setError("Commande introuvable.");
        setLoading(false);
        return;
      }
      void (async () => {
        try {
          const verified = await verifyMaterialOrderPayment(
            requestedId,
            accessToken || undefined,
            paymentId || undefined,
          );
          if (!cancelled) {
            setOrder(verified);
            setError(null);
          }
        } catch (cause: unknown) {
          try {
            const fallback = await loadMaterialOrder(
              requestedId,
              accessToken || undefined,
            );
            if (!cancelled) {
              setOrder(fallback);
              setError(friendlyPaymentError(cause));
            }
          } catch (loadCause: unknown) {
            if (!cancelled) {
              setError(friendlyConfirmationError(loadCause));
            }
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessToken, paymentId, requestedId]);

  if (loading) {
    return (
      <p className={styles.status} role="status">
        Vérification du paiement auprès du prestataire…
      </p>
    );
  }

  if (!order) {
    return (
      <div className={styles.card}>
        <p className={styles.error} role="alert">
          {error || "Impossible de vérifier ce paiement."}
        </p>
        <Button href={routes.checkoutTrack} variant="secondary" fullWidth>
          Suivre une commande
        </Button>
      </div>
    );
  }

  const paid = order.status === "PAYEE";
  const payHref = routes.checkoutPay(order.id, accessToken || undefined);

  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        {paid ? (
          <p className={styles.success} role="status">
            Paiement confirmé. Votre commande est désormais payée.
          </p>
        ) : (
          <p className={styles.note} role="status">
            Le paiement n’est pas confirmé. Votre commande reste en attente de
            paiement. Vous pouvez réessayer.
          </p>
        )}
        {error && !paid ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <dl className={styles.meta}>
          <div>
            <dt>Référence</dt>
            <dd className={styles.reference}>{order.reference}</dd>
          </div>
        </dl>
        <div className={styles.totalRow}>
          <span>Sous-total</span>
          <strong>{formatCartMoney(orderSubtotal(order))}</strong>
        </div>
        <div className={styles.totalRow}>
          <span>Livraison</span>
          <strong>{formatDeliveryFee(order)}</strong>
        </div>
        <div className={styles.totalRow}>
          <span>Total</span>
          <strong>{formatCartMoney(order.totalAmount)}</strong>
        </div>
        <div className={styles.actions}>
          <Button href={routes.checkoutOrder(order.id, accessToken || undefined)} fullWidth>
            Voir la commande
          </Button>
          {!paid ? (
            <Button href={payHref} variant="secondary" fullWidth>
              Réessayer le paiement
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
