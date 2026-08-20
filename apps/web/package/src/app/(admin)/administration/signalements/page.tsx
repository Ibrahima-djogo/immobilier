"use client";
import Link from "next/link";
import {ArrowRight,Flag,Search,ShieldCheck} from "lucide-react";
import {useMemo,useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {reports} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function ReportsPage(){
 const [query,setQuery]=useState("");const [status,setStatus]=useState("TOUS");const [risk,setRisk]=useState("TOUS");
 const filtered=useMemo(()=>reports.filter(r=>`${r.reference} ${r.target} ${r.reason}`.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||r.status===status)&&(risk==="TOUS"||r.risk===risk)),[query,status,risk]);
 return <AdminShell active="signalements" eyebrow="Protection et confiance" title="Signalements" description="Qualifiez les signalements sans exposer l’identité du déclarant.">
  <section className={styles.privacy}><ShieldCheck size={19}/><p>L’identité du déclarant reste protégée et ne doit pas être communiquée au propriétaire ou à l’agence.</p></section>
  <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Référence, annonce ou motif..."/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="NOUVEAU">Nouveaux</option><option value="EN_ANALYSE">En analyse</option><option value="ACTION_PRISE">Action prise</option><option value="REJETE">Rejetés</option><option value="CLOTURE">Clôturés</option></select><select value={risk} onChange={e=>setRisk(e.target.value)}><option value="TOUS">Tous les risques</option><option value="FAIBLE">Faible</option><option value="MOYEN">Moyen</option><option value="ELEVE">Élevé</option></select></section>
  <section className={`${styles.card} ${styles.table}`}><div className={styles.head}><span>Dossier</span><span>Motif</span><span>Statut</span><span>Risque</span><span>Occurrences</span><span>Date</span><span></span></div>{filtered.map(r=><article key={r.id}><div><span><Flag size={18}/></span><div><strong>{r.reference}</strong><small>{r.target}</small></div></div><span>{r.reason}</span><b className={styles[r.status.toLowerCase()]}>{r.status.replace("_"," ")}</b><i className={styles[r.risk.toLowerCase()]}>{r.risk}</i><small>{r.count}</small><small>{r.createdAt}</small><Link href={`/administration/signalements/${r.id}`}>Traiter<ArrowRight size={14}/></Link></article>)}</section>
 </AdminShell>
}
