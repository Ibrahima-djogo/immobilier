import { StatusBadge } from "@/components/ui";
import { formatOrderStatus } from "@/lib/commande/orders";

type Props = {
  status: string;
};

export function OrderStatus({ status }: Props) {
  return <StatusBadge status={status} label={formatOrderStatus(status)} />;
}
