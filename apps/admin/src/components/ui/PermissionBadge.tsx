import { formatPermissionLabel } from "@/lib/ui/permissions";

import styles from "./PermissionBadge.module.css";

type PermissionBadgeProps = {
  permission: string;
  className?: string;
};

export function PermissionBadge({
  permission,
  className = "",
}: PermissionBadgeProps) {
  const all = permission === "TOUTES";
  const label = formatPermissionLabel(permission);

  return (
    <span
      className={`${styles.badge} ${all ? styles.all : ""}${
        className ? ` ${className}` : ""
      }`}
      title={label}
    >
      {label}
    </span>
  );
}
