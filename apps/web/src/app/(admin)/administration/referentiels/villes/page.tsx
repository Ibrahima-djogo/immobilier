import AdminShell from "@/components/administration/AdminShell";
import ReferenceManager from "@/components/administration/ReferenceManager";
import { referenceData } from "@/lib/administration/demo-data";

export default function Page(){
 return <AdminShell active="referentiels" eyebrow="Référentiel géographique" title="Villes et communes" description="Gérez les localités principales utilisées par les annonces.">
  <ReferenceManager title="Liste des villes et communes" description="Création, ordre et activation des localités." items={referenceData.villes} />
 </AdminShell>
}
