import type { ReactNode } from "react";

import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  className = "",
  as: TitleTag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={`${styles.heading}${align === "center" ? ` ${styles.center}` : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <div className={styles.copy}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <TitleTag className={styles.title}>{title}</TitleTag>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
