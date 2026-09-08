"use client";

import { useState, type FormEvent } from "react";
import { Minus, Plus } from "lucide-react";

import { Button, FieldError, fieldA11y } from "@/components/ui";
import { useCart } from "@/context/CartContext";
import { loadPublicMaterial } from "@/lib/materiaux/catalog-source";
import type { PublicMaterialAvailability } from "@/lib/materiaux/types";
import { CART_MESSAGES } from "@/lib/panier/types";
import { parseCartQuantity } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import styles from "./AddToCartForm.module.css";

type AddToCartFormProps = {
  productId: string;
  slug: string;
  unitLabel: string;
  initialAvailableQuantity: number;
  availability: PublicMaterialAvailability;
};

export function AddToCartForm({
  productId,
  slug,
  unitLabel,
  initialAvailableQuantity,
  availability,
}: AddToCartFormProps) {
  const { addItem, lines } = useCart();
  const [rawQuantity, setRawQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const soldOut =
    !productId ||
    availability === "RUPTURE" ||
    initialAvailableQuantity <= 0;
  const alreadyInCart =
    lines.find((item) => item.productId === productId)?.quantity ?? 0;

  function bump(delta: number) {
    const parsed = parseCartQuantity(rawQuantity);
    const current = parsed.ok ? parsed.value : 1;
    const next = Math.max(1, current + delta);
    setRawQuantity(String(next));
    setError(null);
    setSuccess(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseCartQuantity(rawQuantity);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const live = await loadPublicMaterial(slug);
      if (!live || live.availableQuantity <= 0) {
        setError(CART_MESSAGES.unavailable);
        return;
      }
      const result = addItem(productId, parsed.value, live.availableQuantity);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(CART_MESSAGES.added);
    } catch {
      setError(CART_MESSAGES.loadError);
    } finally {
      setBusy(false);
    }
  }

  if (soldOut) {
    return (
      <div className={styles.block}>
        <Button disabled fullWidth>
          Ajouter au panier
        </Button>
        <p className={styles.hint} role="status">
          {CART_MESSAGES.unavailable}
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.label} htmlFor="cart-quantity">
        Quantité
        <span>{unitLabel}</span>
      </label>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.step}
          aria-label="Diminuer la quantité"
          onClick={() => bump(-1)}
          disabled={busy}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <input
          id="cart-quantity"
          inputMode="numeric"
          autoComplete="off"
          value={rawQuantity}
          onChange={(event) => {
            setRawQuantity(event.target.value);
            setError(null);
            setSuccess(null);
          }}
          {...fieldA11y("cart-quantity-error", error ?? undefined)}
        />
        <button
          type="button"
          className={styles.step}
          aria-label="Augmenter la quantité"
          onClick={() => bump(1)}
          disabled={busy}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <FieldError id="cart-quantity-error" message={error ?? undefined} />
      {success ? (
        <p className={styles.success} role="status">
          {success}
        </p>
      ) : null}
      {alreadyInCart > 0 ? (
        <p className={styles.already}>
          Déjà dans le panier : {alreadyInCart} {unitLabel.toLowerCase()}
        </p>
      ) : null}
      <Button type="submit" fullWidth disabled={busy}>
        {busy ? "Vérification…" : "Ajouter au panier"}
      </Button>
      <p className={styles.hint}>
        Le stock n’est pas réservé à l’ajout au panier. La réservation est
        effectuée automatiquement après validation de la commande.{" "}
        <a href={routes.cart}>Voir le panier</a>
      </p>
    </form>
  );
}
