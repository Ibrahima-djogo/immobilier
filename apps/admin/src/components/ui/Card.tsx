import type { ElementType, ReactNode } from "react";

import styles from "./Card.module.css";

type CardVariant = "plain" | "outline" | "elevated";
type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  as?: ElementType;
  className?: string;
};

const paddingClass: Record<CardPadding, string> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export function Card({
  children,
  variant = "outline",
  padding = "md",
  as: Tag = "div",
  className = "",
}: CardProps) {
  return (
    <Tag
      className={`${styles.card} ${styles[variant]} ${paddingClass[padding]}${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </Tag>
  );
}
