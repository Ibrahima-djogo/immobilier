import AdminShell from "@/components/administration/AdminShell";
import ReferenceManager from "@/components/administration/ReferenceManager";
import { referenceData } from "@/lib/administration/demo-data";

export default function Page(){
 return <AdminShell active="referentiels" eyebrow="Référentiel immobilier" title="Équipements" description="Administrez les équipements proposés lors de la saisie d’un bien.">
  <ReferenceManager title="Équipements disponibles" description="Ajout, ordre et activation des équipements." items={referenceData.equipements} />
 </AdminShell>
}
