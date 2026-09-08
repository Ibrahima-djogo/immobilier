import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";

import styles from "./PageHero.module.css";

export type PageHeroVariant = "default" | "dashboard" | "compact" | "public";

export type PageHeroCrumb = {
  href?: string;
  label: string;
};

export type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  /** Ligne secondaire discrète sous la description */
  note?: string;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  crumbs?: PageHeroCrumb[];
  badge?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  variant?: PageHeroVariant;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  note,
  icon,
  backHref,
  backLabel = "Retour",
  crumbs,
  badge,
  actions,
  aside,
  meta,
  children,
  variant = "default",
  className,
}: PageHeroProps) {
  return (
    <header
      className={[styles.hero, styles[variant], className || ""]
        .filter(Boolean)
        .join(" ")}
      data-page-header="page-hero"
    >
      <div className={styles.decoration} aria-hidden="true">
        <span className={styles.decorationCircle} />
        <span className={styles.decorationCircleSoft} />
        <span className={styles.decorationGrid} />
        <span className={styles.decorationArc} />
      </div>

      <div className={styles.inner}>
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Fil d’Ariane">
            <ol className={styles.breadcrumb}>
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`}>
                    {index > 0 ? (
                      <span className={styles.separator} aria-hidden="true">
                        /
                      </span>
                    ) : null}
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href}>{crumb.label}</Link>
                    ) : (
                      <span
                        className={styles.current}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        {backHref ? (
          <Link href={backHref} className={styles.back}>
            <ArrowLeft size={15} aria-hidden="true" />
            {backLabel}
          </Link>
        ) : null}

        <div className={styles.row}>
          <div className={styles.copy}>
            <div className={styles.eyebrowRow}>
              {icon ? <span className={styles.iconWrap}>{icon}</span> : null}
              <p className={styles.eyebrow}>{eyebrow}</p>
            </div>

            <div className={styles.titleRow}>
              <h1 className={styles.title}>{title}</h1>
              {badge ? <div className={styles.badge}>{badge}</div> : null}
            </div>

            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
            {note ? <p className={styles.note}>{note}</p> : null}
            {meta ? <div className={styles.meta}>{meta}</div> : null}
            {children}
          </div>

          {aside ? <div className={styles.aside}>{aside}</div> : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}
