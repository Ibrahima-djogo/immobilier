"use client";
import Link from "next/link";
import {ArrowLeft,CheckCircle2,Eye,Flag,Image,Save,ShieldAlert,XCircle} from "lucide-react";
import {useParams} from "next/navigation";
import {useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {adminAds} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AdminAdDetailPage(){
 const params=useParams<{id:string}>();const ad=adminAds.find(a=>a.id===params.id)??adminAds[0];
 const [decision,setDecision]=useState<"VALIDER"|"REFUSER"|"SUSPENDRE"|"" >("");const [reason,setReason]=useState("");const [saved,setSaved]=useState(false);
 return <AdminShell active="annonces" eyebrow="Contrôle de l’annonce" title={ad.title} description={`Annonce publiée par ${ad.owner}.`}>
  <Link href="/administration/annonces" className={styles.back}><ArrowLeft size={15}/>Retour aux annonces</Link>{saved&&<div className={styles.success}><CheckCircle2 size={17}/>Décision simulée enregistrée.</div>}
  <div className={styles.grid}><section className={`${styles.card} ${styles.main}`}><div className={styles.summary}><div><span>{ad.type}</span><h2>{ad.title}</h2><p>Annonceur : {ad.owner}</p></div><b className={styles[ad.status.toLowerCase()]}>{ad.status.replace("_"," ")}</b></div><div className={styles.metrics}><p><Eye size={17}/><span><small>Vues</small><strong>{ad.views}</strong></span></p><p><Flag size={17}/><span><small>Signalements</small><strong>{ad.reports}</strong></span></p><p><ShieldAlert size={17}/><span><small>Risque</small><strong>{ad.risk}/100</strong></span></p></div><h3>Médias à contrôler</h3><div className={styles.media}>{[1,2,3].map(i=><button key={i}><Image size={22}/><span>Image {i}</span><small>Vérification visuelle requise</small></button>)}</div><h3>Checklist de modération</h3><ul><li>Concordance entre le titre, la catégorie et le type d’opération</li><li>Cohérence du prix et de la localisation</li><li>Qualité et absence de doublons évidents dans les médias</li><li>Absence de contenu trompeur, interdit ou hors sujet</li><li>Respect de la confidentialité de l’adresse précise</li></ul></section>
   <aside className={`${styles.card} ${styles.side}`}><h2>Décision de modération</h2><div className={styles.choices}><button className={decision==="VALIDER"?styles.selected:""} onClick={()=>setDecision("VALIDER")}><CheckCircle2 size={17}/>Valider / publier</button><button className={decision==="REFUSER"?styles.selectedDanger:""} onClick={()=>setDecision("REFUSER")}><XCircle size={17}/>Refuser</button><button className={decision==="SUSPENDRE"?styles.selectedDanger:""} onClick={()=>setDecision("SUSPENDRE")}><ShieldAlert size={17}/>Suspendre</button></div><label>Motif de décision<textarea rows={7} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motif obligatoire pour refus ou suspension..."/></label><button className={styles.save} disabled={!decision||(decision!=="VALIDER"&&!reason.trim())} onClick={()=>setSaved(true)}><Save size={16}/>Enregistrer</button><p className={styles.note}>La décision doit conserver l’auteur, la date, le motif et les éléments consultés.</p></aside>
  </div>
 </AdminShell>
}
