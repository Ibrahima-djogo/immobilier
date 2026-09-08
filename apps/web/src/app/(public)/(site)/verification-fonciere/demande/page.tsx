import type { Metadata } from "next";

import { VerificationFonciereRequestView } from "./VerificationFonciereRequestView";

export const metadata: Metadata = {
  title: "Demande de vérification foncière officielle | Demeure Guinée",
  description:
    "Facilitez une vérification foncière officielle. Demeure Guinée n’effectue pas de certification de propriété.",
};

type PageProps = {
  searchParams: Promise<{ bien?: string }>;
};

export default async function FonciereVerificationRequestPage({
  searchParams,
}: PageProps) {
  const { bien } = await searchParams;
  return <VerificationFonciereRequestView propertyId={bien ?? ""} />;
}
