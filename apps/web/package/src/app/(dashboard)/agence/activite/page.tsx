"use client";
import {Activity,Building2,FileText,MessageSquareText,Search,Store} from "lucide-react";
import {useMemo,useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyActivity} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

function iconFor(action:string){if(action.includes("Annonce"))return FileText;if(action.includes("Prospect"))return MessageSquareText;if(action.includes("Profil"))return Store;if(action.includes("Bien"))return Building2;return Activity}
export default function AgencyActivityPage(){
 const [query,setQuery]=useState("");const filtered=useMemo(()=>agencyActivity.filter(i=>`${i.action} ${i.target} ${i.actor}`.toLowerCase().includes(query.toLowerCase())),[query]);
 return <AgencyShell active="activite" eyebrow="Traçabilité limitée" title="Activité récente" description="Consultez les principales actions du périmètre de l’agence."><section className={`${styles.card} ${styles.search}`}><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une action..."/></section><section className={`${styles.card} ${styles.timeline}`}>{filtered.map(item=>{const Icon=iconFor(item.action);return <article key={item.id}><span><Icon size={18}/></span><div><strong>{item.action}</strong><p>{item.target}</p><small>{item.actor} · {item.date}</small></div></article>})}</section><p className={styles.notice}>Cette vue est limitée au périmètre de l’agence. Le journal global reste réservé à l’administration.</p></AgencyShell>
}
