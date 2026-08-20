import Link from "next/link";
import { House } from "lucide-react";

import styles from "./BrandLogo.module.css";

type BrandLogoProps = {
  tone?: "light" | "dark";
  size?: "md" | "sm";
  className?: string;
};

export function BrandLogo({
  tone = "light",
  size = "md",
  className = "",
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={`${styles.logo} ${styles[tone]}${
        size === "sm" ? ` ${styles.sm}` : ""
      }${className ? ` ${className}` : ""}`}
      aria-label="Demeure Guinée — Accueil"
    >
      <span className={styles.mark}>
        <House size={size === "sm" ? 18 : 20} strokeWidth={2.15} aria-hidden="true" />
      </span>
      <span className={styles.text}>
        <strong>Demeure</strong>
        <small>Guinée</small>
      </span>
    </Link>
  );
}
