import { type ReactNode } from "react";

import {
  PublicPageHeader,
  type PublicPageHeaderCrumb,
} from "@/components/layout/PublicPageHeader";

import styles from "./catalog.module.css";

type Props = {
  crumbs: PublicPageHeaderCrumb[];
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  search?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function CatalogPageLayout({
  crumbs,
  eyebrow,
  title,
  description,
  actions,
  search,
  footer,
  children,
}: Props) {
  return (
    <main className={styles.page}>
      <section className={styles.pageIntro}>
        <PublicPageHeader
          crumbs={crumbs}
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
          containerClassName={styles.container}
          overlap={Boolean(search)}
        >
          {search ? <div className={styles.searchPanel}>{search}</div> : null}
        </PublicPageHeader>
      </section>
      <section className={styles.resultsSection}>
        <div className={styles.container}>{children}</div>
      </section>
      {footer}
    </main>
  );
}
