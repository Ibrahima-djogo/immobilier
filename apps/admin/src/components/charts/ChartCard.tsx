import { type ReactNode } from "react";

import styles from "./charts.module.css";

export type ChartCardProps = {
  title: string;
  eyebrow?: string;
  value?: string | number;
  delta?: string;
  deltaTone?: "up" | "down";
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  eyebrow,
  value,
  delta,
  deltaTone = "up",
  description,
  action,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <section className={`${styles.card} ${className}`.trim()}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <h2 className={styles.title}>{title}</h2>
          {(value != null || delta) && (
            <div className={styles.valueRow}>
              {value != null ? (
                <strong className={styles.value}>{value}</strong>
              ) : null}
              {delta ? (
                <span
                  className={`${styles.delta} ${
                    deltaTone === "down" ? styles.deltaDown : styles.deltaUp
                  }`}
                >
                  {delta}
                </span>
              ) : null}
            </div>
          )}
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
