/**
 * Mouvements de stock des matériaux — modèle de démonstration frontend.
 * Distinct du stock. À remplacer par l’API Spring Boot.
 */

export const MATERIAL_STOCK_MOVEMENT_TYPES = [
  "ENTREE",
  "SORTIE",
  "AJUSTEMENT",
  "PERTE",
  "INVENTAIRE",
  "RESERVATION",
  "LIBERATION",
  "VENTE",
  "RETOUR",
] as const;

export const MANUAL_STOCK_MOVEMENT_TYPES = [
  "ENTREE",
  "SORTIE",
  "AJUSTEMENT",
  "PERTE",
  "INVENTAIRE",
  "RETOUR",
] as const;

export type MaterialStockMovementType =
  (typeof MATERIAL_STOCK_MOVEMENT_TYPES)[number];

export type MaterialStockMovement = {
  id: string;
  stockId: string;
  productId: string;
  type: MaterialStockMovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  adjustmentTargetQuantity: number | null;
  reason: string;
  note: string;
  supplierId: string;
  orderId?: string;
  orderReference?: string;
  createdBy: string;
  createdAt: string;
};

export const MOVEMENT_REASONS: Record<MaterialStockMovementType, string[]> = {
  ENTREE: ["Réception fournisseur", "Achat", "Retour client"],
  SORTIE: ["Vente", "Utilisation interne", "Transfert"],
  PERTE: ["Produit endommagé", "Produit perdu", "Péremption"],
  AJUSTEMENT: ["Erreur de saisie", "Correction administrative"],
  INVENTAIRE: ["Inventaire physique"],
  RESERVATION: ["Réservation de commande"],
  LIBERATION: ["Libération de réservation"],
  VENTE: ["Vente commande"],
  RETOUR: ["Retour client", "Retour fournisseur"],
};

const DECIMAL_UNITS = new Set(["KILOGRAMME", "TONNE", "M3", "LITRE"]);

export function unitRequiresInteger(unitId: string) {
  return !DECIMAL_UNITS.has(unitId);
}

export function isTargetQuantityType(type: string) {
  return type === "AJUSTEMENT" || type === "INVENTAIRE";
}

export function labelMovementType(type: string) {
  if (type === "ENTREE") return "Entrée";
  if (type === "SORTIE") return "Sortie";
  if (type === "PERTE") return "Perte";
  if (type === "AJUSTEMENT") return "Ajustement";
  if (type === "INVENTAIRE") return "Inventaire";
  if (type === "RESERVATION") return "Réservation";
  if (type === "LIBERATION") return "Libération";
  if (type === "VENTE") return "Vente";
  if (type === "RETOUR") return "Retour";
  return type;
}

export function movementDelta(movement: Pick<
  MaterialStockMovement,
  "quantityBefore" | "quantityAfter"
>) {
  return movement.quantityAfter - movement.quantityBefore;
}

export function formatSignedQuantity(value: number) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 3,
  }).format(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function formatMovementDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type MovementPreview = {
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  adjustmentTargetQuantity: number | null;
};

export function previewMovement(input: {
  type: MaterialStockMovementType;
  quantityBefore: number;
  quantity?: number;
  adjustmentTargetQuantity?: number;
}): MovementPreview {
  const quantityBefore = input.quantityBefore;
  if (!Number.isFinite(quantityBefore) || quantityBefore < 0) {
    throw new Error("Le stock actuel est invalide.");
  }

  if (isTargetQuantityType(input.type)) {
    const target = input.adjustmentTargetQuantity;
    if (target == null || !Number.isFinite(target)) {
      throw new Error("Indiquez la quantité constatée.");
    }
    if (target < 0) {
      throw new Error("La quantité constatée ne peut pas être négative.");
    }
    const quantity = Math.abs(target - quantityBefore);
    if (quantity <= 0) {
      throw new Error("La quantité constatée est identique au stock actuel.");
    }
    return {
      quantity,
      quantityBefore,
      quantityAfter: target,
      adjustmentTargetQuantity: target,
    };
  }

  const quantity = input.quantity;
  if (quantity == null || !Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La quantité du mouvement doit être strictement positive.");
  }

  const quantityAfter =
    input.type === "ENTREE" || input.type === "RETOUR"
      ? quantityBefore + quantity
      : quantityBefore - quantity;

  if (quantityAfter < 0) {
    throw new Error(
      `Opération refusée : le stock actuel (${quantityBefore}) est insuffisant pour une ${input.type === "PERTE" ? "perte" : "sortie"} de ${quantity}.`,
    );
  }

  return {
    quantity,
    quantityBefore,
    quantityAfter,
    adjustmentTargetQuantity: null,
  };
}
