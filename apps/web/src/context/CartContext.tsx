"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DemoToast } from "@/components/ui";
import {
  CART_MESSAGES,
  type MaterialCartItem,
} from "@/lib/panier/types";
import {
  canCoverQuantity,
  cartLineCount,
  cartTotalQuantity,
  nextCartQuantity,
} from "@/lib/panier/cart";
import {
  addItem as persistAddItem,
  clearCart as persistClearCart,
  getCart,
  pruneUnknownItems as persistPruneUnknownItems,
  removeItem as persistRemoveItem,
  updateQuantity as persistUpdateQuantity,
  writeCart,
} from "@/lib/panier/cart-storage";

type AddResult = { ok: true } | { ok: false; error: string };

type CartContextType = {
  ready: boolean;
  items: MaterialCartItem[];
  lines: MaterialCartItem[];
  cartLineCount: number;
  totalQuantity: number;
  addItem: (
    productId: string,
    quantity: number,
    availableQuantity: number,
  ) => AddResult;
  setItemQuantity: (
    productId: string,
    quantity: number,
    availableQuantity: number,
  ) => AddResult;
  updateQuantity: (
    productId: string,
    quantity: number,
    availableQuantity: number,
  ) => AddResult;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  pruneUnknownItems: (knownProductIds: string[]) => void;
};

const CartContext = createContext<CartContextType>({
  ready: false,
  items: [],
  lines: [],
  cartLineCount: 0,
  totalQuantity: 0,
  addItem: () => ({ ok: false, error: CART_MESSAGES.loadError }),
  setItemQuantity: () => ({ ok: false, error: CART_MESSAGES.loadError }),
  updateQuantity: () => ({ ok: false, error: CART_MESSAGES.loadError }),
  removeItem: () => {},
  clearCart: () => {},
  pruneUnknownItems: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MaterialCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage bootstrap
    setItems(getCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeCart(items);
  }, [items, ready]);

  useEffect(() => {
    function restore() {
      setItems(getCart());
    }
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  const addItem = useCallback(
    (
      productId: string,
      quantity: number,
      availableQuantity: number,
    ): AddResult => {
      if (!Number.isInteger(quantity) || quantity < 1) {
        return { ok: false, error: CART_MESSAGES.invalidQuantity };
      }
      const current =
        items.find((item) => item.productId === productId)?.quantity ?? 0;
      const next = nextCartQuantity(current, quantity);
      if (!canCoverQuantity(next, availableQuantity)) {
        return { ok: false, error: CART_MESSAGES.notEnough };
      }
      setItems(persistAddItem(productId, quantity));
      setToast(current > 0 ? CART_MESSAGES.updated : CART_MESSAGES.added);
      return { ok: true };
    },
    [items],
  );

  const setItemQuantity = useCallback(
    (
      productId: string,
      quantity: number,
      availableQuantity: number,
    ): AddResult => {
      if (!Number.isInteger(quantity) || quantity < 1) {
        return { ok: false, error: CART_MESSAGES.invalidQuantity };
      }
      if (!canCoverQuantity(quantity, availableQuantity)) {
        return { ok: false, error: CART_MESSAGES.notEnough };
      }
      setItems(persistUpdateQuantity(productId, quantity));
      return { ok: true };
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems(persistRemoveItem(productId));
    setToast(CART_MESSAGES.removed);
  }, []);

  const clearCart = useCallback(() => {
    setItems(persistClearCart());
  }, []);

  const pruneUnknownItems = useCallback((knownProductIds: string[]) => {
    if (!ready) return;
    const next = persistPruneUnknownItems(knownProductIds);
    setItems((current) => {
      if (
        current.length === next.length &&
        current.every((item, index) => item.productId === next[index]?.productId)
      ) {
        return current;
      }
      return next;
    });
  }, [ready]);

  const value = useMemo(
    () => ({
      ready,
      items,
      lines: items,
      cartLineCount: cartLineCount(items),
      totalQuantity: cartTotalQuantity(items),
      addItem,
      setItemQuantity,
      updateQuantity: setItemQuantity,
      removeItem,
      clearCart,
      pruneUnknownItems,
    }),
    [
      addItem,
      clearCart,
      items,
      pruneUnknownItems,
      ready,
      removeItem,
      setItemQuantity,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <DemoToast message={toast} onDismiss={dismissToast} />
    </CartContext.Provider>
  );
}

export const MaterialCartProvider = CartProvider;

export function useCart() {
  return useContext(CartContext);
}

export const useMaterialCart = useCart;
