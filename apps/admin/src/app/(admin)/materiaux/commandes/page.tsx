"use client";

import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  getAdminNotifications,
  getOrders,
  markAdminNotificationRead,
} from "@/lib/materiaux/order-api";
import type { MaterialAdminNotification } from "@/lib/materiaux/material-api";
import {
  formatOrderAmount,
  formatOrderDate,
  formatOrderWorkflowLabel,
  friendlyOrderLoadError,
  matchesOrderSearch,
  orderStatusOptions,
  sortOrders,
  type MaterialOrder,
} from "@/lib/materiaux/orders";
import { formatStatusLabel } from "@/lib/ui/status";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export default function MaterialOrdersPage() {
  const [items, setItems] = useState<MaterialOrder[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [notifications, setNotifications] = useState<
    MaterialAdminNotification[]
  >([]);
  const [notificationsOpen, setNotificationsOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void getOrders()
        .then((orders) => {
          if (cancelled) return;
          setItems(Array.isArray(orders) ? orders : []);
          setLoadError(null);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setItems([]);
          setLoadError(friendlyOrderLoadError(error));
        })
        .finally(() => {
          if (!cancelled) setReady(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getAdminNotifications()
      .then((items) => {
        if (cancelled) return;
        setNotifications(
          (Array.isArray(items) ? items : []).filter((item) =>
            String(item.type || "").startsWith("MATERIAL_"),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statuses = useMemo(() => orderStatusOptions(), []);

  const filtered = useMemo(() => {
    const next = items.filter((item) => {
      const matchesStatus =
        statusFilter === "TOUS" || item.status === statusFilter;
      return matchesStatus && matchesOrderSearch(item, debouncedQuery);
    });
    return sortOrders(next, sort);
  }, [items, debouncedQuery, statusFilter, sort]);

  const hasFilters =
    Boolean(query.trim()) || statusFilter !== "TOUS" || sort !== "recent";
  const pendingCount = items.filter((item) => item.status === "EN_ATTENTE").length;
  const paymentCount = items.filter(
    (item) => item.status === "PAIEMENT_EN_ATTENTE",
  ).length;

  function resetFilters() {
    setQuery("");
    setStatusFilter("TOUS");
    setSort("recent");
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Commandes"
      description="Consultez les commandes par fournisseur, les montants serveur et le paiement."
      icon={ClipboardList}
      backHref={routes.materials}
      backLabel="Retour aux matériaux"
      heroVariant="compact"
      stats={[
        {
          label: "En attente",
          value: ready ? pendingCount : null,
          tone: "warning",
        },
        {
          label: "Paiement en attente",
          value: ready ? paymentCount : null,
          tone: "warning",
        },
      ]}
    >
      <section className={styles.warning}>
        Les montants sont ceux enregistrés au moment de la commande. Une
        annulation libère les réservations, jamais le stock physique.
      </section>

      {notifications.length > 0 ? (
        <section className={styles.notifications} aria-label="Notifications commandes">
          <button
            type="button"
            className={styles.notificationsHeader}
            aria-expanded={notificationsOpen}
            aria-controls="admin-payment-notifications"
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <h2>Notifications de paiement</h2>
            <span className={styles.notificationsHeaderMeta}>
              <span>
                {notifications.filter((item) => !item.read).length} non lue(s)
              </span>
              <span
                className={
                  notificationsOpen
                    ? styles.notificationsChevronOpen
                    : styles.notificationsChevron
                }
                aria-hidden="true"
              />
            </span>
          </button>
          <div
            id="admin-payment-notifications"
            className={
              notificationsOpen
                ? `${styles.notificationPanel} ${styles.notificationPanelOpen}`
                : styles.notificationPanel
            }
          >
            <div className={styles.notificationPanelInner}>
              <ul className={styles.notificationList}>
                {notifications.slice(0, 8).map((item) => (
                  <li
                    key={item.id}
                    className={
                      item.read ? styles.notificationItem : styles.notificationUnread
                    }
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>{formatOrderDate(item.createdAt)}</small>
                    </div>
                    {item.orderId ? (
                      <Link
                        href={routes.materialOrder(item.orderId)}
                        className={styles.view}
                        onClick={() => {
                          if (item.read) return;
                          void markAdminNotificationRead(item.id).then((next) => {
                            setNotifications((current) =>
                              current.map((entry) =>
                                entry.id === next.id ? next : entry,
                              ),
                            );
                          });
                        }}
                      >
                        Ouvrir
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Chargement des commandes…
        </div>
      ) : null}

      <section className={styles.filters}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Référence, client ou téléphone…"
            aria-label="Rechercher une commande"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) =>
            setSort(event.target.value === "oldest" ? "oldest" : "recent")
          }
          aria-label="Trier par date"
        >
          <option value="recent">Plus récente</option>
          <option value="oldest">Plus ancienne</option>
        </select>
        <span className={styles.count}>{filtered.length} élément(s)</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Référence</div>
          <div>Client</div>
          <div>Fournisseur</div>
          <div>Montant</div>
          <div>Statut</div>
          <div>Action</div>
        </div>

        {ready && !loadError && filtered.length === 0 ? (
          <EmptyState
            title="Aucune commande trouvée"
            description={
              hasFilters
                ? "Aucune commande ne correspond à votre recherche ou à vos filtres."
                : "Les commandes confirmées depuis le site public apparaîtront ici."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        ) : null}

        {filtered.map((item) => (
          <article
            key={item.id}
            className={`${styles.tableGrid} ${styles.row}`}
          >
            <div className={`${styles.colReference} ${styles.reference}`}>
              {item.reference}
            </div>
            <div className={`${styles.colClient} ${styles.muted}`}>
              {item.customer.name}
            </div>
            <div className={`${styles.colSupplier} ${styles.muted}`}>
              {item.supplierName || "—"}
            </div>
            <div className={`${styles.colAmount} ${styles.amount}`}>
              {formatOrderAmount(item.totalAmount)}
            </div>
            <div className={styles.colStatus}>
              <StatusBadge
                status={item.status}
                label={formatOrderWorkflowLabel(item)}
              />
            </div>
            <div className={styles.colActions}>
              <Link
                href={routes.materialOrder(item.id)}
                className={styles.view}
                aria-label={`Voir la commande ${item.reference}`}
              >
                Voir
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
