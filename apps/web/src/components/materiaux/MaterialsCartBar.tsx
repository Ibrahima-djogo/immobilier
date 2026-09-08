"use client";

import { CartButton } from "@/components/materiaux/cart";

import styles from "./MaterialsCartBar.module.css";

export function MaterialsCartBar() {
  return (
    <div className={styles.bar}>
      <CartButton />
    </div>
  );
}
