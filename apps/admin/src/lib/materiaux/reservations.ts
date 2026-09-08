/**
 * Réservations de stock des matériaux — modèle de démonstration frontend.
 * Distinct du stock et des mouvements. À remplacer par l’API Spring Boot.
 */

export const MATERIAL_STOCK_RESERVATION_STATUSES = [
  "ACTIVE",
  "EXPIRED",
  "RELEASED",
  "CONSUMED",
] as const;

export type MaterialStockReservationStatus =
  (typeof MATERIAL_STOCK_RESERVATION_STATUSES)[number];

export type MaterialStockReservation = {
  id: string;
  stockId: string;
  productId: string;
  quantity: number;
  status: MaterialStockReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
  orderReference?: string;
};

/** Durée démo, facilement modifiable. Pas de cron : expiration à la lecture. */
export const DEFAULT_RESERVATION_HOURS = 48;

export const RESERVATION_DURATION_HOURS = [24, 48, 72, 168] as const;

export function labelReservationDuration(hours: number) {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "24 heures" : `${days} jours`;
  }
  return `${hours} heures`;
}

export function expiresAtFromHours(hours: number, from = new Date()) {
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isReservationExpired(
  reservation: Pick<MaterialStockReservation, "status" | "expiresAt">,
  now = new Date(),
) {
  if (reservation.status !== "ACTIVE") return false;
  const expires = new Date(reservation.expiresAt);
  return !Number.isNaN(expires.getTime()) && expires.getTime() <= now.getTime();
}

export function sumActiveReserved(
  reservations: MaterialStockReservation[],
  stockId: string,
) {
  return reservations
    .filter((item) => item.stockId === stockId && item.status === "ACTIVE")
    .reduce((total, item) => total + item.quantity, 0);
}

export function formatReservationDate(iso: string) {
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
