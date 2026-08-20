import { formatAdminRoleLabel } from "@/lib/ui/permissions";

import styles from "./RoleBadge.module.css";

type RoleBadgeProps = {
  role: string;
  className?: string;
};

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const label = formatAdminRoleLabel(role);
  return (
    <span
      className={`${styles.badge} ${
        role === "SUPER_ADMIN" ? styles.super : ""
      }${className ? ` ${className}` : ""}`}
      title={label}
    >
      {label}
    </span>
  );
}
