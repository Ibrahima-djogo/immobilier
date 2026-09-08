"use client";

import { useEffect } from "react";

import { Button, StatusBadge } from "@/components/ui";
import { getGuestOrderAccess, saveGuestOrderAccess } from "@/lib/commande/guest-order-access";
import {
  formatOrderStatus,
  type MaterialOrder,
  type MaterialOrderRelated,
} from "@/lib/commande/orders";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import styles from "./confirmation/page.module.css";

type Props = {
  order: MaterialOrder;
  loggedIn?: boolean;
};

function relatedHref(related: MaterialOrderRelated, loggedIn?: boolean) {
  if (loggedIn) return routes.myOrder(related.id);
  const stored = getGuestOrderAccess(related.id);
  const token = related.accessToken || stored?.accessToken;
  return routes.checkoutOrder(related.id, token);
}

export function RelatedOrdersCard({ order, loggedIn }: Props) {
  const related = order.relatedOrders || [];
  useEffect(() => {
    if (loggedIn) return;
    for (const item of related) {
      if (item.accessToken) {
        saveGuestOrderAccess({
          id: item.id,
          reference: item.reference,
          accessToken: item.accessToken,
        });
      }
    }
  }, [loggedIn, related]);
  if (related.length === 0) return null;

  const grouped = [
    {
      id: order.id,
      reference: order.reference,
      status: order.status,
      supplierName: order.supplierName,
      totalAmount: order.totalAmount,
      current: true,
    },
    ...related.map((item) => ({
      ...item,
      current: false,
    })),
  ];

  return (
    <section className={`${styles.card} ${styles.lightCard}`}>
      <h2>Commandes par fournisseur</h2>
      <p className={styles.note}>
        Vos commandes ont été réparties par fournisseur.
      </p>
      <ul className={styles.relatedList}>
        {grouped.map((item, index) => (
          <li key={item.id} className={styles.relatedItem}>
            <p className={styles.relatedLabel}>
              Commande fournisseur {index + 1}
              {item.current ? " — en cours de consultation" : ""}
            </p>
            <div className={styles.relatedTop}>
              <strong>{item.reference}</strong>
              <StatusBadge
                status={item.status}
                label={formatOrderStatus(item.status)}
              />
            </div>
            <dl className={styles.meta}>
              {item.supplierName ? (
                <div>
                  <dt>Fournisseur</dt>
                  <dd>{item.supplierName}</dd>
                </div>
              ) : null}
              <div>
                <dt>Montant</dt>
                <dd>{formatCartMoney(item.totalAmount)}</dd>
              </div>
            </dl>
            {!item.current ? (
              <div className={styles.relatedActions}>
                <Button
                  href={relatedHref(item as MaterialOrderRelated, loggedIn)}
                  variant="secondary"
                >
                  Voir cette commande
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
