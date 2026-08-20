import {
  DashboardPageHeader,
  type DashboardPageHeaderProps,
} from "@/components/dashboard";

export type OwnerPageHeaderProps = DashboardPageHeaderProps;

/** @deprecated Prefer DashboardPageHeader — kept for propriétaire route compatibility */
export default function OwnerPageHeader(props: OwnerPageHeaderProps) {
  return <DashboardPageHeader {...props} />;
}
