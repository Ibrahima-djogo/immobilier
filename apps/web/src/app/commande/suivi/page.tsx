import type { Metadata } from "next";

import { AccountCheckoutShell } from "../AccountCheckoutShell";
import { OrderTrackView } from "./OrderTrackView";

export const metadata: Metadata = {
  title: "Suivre une commande | Demeure Guinée",
  description:
    "Retrouvez une commande de matériaux avec votre référence et votre téléphone.",
};

export default function OrderTrackPage() {
  return (
    <AccountCheckoutShell
      active="commandes"
      eyebrow="Commande matériaux"
      title="Suivre une commande"
      description="Saisissez la référence et le téléphone utilisés lors de la commande. Aucun compte n’est requis."
      icon="package-check"
    >
      <OrderTrackView />
    </AccountCheckoutShell>
  );
}
