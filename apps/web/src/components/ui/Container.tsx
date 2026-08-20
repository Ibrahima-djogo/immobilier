import type { ElementType, ReactNode } from "react";

import styles from "./Container.module.css";

type ContainerProps = {
  children: ReactNode;
  wide?: boolean;
  as?: ElementType;
  className?: string;
};

export function Container({
  children,
  wide = false,
  as: Tag = "div",
  className = "",
}: ContainerProps) {
  return (
    <Tag
      className={`${styles.container}${wide ? ` ${styles.wide}` : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </Tag>
  );
}
