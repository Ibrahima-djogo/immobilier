import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./Chip.module.css";

type ChipVariant = "neutral" | "gold" | "forest";

type ChipProps = {
  children: ReactNode;
  variant?: ChipVariant;
  active?: boolean;
  href?: string;
  className?: string;
  onClick?: () => void;
};

export function Chip({
  children,
  variant = "neutral",
  active = false,
  href,
  className = "",
  onClick,
}: ChipProps) {
  const classNames = [
    styles.chip,
    styles[variant],
    active ? styles.active : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classNames} onClick={onClick}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={classNames} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <span className={classNames}>{children}</span>;
}
