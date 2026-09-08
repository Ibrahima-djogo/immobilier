"use client";

import { useParams } from "next/navigation";
import { Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { OrderDetailContent } from "@/app/commande/OrderDetailContent";
import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui";
import { useRequirePublicSession } from "@/hooks/useRequirePublicSession";
import { DEMO_POLL_MS } from "@/lib/demo-api/config";
import {
  friendlyConfirmationError,
  loadMyMaterialOrder,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export default function MyOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = String(params?.id || "").trim();
  const { ready, isLoggedIn } = useRequirePublicSession(
    orderId ? routes.myOrder(orderId) : routes.myOrders,
  );
  const [order, setOrder] = useState<MaterialOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(
    async (silent = false) => {
      if (!orderId) {
        setOrder(null);
        setError("Commande introuvable.");
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const next = await loadMyMaterialOrder(orderId);
        setOrder(next);
        setError(null);
      } catch (cause: unknown) {
        if (!silent) {
          setOrder(null);
          setError(friendlyConfirmationError(cause));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    const timer = window.setTimeout(() => {
      void fetchOrder(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready, isLoggedIn, fetchOrder]);

  useEffect(() => {
    if (!ready || !isLoggedIn || !orderId) return;
    const timer = window.setInterval(() => {
      void fetchOrder(true);
    }, DEMO_POLL_MS);
    return () => window.clearInterval(timer);
  }, [ready, isLoggedIn, orderId, fetchOrder]);

  return (
    <UserShell active="commandes">
      <section className={styles.content}>
        <PageHero
          variant="dashboard"
          eyebrow="Suivi commande"
          title={order?.reference || "Commande"}
          description="Suivez l’avancement de votre commande de matériaux."
          icon={<Package size={16} aria-hidden="true" />}
          backHref={routes.myOrders}
          backLabel="Mes commandes de matériaux"
        />

        {!ready || !isLoggedIn || (loading && !order) ? (
          <p className={styles.status} role="status">
            Chargement de votre commande…
          </p>
        ) : error || !order ? (
          <div className={styles.error} role="alert">
            <p>{error || "Commande introuvable."}</p>
            <Button href={routes.myOrders} variant="secondary">
              Retour à mes commandes
            </Button>
          </div>
        ) : (
          <OrderDetailContent
            order={order}
            loggedIn
            variant="account"
            refreshing={refreshing}
            onRefresh={() => void fetchOrder(true)}
            onOrderChange={setOrder}
          />
        )}
      </section>
    </UserShell>
  );
}
