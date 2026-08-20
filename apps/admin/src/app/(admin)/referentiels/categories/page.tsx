"use client";

import { Boxes } from "lucide-react";

import AdminShell from "@/components/administration/AdminShell";
import ReferenceManager from "@/components/administration/ReferenceManager";
import { referenceData } from "@/lib/administration/demo-data";

export default function Page() {
  return (
    <AdminShell
      active="referentiels"
      eyebrow="Référentiel immobilier"
      title="Catégories de biens"
      description="Gérez les catégories utilisées par les formulaires et les recherches."
      icon={Boxes}
      backHref="/referentiels"
      backLabel="Retour aux référentiels"
      heroVariant="compact"
      stats={[{ label: "Valeurs", value: referenceData.categories.length }]}
    >
      <ReferenceManager
        title="Catégories actives"
        description="Les modifications doivent préserver les annonces existantes."
        items={referenceData.categories}
      />
    </AdminShell>
  );
}
