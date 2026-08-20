import { type ReactNode } from "react";

import { PageHero } from "@/components/layout/PageHero";

export type DashboardPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  badge?: ReactNode;
  note?: string;
};

/**
 * En-tête dashboard — s’appuie sur le PageHero global.
 * Conservé pour compatibilité Agence / Propriétaire / Admin.
 */
export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  action,
  meta,
  icon,
  backHref,
  backLabel,
  badge,
  note,
}: DashboardPageHeaderProps) {
  return (
    <PageHero
      variant="dashboard"
      eyebrow={eyebrow}
      title={title}
      description={description}
      note={note}
      icon={icon}
      backHref={backHref}
      backLabel={backLabel}
      badge={badge}
      actions={action}
      meta={meta}
    />
  );
}
