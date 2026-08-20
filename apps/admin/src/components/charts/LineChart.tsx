"use client";

import { useId, useMemo, useState } from "react";

import styles from "./charts.module.css";

export type LinePoint = {
  label: string;
  value: number;
};

export type LineValueFormat = "raw" | "locale" | "views" | "demands";

type LineChartProps = {
  data: LinePoint[];
  height?: number;
  /** Named formats only — avoid passing functions from Server Components. */
  format?: LineValueFormat;
};

function formatValue(value: number, format: LineValueFormat): string {
  switch (format) {
    case "locale":
      return value.toLocaleString("fr-FR");
    case "views":
      return `${value} vues`;
    case "demands":
      return `${value} demandes`;
    default:
      return String(value);
  }
}

const W = 640;
const H = 220;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 28;

export function LineChart({
  data,
  height = 220,
  format = "raw",
}: LineChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const { path, area, dots } = useMemo(() => {
    const values = data.map((d) => d.value);
    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values, 0);
    const pad = (maxV - minV) * 0.15 || maxV * 0.1;
    const top = maxV + pad;
    const bottom = Math.max(0, minV - pad);
    const range = top - bottom || 1;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

    const coords = data.map((d, i) => {
      const x = PAD_L + i * step;
      const y = PAD_T + innerH - ((d.value - bottom) / range) * innerH;
      return { x, y, ...d };
    });

    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
      .join(" ");
    const areaPath = `${line} L ${coords[coords.length - 1]?.x ?? PAD_L} ${
      PAD_T + innerH
    } L ${PAD_L} ${PAD_T + innerH} Z`;

    return { path: line, area: areaPath, dots: coords };
  }, [data]);

  const gridYs = [0.25, 0.5, 0.75].map(
    (g) => PAD_T + (H - PAD_T - PAD_B) * g,
  );

  return (
    <div className={styles.lineWrap} style={{ minHeight: height }}>
      <svg
        className={styles.lineSvg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Graphique linéaire"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#285c45" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#285c45" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((y) => (
          <line
            key={y}
            className={styles.gridLine}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y}
            y2={y}
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path className={styles.linePath} d={path} />

        {dots.map((dot, index) => (
          <g key={dot.label}>
            <circle
              className={styles.dot}
              cx={dot.x}
              cy={dot.y}
              r={hover === index ? 5 : 3.5}
            />
            <circle
              className={styles.dotHit}
              cx={dot.x}
              cy={dot.y}
              r={14}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(index)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${dot.label} : ${formatValue(dot.value, format)}`}
            />
          </g>
        ))}

        {data.map((point, index) => {
          const show =
            data.length <= 8 ||
            index === 0 ||
            index === data.length - 1 ||
            index % Math.ceil(data.length / 6) === 0;
          if (!show) return null;
          const x = dots[index]?.x ?? 0;
          return (
            <text
              key={`label-${point.label}`}
              className={styles.axisLabel}
              x={x}
              y={H - 8}
              textAnchor="middle"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      {hover != null && dots[hover] ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(dots[hover].x / W) * 100}%`,
            top: `${(dots[hover].y / H) * 100}%`,
          }}
        >
          <strong>{formatValue(dots[hover].value, format)}</strong>
          <span>{dots[hover].label}</span>
        </div>
      ) : null}
    </div>
  );
}
