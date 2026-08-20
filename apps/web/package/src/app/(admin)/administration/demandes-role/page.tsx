"use client";
import Link from "next/link";
import {ArrowRight,ClipboardCheck,Search} from "lucide-react";
import {useMemo,useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {roleRequests} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function RoleRequestsPage(){
 const [query,setQuery]=useState("");const [status,setStatus]=useState("TOUS");const [role,setRole]=useState("TOUS");
 const filtered=useMemo(()=>roleRequests.filter(r=>`${r.name} ${r.email} ${r.reference}`.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||r.status===status)&&(role==="TOUS"||r.requestedRole===role)),[query,status,role]);
 return <AdminShell active="roles" eyebrow="Vérification des identités" title="Demandes de rôle" description="Examinez les demandes Propriétaire et Agence avec leurs justificatifs.">
  <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Identité, e-mail ou référence..."/></div><select value={role} onChange={e=>setRole(e.target.value)}><option value="TOUS">Tous les rôles</option><option value="PROPRIETAIRE">Propriétaire</option><option value="AGENCE">Agence</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="SOUMISE">Soumises</option><option value="EN_EXAMEN">En examen</option><option value="COMPLEMENT_REQUIS">Complément requis</option><option value="APPROUVEE">Approuvées</option><option value="REFUSEE">Refusées</option></select></section>
  <section className={`${styles.card} ${styles.table}`}><div className={styles.head}><span>Demandeur</span><span>Rôle</span><span>Statut</span><span>Risque</span><span>Documents</span><span>Soumission</span><span></span></div>{filtered.map(r=><article key={r.id}><div><span className={styles.avatar}><ClipboardCheck size={18}/></span><div><strong>{r.name}</strong><small>{r.email}</small><small>{r.reference}</small></div></div><span>{r.requestedRole}</span><b className={styles[r.status.toLowerCase()]}>{r.status.replace("_"," ")}</b><i className={styles[r.risk.toLowerCase()]}>{r.risk}</i><small>{r.documents} fichier(s)</small><small>{r.submittedAt}</small><Link href={`/administration/demandes-role/${r.id}`}>Examiner<ArrowRight size={14}/></Link></article>)}</section>
 </AdminShell>
}
