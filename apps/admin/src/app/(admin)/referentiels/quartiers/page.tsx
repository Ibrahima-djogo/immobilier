"use client";

import { Map } from "lucide-react";

import AdminShell from "@/components/administration/AdminShell";
import ReferenceManager from "@/components/administration/ReferenceManager";
import { referenceData } from "@/lib/administration/demo-data";

export default function Page() {
  return (
    <AdminShell
      active="referentiels"
      eyebrow="Référentiel géographique"
      title="Quartiers et secteurs"
      description="Maintenez la cohérence hiérarchique entre ville, commune et quartier."
      icon={Map}
      backHref="/referentiels"
      backLabel="Retour aux référentiels"
      heroVariant="compact"
      stats={[{ label: "Valeurs", value: referenceData.quartiers.length }]}
    >
      <ReferenceManager
        title="Liste des quartiers"
        description="Chaque quartier doit être rattaché à une localité valide."
        items={referenceData.quartiers}
        parentLabel="Ville / commune"
      />
    </AdminShell>
  );
}
