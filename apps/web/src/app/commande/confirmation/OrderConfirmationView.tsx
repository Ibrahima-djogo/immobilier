"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { DEMO_POLL_MS } from "@/lib/demo-api/config";
import { getGuestOrderAccess } from "@/lib/commande/guest-order-access";
import {
  friendlyConfirmationError,
  loadMaterialOrder,
  readAccessTokenFromSearch,
  readOrderIdFromSearch,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { routes } from "@/lib/routes/app-routes";

import { OrderDetailContent } from "../OrderDetailContent";
import styles from "./page.module.css";

type Props = {
  orderId?: string;
};

export function OrderConfirmationView({ orderId = "" }: Props) {
  const searchParams = useSearchParams();
  const { isLoggedIn } = usePublicDemoSession();
  const requestedId = readOrderIdFromSearch(searchParams, orderId);
  const accessToken =
    readAccessTokenFromSearch(searchParams) ||
    getGuestOrderAccess(requestedId)?.accessToken ||
    "";
  const [order, setOrder] = useState<MaterialOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(
    async (silent = false) => {
      if (!requestedId) {
        setOrder(null);
        setError("Commande introuvable.");
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const next = await loadMaterialOrder(requestedId, accessToken || undefined);
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
    [accessToken, requestedId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchOrder(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchOrder]);

  useEffect(() => {
    if (!requestedId) return;
    const timer = window.setInterval(() => {
      void fetchOrder(true);
    }, DEMO_POLL_MS);
    return () => window.clearInterval(timer);
  }, [requestedId, fetchOrder]);

  if (loading && !order) {
    return (
      <p className={styles.status} role="status">
        Chargement de votre commande…
      </p>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.card}>
        <p className={styles.error} role="alert">
          {error || "Commande introuvable."}
        </p>
        <div className={styles.actions}>
          <Button
            type="button"
            fullWidth
            disabled={refreshing}
            onClick={() => void fetchOrder(false)}
          >
            Actualiser
          </Button>
          <Button href={routes.materials} variant="secondary" fullWidth>
            Continuer mes achats
          </Button>
        </div>
      </div>
    );
  }

  return (
    <OrderDetailContent
      order={order}
      accessToken={accessToken || undefined}
      loggedIn={isLoggedIn}
      variant="confirmation"
      refreshing={refreshing}
      onRefresh={() => void fetchOrder(true)}
      onOrderChange={setOrder}
    />
  );
}
