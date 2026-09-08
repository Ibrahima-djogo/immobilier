"use client";

import { ClipboardList, FileSpreadsheet, PackageMinus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardPanel, KpiStrip } from "@/components/dashboard";
import { fetchMaterialQuotes } from "@/lib/materiaux/material-api";
import { getOrders } from "@/lib/materiaux/order-api";
import { hydrateMaterialStores } from "@/lib/materiaux/remote-cache";
import { materialStockStorage } from "@/lib/materiaux/stock-storage";
import { stockLevel } from "@/lib/materiaux/stocks";
import { routes } from "@/lib/routes/app-routes";

type Counts = {
  pendingOrders: number;
  pendingPayments: number;
  lowStock: number;
  pendingQuotes: number;
};

const emptyCounts: Counts = {
  pendingOrders: 0,
  pendingPayments: 0,
  lowStock: 0,
  pendingQuotes: 0,
};

export function DashboardMaterialsSection() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;

    function loadCounts() {
      void Promise.allSettled([
        getOrders(),
        fetchMaterialQuotes(),
        hydrateMaterialStores(),
      ]).then(([ordersResult, quotesResult]) => {
        if (cancelled) return;
        const orders =
          ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)
            ? ordersResult.value
            : [];
        const quotes =
          quotesResult.status === "fulfilled" && Array.isArray(quotesResult.value)
            ? quotesResult.value
            : [];
        const stocks = materialStockStorage.list();
        setCounts({
          pendingOrders: orders.filter((item) => item.status === "EN_ATTENTE").length,
          pendingPayments: orders.filter(
            (item) => item.status === "PAIEMENT_EN_ATTENTE",
          ).length,
          lowStock: stocks.filter((item) => {
            const level = stockLevel(item);
            return level === "FAIBLE" || level === "RUPTURE";
          }).length,
          pendingQuotes: quotes.filter(
            (item) => item.status === "DEMANDE" || item.status === "EN_ETUDE",
          ).length,
        });
      });
    }

    const timer = window.setTimeout(loadCounts, 0);
    function onVisible() {
      if (document.visibilityState === "visible") loadCounts();
    }
    window.addEventListener("pageshow", loadCounts);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", loadCounts);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const values = counts ?? emptyCounts;
  const ready = counts !== null;

  return (
    <DashboardPanel
      title="Matériaux"
      description="Activité réelle du catalogue, des commandes et des devis."
    >
      <KpiStrip
        items={[
          {
            label: "Commandes en attente",
            value: ready ? values.pendingOrders : "…",
            icon: ClipboardList,
            tone: values.pendingOrders > 0 ? "warning" : "success",
            href: routes.materialOrders,
            actionLabel: "Voir les commandes",
          },
          {
            label: "Paiements à traiter",
            value: ready ? values.pendingPayments : "…",
            icon: Wallet,
            tone: values.pendingPayments > 0 ? "accent" : "default",
            href: routes.materialOrders,
            actionLabel: "Voir les commandes",
          },
          {
            label: "Stock faible",
            value: ready ? values.lowStock : "…",
            icon: PackageMinus,
            tone: values.lowStock > 0 ? "warning" : "success",
            href: routes.materialStock,
            actionLabel: "Voir le stock",
          },
          {
            label: "Devis en attente",
            value: ready ? values.pendingQuotes : "…",
            icon: FileSpreadsheet,
            tone: values.pendingQuotes > 0 ? "accent" : "default",
            href: routes.materialQuotes,
            actionLabel: "Voir les devis",
          },
        ]}
      />
    </DashboardPanel>
  );
}
