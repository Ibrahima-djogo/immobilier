"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { MaterialPhoto } from "@/components/materiaux/MaterialPhoto";
import { useCart } from "@/context/CartContext";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import {
  formatMaterialPricing,
  materialImageUrl,
  materialPricing,
  materialSupplierName,
  materialUnit,
} from "@/lib/materiaux/catalog";
import { loadPublicCatalog } from "@/lib/materiaux/catalog-source";
import type { PublicCatalog } from "@/lib/materiaux/types";
import {
  formatCartMoney,
  parseCartQuantity,
  resolveCart,
  type ResolvedCartLine,
} from "@/lib/panier/cart";
import { CART_MESSAGES } from "@/lib/panier/types";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

function cartHasMultipleSuppliers(lines: ResolvedCartLine[]) {
  const keys = new Set<string>();
  for (const line of lines) {
    if (!line.material) continue;
    const key =
      line.material.supplierId?.trim() ||
      materialSupplierName(line.material);
    if (key) keys.add(key);
  }
  return keys.size > 1;
}

export function CartView() {
  const { lines, setItemQuantity, removeItem } = useCart();
  const { ready: sessionReady, isLoggedIn } = usePublicDemoSession();
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const refreshCatalog = useCallback(async () => {
    try {
      const next = await loadPublicCatalog();
      setCatalog(next);
      setLoadError(null);
    } catch {
      setCatalog(null);
      setLoadError(CART_MESSAGES.loadError);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshCatalog();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshCatalog]);

  const resolved = resolveCart(lines, catalog);
  const multipleSuppliers = cartHasMultipleSuppliers(resolved.lines);

  function updateQuantity(productId: string, raw: string, available: number) {
    const parsed = parseCartQuantity(raw);
    if (!parsed.ok) {
      setLineErrors((current) => ({ ...current, [productId]: parsed.error }));
      return;
    }
    const result = setItemQuantity(productId, parsed.value, available);
    if (!result.ok) {
      setLineErrors((current) => ({ ...current, [productId]: result.error }));
      return;
    }
    setLineErrors((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  if (!ready) {
    return (
      <p className={styles.status} role="status">
        Chargement du panier…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <ShoppingBag size={32} aria-hidden="true" />
        <h2>{CART_MESSAGES.empty}</h2>
        <p>
          Parcourez le catalogue pour sélectionner les matériaux de votre
          chantier.
        </p>
        <Button href={routes.materials}>Découvrir les matériaux</Button>
      </div>
    );
  }

  return (
    <>
      {loadError ? (
        <p className={styles.banner} role="alert">
          {loadError}
        </p>
      ) : null}

      {multipleSuppliers ? (
        <p className={styles.notice} role="status">
          Votre panier contient des produits provenant de plusieurs
          fournisseurs. Les commandes seront séparées automatiquement.
        </p>
      ) : null}

      <section className={styles.list} aria-label="Articles du panier">
        <p className={styles.listCount}>
          {resolved.articleCount} article
          {resolved.articleCount > 1 ? "s" : ""}
        </p>
        <ul className={styles.lines}>
          {resolved.lines.map((line) => {
            const material = line.material;
            const available = material?.availableQuantity ?? 0;
            const canAdjust = Boolean(material) && available > 0;
            const overstock =
              Boolean(material) && line.quantity > available;
            const category =
              material?.category?.name?.trim() ||
              material?.categoryName?.trim() ||
              "";
            const packaging = material
              ? materialPricing(material).packaging?.trim() || ""
              : "";
            return (
              <li key={line.productId} className={styles.line}>
                <div className={styles.media}>
                  <MaterialPhoto
                    imageUrl={material ? materialImageUrl(material) : ""}
                    alt={material?.name ?? "Matériau"}
                    sizes="(max-width: 800px) 96px, 120px"
                    className={styles.image}
                  />
                </div>

                <div className={styles.details}>
                  {category ? (
                    <p className={styles.category}>{category}</p>
                  ) : null}
                  {material ? (
                    <Link href={routes.material(material.slug)}>
                      {material.name}
                    </Link>
                  ) : (
                    <strong>Produit indisponible</strong>
                  )}
                  {packaging ? (
                    <p className={styles.packaging}>{packaging}</p>
                  ) : null}
                  {material ? (
                    <p className={styles.unitPrice}>
                      {formatMaterialPricing(material)}
                    </p>
                  ) : (
                    <p className={styles.unitPrice}>
                      {CART_MESSAGES.unavailable}
                    </p>
                  )}
                  {line.issueMessage ? (
                    <p className={styles.issue} role="status">
                      {line.issueMessage}
                    </p>
                  ) : null}
                  {overstock && available >= 1 ? (
                    <button
                      type="button"
                      className={styles.reduce}
                      onClick={() =>
                        updateQuantity(
                          line.productId,
                          String(available),
                          available,
                        )
                      }
                    >
                      Réduire à {available}{" "}
                      {material ? materialUnit(material).toLowerCase() : ""}
                    </button>
                  ) : null}
                </div>

                <div className={styles.controls}>
                  <div className={styles.qtyBlock}>
                    <p className={styles.qtyLabel} id={`qty-label-${line.productId}`}>
                      Quantité
                    </p>
                    <div className={styles.qty}>
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        disabled={!canAdjust || line.quantity <= 1}
                        onClick={() =>
                          updateQuantity(
                            line.productId,
                            String(Math.max(1, line.quantity - 1)),
                            available,
                          )
                        }
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <input
                        aria-labelledby={`qty-label-${line.productId}`}
                        inputMode="numeric"
                        value={drafts[line.productId] ?? String(line.quantity)}
                        disabled={!canAdjust}
                        onChange={(event) => {
                          setDrafts((current) => ({
                            ...current,
                            [line.productId]: event.target.value,
                          }));
                          setLineErrors((current) => {
                            const next = { ...current };
                            delete next[line.productId];
                            return next;
                          });
                        }}
                        onBlur={(event) => {
                          updateQuantity(
                            line.productId,
                            event.target.value,
                            available,
                          );
                          setDrafts((current) => {
                            const next = { ...current };
                            delete next[line.productId];
                            return next;
                          });
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        disabled={
                          !canAdjust || line.quantity >= available
                        }
                        onClick={() =>
                          updateQuantity(
                            line.productId,
                            String(line.quantity + 1),
                            available,
                          )
                        }
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  {lineErrors[line.productId] ? (
                    <p className={styles.issue} role="alert">
                      {lineErrors[line.productId]}
                    </p>
                  ) : null}
                  <p className={styles.subtotal}>
                    <span>Total</span>
                    {line.unitPrice == null
                      ? "—"
                      : formatCartMoney(line.subtotal)}
                  </p>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeItem(line.productId)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className={styles.summary}>
        <h2>Résumé commande</h2>
        <dl className={styles.totals}>
          <div>
            <dt>Nombre d’articles</dt>
            <dd>{resolved.articleCount}</dd>
          </div>
          <div>
            <dt>Sous-total</dt>
            <dd>{formatCartMoney(resolved.total)}</dd>
          </div>
          <div className={styles.totalRow}>
            <dt>Total</dt>
            <dd className={styles.total}>{formatCartMoney(resolved.total)}</dd>
          </div>
        </dl>
        <p className={styles.note}>
          Les frais de livraison seront confirmés à l’étape suivante. Le stock
          est réservé automatiquement après validation de la commande.
        </p>
        <Button href={routes.materials} variant="secondary" fullWidth>
          Continuer mes achats
        </Button>
        <Button href={routes.checkoutInformation} fullWidth>
          Passer commande
        </Button>
        {sessionReady && !isLoggedIn ? (
          <p className={styles.note}>
            Un compte n’est pas obligatoire. Vous pourrez retrouver votre
            commande avec la référence et votre téléphone.
          </p>
        ) : null}
      </aside>
    </>
  );
}
