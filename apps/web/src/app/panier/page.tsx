import type { Metadata } from "next";

import { CartExperience } from "./CartExperience";

export const metadata: Metadata = {
  title: "Mon panier | Demeure Guinée",
  description:
    "Vérifiez vos matériaux puis validez votre commande en ligne.",
};

type CartPageProps = {
  searchParams: Promise<{ vide?: string }>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const { vide } = await searchParams;
  return <CartExperience emptied={vide === "1"} />;
}
