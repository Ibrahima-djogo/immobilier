/**
 * Compatibilité : les écrans existants importent encore readCartLines / writeCartLines.
 */

import {
  getCart,
  writeCart,
  MATERIAL_CART_KEY,
} from "./cart-storage";
import type { MaterialCartItem } from "./types";

export { MATERIAL_CART_KEY };

export function readCartLines(): MaterialCartItem[] {
  return getCart();
}

export function writeCartLines(lines: MaterialCartItem[]) {
  writeCart(lines);
}
