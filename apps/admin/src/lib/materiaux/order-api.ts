/**
 * Commandes matériaux — appels Demo API.
 * Ne pas dupliquer ces fonctions ailleurs.
 */

import {
  apiCancelMaterialOrder,
  apiConfirmAgentPayment,
  apiConfirmStorePayment,
  apiMarkNotificationRead,
  fetchAdminNotifications,
  apiUpdateOrderDeliveryFee,
  apiUpdateOrderDeliveryMode,
  apiUpdateOrderStatus,
  apiUpdateOrderVerification,
  fetchMaterialOrder,
  fetchMaterialOrders,
  fetchMaterialReservations,
} from "./material-api";
import type { MaterialStockReservation } from "./reservations";

export function getOrders() {
  return fetchMaterialOrders();
}

export function getOrderById(id: string) {
  return fetchMaterialOrder(id);
}

export function cancelOrder(id: string) {
  return apiCancelMaterialOrder(id);
}

export function updateOrderStatus(id: string, status: string) {
  return apiUpdateOrderStatus(id, status);
}

export function updateDeliveryMode(id: string, deliveryMode: string) {
  return apiUpdateOrderDeliveryMode(id, deliveryMode);
}

export function updateOrderDeliveryFee(id: string, deliveryFee: number) {
  return apiUpdateOrderDeliveryFee(id, deliveryFee);
}

export function confirmAgentPayment(id: string) {
  return apiConfirmAgentPayment(id);
}

export function confirmStorePayment(id: string) {
  return apiConfirmStorePayment(id);
}

export function getAdminNotifications() {
  return fetchAdminNotifications();
}

export function markAdminNotificationRead(id: string) {
  return apiMarkNotificationRead(id);
}

export function updateVerification(
  id: string,
  body: {
    customerVerified?: boolean;
    addressVerified?: boolean;
    stockVerified?: boolean;
    notes?: string;
  },
) {
  return apiUpdateOrderVerification(id, body);
}

export function getReservationsForOrder(orderId: string) {
  return fetchMaterialReservations().then((items) =>
    items.filter((item) => item.orderId === orderId),
  );
}

export type { MaterialStockReservation };
