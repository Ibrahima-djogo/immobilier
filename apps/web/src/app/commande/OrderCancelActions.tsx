"use client";

import { useState } from "react";

import { Button, ConfirmDialog } from "@/components/ui";
import {
  canCancelOwnOrder,
  cancelOwnMaterialOrder,
  friendlyCancelError,
  type MaterialOrder,
} from "@/lib/commande/orders";

import styles from "./confirmation/page.module.css";

type Props = {
  order: MaterialOrder;
  accessToken?: string;
  onOrderChange?: (order: MaterialOrder) => void;
};

export function OrderCancelActions({
  order,
  accessToken,
  onOrderChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCancelOwnOrder(order)) return null;

  async function confirmCancel() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await cancelOwnMaterialOrder(order.id, accessToken);
      onOrderChange?.(next);
      setOpen(false);
    } catch (cause: unknown) {
      setError(friendlyCancelError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className={styles.quietActions}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => setOpen(true)}
        >
          Annuler la commande
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        title="Annuler cette commande ?"
        description="La commande sera annulée et les quantités réservées seront libérées. Cette action est définitive."
        subject={order.reference}
        confirmLabel={busy ? "Annulation…" : "Confirmer l’annulation"}
        cancelLabel="Conserver la commande"
        onCancel={() => {
          if (!busy) setOpen(false);
        }}
        onConfirm={() => void confirmCancel()}
      />
    </>
  );
}
