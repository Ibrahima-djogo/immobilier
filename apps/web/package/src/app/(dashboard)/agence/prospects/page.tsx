"use client";
import Link from "next/link";
import {ArrowRight,Mail,Phone,Search} from "lucide-react";
import {useMemo,useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyProspects} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyProspectsPage(){
 const [query,setQuery]=useState("");const [status,setStatus]=useState("TOUS");
 const filtered=useMemo(()=>agencyProspects.filter(p=>`${p.name} ${p.propertyTitle} ${p.subject}`.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||p.status===status)),[query,status]);
 return <AgencyShell active="prospects" eyebrow="Suivi commercial élémentaire" title="Prospects de l’agence" description="Consultez et qualifiez les demandes reçues pour le portefeuille.">
  <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, bien ou sujet..."/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="NOUVEAU">Nouveaux</option><option value="EN_COURS">En cours</option><option value="QUALIFIE">Qualifiés</option><option value="CLOTURE">Clôturés</option></select></section>
  <section className={`${styles.card} ${styles.list}`}>{filtered.map(p=><article key={p.id}><span className={styles.avatar}>{p.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><div><strong>{p.name}</strong><small>{p.subject} · {p.propertyTitle}</small><p>{p.message}</p><span>{p.createdAt} · {p.source}</span></div><div className={styles.contact}><span><Mail size={14}/>{p.email}</span><span><Phone size={14}/>{p.phone}</span></div><span className={styles[p.status.toLowerCase()]}>{p.status.replace("_"," ")}</span><Link href={`/agence/prospects/${p.id}`}>Ouvrir<ArrowRight size={14}/></Link></article>)}</section>
 </AgencyShell>
}
