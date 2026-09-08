"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button, FieldError, fieldA11y } from "@/components/ui";
import { useCart } from "@/context/CartContext";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import {
  getCheckoutCustomer,
  getGuestCheckoutCustomer,
  saveCheckoutCustomer,
  saveGuestCheckoutCustomer,
} from "@/lib/commande/checkout-storage";
import { saveGuestOrderAccess } from "@/lib/commande/guest-order-access";
import {
  checkoutMaterialOrders,
  friendlyOrderError,
  newIdempotencyKey,
} from "@/lib/commande/orders";
import {
  EMPTY_CHECKOUT_CUSTOMER,
  type CheckoutCustomerDraft,
  type CheckoutDeliveryMode,
} from "@/lib/commande/types";
import {
  formatMaterialPrice,
  materialPricing,
  materialSupplierName,
} from "@/lib/materiaux/catalog";
import { loadPublicCatalog } from "@/lib/materiaux/catalog-source";
import type { PublicCatalog } from "@/lib/materiaux/types";
import { formatCartMoney, resolveCart } from "@/lib/panier/cart";
import { CART_MESSAGES } from "@/lib/panier/types";
import { routes } from "@/lib/routes/app-routes";
import {
  checkoutCustomerSchema,
  checkoutDeliveryModeSchema,
  safeParseFields,
} from "@/lib/validation";

import styles from "./page.module.css";

export function CheckoutInformationView() {
  const router = useRouter();
  const { session, ready: sessionReady, isLoggedIn } = usePublicDemoSession();
  const { ready, lines, clearCart } = useCart();
  const [values, setValues] = useState<CheckoutCustomerDraft>(
    EMPTY_CHECKOUT_CUSTOMER,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderJustCreated, setOrderJustCreated] = useState(false);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  const idempotencyKeyRef = useRef("");

  useEffect(() => {
    if (!sessionReady) return;
    const scope = isLoggedIn && session?.id ? session.id : "guest";
    if (prefilledFor === scope) return;

    if (isLoggedIn && session?.id) {
      const draft = getCheckoutCustomer(session.id);
      setValues({
        nomComplet: draft.nomComplet.trim() || session.name || "",
        telephone: draft.telephone.trim() || session.phone || "",
        email: draft.email.trim() || session.email || "",
        ville: draft.ville.trim(),
        quartier: draft.quartier.trim(),
        adresse: draft.adresse.trim(),
        commentaire: draft.commentaire.trim(),
        deliveryMode: draft.deliveryMode || "",
      });
    } else {
      setValues(getGuestCheckoutCustomer());
    }
    setPrefilledFor(scope);
  }, [
    isLoggedIn,
    prefilledFor,
    session?.email,
    session?.id,
    session?.name,
    session?.phone,
    sessionReady,
  ]);

  useEffect(() => {
    if (!ready || !sessionReady || orderJustCreated) return;
    if (lines.length === 0) {
      router.replace(`${routes.cart}?vide=1`);
    }
  }, [lines.length, orderJustCreated, ready, router, sessionReady]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadPublicCatalog()
        .then((next) => {
          if (cancelled) return;
          setCatalog(next);
          setLoadError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setCatalog(null);
          setLoadError(CART_MESSAGES.loadError);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const resolved = resolveCart(lines, catalog);
  const supplierKeys = new Set(
    resolved.lines
      .map((line) =>
        line.material
          ? line.material.supplierId?.trim() ||
            materialSupplierName(line.material)
          : "",
      )
      .filter(Boolean),
  );
  const multipleSuppliers = supplierKeys.size > 1;
  const deliveryMode = values.deliveryMode;
  const estimatedSubtotal = resolved.total;
  const deliveryFeeLabel =
    deliveryMode === "RETRAIT_DEPOT"
      ? formatCartMoney(0)
      : deliveryMode === "LIVRAISON"
        ? "À confirmer"
        : "—";
  const estimatedTotalLabel =
    deliveryMode === "LIVRAISON"
      ? `${formatCartMoney(estimatedSubtotal)} + livraison`
      : formatCartMoney(estimatedSubtotal);

  function setField<K extends keyof CheckoutCustomerDraft>(
    key: K,
    value: CheckoutCustomerDraft[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSubmitError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const parsedCustomer = safeParseFields(checkoutCustomerSchema, values);
    const parsedMode = checkoutDeliveryModeSchema.safeParse(values.deliveryMode);
    if (!parsedCustomer.ok || !parsedMode.success) {
      setErrors({
        ...(parsedCustomer.ok ? {} : parsedCustomer.errors),
        ...(!parsedMode.success
          ? {
              deliveryMode:
                parsedMode.error.issues[0]?.message ||
                "Choisissez le retrait au magasin ou la livraison à domicile.",
            }
          : {}),
      });
      setSubmitError(null);
      return;
    }

    if (lines.length === 0) {
      setSubmitError("Votre panier est vide.");
      return;
    }

    const mode = parsedMode.data as CheckoutDeliveryMode;
    const draft: CheckoutCustomerDraft = {
      nomComplet: parsedCustomer.data.nomComplet,
      telephone: parsedCustomer.data.telephone,
      email: parsedCustomer.data.email,
      ville: parsedCustomer.data.ville,
      quartier: parsedCustomer.data.quartier,
      adresse: parsedCustomer.data.adresse,
      commentaire: parsedCustomer.data.commentaire,
      deliveryMode: mode,
    };
    if (isLoggedIn && session?.id) {
      saveCheckoutCustomer(session.id, draft);
    } else {
      saveGuestCheckoutCustomer(draft);
    }
    setValues(draft);
    setErrors({});

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = newIdempotencyKey();
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await checkoutMaterialOrders({
        customer: draft,
        deliveryMode: mode,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
        idempotencyKey: idempotencyKeyRef.current,
      });
      const orders = result.orders || [];
      const order = orders[0];
      if (!order) {
        setSubmitError("Impossible de créer la commande.");
        return;
      }
      if (!isLoggedIn) {
        for (const created of orders) {
          if (created.accessToken) {
            saveGuestOrderAccess({
              id: created.id,
              reference: created.reference,
              accessToken: created.accessToken,
            });
          }
        }
      }
      setOrderJustCreated(true);
      clearCart();
      router.replace(routes.checkoutOrder(order.id, order.accessToken));
    } catch (error) {
      setSubmitError(friendlyOrderError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionReady || !ready || (lines.length === 0 && !orderJustCreated)) {
    return (
      <p className={styles.status} role="status">
        Vérification du panier…
      </p>
    );
  }

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <p className={styles.formIntro}>
          {isLoggedIn
            ? "Vos informations de compte sont proposées. Vérifiez-les avant de confirmer."
            : "Aucune connexion n’est requise. Conservez votre référence pour suivre la commande."}{" "}
          Après validation, les quantités commandées sont réservées
          automatiquement.
        </p>

        {submitError ? (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        ) : null}

        <section className={styles.block}>
          <h2>Informations client</h2>
          <p className={styles.blockHint}>
            Nom, téléphone, ville et adresse pour vous recontacter.
          </p>
          <label className={styles.field}>
            Nom complet
            <input
              autoComplete="name"
              value={values.nomComplet}
              onChange={(event) => setField("nomComplet", event.target.value)}
              placeholder="Votre nom complet"
              className={errors.nomComplet ? styles.inputError : undefined}
              disabled={submitting}
              {...fieldA11y("checkout-nom-error", errors.nomComplet)}
            />
            <FieldError id="checkout-nom-error" message={errors.nomComplet} />
          </label>

          <div className={styles.two}>
            <label className={styles.field}>
              Téléphone
              <input
                type="tel"
                autoComplete="tel"
                value={values.telephone}
                onChange={(event) => setField("telephone", event.target.value)}
                placeholder="+224 6XX XX XX XX"
                className={errors.telephone ? styles.inputError : undefined}
                disabled={submitting}
                {...fieldA11y("checkout-tel-error", errors.telephone)}
              />
              <FieldError id="checkout-tel-error" message={errors.telephone} />
            </label>
            <label className={styles.field}>
              E-mail <span>facultatif</span>
              <input
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="exemple@email.com"
                className={errors.email ? styles.inputError : undefined}
                disabled={submitting}
                {...fieldA11y("checkout-email-error", errors.email)}
              />
              <FieldError id="checkout-email-error" message={errors.email} />
            </label>
          </div>

          <div className={styles.two}>
            <label className={styles.field}>
              Ville
              <input
                autoComplete="address-level2"
                value={values.ville}
                onChange={(event) => setField("ville", event.target.value)}
                placeholder="Conakry"
                className={errors.ville ? styles.inputError : undefined}
                disabled={submitting}
                {...fieldA11y("checkout-ville-error", errors.ville)}
              />
              <FieldError id="checkout-ville-error" message={errors.ville} />
            </label>
            <label className={styles.field}>
              Quartier
              <input
                value={values.quartier}
                onChange={(event) => setField("quartier", event.target.value)}
                placeholder="Quartier"
                className={errors.quartier ? styles.inputError : undefined}
                disabled={submitting}
                {...fieldA11y("checkout-quartier-error", errors.quartier)}
              />
              <FieldError
                id="checkout-quartier-error"
                message={errors.quartier}
              />
            </label>
          </div>

          <label className={styles.field}>
            {deliveryMode === "LIVRAISON"
              ? "Adresse de livraison"
              : "Adresse complète"}
            <input
              autoComplete="street-address"
              value={values.adresse}
              onChange={(event) => setField("adresse", event.target.value)}
              placeholder="Rue, immeuble, précisions d’accès"
              className={errors.adresse ? styles.inputError : undefined}
              disabled={submitting}
              {...fieldA11y("checkout-adresse-error", errors.adresse)}
            />
            <FieldError id="checkout-adresse-error" message={errors.adresse} />
          </label>

          <label className={styles.field}>
            Message / commentaire <span>facultatif</span>
            <textarea
              rows={4}
              value={values.commentaire}
              onChange={(event) => setField("commentaire", event.target.value)}
              placeholder="Précisions utiles pour le suivi"
              className={errors.commentaire ? styles.inputError : undefined}
              disabled={submitting}
              {...fieldA11y("checkout-commentaire-error", errors.commentaire)}
            />
            <FieldError
              id="checkout-commentaire-error"
              message={errors.commentaire}
            />
          </label>
        </section>

        <fieldset className={styles.modes}>
          <legend>Réception</legend>
          <p className={styles.modeHint}>
            Choisissez comment vous souhaitez recevoir vos matériaux.
          </p>
          <label
            className={`${styles.modeCard} ${
              deliveryMode === "RETRAIT_DEPOT" ? styles.modeCardOn : ""
            }`}
          >
            <input
              type="radio"
              name="deliveryMode"
              value="RETRAIT_DEPOT"
              checked={deliveryMode === "RETRAIT_DEPOT"}
              disabled={submitting}
              onChange={() => setField("deliveryMode", "RETRAIT_DEPOT")}
            />
            <span>
              <strong>Retrait magasin</strong>
              <em>Vous retirez vos matériaux au dépôt. Aucun frais de livraison.</em>
            </span>
          </label>
          <label
            className={`${styles.modeCard} ${
              deliveryMode === "LIVRAISON" ? styles.modeCardOn : ""
            }`}
          >
            <input
              type="radio"
              name="deliveryMode"
              value="LIVRAISON"
              checked={deliveryMode === "LIVRAISON"}
              disabled={submitting}
              onChange={() => setField("deliveryMode", "LIVRAISON")}
            />
            <span>
              <strong>Livraison</strong>
              <em>Les frais de livraison seront confirmés ensuite.</em>
            </span>
          </label>
          <FieldError
            id="checkout-mode-error"
            message={errors.deliveryMode}
          />
        </fieldset>

        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Création en cours…" : "Confirmer la commande"}
          </Button>
          <Button
            href={routes.cart}
            variant="secondary"
            fullWidth
            disabled={submitting}
          >
            Retour au panier
          </Button>
        </div>
      </form>

      <aside className={styles.summary}>
        <h2>Résumé commande</h2>
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
        <ul className={styles.lines}>
          {resolved.lines.map((line) => {
            const packaging = line.material
              ? materialPricing(line.material).packaging?.trim() || ""
              : "";
            return (
              <li key={line.productId}>
                <div>
                  {line.material ? (
                    <Link href={routes.material(line.material.slug)}>
                      {line.material.name} × {line.quantity}
                    </Link>
                  ) : (
                    <strong>{CART_MESSAGES.unavailable}</strong>
                  )}
                  {packaging ? <p>{packaging}</p> : null}
                  <p>
                    {line.material
                      ? formatMaterialPrice(
                          line.material.price,
                          line.material.unitLabel,
                        )
                      : "—"}
                  </p>
                </div>
                <span>
                  {line.unitPrice == null ? "—" : formatCartMoney(line.subtotal)}
                </span>
              </li>
            );
          })}
        </ul>
        <dl className={styles.totals}>
          <div>
            <dt>Nombre d’articles</dt>
            <dd>{resolved.articleCount}</dd>
          </div>
          <div>
            <dt>Sous-total</dt>
            <dd>{formatCartMoney(estimatedSubtotal)}</dd>
          </div>
          {deliveryMode ? (
            <div>
              <dt>Livraison</dt>
              <dd>{deliveryFeeLabel}</dd>
            </div>
          ) : null}
          <div className={styles.totalRow}>
            <dt>Total</dt>
            <dd>
              <strong>{estimatedTotalLabel}</strong>
            </dd>
          </div>
        </dl>
        <p className={styles.note}>
          Les frais de livraison seront confirmés ensuite si vous choisissez
          la livraison.
        </p>
      </aside>
    </div>
  );
}
