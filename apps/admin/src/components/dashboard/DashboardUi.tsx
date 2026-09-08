import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { RowAction } from "@/components/ui/RowAction";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./dashboardUi.module.css";

export type KpiItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  href?: string;
  actionLabel?: string;
  tone?: "default" | "accent" | "success" | "warning";
};

const toneClass = {
  default: styles.tone_default,
  accent: styles.tone_accent,
  success: styles.tone_success,
  warning: styles.tone_warning,
} as const;

type KpiStripProps = {
  items: KpiItem[];
  /** First item rendered as a wider synthesis block */
  highlightFirst?: boolean;
};

export function KpiStrip({ items, highlightFirst = false }: KpiStripProps) {
  return (
    <section
      className={`${styles.kpiStrip} ${
        highlightFirst ? styles.kpiStripHighlight : ""
      }`}
      aria-label="Indicateurs"
    >
      {items.map(
        (
          { label, value, icon: Icon, hint, href, actionLabel, tone = "default" },
          index,
        ) => {
          const className = `${styles.kpiCard} ${
            highlightFirst && index === 0 ? styles.kpiHero : ""
          } ${toneClass[tone]}`;
          const body = (
            <>
              <span className={styles.kpiIcon} aria-hidden="true">
                <Icon size={20} />
              </span>
              <div className={styles.kpiBody}>
                <small>{label}</small>
                <strong>{value}</strong>
                {hint ? <span className={styles.kpiHint}>{hint}</span> : null}
                {href && actionLabel ? (
                  <span className={styles.kpiAction}>{actionLabel}</span>
                ) : null}
              </div>
            </>
          );
          if (href) {
            return (
              <Link key={label} href={href} className={className}>
                {body}
              </Link>
            );
          }
          return (
            <article key={label} className={className}>
              {body}
            </article>
          );
        },
      )}
    </section>
  );
}

type PanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className = "",
}: PanelProps) {
  return (
    <section className={`${styles.panel} ${className}`.trim()}>
      <div className={styles.panelHeader}>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className={styles.panelAction}>{action}</div> : null}
      </div>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

/** Conteneur des lignes : il porte les colonnes que chaque ligne reprend en
 *  `subgrid`, ce qui aligne statuts et actions d'une ligne à l'autre. */
export function DashboardList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.listGroup} ${className}`.trim()}>{children}</div>
  );
}

type ListRowAction = {
  label: string;
  /** Absent lorsque la ligne entière est déjà un lien : l'action reste
   *  visible comme affordance sans imbriquer deux liens. */
  href?: string;
  ariaLabel?: string;
};

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Code technique du statut ; le libellé affiché est dérivé. */
  status?: string;
  statusLabel?: string;
  meta?: string;
  action?: ListRowAction;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** When set, the whole row is navigable (cursor + keyboard). */
  href?: string;
  ariaLabel?: string;
};

export function DashboardListRow({
  title,
  subtitle,
  status,
  statusLabel,
  meta,
  action,
  leading,
  trailing,
  href,
  ariaLabel,
}: ListRowProps) {
  const actionNode = action ? (
    <RowAction
      label={action.label}
      href={action.href}
      ariaLabel={action.ariaLabel}
    />
  ) : (
    trailing
  );

  const content = (
    <>
      {leading ? <div className={styles.listLeading}>{leading}</div> : null}
      <strong className={styles.listTitle}>{title}</strong>
      {subtitle ? (
        <span className={styles.listSubtitle}>{subtitle}</span>
      ) : null}
      {status || meta ? (
        <div className={styles.listAside}>
          {status ? <StatusBadge status={status} label={statusLabel} /> : null}
          {meta ? <span className={styles.listMeta}>{meta}</span> : null}
        </div>
      ) : null}
      {actionNode ? (
        <div className={styles.listTrailing}>{actionNode}</div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${styles.listRow} ${styles.listRowLink}`}
        aria-label={ariaLabel ?? title}
      >
        {content}
      </Link>
    );
  }

  return <article className={styles.listRow}>{content}</article>;
}
