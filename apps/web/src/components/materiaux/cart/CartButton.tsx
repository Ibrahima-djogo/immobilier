"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { routes } from "@/lib/routes/app-routes";

import styles from "@/components/layout/Header.module.css";

type CartButtonProps = {
  className?: string;
  variant?: "icon" | "text";
  onClick?: () => void;
};

export function CartButton({
  className,
  variant = "icon",
  onClick,
}: CartButtonProps) {
  const { totalQuantity } = useCart();
  const label =
    totalQuantity > 0
      ? `Voir le panier (${totalQuantity} article${totalQuantity > 1 ? "s" : ""})`
      : "Voir le panier";

  if (variant === "text") {
    return (
      <Link href={routes.cart} className={className} onClick={onClick}>
        <ShoppingBag size={17} aria-hidden="true" />
        Panier{totalQuantity > 0 ? ` (${totalQuantity})` : ""}
      </Link>
    );
  }

  return (
    <Link
      href={routes.cart}
      className={className ?? styles.headerFavorite}
      aria-label={label}
      onClick={onClick}
    >
      <ShoppingBag size={20} aria-hidden="true" />
      {totalQuantity > 0 ? (
        <span className={styles.favoriteBadge}>{totalQuantity}</span>
      ) : null}
    </Link>
  );
}
