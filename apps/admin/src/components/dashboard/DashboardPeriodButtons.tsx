"use client";

import { useState } from "react";

import styles from "./DashboardPeriodToggle.module.css";

type Props = {
  periods?: string[];
  defaultPeriod?: string;
};

/** Decorative period switch used on demo dashboards (chart data unchanged). */
export function DashboardPeriodButtons({
  periods = ["7j", "30j", "90j"],
  defaultPeriod = "30j",
}: Props) {
  const [period, setPeriod] = useState(defaultPeriod);

  return (
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
  );
}
