"use client";

import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, Edit3, Eye, FileText, MapPin, MessageSquareText, Ruler } from "lucide-react";
import { useParams } from "next/navigation";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { formatGnf, ownerProperties } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function PropertyDetailPage() {
  const params = useParams<{slug:string}>();
  const property = ownerProperties.find((item)=>item.slug===params.slug) ?? ownerProperties[0];

  return (
    <OwnerShell
      active="biens"
      eyebrow="Fiche du bien"
      title={property.title}
      description="Consultez les informations techniques, les médias et les performances du bien."
      action={<Link className={styles.action} href={`/proprietaire/biens/${property.slug}/modifier`}><Edit3 size={16}/> Modifier</Link>}
    >
      <Link href="/proprietaire/biens" className={styles.back}><ArrowLeft size={15}/> Retour à mes biens</Link>
      <section className={styles.gallery}>
        <img src={property.images[0]} alt={property.title}/>
        <div>{property.images.slice(1).map((img,index)=><img key={img} src={img} alt={`${property.title} ${index+2}`}/>)}</div>
      </section>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.details}`}>
          <div className={styles.top}><div><span>{property.type} · {property.operation==="VENTE"?"Vente":"Location"}</span><h2>{property.title}</h2><p><MapPin size={15}/>{property.location}</p></div><strong>{formatGnf(property.price)}{property.operation==="LOCATION"?" / mois":""}</strong></div>
          <div className={styles.features}>
            <span><Ruler size={19}/><b>{property.area} m²</b><small>Surface</small></span>
            <span><BedDouble size={19}/><b>{property.bedrooms}</b><small>Chambres</small></span>
            <span><Bath size={19}/><b>{property.bathrooms}</b><small>Salles d’eau</small></span>
          </div>
          <h3>Description</h3><p className={styles.description}>{property.description}</p>
        </section>

        <aside>
          <section className={`${styles.card} ${styles.metrics}`}>
            <h2>Performance</h2>
            <div><span><Eye size={18}/>Consultations</span><strong>{property.views}</strong></div>
            <div><span><MessageSquareText size={18}/>Contacts</span><strong>{property.contacts}</strong></div>
            <Link href="/proprietaire/statistiques">Voir les statistiques</Link>
          </section>
          <section className={`${styles.card} ${styles.adCard}`}>
            <FileText size={24}/><h2>Annonce liée</h2><p>Gérez la diffusion publique séparément de la fiche du bien.</p>
            <Link href="/proprietaire/annonces">Ouvrir les annonces</Link>
          </section>
        </aside>
      </div>
    </OwnerShell>
  );
}
