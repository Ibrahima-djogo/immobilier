"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardList, Truck, UserRound, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { InfoField, InfoGrid } from "@/components/administration/InfoField";
import { ConfirmDialog, DemoToast, EmptyState, StatusBadge } from "@/components/ui";
import { DemoApiError } from "@/lib/demo-api/client";
import {
  cancelOrder,
  confirmAgentPayment,
  confirmStorePayment,
  getOrderById,
  getReservationsForOrder,
  updateDeliveryMode,
  updateOrderDeliveryFee,
  updateOrderStatus,
} from "@/lib/materiaux/order-api";
import { forceRefreshMaterialStores } from "@/lib/materiaux/remote-cache";
import {
  canCancelMaterialOrder,
  canConfirmStorePayment,
  canEditDeliveryFee,
  formatCustomerKind,
  formatDeliveryFee,
  formatDeliveryMode,
  formatHistoryAction,
  formatOrderAmount,
  formatOrderWorkflowLabel,
  formatPaymentChannel,
  formatPaymentIntent,
  formatPaymentMethod,
  formatPaymentRequestState,
  formatPaymentStatus,
  isAgentPaymentPending,
  orderSubtotal,
  parseDeliveryFeeInput,
  formatOrderDate,
  formatOrderItemQuantity,
  formatOrderUnitPrice,
  friendlyOrderLoadError,
  type MaterialOrder,
} from "@/lib/materiaux/orders";
import {
  formatReservationDate,
  type MaterialStockReservation,
} from "@/lib/materiaux/reservations";
import { formatStockAmount } from "@/lib/materiaux/stocks";
import { routes } from "@/lib/routes/app-routes";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

import styles from "./page.module.css";

const ACTION_STATUS = {
  requestPayment: "PAIEMENT_EN_ATTENTE",
  startPrep: "EN_PREPARATION",
  markReady: "PRETE",
  startDelivery: "EN_LIVRAISON",
  confirmDelivery: "LIVREE",
  confirmPickup: "RETIRE_DEPOT",
} as const;

const ACTION_TOAST = {
  requestPayment: "Commande passée en attente de paiement.",
  confirmAgent: "Paiement avec agent confirmé.",
  confirmStore: "Paiement au magasin confirmé.",
  startPrep: "Préparation commencée.",
  markReady: "Commande marquée comme prête.",
  startDelivery: "Livraison démarrée.",
  confirmDelivery: "Commande marquée comme livrée.",
  confirmPickup: "Retrait client confirmé.",
  cancel: "Commande annulée. Les réservations associées ont été libérées.",
} as const;

const ACTION_DIALOG = {
  requestPayment: {
    title: "Demander le paiement",
    description: "Passer cette commande en attente de paiement ?",
    confirm: "Demander le paiement",
  },
  confirmAgent: {
    title: "Confirmer le paiement",
    description:
      "Confirmer le paiement avec agent pour le montant total attendu de cette commande ?",
    confirm: "Confirmer le paiement",
  },
  confirmStore: {
    title: "Confirmer le paiement",
    description:
      "Confirmer le paiement reçu au magasin pour le montant total attendu de cette commande ?",
    confirm: "Confirmer le paiement",
  },
  startPrep: {
    title: "Passer en préparation",
    description: "Passer cette commande en préparation ?",
    confirm: "Passer en préparation",
  },
  markReady: {
    title: "Marquer prête",
    description: "Confirmer que cette commande est prête ?",
    confirm: "Commande prête",
  },
  startDelivery: {
    title: "Passer en livraison",
    description: "Démarrer la livraison de cette commande ?",
    confirm: "Passer en livraison",
  },
  confirmDelivery: {
    title: "Marquer comme livrée",
    description: "Confirmer que la commande a été livrée ?",
    confirm: "Livrée",
  },
  confirmPickup: {
    title: "Confirmer le retrait",
    description: "Confirmer que le client a retiré cette commande ?",
    confirm: "Confirmer le retrait",
  },
  cancel: {
    title: "Annuler la commande",
    description:
      "Voulez-vous vraiment annuler cette commande ? Les réservations associées seront libérées.",
    confirm: "Annuler la commande",
  },
} as const;

function reservationProductName(
  reservation: MaterialStockReservation,
  order: MaterialOrder,
) {
  return (
    order.items.find((item) => item.productId === reservation.productId)
      ?.productName ?? reservation.productId
  );
}

function verificationTimeline(order: MaterialOrder) {
  const checks = (order.verificationHistory ?? []).map((entry, index) => ({
    key: `verify-${entry.action}-${entry.changedAt}-${index}`,
    title: formatHistoryAction(entry),
    at: entry.changedAt,
    by: entry.changedBy,
    kind: "verify" as const,
    status: null as string | null,
  }));
  const statuses = (order.statusHistory ?? []).map((entry, index) => ({
    key: `status-${entry.status}-${entry.changedAt}-${index}`,
    title: formatStatusLabel(entry.status),
    at: entry.changedAt,
    by: entry.changedBy,
    kind: "status" as const,
    status: entry.status,
  }));
  return [...checks, ...statuses].sort((left, right) =>
    left.at.localeCompare(right.at),
  );
}

export default function MaterialOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<MaterialOrder | null>(null);
  const [reservations, setReservations] = useState<MaterialStockReservation[]>(
    [],
  );
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    keyof typeof ACTION_DIALOG | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [feeDraft, setFeeDraft] = useState("");
  const [editingFee, setEditingFee] = useState(false);

  const loadReservations = useCallback(async (orderId: string) => {
    try {
      const linked = await getReservationsForOrder(orderId);
      setReservations(linked);
      setReservationError(null);
    } catch {
      setReservations([]);
      setReservationError("Impossible de charger les réservations liées.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const id = String(params.id || "").trim();
      if (!id) {
        setOrder(null);
        setNotFound(true);
        setReady(true);
        return;
      }
      void getOrderById(id)
        .then(async (next) => {
          if (cancelled) return;
          setOrder(next);
          setFeeDraft(
            next.deliveryFee == null ? "" : String(next.deliveryFee),
          );
          setEditingFee(false);
          setNotFound(false);
          setLoadError(null);
          await loadReservations(next.id);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setOrder(null);
          setReservations([]);
          if (error instanceof DemoApiError && error.status === 404) {
            setNotFound(true);
            setLoadError(null);
            return;
          }
          setNotFound(false);
          setLoadError(friendlyOrderLoadError(error, "detail"));
        })
        .finally(() => {
          if (!cancelled) setReady(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [params.id, loadReservations]);

  async function confirmAction() {
    if (!order || !pendingAction || busy) return;
    setBusy(true);
    try {
      const next =
        pendingAction === "cancel"
          ? await cancelOrder(order.id)
          : pendingAction === "confirmAgent"
            ? await confirmAgentPayment(order.id)
            : pendingAction === "confirmStore"
              ? await confirmStorePayment(order.id)
            : await updateOrderStatus(
                order.id,
                ACTION_STATUS[pendingAction as keyof typeof ACTION_STATUS],
              );
      await forceRefreshMaterialStores();
      setOrder(next);
      await loadReservations(next.id);
      setToast(ACTION_TOAST[pendingAction]);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof DemoApiError
          ? error.message
          : "Impossible de mettre à jour cette commande.",
      );
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  async function selectDeliveryMode(mode: "RETRAIT_DEPOT" | "LIVRAISON") {
    if (!order || busy || order.status !== "PRETE") return;
    setBusy(true);
    try {
      const next = await updateDeliveryMode(order.id, mode);
      setOrder(next);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof DemoApiError
          ? error.message
          : "Impossible d’enregistrer le mode de remise.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveDeliveryFee() {
    if (!order || busy) return;
    const amount = parseDeliveryFeeInput(feeDraft);
    if (amount == null) {
      setLoadError("Saisissez un montant de livraison valide.");
      return;
    }
    setBusy(true);
    try {
      const next = await updateOrderDeliveryFee(order.id, amount);
      setOrder(next);
      setFeeDraft(String(next.deliveryFee ?? amount));
      setEditingFee(false);
      setLoadError(null);
      setToast("Frais de livraison mis à jour.");
    } catch (error) {
      setLoadError(
        error instanceof DemoApiError
          ? error.message
          : "Impossible d’enregistrer les frais de livraison.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (ready && notFound) {
    return (
      <AdminShell
        active="materiaux"
        eyebrow="Matériaux de construction"
        title="Commande introuvable"
        icon={ClipboardList}
        backHref={routes.materialOrders}
        backLabel="Retour aux commandes"
        heroVariant="compact"
      >
        <EmptyState
          title="Commande introuvable"
          description="Cette commande est introuvable, ou la référence est incorrecte."
          action={
            <Link href={routes.materialOrders} className={styles.secondary}>
              Retour à la liste
            </Link>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow={
        order ? `Commande · ${formatCustomerKind(order)}` : "Commande matériaux"
      }
      title={order?.reference ?? "Commande"}
      icon={ClipboardList}
      backHref={routes.materialOrders}
      backLabel="Retour aux commandes"
      heroVariant="compact"
      badge={order ? formatOrderWorkflowLabel(order) : undefined}
      badgeTone={order ? statusTone(order.status) : "neutral"}
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Chargement de la commande…
        </div>
      ) : null}

      {order ? (
        <div className={styles.stack}>
          <section className={styles.summaryBar} aria-label="Synthèse commande">
            <div>
              <span>
                <UserRound size={13} aria-hidden="true" />
                Client
              </span>
              <strong>{order.customer.name}</strong>
            </div>
            <div>
              <span>
                <Wallet size={13} aria-hidden="true" />
                Montant
              </span>
              <strong>{formatOrderAmount(order.totalAmount)}</strong>
            </div>
            <div>
              <span>
                <Truck size={13} aria-hidden="true" />
                Réception
              </span>
              <strong>{formatDeliveryMode(order.deliveryMode)}</strong>
            </div>
          </section>

          <div className={styles.columns}>
            <div className={styles.column}>
              <section className={`${styles.card} ${styles.clientCard}`}>
                <div className={styles.cardHead}>
                  <h2>Informations client</h2>
                  <span className={styles.kindChip}>
                    {formatCustomerKind(order)}
                  </span>
                </div>
                <InfoGrid className={styles.compactGrid}>
                  <InfoField label="Nom" value={order.customer.name} />
                  <InfoField label="Téléphone">
                    <span className={styles.contactValue}>
                      {order.customer.phone || "—"}
                    </span>
                  </InfoField>
                  <InfoField label="E-mail">
                    <span className={styles.contactValue}>
                      {order.customer.email || "—"}
                    </span>
                  </InfoField>
                  <InfoField label="Ville" value={order.customer.city} />
                  <InfoField label="Quartier" value={order.customer.district} />
                  <InfoField
                    label="Fournisseur"
                    value={order.supplierName || "—"}
                  />
                  <InfoField
                    label="Adresse"
                    value={order.customer.address}
                    full
                  />
                  {order.customer.comment ? (
                    <InfoField
                      label="Commentaire"
                      value={order.customer.comment}
                      full
                    />
                  ) : null}
                </InfoGrid>
              </section>

              <section className={styles.card}>
                <h2>Produits commandés</h2>
                <div className={styles.lines}>
                  <div className={`${styles.lineGrid} ${styles.lineHead}`}>
                    <div>Produit</div>
                    <div>Quantité</div>
                    <div>Prix unitaire</div>
                    <div>Sous-total</div>
                  </div>
                  {order.items.map((item) => (
                    <article key={item.productId} className={styles.lineGrid}>
                      <strong data-label="Produit">{item.productName}</strong>
                      <span data-label="Quantité">
                        {formatOrderItemQuantity(item)}
                      </span>
                      <span data-label="Prix unitaire">
                        {formatOrderUnitPrice(item)}
                      </span>
                      <span data-label="Sous-total" className={styles.amount}>
                        {formatOrderAmount(item.subtotal)}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className={styles.column}>
              {order.status === "EN_ATTENTE" ||
              order.status === "EN_VERIFICATION" ||
              order.status === "VALIDEE" ||
              order.status === "PAIEMENT_EN_ATTENTE" ||
              order.status === "PAYEE" ||
              order.status === "EN_PREPARATION" ||
              (order.status === "PRETE" &&
                order.deliveryMode !== "LIVRAISON") ||
              canCancelMaterialOrder(order) ? (
                <section className={`${styles.card} ${styles.actionCard}`}>
                  <h2>Traitement commande</h2>
                  <p className={styles.note}>
                    Le statut Payée n’est appliqué qu’après confirmation du
                    paiement.
                  </p>
                  <div className={styles.actions}>
                    {order.status === "EN_ATTENTE" ||
                    order.status === "EN_VERIFICATION" ||
                    order.status === "VALIDEE" ? (
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => setPendingAction("requestPayment")}
                      >
                        Demander le paiement
                      </button>
                    ) : null}
                    {order.status === "PAYEE" ? (
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => setPendingAction("startPrep")}
                      >
                        Passer en préparation
                      </button>
                    ) : null}
                    {order.status === "EN_PREPARATION" ? (
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => setPendingAction("markReady")}
                      >
                        Commande prête
                      </button>
                    ) : null}
                    {order.status === "PRETE" && !order.deliveryMode ? (
                      <fieldset className={styles.modeChoice}>
                        <legend>Mode de remise</legend>
                        <label>
                          <input
                            type="radio"
                            name="deliveryMode"
                            checked={order.deliveryMode === "RETRAIT_DEPOT"}
                            disabled={busy}
                            onChange={() =>
                              void selectDeliveryMode("RETRAIT_DEPOT")
                            }
                          />
                          Retrait au magasin
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="deliveryMode"
                            checked={order.deliveryMode === "LIVRAISON"}
                            disabled={busy}
                            onChange={() => void selectDeliveryMode("LIVRAISON")}
                          />
                          Livraison à domicile
                        </label>
                      </fieldset>
                    ) : null}
                    {order.status === "PRETE" &&
                    order.deliveryMode === "RETRAIT_DEPOT" ? (
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => setPendingAction("confirmPickup")}
                      >
                        Confirmer le retrait
                      </button>
                    ) : null}
                    {canCancelMaterialOrder(order) ? (
                      <button
                        type="button"
                        className={styles.danger}
                        disabled={busy}
                        onClick={() => setPendingAction("cancel")}
                      >
                        Annuler
                      </button>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <PaymentCard
                order={order}
                busy={busy}
                onConfirmAgent={() => setPendingAction("confirmAgent")}
                onConfirmStore={() => setPendingAction("confirmStore")}
              />
            </div>
          </div>

          <ProductControlCard order={order} />

          <DeliveryFeeCard
            order={order}
            busy={busy}
            editing={editingFee}
            feeDraft={feeDraft}
            onFeeDraftChange={setFeeDraft}
            onStartEdit={() => {
              setEditingFee(true);
              setFeeDraft(
                order.deliveryFee == null ? "" : String(order.deliveryFee),
              );
            }}
            onCancelEdit={() => {
              setEditingFee(false);
              setFeeDraft(
                order.deliveryFee == null ? "" : String(order.deliveryFee),
              );
            }}
            onSave={() => void saveDeliveryFee()}
            onAction={setPendingAction}
          />

          <section className={styles.card}>
            <h2>Réservations</h2>
            {reservationError ? (
              <p className={styles.error} role="alert">
                {reservationError}
              </p>
            ) : reservations.length === 0 ? (
              <p className={styles.note}>
                Aucune réservation n’est liée à cette commande.
              </p>
            ) : (
              <div className={styles.lines}>
                <div className={`${styles.reservationGrid} ${styles.lineHead}`}>
                  <div>Produit</div>
                  <div>Quantité réservée</div>
                  <div>Statut</div>
                  <div>Expiration</div>
                </div>
                {reservations.map((item) => (
                  <article key={item.id} className={styles.reservationGrid}>
                    <strong>{reservationProductName(item, order)}</strong>
                    <span data-label="Quantité réservée">
                      {formatStockAmount(item.quantity)}
                    </span>
                    <span data-label="Statut">
                      <StatusBadge status={item.status} />
                    </span>
                    <span data-label="Expiration">
                      {formatReservationDate(item.expiresAt)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          {verificationTimeline(order).length > 0 ? (
            <section className={styles.card}>
              <h2>Historique</h2>
              <ol className={styles.timeline}>
                {verificationTimeline(order).map((entry) => (
                  <li key={entry.key}>
                    <span
                      className={
                        entry.kind === "status"
                          ? styles.timelineDotStatus
                          : styles.timelineDot
                      }
                      aria-hidden="true"
                    />
                    <div>
                      <strong>
                        {entry.kind === "status" && entry.status ? (
                          <StatusBadge status={entry.status} />
                        ) : (
                          entry.title
                        )}
                      </strong>
                      <p>
                        {formatOrderDate(entry.at)}
                        <span>par {entry.by}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      ) : null}
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction ? ACTION_DIALOG[pendingAction].title : ""}
        description={
          (pendingAction === "confirmAgent" ||
            pendingAction === "confirmStore") &&
          order
            ? `Confirmer le paiement de ${formatOrderAmount(order.totalAmount)} ? Ce montant doit correspondre au total attendu (sous-total + livraison).`
            : pendingAction
              ? ACTION_DIALOG[pendingAction].description
              : ""
        }
        subject={order?.reference}
        confirmLabel={
          pendingAction ? ACTION_DIALOG[pendingAction].confirm : "Confirmer"
        }
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}

function PaymentCard({
  order,
  busy,
  onConfirmAgent,
  onConfirmStore,
}: {
  order: MaterialOrder;
  busy: boolean;
  onConfirmAgent: () => void;
  onConfirmStore: () => void;
}) {
  const payment = order.payment;
  const agentPending = isAgentPaymentPending(order);
  const storePending = canConfirmStorePayment(order);
  return (
    <section className={styles.card}>
      <h2>{agentPending ? "Paiement avec agent" : "Paiement"}</h2>
      <InfoGrid className={styles.paymentGrid}>
        <InfoField label="Montant" value={formatOrderAmount(order.totalAmount)} />
        <InfoField
          label="Mode paiement"
          value={
            formatPaymentMethod(payment?.method) !== "—"
              ? formatPaymentMethod(payment?.method)
              : formatPaymentIntent(order.paymentIntent)
          }
        />
        <InfoField label="Statut paiement" value={formatPaymentStatus(order)} />
      </InfoGrid>
      <details className={styles.advanced}>
        <summary>Informations avancées</summary>
        <InfoGrid>
          <InfoField
            label="Demande de paiement"
            value={formatPaymentRequestState(order)}
          />
          <InfoField
            label="Choix du client"
            value={formatPaymentIntent(order.paymentIntent)}
          />
          <InfoField
            label="Canal"
            value={formatPaymentChannel(payment?.channel)}
          />
          <InfoField label="Référence" value={payment?.reference || "—"} />
          <InfoField
            label="Transaction"
            value={payment?.providerPaymentId || "—"}
          />
          <InfoField
            label="Date"
            value={
              payment?.confirmedAt ? formatOrderDate(payment.confirmedAt) : "—"
            }
          />
          {payment?.confirmedBy ? (
            <InfoField label="Confirmé par" value={payment.confirmedBy} />
          ) : null}
        </InfoGrid>
      </details>
      {agentPending ? (
        <>
          <p className={styles.note}>
            La preuve WhatsApp n’est pas une confirmation automatique. Vérifiez
            le règlement puis confirmez le montant attendu{" "}
            {formatOrderAmount(order.totalAmount)}.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={onConfirmAgent}
            >
              Confirmer le paiement
            </button>
          </div>
        </>
      ) : null}
      {storePending ? (
        <>
          <p className={styles.note}>
            Le client a choisi de payer au magasin. Confirmez uniquement après
            réception réelle du règlement de{" "}
            {formatOrderAmount(order.totalAmount)}.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={onConfirmStore}
            >
              Confirmer le paiement
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ProductControlCard({ order }: { order: MaterialOrder }) {
  return (
    <section className={`${styles.card} ${styles.productCard}`}>
      <h2>Contrôle stock</h2>
      <p className={styles.note}>
        Demandé, physique, réservé et disponible réel. Le stock n’est pas
        modifié ici.
      </p>
      <div className={styles.lines}>
        <div className={`${styles.verifyGrid} ${styles.lineHead}`}>
          <div>Produit</div>
          <div>Demandé</div>
          <div>Physique</div>
          <div>Réservé</div>
          <div>Disponible réel</div>
          <div>Statut</div>
        </div>
        {order.items.map((item) => {
          const stock = item.stock;
          const unit = item.unitName || item.unitSymbol || "unité";
          const physical = stock?.quantity ?? 0;
          const reserved = stock?.reservedQuantity ?? 0;
          const available = Math.max(0, physical - reserved);
          const result = stock?.result ?? "—";
          return (
            <article key={item.productId} className={styles.verifyGrid}>
              <strong data-label="Produit">{item.productName}</strong>
              <span data-label="Demandé">
                {formatStockAmount(item.quantity)} {unit}
              </span>
              <span data-label="Physique">{formatStockAmount(physical)}</span>
              <span data-label="Réservé">{formatStockAmount(reserved)}</span>
              <span data-label="Disponible réel">
                {formatStockAmount(available)}
              </span>
              <span data-label="Statut">
                <span
                  className={
                    result === "Disponible" ? styles.stockOk : styles.stockKo
                  }
                >
                  {result}
                </span>
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DeliveryFeeCard({
  order,
  busy,
  editing,
  feeDraft,
  onFeeDraftChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onAction,
}: {
  order: MaterialOrder;
  busy: boolean;
  editing: boolean;
  feeDraft: string;
  onFeeDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onAction: (action: keyof typeof ACTION_DIALOG) => void;
}) {
  const pickup = order.deliveryMode === "RETRAIT_DEPOT";
  const delivery = order.deliveryMode === "LIVRAISON";
  const editable = canEditDeliveryFee(order);

  return (
    <section className={`${styles.card} ${styles.deliveryCard}`}>
      <div className={styles.deliveryHead}>
        {delivery ? <Truck size={18} aria-hidden="true" /> : null}
        <h2>
          {pickup
            ? "Retrait au magasin"
            : delivery
              ? "Gestion de la livraison"
              : "Totaux de la commande"}
        </h2>
      </div>
      {delivery ? (
        <dl className={styles.deliveryMeta}>
          <div>
            <dt>Client</dt>
            <dd>{order.customer.name}</dd>
          </div>
          <div>
            <dt>Téléphone</dt>
            <dd>{order.customer.phone || "—"}</dd>
          </div>
          <div>
            <dt>Destination</dt>
            <dd>
              {order.customer.city} — {order.customer.district}
            </dd>
          </div>
          {order.customer.address ? (
            <div>
              <dt>Adresse</dt>
              <dd>{order.customer.address}</dd>
            </div>
          ) : null}
          {order.customer.comment ? (
            <div>
              <dt>Indication</dt>
              <dd>{order.customer.comment}</dd>
            </div>
          ) : null}
        </dl>
      ) : pickup ? (
        <p className={styles.note}>
          Mode de réception : retrait au magasin. Aucun frais de livraison
          n’est applicable. Le total reste le sous-total des matériaux.
        </p>
      ) : null}

      {delivery && editable ? (
        <div className={styles.feeEditor}>
          <label>
            Frais de livraison
            {editing ? (
              <input
                inputMode="numeric"
                value={feeDraft}
                disabled={busy}
                placeholder="50000"
                onChange={(event) => onFeeDraftChange(event.target.value)}
              />
            ) : (
              <strong>{formatDeliveryFee(order)}</strong>
            )}
          </label>
          <div className={styles.actions}>
            {editing ? (
              <>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={busy}
                  onClick={onSave}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy}
                  onClick={onCancelEdit}
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.primary}
                disabled={busy}
                onClick={onStartEdit}
              >
                Modifier les frais de livraison
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.feeReadout}>
          <span>Frais de livraison</span>
          <strong>{formatDeliveryFee(order)}</strong>
        </p>
      )}

      <dl className={styles.moneyStack}>
        <div>
          <dt>Sous-total matériaux</dt>
          <dd>{formatOrderAmount(orderSubtotal(order))}</dd>
        </div>
        <div>
          <dt>Frais de livraison</dt>
          <dd>{formatDeliveryFee(order)}</dd>
        </div>
        <div className={styles.moneyTotal}>
          <dt>Total</dt>
          <dd>{formatOrderAmount(order.totalAmount)}</dd>
        </div>
      </dl>

      <div className={styles.deliveryStatus}>
        <span>Statut</span>
        <StatusBadge
          status={order.status}
          label={formatOrderWorkflowLabel(order)}
        />
      </div>

      {delivery && order.status === "PRETE" ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => onAction("startDelivery")}
          >
            Passer en livraison
          </button>
        </div>
      ) : null}
      {delivery && order.status === "EN_LIVRAISON" ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => onAction("confirmDelivery")}
          >
            Livrée
          </button>
        </div>
      ) : null}
    </section>
  );
}
