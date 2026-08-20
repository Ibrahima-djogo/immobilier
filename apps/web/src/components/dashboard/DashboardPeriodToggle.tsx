"use client";

import { type ReactNode, useState } from "react";

import styles from "./DashboardPeriodToggle.module.css";

type Props = {
  periods?: string[];
  defaultPeriod?: string;
  children: (period: string) => ReactNode;
};

/** Small client island for dashboard period filters without forcing the whole page client-side. */
export function DashboardPeriodToggle({
  periods = ["7j", "30j", "90j"],
  defaultPeriod = "30j",
  children,
}: Props) {
  const [period, setPeriod] = useState(defaultPeriod);

  return (
    <>
      <div className={styles.periods} role="group" aria-label="Période">
        {periods.map((item) => (
          <button
            key={item}
            type="button"
            className={period === item ? styles.active : undefined}
            onClick={() => setPeriod(item)}
            aria-pressed={period === item}
          >
            {item}
          </button>
        ))}
      </div>
      {children(period)}
    </>
  );
}
