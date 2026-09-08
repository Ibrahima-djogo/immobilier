"use client";

import Link from "next/link";
import { Bookmark, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getOrders } from "@/lib/materiaux/order-api";
import type { MaterialOrder } from "@/lib/materiaux/orders";
import { materialStockReservationStorage } from "@/lib/materiaux/reservation-storage";
import {
  formatReservationDate,
  type MaterialStockReservation,
} from "@/lib/materiaux/reservations";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import type { MaterialProduct } from "@/lib/materiaux/products";
import { materialStockStorage } from "@/lib/materiaux/stock-storage";
import {
  availableQuantity,
  formatStockAmount,
} from "@/lib/materiaux/stocks";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

function reservationStatusLabel(status: string) {
  if (status === "ACTIVE") return "Active";
  if (status === "RELEASED") return "Libérée";
  if (status === "EXPIRED") return "Expirée";
  if (status === "CONSUMED") return "Consommée";
  return status;
}

export default function MaterialStockReservationsPage() {
  const [items, setItems] = useState<MaterialStockReservation[]>([]);
  const [products, setProducts] = useState<MaterialProduct[]>([]);
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [productFilter, setProductFilter] = useState("TOUS");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingRelease, setPendingRelease] =
    useState<MaterialStockReservation | null>(null);
  const [selected, setSelected] = useState<MaterialStockReservation | null>(
    null,
  );

  const reloadFromStore = useCallback(() => {
    setProducts(materialProductStorage.list());
    setItems(materialStockReservationStorage.list());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reloadFromStore();
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger les réservations.");
      } finally {
        setStoreReady(true);
      }
      void getOrders()
        .then((list) => setOrders(Array.isArray(list) ? list : []))
        .catch(() => setOrders([]));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reloadFromStore]);

  const productName = useCallback(
    (productId: string) =>
      products.find((item) => item.id === productId)?.name ??
      "Matériau introuvable",
    [products],
  );

  const customerName = useCallback(
    (item: MaterialStockReservation) => {
      if (!item.orderId) return "";
      const order = orders.find((entry) => entry.id === item.orderId);
      return order?.customer?.name || "";
    },
    [orders],
  );

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      const name = productName(item.productId);
      const orderRef = item.orderReference || "";
      const client = customerName(item);
      const matchesQuery =
        !needle ||
        name.toLowerCase().includes(needle) ||
        orderRef.toLowerCase().includes(needle) ||
        client.toLowerCase().includes(needle);
      const matchesStatus =
        statusFilter === "TOUS" || item.status === statusFilter;
      const matchesProduct =
        productFilter === "TOUS" || item.productId === productFilter;
      return matchesQuery && matchesStatus && matchesProduct;
    });
  }, [items, debouncedQuery, statusFilter, productFilter, productName, customerName]);

  const hasFilters =
    Boolean(query.trim()) ||
    statusFilter !== "TOUS" ||
    productFilter !== "TOUS";
  const activeCount = items.filter((item) => item.status === "ACTIVE").length;
  const selectedStock = selected
    ? materialStockStorage.findByProductId(selected.productId)
    : undefined;

  function resetFilters() {
    setQuery("");
    setStatusFilter("TOUS");
    setProductFilter("TOUS");
  }

  async function confirmRelease() {
    if (!pendingRelease) return;
    try {
      await materialStockReservationStorage.release(pendingRelease.id);
      reloadFromStore();
      setToast("Réservation libérée. La quantité physique n’a pas changé.");
      setLoadError(null);
      if (selected?.id === pendingRelease.id) setSelected(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Libération impossible.",
      );
    }
    setPendingRelease(null);
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Réservations stock"
      icon={Bookmark}
      backHref={routes.materialStock}
      backLabel="Retour au stock"
      heroVariant="compact"
      actions={
        <Link href={routes.materialStockReservationNew} className={styles.action}>
          <Plus size={16} aria-hidden="true" />
          Nouvelle réservation
        </Link>
      }
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!storeReady ? (
        <div className={styles.loading} role="status">
          Chargement des réservations…
        </div>
      ) : null}

      {storeReady ? (
        <section className={styles.summaryBar} aria-label="Synthèse réservations">
          <div>
            <span>Réservations actives</span>
            <strong>{activeCount}</strong>
          </div>
        </section>
      ) : null}

      {selected ? (
        <section className={styles.fiche} aria-label="Fiche réservation">
          <div className={styles.ficheHead}>
            <h2>{productName(selected.productId)}</h2>
            <StatusBadge
              status={selected.status}
              label={reservationStatusLabel(selected.status)}
            />
          </div>
          <div className={styles.ficheGrid}>
            <article className={styles.card}>
              <h3>Informations réservation</h3>
              <dl className={styles.meta}>
                <div>
                  <dt>Quantité réservée</dt>
                  <dd>{formatStockAmount(selected.quantity)}</dd>
                </div>
                <div>
                  <dt>Statut</dt>
                  <dd>{reservationStatusLabel(selected.status)}</dd>
                </div>
                <div>
                  <dt>Créée</dt>
                  <dd>{formatReservationDate(selected.createdAt)}</dd>
                </div>
                <div>
                  <dt>Expiration</dt>
                  <dd>{formatReservationDate(selected.expiresAt)}</dd>
                </div>
              </dl>
            </article>
            <article className={styles.card}>
              <h3>Produit</h3>
              <p className={styles.product}>{productName(selected.productId)}</p>
            </article>
            <article className={styles.card}>
              <h3>Commande associée</h3>
              <dl className={styles.meta}>
                <div>
                  <dt>Référence</dt>
                  <dd>
                    {selected.orderId && selected.orderReference ? (
                      <Link href={routes.materialOrder(selected.orderId)}>
                        {selected.orderReference}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Client</dt>
                  <dd>{customerName(selected) || "—"}</dd>
                </div>
              </dl>
            </article>
            <article className={styles.card}>
              <h3>Stock concerné</h3>
              {selectedStock ? (
                <dl className={styles.meta}>
                  <div>
                    <dt>Disponible</dt>
                    <dd>{formatStockAmount(availableQuantity(selectedStock))}</dd>
                  </div>
                  <div>
                    <dt>Réservé</dt>
                    <dd>{formatStockAmount(selectedStock.reservedQuantity)}</dd>
                  </div>
                  <div>
                    <dt>Dépôt</dt>
                    <dd>{selectedStock.location || "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className={styles.hint}>Aucune fiche de stock liée.</p>
              )}
            </article>
            <article className={styles.card}>
              <h3>Historique</h3>
              <ul className={styles.history}>
                <li>
                  <span>Création</span>
                  <span>{formatReservationDate(selected.createdAt)}</span>
                </li>
                <li>
                  <span>Mise à jour</span>
                  <span>{formatReservationDate(selected.updatedAt)}</span>
                </li>
                <li>
                  <span>Expiration prévue</span>
                  <span>{formatReservationDate(selected.expiresAt)}</span>
                </li>
              </ul>
            </article>
          </div>
          <div className={styles.ficheActions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setSelected(null)}
            >
              Fermer
            </button>
            <button
              type="button"
              className={styles.view}
              disabled={selected.status !== "ACTIVE"}
              onClick={() => setPendingRelease(selected)}
            >
              Libérer
            </button>
          </div>
        </section>
      ) : null}

      <section className={styles.filters}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Matériau, commande ou client…"
            aria-label="Rechercher une réservation"
          />
        </div>
        <select
          value={productFilter}
          onChange={(event) => setProductFilter(event.target.value)}
          aria-label="Filtrer par produit"
        >
          <option value="TOUS">Tous les matériaux</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="RELEASED">Libérée</option>
          <option value="EXPIRED">Expirée</option>
          <option value="CONSUMED">Consommée</option>
        </select>
        <span className={styles.count}>{filtered.length} élément(s)</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Produit</div>
          <div>Commande associée</div>
          <div>Client</div>
          <div>Quantité réservée</div>
          <div>Statut</div>
          <div>Date</div>
          <div>Action</div>
        </div>

        {storeReady && filtered.length === 0 ? (
          <EmptyState
            title={
              hasFilters
                ? "Aucune réservation correspondante"
                : "Aucune réservation"
            }
            description={
              hasFilters
                ? "Aucun résultat ne correspond à votre recherche ou à vos filtres."
                : "Aucune réservation fictive n’est créée. Le stock réservé reste à 0 tant qu’aucune réservation active n’existe."
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
              ) : (
                <Link
                  href={routes.materialStockReservationNew}
                  className={styles.action}
                >
                  <Plus size={16} aria-hidden="true" />
                  Nouvelle réservation
                </Link>
              )
            }
          />
        ) : null}

        {filtered.map((item) => (
          <article
            key={item.id}
            className={`${styles.tableGrid} ${styles.row}`}
          >
            <div className={`${styles.colProduct} ${styles.product}`} data-label="Produit">
              {productName(item.productId)}
            </div>
            <div className={`${styles.colOrder} ${styles.muted}`} data-label="Commande associée">
              {item.orderId && item.orderReference ? (
                <Link href={routes.materialOrder(item.orderId)}>
                  {item.orderReference}
                </Link>
              ) : (
                "—"
              )}
            </div>
            <div className={`${styles.colClient} ${styles.muted}`} data-label="Client">
              {customerName(item) || "—"}
            </div>
            <div className={`${styles.colQty} ${styles.qty}`} data-label="Quantité réservée">
              {formatStockAmount(item.quantity)}
            </div>
            <div className={styles.colStatus} data-label="Statut">
              <StatusBadge
                status={item.status}
                label={reservationStatusLabel(item.status)}
              />
            </div>
            <div className={`${styles.colDate} ${styles.muted}`} data-label="Date">
              {formatReservationDate(item.createdAt)}
            </div>
            <div className={styles.colActions}>
              <div className={styles.actions}>
                <button type="button" onClick={() => setSelected(item)}>
                  Voir
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <ConfirmDialog
        open={Boolean(pendingRelease)}
        title="Libérer cette réservation ?"
        description="Le stock physique reste inchangé. La quantité redevient disponible."
        subject={
          pendingRelease
            ? `${productName(pendingRelease.productId)} — ${formatStockAmount(pendingRelease.quantity)}`
            : undefined
        }
        confirmLabel="Libérer"
        onCancel={() => setPendingRelease(null)}
        onConfirm={confirmRelease}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
