import { type ReactNode } from "react";

import { PageHero, type PageHeroCrumb } from "@/components/layout/PageHero";

import styles from "./PublicPageHeader.module.css";

export type PublicPageHeaderCrumb = PageHeroCrumb;

export type PublicPageHeaderProps = {
  crumbs: PublicPageHeaderCrumb[];
  eyebrow?: string;
  title: string;
  description?: string;
  note?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  containerClassName?: string;
  className?: string;
  overlap?: boolean;
};

/**
 * Header des pages publiques : réutilise PageHero
 * (même carte ivoire / motifs que AdminPageHero).
 */
export function PublicPageHeader({
  crumbs,
  eyebrow = "",
  title,
  description,
  note,
  actions,
  aside,
  children,
  containerClassName,
  className,
  overlap = false,
}: PublicPageHeaderProps) {
  return (
    <div className={[styles.band, overlap ? styles.overlap : ""].filter(Boolean).join(" ")}>
      <div
        className={[
          styles.wrap,
          containerClassName || styles.container,
          className || "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <PageHero
          variant="compact"
          crumbs={crumbs}
          eyebrow={eyebrow}
          title={title}
          description={description}
          note={note}
          actions={actions}
          aside={aside}
        />
        {children ? <div className={styles.extra}>{children}</div> : null}
      </div>
    </div>
  );
}
