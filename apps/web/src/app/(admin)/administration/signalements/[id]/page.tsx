"use client";
import Link from "next/link";
import {ArrowLeft,CheckCircle2,EyeOff,Flag,Save,ShieldAlert,XCircle} from "lucide-react";
import {useParams} from "next/navigation";
import {useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {reports} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function ReportDetailPage(){
 const params=useParams<{id:string}>();const report=reports.find(r=>r.id===params.id)??reports[0];
 const [action,setAction]=useState<"AUCUNE"|"CORRECTION"|"RETRAIT"|"SUSPENSION"|"ESCALADE"|"" >("");const [reason,setReason]=useState("");const [saved,setSaved]=useState(false);
 return <AdminShell active="signalements" eyebrow="Traitement du signalement" title={report.reference} description={`Dossier lié à ${report.target}.`}>
  <Link href="/administration/signalements" className={styles.back}><ArrowLeft size={15}/>Retour aux signalements</Link>{saved&&<div className={styles.success}><CheckCircle2 size={17}/>Décision simulée enregistrée.</div>}
  <div className={styles.grid}><section className={`${styles.card} ${styles.main}`}><div className={styles.head}><span><Flag size={22}/></span><div><small>{report.reason}</small><h2>{report.target}</h2><p>{report.createdAt} · {report.count} occurrence(s)</p></div><b className={styles[report.risk.toLowerCase()]}>{report.risk}</b></div><div className={styles.protected}><EyeOff size={18}/><div><strong>Identité protégée</strong><p>Les informations du déclarant ne sont pas affichées dans cette interface de démonstration.</p></div></div><h3>Éléments à examiner</h3><ul><li>Annonce et médias actuels</li><li>Historique des modifications</li><li>Décisions et signalements antérieurs du compte</li><li>Doublons potentiels</li><li>Signaux de risque sur l’identité et le comportement</li></ul><h3>Historique du dossier</h3><ol><li><span>1</span><div><strong>Signalement reçu</strong><small>{report.createdAt}</small></div></li><li><span>2</span><div><strong>Qualification automatique</strong><small>Risque {report.risk.toLowerCase()}</small></div></li><li><span>3</span><div><strong>État actuel</strong><small>{report.status.replace("_"," ")}</small></div></li></ol></section>
   <aside className={`${styles.card} ${styles.side}`}><ShieldAlert size={23}/><h2>Décision</h2><label>Action<select value={action} onChange={e=>setAction(e.target.value as typeof action)}><option value="">Sélectionner</option><option value="AUCUNE">Aucune action</option><option value="CORRECTION">Correction demandée</option><option value="RETRAIT">Retrait</option><option value="SUSPENSION">Suspension</option><option value="ESCALADE">Escalade</option></select></label><label>Motif final<textarea rows={7} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Décision fondée et traçable..."/></label><button disabled={!action||!reason.trim()} onClick={()=>setSaved(true)}><Save size={16}/>Clôturer la décision</button><button className={styles.reject} onClick={()=>setAction("AUCUNE")}><XCircle size={16}/>Rejeter le signalement</button><p>La notification envoyée aux parties ne doit jamais révéler les données du déclarant.</p></aside>
  </div>
 </AdminShell>
}
