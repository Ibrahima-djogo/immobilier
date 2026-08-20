import { formatStatusLabel, statusTone, type StatusTone } from "@/lib/ui/status";

import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

const toneClass: Record<StatusTone, string> = {
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  neutral: styles.neutral,
  info: styles.info,
};

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const tone = statusTone(status);
  return (
    <span
      className={`${styles.badge} ${toneClass[tone]}${
        className ? ` ${className}` : ""
      }`}
    >
      {label ?? formatStatusLabel(status)}
    </span>
  );
}
