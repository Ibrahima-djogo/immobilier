"use client";
import Link from "next/link";
import {ArrowRight,Eye,FileText,Heart,MessageSquareText,Plus,Search} from "lucide-react";
import {useMemo,useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyAds} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyAdsPage(){
 const [query,setQuery]=useState("");const [status,setStatus]=useState("TOUS");
 const filtered=useMemo(()=>agencyAds.filter(a=>a.title.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||a.status===status)),[query,status]);
 return <AgencyShell active="annonces" eyebrow="Diffusion professionnelle" title="Annonces de l’agence" description="Gérez les annonces rattachées au portefeuille professionnel." action={<Link className={styles.action} href="/agence/annonces/nouvelle"><Plus size={17}/>Nouvelle annonce</Link>}>
  <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une annonce..."/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="PUBLIEE">Publiées</option><option value="BROUILLON">Brouillons</option><option value="EN_ATTENTE">En attente</option><option value="REJETEE">Rejetées</option></select></section>
  <section className={`${styles.card} ${styles.table}`}><div className={styles.head}><span>Annonce</span><span>Statut</span><span>Performance</span><span>Mise à jour</span><span></span></div>{filtered.map(a=><article key={a.id}><div><span className={styles.icon}><FileText size={18}/></span><div><strong>{a.title}</strong><small>Bien : {a.propertySlug}</small></div></div><span className={styles[a.status.toLowerCase()]}>{a.status.replace("_"," ")}</span><div className={styles.metrics}><span><Eye size={14}/>{a.views}</span><span><Heart size={14}/>{a.favorites}</span><span><MessageSquareText size={14}/>{a.contacts}</span></div><small>{a.updatedAt}</small><Link href={`/agence/annonces/${a.id}`}>Ouvrir<ArrowRight size={14}/></Link></article>)}</section>
 </AgencyShell>
}
