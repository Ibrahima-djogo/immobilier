"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, StatusBadge } from "@/components/ui";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import {
  formatOrderDate,
  formatOrderStatus,
  loadMyMaterialOrders,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export function DashboardMaterialOrders() {
  const { ready, isLoggedIn } = usePublicDemoSession();
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadMyMaterialOrders()
        .then((items) => {
          if (cancelled) return;
          setOrders(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          if (!cancelled) setOrders([]);
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, isLoggedIn]);

  const sorted = orders
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const latest = sorted[0] ?? null;

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <span>Mes matériaux</span>
          <h2>Commandes de matériaux</h2>
        </div>
        <Link href={routes.myOrders} className={styles.sectionLink}>
          Voir mes commandes
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {!loaded ? (
        <p className={styles.dashboardHint}>Chargement de vos commandes…</p>
      ) : !latest ? (
        <div className={styles.materialsEmpty}>
          <p>Vous n’avez pas encore passé de commande de matériaux.</p>
          <Button href={routes.materials} variant="secondary" size="sm">
            Découvrir les matériaux
          </Button>
          <Button href={routes.cart} variant="secondary" size="sm">
            Mon panier
          </Button>
        </div>
      ) : (
        <div className={styles.materialsSummary}>
          <article className={styles.materialsLatest}>
            <span className={styles.activityIcon}>
              <Package size={19} aria-hidden="true" />
            </span>
            <div>
              <small>
                {orders.length} commande{orders.length > 1 ? "s" : ""}
              </small>
              <strong>
                <Link href={routes.myOrder(latest.id)}>{latest.reference}</Link>
              </strong>
              <p>
                {formatCartMoney(latest.totalAmount)} ·{" "}
                {formatOrderDate(latest.createdAt)}
              </p>
            </div>
            <StatusBadge
              status={latest.status}
              label={formatOrderStatus(latest.status)}
            />
          </article>
        </div>
      )}
    </section>
  );
}
