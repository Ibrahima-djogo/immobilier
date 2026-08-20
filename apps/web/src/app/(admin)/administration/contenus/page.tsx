"use client";
import {CheckCircle2,Edit3,Eye,EyeOff,Plus} from "lucide-react";
import {useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import styles from "./page.module.css";

const initial=[
{id:1,title:"À propos",type:"PAGE",status:"PUBLIE",version:"v1.3",updated:"30 juillet 2026"},
{id:2,title:"Centre d’aide",type:"PAGE",status:"PUBLIE",version:"v1.1",updated:"29 juillet 2026"},
{id:3,title:"Questions fréquentes",type:"FAQ",status:"BROUILLON",version:"v0.8",updated:"Aujourd’hui"},
{id:4,title:"Conditions d’utilisation",type:"POLITIQUE",status:"PUBLIE",version:"v2.0",updated:"15 juillet 2026"},
{id:5,title:"Politique de confidentialité",type:"POLITIQUE",status:"PUBLIE",version:"v2.1",updated:"15 juillet 2026"},
{id:6,title:"Message de maintenance",type:"BANNIERE",status:"INACTIF",version:"v1.0",updated:"20 juillet 2026"},
];

export default function ContentsPage(){
 const [items,setItems]=useState(initial);const [saved,setSaved]=useState(false);
 function toggle(id:number){setItems(v=>v.map(i=>i.id===id?{...i,status:i.status==="PUBLIE"?"INACTIF":"PUBLIE"}:i));setSaved(true)}
 return <AdminShell active="contenus" eyebrow="CMS institutionnel" title="Contenus publics" description="Gérez les pages, FAQ, guides, politiques et messages système." action={<button className={styles.action}><Plus size={16}/>Nouveau contenu</button>}>
  {saved&&<div className={styles.success}><CheckCircle2 size={17}/>Modification simulée enregistrée.</div>}
  <section className={styles.cards}>{items.map(item=><article key={item.id} className={styles.card}><div className={styles.top}><span>{item.type}</span><b className={styles[item.status.toLowerCase()]}>{item.status}</b></div><h2>{item.title}</h2><p>Version {item.version} · Mise à jour {item.updated}</p><div><button><Edit3 size={15}/>Modifier</button><button onClick={()=>toggle(item.id)}>{item.status==="PUBLIE"?<EyeOff size={15}/>:<Eye size={15}/>} {item.status==="PUBLIE"?"Dépublier":"Publier"}</button></div></article>)}</section>
  <section className={styles.policy}><strong>Règles de publication</strong><p>Les conditions et politiques doivent être versionnées, datées et conserver les versions acceptées. Les bannières et messages système doivent être planifiables, ciblables et tracés.</p></section>
 </AdminShell>
}
