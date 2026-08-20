"use client";
import Link from "next/link";
import {ArrowRight,Eye,Flag,Search} from "lucide-react";
import {useMemo,useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {adminAds} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AdminAdsPage(){
 const [query,setQuery]=useState("");const [status,setStatus]=useState("TOUS");const [risk,setRisk]=useState("TOUS");
 const filtered=useMemo(()=>adminAds.filter(a=>`${a.title} ${a.owner} ${a.type}`.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||a.status===status)&&(risk==="TOUS"||(risk==="ELEVE"?a.risk>=60:risk==="MOYEN"?a.risk>=30&&a.risk<60:a.risk<30))),[query,status,risk]);
 return <AdminShell active="annonces" eyebrow="Contrôle des publications" title="Gestion des annonces" description="Recherchez, filtrez et contrôlez toutes les annonces de la plateforme.">
  <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Titre, annonceur ou catégorie..."/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="BROUILLON">Brouillons</option><option value="EN_ATTENTE">En attente</option><option value="PUBLIEE">Publiées</option><option value="REJETEE">Rejetées</option><option value="SUSPENDUE">Suspendues</option></select><select value={risk} onChange={e=>setRisk(e.target.value)}><option value="TOUS">Tous les risques</option><option value="FAIBLE">Faible</option><option value="MOYEN">Moyen</option><option value="ELEVE">Élevé</option></select></section>
  <section className={`${styles.card} ${styles.table}`}><div className={styles.head}><span>Annonce</span><span>Statut</span><span>Risque</span><span>Performance</span><span>Signalements</span><span>Soumission</span><span></span></div>{filtered.map(a=><article key={a.id}><div><strong>{a.title}</strong><small>{a.owner} · {a.type}</small></div><b className={styles[a.status.toLowerCase()]}>{a.status.replace("_"," ")}</b><div className={styles.risk}><span><i style={{width:`${a.risk}%`}}/></span><small>{a.risk}/100</small></div><span className={styles.views}><Eye size={14}/>{a.views} vues</span><span className={styles.reports}><Flag size={14}/>{a.reports}</span><small>{a.submittedAt}</small><Link href={`/administration/annonces/${a.id}`}>Contrôler<ArrowRight size={14}/></Link></article>)}</section>
 </AdminShell>
}
