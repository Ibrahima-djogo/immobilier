"use client";
import {Download,FileSearch,Search,ShieldCheck} from "lucide-react";
import {useMemo,useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {auditLogs} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AuditPage(){
 const [query,setQuery]=useState("");const [result,setResult]=useState("TOUS");
 const filtered=useMemo(()=>auditLogs.filter(l=>`${l.actor} ${l.action} ${l.target} ${l.ip}`.toLowerCase().includes(query.toLowerCase())&&(result==="TOUS"||l.result===result)),[query,result]);
 return <AdminShell active="audit" eyebrow="Traçabilité et sécurité" title="Journal d’activité" description="Filtrez les actions par auteur, action, cible, date et résultat." action={<button className={styles.export}><Download size={16}/>Exporter</button>}>
  <section className={styles.notice}><ShieldCheck size={19}/><p>Les entrées d’audit critiques doivent être immuables et accessibles uniquement selon les permissions.</p></section>
  <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Auteur, action, cible ou IP..."/></div><select value={result} onChange={e=>setResult(e.target.value)}><option value="TOUS">Tous les résultats</option><option value="SUCCES">Succès</option><option value="AUTORISE">Autorisé</option><option value="ECHEC">Échec</option></select><input type="date" aria-label="Date de début"/><input type="date" aria-label="Date de fin"/></section>
  <section className={`${styles.card} ${styles.table}`}><div className={styles.head}><span>Auteur</span><span>Action</span><span>Cible</span><span>Résultat</span><span>Date</span><span>Adresse IP</span></div>{filtered.map(l=><article key={l.id}><div><span><FileSearch size={17}/></span><strong>{l.actor}</strong></div><code>{l.action}</code><span>{l.target}</span><b className={styles[l.result.toLowerCase()]}>{l.result}</b><small>{l.date}</small><code>{l.ip}</code></article>)}</section>
 </AdminShell>
}
