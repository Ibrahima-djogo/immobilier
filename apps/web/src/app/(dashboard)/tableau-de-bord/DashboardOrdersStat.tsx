"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";

import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { loadMyMaterialOrders } from "@/lib/commande/orders";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export function DashboardOrdersStat() {
  const { ready, isLoggedIn } = usePublicDemoSession();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadMyMaterialOrders()
        .then((items) => {
          if (!cancelled) setCount(Array.isArray(items) ? items.length : 0);
        })
        .catch(() => {
          if (!cancelled) setCount(0);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, isLoggedIn]);

  return (
    <article className={styles.statCard}>
      <span className={styles.statIcon}>
        <Package size={22} aria-hidden="true" />
      </span>
      <div>
        <small>Commandes matériaux</small>
        <strong>{count === null ? "…" : count}</strong>
        <Link href={routes.myOrders}>Voir mes commandes</Link>
      </div>
    </article>
  );
}
