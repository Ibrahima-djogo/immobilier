"use client";
import Link from "next/link";
import {ArrowLeft,CheckCircle2,FileText,MessageSquareWarning,Save,ShieldCheck,XCircle} from "lucide-react";
import {useParams} from "next/navigation";
import {useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {roleRequests} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function RoleRequestDetailPage(){
 const params=useParams<{id:string}>();const request=roleRequests.find(r=>r.id===params.id)??roleRequests[0];
 const [decision,setDecision]=useState<"APPROUVER"|"COMPLEMENT"|"REFUSER"|"" >("");const [reason,setReason]=useState("");const [saved,setSaved]=useState(false);
 return <AdminShell active="roles" eyebrow="Examen de la demande" title={request.reference} description={`Demande ${request.requestedRole.toLowerCase()} soumise par ${request.name}.`}>
  <Link href="/administration/demandes-role" className={styles.back}><ArrowLeft size={15}/>Retour aux demandes</Link>{saved&&<div className={styles.success}><CheckCircle2 size={17}/>Décision simulée enregistrée.</div>}
  <div className={styles.grid}><section className={`${styles.card} ${styles.main}`}><div className={styles.identity}><span>{request.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><div><h2>{request.name}</h2><p>{request.email}</p><small>{request.requestedRole} · {request.status.replace("_"," ")}</small></div></div><div className={styles.facts}><p><small>Soumission</small><strong>{request.submittedAt}</strong></p><p><small>Niveau de risque</small><strong>{request.risk}</strong></p><p><small>Justificatifs</small><strong>{request.documents} fichier(s)</strong></p><p><small>Référence</small><strong>{request.reference}</strong></p></div><h3>Justificatifs disponibles</h3><div className={styles.documents}>{Array.from({length:request.documents}).map((_,i)=><button key={i}><FileText size={18}/><span><strong>Document {i+1}</strong><small>Accès réservé aux personnes habilitées</small></span></button>)}</div><div className={styles.privacy}><ShieldCheck size={18}/><p>Les pièces justificatives sont sensibles. Leur consultation et leur téléchargement doivent être contrôlés et journalisés.</p></div></section>
   <aside className={`${styles.card} ${styles.side}`}><h2>Décision</h2><div className={styles.choices}><button className={decision==="APPROUVER"?styles.selected:""} onClick={()=>setDecision("APPROUVER")}><CheckCircle2 size={17}/>Approuver</button><button className={decision==="COMPLEMENT"?styles.selected:""} onClick={()=>setDecision("COMPLEMENT")}><MessageSquareWarning size={17}/>Demander un complément</button><button className={decision==="REFUSER"?styles.selectedDanger:""} onClick={()=>setDecision("REFUSER")}><XCircle size={17}/>Refuser</button></div><label>Motif ou commentaire<textarea rows={7} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motif obligatoire pour complément ou refus..."/></label><button className={styles.save} disabled={!decision||(decision!=="APPROUVER"&&!reason.trim())} onClick={()=>setSaved(true)}><Save size={16}/>Enregistrer la décision</button><p className={styles.note}>L’attribution ou la révocation du rôle doit être exécutée côté serveur et produire une entrée d’audit.</p></aside>
  </div>
 </AdminShell>
}
