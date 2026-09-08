/**
 * État local du panier visiteur.
 * localStorage ne persiste jamais nom, prix, image, stock ni catégorie.
 */

/** Forme persistée — uniquement des identifiants et une quantité. */
export type StoredCartItem = {
  productId: string;
  quantity: number;
  addedAt: string;
};

export type MaterialCartItem = StoredCartItem & {
  id: string;
};

/** Alias conservé pour les écrans déjà branchés sur CartLine. */
export type CartLine = MaterialCartItem;

export type CartLineIssue =
  | "UNAVAILABLE"
  | "INACTIVE"
  | "INSUFFICIENT_STOCK";

export const CART_MESSAGES = {
  empty: "Votre panier est vide.",
  added: "Produit ajouté au panier",
  updated: "Quantité mise à jour dans le panier.",
  removed: "Matériau retiré du panier.",
  unavailable: "Produit indisponible",
  insufficient: "Stock insuffisant",
  inactive: "Ce matériau n'est plus disponible.",
  loadError: "Impossible de charger les informations",
  invalidQuantity: "Indiquez une quantité entière supérieure ou égale à 1.",
  notNumeric: "La quantité doit être un nombre.",
  notEnough: "Quantité disponible insuffisante.",
} as const;
