import Link from "next/link";
import {ArrowRight,Clock3,Flag,ShieldAlert} from "lucide-react";
import AdminShell from "@/components/administration/AdminShell";
import {adminAds,reports,roleRequests} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function ModerationQueuePage(){
 const queue=[
  ...adminAds.filter(a=>a.status==="EN_ATTENTE"||a.status==="SUSPENDUE").map(a=>({id:a.id,type:"ANNONCE",title:a.title,subtitle:a.owner,risk:a.risk,age:a.submittedAt,href:`/administration/annonces/${a.id}`})),
  ...reports.filter(r=>r.status==="NOUVEAU"||r.status==="EN_ANALYSE").map(r=>({id:r.id,type:"SIGNALEMENT",title:r.target,subtitle:r.reason,risk:r.risk==="ELEVE"?90:r.risk==="MOYEN"?55:20,age:r.createdAt,href:`/administration/signalements/${r.id}`})),
  ...roleRequests.filter(r=>r.status==="SOUMISE"||r.status==="EN_EXAMEN").map(r=>({id:r.id,type:"IDENTITE",title:r.name,subtitle:r.requestedRole,risk:r.risk==="ELEVE"?85:r.risk==="MOYEN"?50:15,age:r.submittedAt,href:`/administration/demandes-role/${r.id}`}))
 ].sort((a,b)=>b.risk-a.risk);
 return <AdminShell active="moderation" eyebrow="File centralisée" title="File de modération" description="Traitez les dossiers par niveau de risque, ancienneté et type.">
  <section className={styles.legend}><span><i className={styles.high}/>Risque élevé</span><span><i className={styles.medium}/>Risque moyen</span><span><i className={styles.low}/>Risque faible</span></section>
  <section className={`${styles.card} ${styles.queue}`}>{queue.map((item,index)=><article key={`${item.type}-${item.id}`}><span className={styles.rank}>{index+1}</span><span className={styles.icon}>{item.type==="SIGNALEMENT"?<Flag size={18}/>:<ShieldAlert size={18}/>}</span><div><small>{item.type}</small><strong>{item.title}</strong><p>{item.subtitle}</p></div><div className={styles.risk}><span><i style={{width:`${item.risk}%`}}/></span><strong>{item.risk}/100</strong></div><span className={styles.age}><Clock3 size={14}/>{item.age}</span><Link href={item.href}>Examiner<ArrowRight size={14}/></Link></article>)}</section>
 </AdminShell>
}
