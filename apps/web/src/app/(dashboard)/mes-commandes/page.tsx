"use client";

import { Package, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { Button, StatusBadge } from "@/components/ui";
import { useRequirePublicSession } from "@/hooks/useRequirePublicSession";
import {
  formatOrderStatus,
  friendlyConfirmationError,
  loadMyMaterialOrders,
  type MaterialOrder,
} from "@/lib/commande/orders";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import styles from "../accountList.module.css";

const STATUS_FILTERS = [
  { value: "TOUS", label: "Tous les statuts" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_VERIFICATION", label: "En vérification" },
  { value: "VALIDEE", label: "Validée" },
  { value: "PAIEMENT_EN_ATTENTE", label: "Paiement en attente" },
  { value: "PAYEE", label: "Payée" },
  { value: "EN_PREPARATION", label: "En préparation" },
  { value: "PRETE", label: "Prête" },
  { value: "EN_LIVRAISON", label: "En livraison" },
  { value: "RETIRE_DEPOT", label: "Retrait effectué" },
  { value: "LIVREE", label: "Livrée" },
  { value: "ANNULEE", label: "Annulée" },
  { value: "RESERVATION_EXPIREE", label: "Réservation expirée" },
];

function formatListDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyOrdersPage() {
  const { ready, isLoggedIn } = useRequirePublicSession(routes.myOrders);
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("TOUS");

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadMyMaterialOrders()
        .then((items) => {
          if (cancelled) return;
          setOrders(Array.isArray(items) ? items : []);
          setError(null);
        })
        .catch((cause: unknown) => {
          if (cancelled) return;
          setOrders([]);
          setError(friendlyConfirmationError(cause));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, isLoggedIn]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        const matchesStatus = status === "TOUS" || order.status === status;
        if (!matchesStatus) return false;
        if (!needle) return true;
        const haystack = [
          order.reference,
          order.status,
          formatOrderStatus(order.status),
          ...(order.items || []).map((item) => item.productName),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [orders, query, status]);

  return (
    <UserShell active="commandes">
      <section className={styles.content}>
        <PageHero
          variant="dashboard"
          eyebrow="Compte"
          title="Mes commandes"
          description="Retrouvez vos commandes de matériaux et suivez leur avancement."
          icon={<Package size={16} aria-hidden="true" />}
        />

        {!ready || !isLoggedIn ? (
          <p className={styles.status} role="status">
            Vérification de votre connexion…
          </p>
        ) : loading ? (
          <p className={styles.status} role="status">
            Chargement de vos commandes…
          </p>
        ) : error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            <p>Vous n’avez pas encore passé de commande de matériaux.</p>
            <Button href={routes.materials}>Découvrir les matériaux</Button>
          </div>
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <label className={styles.search}>
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rechercher une référence ou un matériau"
                    aria-label="Rechercher une commande"
                  />
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-label="Filtrer par statut"
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className={styles.count}>
              {filtered.length} commande{filtered.length > 1 ? "s" : ""}
            </p>
            {filtered.length === 0 ? (
              <p className={styles.empty}>Aucune commande ne correspond à ce filtre.</p>
            ) : (
              <>
                <section className={styles.table} aria-label="Liste des commandes">
                  <div className={`${styles.tableGrid} ${styles.head}`}>
                    <div>Référence</div>
                    <div>Date</div>
                    <div>Statut</div>
                    <div>Montant</div>
                    <div>Action</div>
                  </div>
                  {filtered.map((order) => (
                    <article
                      key={order.id}
                      className={`${styles.tableGrid} ${styles.row}`}
                    >
                      <div className={styles.identity}>
                        <p className={styles.reference}>{order.reference}</p>
                        {(order.items || []).length > 0 ? (
                          <p className={styles.products}>
                            {(order.items || [])
                              .map((item) => `${item.productName} × ${item.quantity}`)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>
                      <p className={styles.date}>{formatListDate(order.createdAt)}</p>
                      <div className={styles.statusCell}>
                        <StatusBadge
                          status={order.status}
                          label={formatOrderStatus(order.status)}
                        />
                      </div>
                      <p className={styles.amount}>
                        {formatCartMoney(order.totalAmount)}
                      </p>
                      <div className={styles.actionCell}>
                        <Button
                          href={routes.myOrder(order.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Voir
                        </Button>
                      </div>
                    </article>
                  ))}
                </section>
                <div className={styles.footerActions}>
                  <Button href={routes.materials} variant="secondary">
                    Continuer mes achats
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </UserShell>
  );
}
