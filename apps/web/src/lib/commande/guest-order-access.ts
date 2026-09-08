/**
 * Jeton de suivi d’une commande invitée, uniquement dans ce navigateur.
 * La commande elle-même est persistée par l’API.
 */

const GUEST_ORDER_ACCESS_KEY = "demeure-guinee-guest-order-access";

export type GuestOrderAccess = {
  id: string;
  reference: string;
  accessToken: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function saveGuestOrderAccess(access: GuestOrderAccess) {
  if (!canUseStorage() || !access.id || !access.accessToken) return;
  try {
    const current = listGuestOrderAccess();
    const next = [
      access,
      ...current.filter((item) => item.id !== access.id),
    ];
    window.sessionStorage.setItem(GUEST_ORDER_ACCESS_KEY, JSON.stringify(next));
  } catch {
    // Mode privé / quota : le lien de confirmation reste suffisant.
  }
}

export function listGuestOrderAccess(): GuestOrderAccess[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.sessionStorage.getItem(GUEST_ORDER_ACCESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestOrderAccess | GuestOrderAccess[];
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.filter((item) => item?.id && item.accessToken);
  } catch {
    return [];
  }
}

export function getGuestOrderAccess(orderId?: string): GuestOrderAccess | null {
  const items = listGuestOrderAccess();
  if (!orderId) return items[0] || null;
  return (
    items.find((item) => item.id === orderId || item.reference === orderId) ||
    null
  );
}
