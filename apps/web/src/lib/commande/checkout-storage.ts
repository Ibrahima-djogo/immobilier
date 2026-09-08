/**
 * Brouillon des informations client (localStorage), isolé par userId.
 * La commande confirmée est persistée par POST /materials/orders.
 * Ne jamais réutiliser un brouillon sans userId : il était partagé entre comptes.
 */

import {
  EMPTY_CHECKOUT_CUSTOMER,
  type CheckoutCustomerDraft,
} from "./types";

export const CHECKOUT_CUSTOMER_KEY = "demeure-guinee-checkout-customer";
/** Brouillon visiteur — jamais partagé avec un compte connecté. */
export const GUEST_CHECKOUT_SCOPE = "guest";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function scopedKey(userId: string) {
  return `${CHECKOUT_CUSTOMER_KEY}:${userId}`;
}

function dropLegacySharedDraft() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CHECKOUT_CUSTOMER_KEY);
}

function hydrate(value: unknown, userId: string): CheckoutCustomerDraft {
  if (!value || typeof value !== "object") return { ...EMPTY_CHECKOUT_CUSTOMER };
  const item = value as Partial<CheckoutCustomerDraft> & { userId?: string };
  if (item.userId && item.userId !== userId) {
    return { ...EMPTY_CHECKOUT_CUSTOMER };
  }
  return {
    nomComplet: typeof item.nomComplet === "string" ? item.nomComplet : "",
    telephone: typeof item.telephone === "string" ? item.telephone : "",
    email: typeof item.email === "string" ? item.email : "",
    ville: typeof item.ville === "string" ? item.ville : "",
    quartier: typeof item.quartier === "string" ? item.quartier : "",
    adresse: typeof item.adresse === "string" ? item.adresse : "",
    commentaire: typeof item.commentaire === "string" ? item.commentaire : "",
    deliveryMode:
      item.deliveryMode === "RETRAIT_DEPOT" || item.deliveryMode === "LIVRAISON"
        ? item.deliveryMode
        : "",
  };
}

export function getGuestCheckoutCustomer(): CheckoutCustomerDraft {
  return getCheckoutCustomer(GUEST_CHECKOUT_SCOPE);
}

export function saveGuestCheckoutCustomer(draft: CheckoutCustomerDraft) {
  saveCheckoutCustomer(GUEST_CHECKOUT_SCOPE, draft);
}

export function getCheckoutCustomer(userId: string): CheckoutCustomerDraft {
  dropLegacySharedDraft();
  if (!userId || !canUseStorage()) return { ...EMPTY_CHECKOUT_CUSTOMER };
  try {
    const raw = window.localStorage.getItem(scopedKey(userId));
    if (!raw) return { ...EMPTY_CHECKOUT_CUSTOMER };
    return hydrate(JSON.parse(raw) as unknown, userId);
  } catch {
    return { ...EMPTY_CHECKOUT_CUSTOMER };
  }
}

export function saveCheckoutCustomer(
  userId: string,
  draft: CheckoutCustomerDraft,
) {
  dropLegacySharedDraft();
  if (!userId || !canUseStorage()) return;
  try {
    window.localStorage.setItem(
      scopedKey(userId),
      JSON.stringify({ ...hydrate(draft, userId), userId }),
    );
  } catch {
    // Quota / mode privé : la saisie reste en mémoire de page.
  }
}

export function clearCheckoutCustomer(userId?: string) {
  if (!canUseStorage()) return;
  dropLegacySharedDraft();
  if (userId) {
    window.localStorage.removeItem(scopedKey(userId));
  }
}
