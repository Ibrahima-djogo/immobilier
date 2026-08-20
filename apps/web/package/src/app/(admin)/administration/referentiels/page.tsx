import Link from "next/link";
import {ArrowRight,Building2,MapPin,Tags,Wrench} from "lucide-react";
import AdminShell from "@/components/administration/AdminShell";
import {referenceData} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function ReferencesPage(){
 const cards=[
  ["/administration/referentiels/villes","Villes et communes",referenceData.villes.length,Building2],
  ["/administration/referentiels/quartiers","Quartiers et secteurs",referenceData.quartiers.length,MapPin],
  ["/administration/referentiels/categories","Catégories de biens",referenceData.categories.length,Tags],
  ["/administration/referentiels/equipements","Équipements",referenceData.equipements.length,Wrench],
 ] as const;
 return <AdminShell active="referentiels" eyebrow="Qualité des données" title="Référentiels fonctionnels" description="Administrez les valeurs utilisées par les formulaires, les filtres et les statistiques.">
  <section className={styles.warning}>La création, la fusion, le renommage et la désactivation doivent préserver les identifiants stables et l’historique.</section>
  <section className={styles.grid}>{cards.map(([href,title,count,Icon])=><Link key={href} href={href} className={styles.card}><span><Icon size={25}/></span><div><small>{count} valeur(s)</small><h2>{title}</h2><p>Ajouter, modifier, ordonner et activer sans redéploiement.</p></div><ArrowRight size={18}/></Link>)}</section>
 </AdminShell>
}
