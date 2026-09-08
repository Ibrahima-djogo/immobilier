/**
 * Brouillon client (localStorage). La commande confirmée
 * est créée via POST /materials/orders.
 */

export type CheckoutDeliveryMode = "RETRAIT_DEPOT" | "LIVRAISON";

export type CheckoutCustomerDraft = {
  nomComplet: string;
  telephone: string;
  email: string;
  ville: string;
  quartier: string;
  adresse: string;
  commentaire: string;
  deliveryMode?: CheckoutDeliveryMode | "";
};

export const EMPTY_CHECKOUT_CUSTOMER: CheckoutCustomerDraft = {
  nomComplet: "",
  telephone: "",
  email: "",
  ville: "",
  quartier: "",
  adresse: "",
  commentaire: "",
  deliveryMode: "",
};
