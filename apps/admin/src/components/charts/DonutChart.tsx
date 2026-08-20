import styles from "./charts.module.css";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string | number;
};

const RADIUS = 42;
const STROKE = 14;
const CIRC = 2 * Math.PI * RADIUS;

export function DonutChart({
  data,
  centerLabel = "total",
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  const segments = data.map((slice, index) => {
    const ratio = total > 0 ? slice.value / total : 0;
    const length = ratio * CIRC;
    const preceding = data
      .slice(0, index)
      .reduce((sum, item) => sum + (total > 0 ? item.value / total : 0), 0);
    return {
      ...slice,
      dash: `${length} ${CIRC - length}`,
      offset: -preceding * CIRC,
    };
  });

  return (
    <div className={styles.donutLayout}>
      <div className={styles.donutWrap}>
        <svg
          className={styles.donutSvg}
          viewBox="0 0 100 100"
          role="img"
          aria-label="Graphique en anneau"
        >
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#e8eee9"
            strokeWidth={STROKE}
          />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={segment.dash}
              strokeDashoffset={segment.offset}
              strokeLinecap="butt"
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>
        <div className={styles.donutCenter}>
          <strong>{centerValue ?? total}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <ul className={styles.legend}>
        {data.map((slice) => (
          <li key={slice.label} className={styles.legendItem}>
            <i
              className={styles.swatch}
              style={{ background: slice.color }}
              aria-hidden="true"
            />
            <span>{slice.label}</span>
            <strong>{slice.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
