import type { Metadata } from "next";

import { AccountCheckoutShell } from "../AccountCheckoutShell";
import { CheckoutInformationView } from "./CheckoutInformationView";

export const metadata: Metadata = {
  title: "Informations client | Demeure Guinée",
  description:
    "Renseignez vos coordonnées puis confirmez votre demande de commande de matériaux.",
};

export default function CheckoutInformationPage() {
  return (
    <AccountCheckoutShell
      active="panier"
      eyebrow="Demande de commande"
      title="Vos informations"
      description="Renseignez vos coordonnées, choisissez le retrait ou la livraison, puis confirmez. Aucun paiement n’est demandé à cette étape."
      icon="clipboard-list"
    >
      <CheckoutInformationView />
    </AccountCheckoutShell>
  );
}
