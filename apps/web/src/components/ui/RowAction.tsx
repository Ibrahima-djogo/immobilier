import Link from "next/link";
import { ArrowRight } from "lucide-react";

import styles from "./RowAction.module.css";

type RowActionProps = {
  label: string;
  /** Absent lorsque la ligne entière est déjà cliquable : l'action reste
   *  visible comme affordance sans imbriquer deux liens. */
  href?: string;
  ariaLabel?: string;
  className?: string;
};

/** Action secondaire compacte d'une ligne de liste (Voir, Ouvrir, Examiner). */
export function RowAction({
  label,
  href,
  ariaLabel,
  className = "",
}: RowActionProps) {
  const classes = `${styles.rowAction}${className ? ` ${className}` : ""}`;
  const content = (
    <>
      {label}
      <ArrowRight size={14} aria-hidden="true" />
    </>
  );

  if (!href) {
    return (
      <span className={classes} aria-hidden="true">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
