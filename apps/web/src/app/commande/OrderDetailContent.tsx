"use client";

import { Button } from "@/components/ui";
import {
  canChooseStorePayment,
  canPayOrder,
  formatDeliveryFee,
  formatDeliveryMode,
  formatOrderUnitPrice,
  isDeliveryFeePending,
  isGuestOrder,
  orderSubtotal,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import { OrderCancelActions } from "./OrderCancelActions";
import { PaymentChoiceCard } from "./PaymentChoiceCard";
import { RelatedOrdersCard } from "./RelatedOrdersCard";
import { OrderStatus } from "./confirmation/OrderStatus";
import { OrderTracking } from "./confirmation/OrderTracking";
import { OrderVerification } from "./confirmation/OrderVerification";
import styles from "./confirmation/page.module.css";

type Props = {
  order: MaterialOrder;
  accessToken?: string;
  loggedIn: boolean;
  variant: "confirmation" | "account";
  refreshing: boolean;
  onRefresh: () => void;
  onOrderChange: (order: MaterialOrder) => void;
};

export function OrderDetailContent({
  order,
  accessToken,
  loggedIn,
  variant,
  refreshing,
  onRefresh,
  onOrderChange,
}: Props) {
  const guestToken = isGuestOrder(order) ? accessToken : undefined;
  const showSummaryPay =
    canPayOrder(order) &&
    !isDeliveryFeePending(order) &&
    !canChooseStorePayment(order);

  return (
    <div className={styles.stack}>
      <section className={`${styles.card} ${styles.summaryCard}`}>
        <div className={styles.summaryTop}>
          <div className={styles.summaryIdentity}>
            <p className={styles.summaryEyebrow}>Commande</p>
            <p className={styles.reference}>{order.reference}</p>
          </div>
          <OrderStatus status={order.status} />
        </div>
        <dl className={styles.summaryMeta}>
          <div>
            <dt>Montant total</dt>
            <dd className={styles.summaryAmount}>
              {formatCartMoney(order.totalAmount)}
            </dd>
          </div>
          <div>
            <dt>Mode de réception</dt>
            <dd>{formatDeliveryMode(order.deliveryMode)}</dd>
          </div>
        </dl>
        {showSummaryPay ? (
          <Button href={routes.checkoutPay(order.id, guestToken)} fullWidth>
            Procéder au paiement
          </Button>
        ) : null}
        {variant === "confirmation" ? (
          <p className={styles.success} role="status">
            Votre commande a bien été enregistrée. Les quantités commandées
            sont réservées automatiquement.
          </p>
        ) : null}
        {isGuestOrder(order) ? (
          <p className={styles.note}>
            Conservez la référence {order.reference} et le téléphone utilisé.
            Vous pourrez retrouver cette commande via{" "}
            <a href={routes.checkoutTrack}>Suivre une commande</a>.
          </p>
        ) : null}
      </section>

      <PaymentChoiceCard
        order={order}
        accessToken={guestToken}
        onOrderChange={onOrderChange}
        skipStandalonePay={showSummaryPay}
      />

      <section className={`${styles.card} ${styles.lightCard}`}>
        <h2>Articles</h2>
        <ul className={styles.articleList}>
          {order.items.map((item) => (
            <li key={item.productId} className={styles.articleCard}>
              <div className={styles.articleMain}>
                <strong>
                  {item.productName} × {item.quantity}
                </strong>
                <p>{formatOrderUnitPrice(item)}</p>
              </div>
              <span>{formatCartMoney(item.subtotal)}</span>
            </li>
          ))}
        </ul>
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
      </section>

      <section className={`${styles.card} ${styles.lightCard}`}>
        <h2>Réception</h2>
        <dl className={styles.meta}>
          <div>
            <dt>Mode</dt>
            <dd>{formatDeliveryMode(order.deliveryMode)}</dd>
          </div>
          <div>
            <dt>Nom</dt>
            <dd>{order.customer.name}</dd>
          </div>
          <div>
            <dt>Téléphone</dt>
            <dd>{order.customer.phone}</dd>
          </div>
          {order.customer.email ? (
            <div>
              <dt>E-mail</dt>
              <dd>{order.customer.email}</dd>
            </div>
          ) : null}
          <div>
            <dt>Ville</dt>
            <dd>{order.customer.city}</dd>
          </div>
          <div>
            <dt>Quartier</dt>
            <dd>{order.customer.district}</dd>
          </div>
          <div>
            <dt>Adresse</dt>
            <dd>{order.customer.address}</dd>
          </div>
          {order.supplierName ? (
            <div>
              <dt>Fournisseur</dt>
              <dd>{order.supplierName}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <RelatedOrdersCard order={order} loggedIn={loggedIn} />

      <OrderVerification verification={order.verification} />

      <OrderTracking history={order.statusHistory} />

      <section className={styles.secondaryActions}>
        <OrderCancelActions
          order={order}
          accessToken={guestToken}
          onOrderChange={onOrderChange}
        />

        <nav className={styles.footerNav} aria-label="Actions secondaires">
          {loggedIn ? (
            <Button href={routes.myOrders} variant="secondary">
              Retour aux commandes
            </Button>
          ) : (
            <Button href={routes.checkoutTrack} variant="secondary">
              Retour aux commandes
            </Button>
          )}
          <Button href={routes.materials} variant="secondary">
            Continuer
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={refreshing}
            onClick={onRefresh}
          >
            {refreshing ? "Actualisation…" : "Actualiser"}
          </Button>
        </nav>
      </section>
    </div>
  );
}
