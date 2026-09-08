/**
 * Stock catalogue des matériaux — modèle de démonstration frontend.
 * Distinct de la fiche produit. À remplacer par l’API Spring Boot.
 */

export type MaterialStockStatus = "ACTIF" | "INACTIF";

export type MaterialStockLevel = "NORMAL" | "FAIBLE" | "RUPTURE";

export type MaterialStock = {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  soldQuantity?: number;
  availableQuantity?: number;
  minimumQuantity: number;
  location: string;
  status: MaterialStockStatus;
  createdAt: string;
  updatedAt: string;
};

/** Disponible affiché = physique − réservé. Le champ persisté n’est pas utilisé. */
export function availableQuantity(
  stock: Pick<MaterialStock, "quantity" | "reservedQuantity"> & {
    availableQuantity?: number;
  },
) {
  return Math.max(
    0,
    Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0),
  );
}

export function stockLevel(
  stock: Pick<
    MaterialStock,
    "quantity" | "reservedQuantity" | "minimumQuantity"
  > & {
    availableQuantity?: number;
  },
): MaterialStockLevel {
  const available = availableQuantity(stock);
  if (available <= 0) return "RUPTURE";
  if (available <= stock.minimumQuantity) return "FAIBLE";
  return "NORMAL";
}

export function formatStockAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(
    value,
  );
}

export function formatStockWithUnit(value: number, unitLabel: string) {
  return `${formatStockAmount(value)} ${unitLabel}`;
}

export function emptyStockForProduct(productId: string): MaterialStock {
  const now = new Date().toISOString();
  return {
    id: `mst-${productId}`,
    productId,
    quantity: 0,
    reservedQuantity: 0,
    soldQuantity: 0,
    minimumQuantity: 0,
    location: "",
    status: "ACTIF",
    createdAt: now,
    updatedAt: now,
  };
}
