"use client";
import Link from "next/link";
import {ArrowLeft,Mail,Phone,Save} from "lucide-react";
import {useParams} from "next/navigation";
import {useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyProspects} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyProspectDetailPage(){
 const params=useParams<{id:string}>();const p=agencyProspects.find(x=>x.id===params.id)??agencyProspects[0];const [status,setStatus]=useState(p.status);const [note,setNote]=useState("");const [saved,setSaved]=useState(false);
 return <AgencyShell active="prospects" eyebrow="Détail du prospect" title={p.name} description={`Demande liée à ${p.propertyTitle}.`}><Link href="/agence/prospects" className={styles.back}><ArrowLeft size={15}/>Retour aux prospects</Link><div className={styles.grid}><section className={`${styles.card} ${styles.main}`}><span className={styles.avatar}>{p.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><h2>{p.subject}</h2><p className={styles.message}>{p.message}</p><div className={styles.info}><span><Mail size={16}/>{p.email}</span><span><Phone size={16}/>{p.phone}</span></div><div className={styles.context}><p><small>Bien</small><strong>{p.propertyTitle}</strong></p><p><small>Source</small><strong>{p.source}</strong></p><p><small>Réception</small><strong>{p.createdAt}</strong></p></div></section><aside className={`${styles.card} ${styles.side}`}><h2>Qualification</h2><label>Statut<select value={status} onChange={e=>setStatus(e.target.value as typeof status)}><option value="NOUVEAU">Nouveau</option><option value="EN_COURS">En cours</option><option value="QUALIFIE">Qualifié</option><option value="CLOTURE">Clôturé</option></select></label><label>Note interne<textarea rows={6} value={note} onChange={e=>setNote(e.target.value)}/></label><button onClick={()=>setSaved(true)}><Save size={16}/>Enregistrer</button>{saved&&<p className={styles.saved}>Suivi simulé enregistré.</p>}</aside></div></AgencyShell>
}
