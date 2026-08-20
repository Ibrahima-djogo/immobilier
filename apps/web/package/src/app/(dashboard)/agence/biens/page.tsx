"use client";
import Link from "next/link";
import {ArrowRight,Building2,Eye,Grid2X2,List,MapPin,MessageSquareText,Plus,Search} from "lucide-react";
import {useMemo,useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyProperties,formatGnf} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyPropertiesPage(){
 const [query,setQuery]=useState("");const [view,setView]=useState<"grid"|"list">("grid");const [status,setStatus]=useState("TOUS");const [mandate,setMandate]=useState("TOUS");
 const filtered=useMemo(()=>agencyProperties.filter(p=>`${p.title} ${p.location} ${p.reference} ${p.ownerDisplayName}`.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||p.status===status)&&(mandate==="TOUS"||p.mandateType===mandate)),[query,status,mandate]);
 return <AgencyShell active="biens" eyebrow="Portefeuille professionnel" title="Biens de l’agence" description="Gérez les biens confiés à l’agence et leurs mandats." action={<Link className={styles.action} href="/agence/biens/nouveau"><Plus size={17}/>Ajouter un bien</Link>}>
  <section className={`${styles.card} ${styles.filters}`}><div className={styles.search}><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Titre, référence, client..."/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="ACTIF">Actifs</option><option value="BROUILLON">Brouillons</option><option value="ARCHIVE">Archivés</option></select><select value={mandate} onChange={e=>setMandate(e.target.value)}><option value="TOUS">Tous les mandats</option><option value="EXCLUSIF">Exclusifs</option><option value="SIMPLE">Simples</option><option value="INTERNE">Internes</option></select><div className={styles.views}><button className={view==="grid"?styles.active:""} onClick={()=>setView("grid")}><Grid2X2 size={17}/></button><button className={view==="list"?styles.active:""} onClick={()=>setView("list")}><List size={18}/></button></div></section>
  <p className={styles.resultCount}><strong>{filtered.length}</strong> bien(s) affiché(s)</p>
  <section className={view==="grid"?styles.grid:styles.list}>{filtered.map(p=><article key={p.id} className={`${styles.card} ${styles.property}`}><div className={styles.imageWrap}><img src={p.images[0]} alt={p.title}/><span className={styles[p.status.toLowerCase()]}>{p.status}</span></div><div className={styles.body}><div className={styles.reference}><span>{p.reference}</span><strong>{p.mandateType}</strong></div><h2>{p.title}</h2><p><MapPin size={14}/>{p.location}</p><strong className={styles.price}>{formatGnf(p.price)}{p.operation==="LOCATION"?" / mois":""}</strong><div className={styles.client}><small>Client associé</small><strong>{p.ownerDisplayName}</strong></div><div className={styles.metrics}><span><Eye size={14}/>{p.views} vues</span><span><MessageSquareText size={14}/>{p.contacts} contacts</span></div><div className={styles.completion}><div><small>Complétude</small><b>{p.completeness}%</b></div><span><i style={{width:`${p.completeness}%`}}/></span></div><Link href={`/agence/biens/${p.slug}`}>Gérer le bien<ArrowRight size={14}/></Link></div></article>)}</section>
  {filtered.length===0&&<section className={`${styles.card} ${styles.empty}`}><Building2 size={37}/><h2>Aucun bien trouvé</h2><p>Modifiez les filtres ou ajoutez un bien.</p></section>}
 </AgencyShell>
}
