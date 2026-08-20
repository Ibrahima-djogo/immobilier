import type { ReactNode } from "react";

import styles from "./Badge.module.css";

type BadgeVariant = "neutral" | "gold" | "forest" | "success" | "danger";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]}${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </span>
  );
}
