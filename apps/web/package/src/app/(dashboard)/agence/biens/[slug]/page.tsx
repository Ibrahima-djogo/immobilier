"use client";
import Link from "next/link";
import {ArrowLeft,Bath,BedDouble,Edit3,Eye,FileText,MapPin,MessageSquareText,Ruler,ShieldCheck} from "lucide-react";
import {useParams} from "next/navigation";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyProperties,formatGnf} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyPropertyDetailPage(){
 const params=useParams<{slug:string}>();const p=agencyProperties.find(x=>x.slug===params.slug)??agencyProperties[0];
 return <AgencyShell active="biens" eyebrow="Fiche professionnelle du bien" title={p.title} description="Consultez les informations du portefeuille, le mandat et les performances." action={<Link className={styles.action} href={`/agence/biens/${p.slug}/modifier`}><Edit3 size={16}/>Modifier</Link>}>
  <Link href="/agence/biens" className={styles.back}><ArrowLeft size={15}/>Retour au portefeuille</Link>
  <section className={styles.gallery}><img src={p.images[0]} alt={p.title}/><div>{p.images.slice(1).map((img,i)=><img key={img} src={img} alt={`${p.title} ${i+2}`}/>)}</div></section>
  <div className={styles.grid}><section className={`${styles.card} ${styles.details}`}><div className={styles.top}><div><span>{p.reference} · {p.type}</span><h2>{p.title}</h2><p><MapPin size={15}/>{p.location}</p></div><strong>{formatGnf(p.price)}{p.operation==="LOCATION"?" / mois":""}</strong></div><div className={styles.mandate}><ShieldCheck size={20}/><div><small>Mandat</small><strong>{p.mandateType}</strong></div><div><small>Client associé</small><strong>{p.ownerDisplayName}</strong></div></div><div className={styles.features}><span><Ruler size={19}/><b>{p.area} m²</b><small>Surface</small></span><span><BedDouble size={19}/><b>{p.bedrooms}</b><small>Chambres</small></span><span><Bath size={19}/><b>{p.bathrooms}</b><small>Salles d’eau</small></span></div><h3>Description</h3><p className={styles.description}>{p.description}</p></section>
   <aside><section className={`${styles.card} ${styles.metrics}`}><h2>Performance</h2><div><span><Eye size={18}/>Consultations</span><strong>{p.views}</strong></div><div><span><MessageSquareText size={18}/>Contacts</span><strong>{p.contacts}</strong></div><Link href="/agence/statistiques">Voir les statistiques</Link></section><section className={`${styles.card} ${styles.adCard}`}><FileText size={24}/><h2>Annonce liée</h2><p>La fiche du bien et sa diffusion publique restent distinctes.</p><Link href="/agence/annonces">Ouvrir les annonces</Link></section></aside>
  </div>
 </AgencyShell>
}
