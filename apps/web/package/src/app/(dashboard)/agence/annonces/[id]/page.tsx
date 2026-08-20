"use client";
import Link from "next/link";
import {ArrowLeft,Edit3,Eye,Heart,MessageSquareText} from "lucide-react";
import {useParams} from "next/navigation";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyAds} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyAdDetailPage(){
 const params=useParams<{id:string}>();const a=agencyAds.find(x=>x.id===params.id)??agencyAds[0];
 return <AgencyShell active="annonces" eyebrow="Détail de l’annonce" title={a.title} description="Consultez le statut, les performances et la modération." action={<Link className={styles.action} href={`/agence/annonces/${a.id}/modifier`}><Edit3 size={16}/>Modifier</Link>}>
  <Link href="/agence/annonces" className={styles.back}><ArrowLeft size={15}/>Retour aux annonces</Link>
  <div className={styles.grid}><section className={`${styles.card} ${styles.main}`}><div className={styles.status}><span className={styles[a.status.toLowerCase()]}>{a.status.replace("_"," ")}</span><small>{a.updatedAt}</small></div><h2>Rattachement</h2><p>Cette annonce est rattachée au bien <strong>{a.propertySlug}</strong>.</p>{a.rejectionReason&&<div className={styles.rejection}><strong>Motif du rejet</strong><p>{a.rejectionReason}</p></div>}<h2>Historique</h2><ol><li><span>1</span><div><strong>Brouillon créé</strong><small>28 juillet 2026</small></div></li><li><span>2</span><div><strong>Soumission</strong><small>29 juillet 2026</small></div></li><li><span>3</span><div><strong>Statut actuel</strong><small>{a.status.replace("_"," ")}</small></div></li></ol></section><aside className={`${styles.card} ${styles.metrics}`}><h2>Performance</h2><div><span><Eye size={18}/>Vues</span><strong>{a.views}</strong></div><div><span><Heart size={18}/>Favoris</span><strong>{a.favorites}</strong></div><div><span><MessageSquareText size={18}/>Prospects</span><strong>{a.contacts}</strong></div></aside></div>
 </AgencyShell>
}
