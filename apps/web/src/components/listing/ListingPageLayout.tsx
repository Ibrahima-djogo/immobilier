import { type ReactNode } from "react";

import { CatalogPageLayout } from "@/components/catalog/CatalogPageLayout";

import type { ListingPageConfig } from "./listing-configs";

type Props = {
  config: ListingPageConfig;
  actions?: ReactNode;
  search?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function ListingPageLayout({
  config,
  actions,
  search,
  footer,
  children,
}: Props) {
  return (
    <CatalogPageLayout
      crumbs={config.crumbs}
      eyebrow={config.eyebrow}
      title={config.title}
      description={config.description}
      actions={actions}
      search={search}
      footer={footer}
    >
      {children}
    </CatalogPageLayout>
  );
}
