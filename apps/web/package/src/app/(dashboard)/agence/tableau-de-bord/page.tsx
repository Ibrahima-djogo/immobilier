"use client";
import Link from "next/link";
import {ArrowRight,Building2,Eye,FileText,MessageSquareText,Plus,TrendingUp} from "lucide-react";
import {useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyAds,agencyProperties,agencyProspects} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function AgencyDashboardPage(){
 const [period,setPeriod]=useState("30j");
 const published=agencyAds.filter(a=>a.status==="PUBLIEE").length;
 const views=agencyAds.reduce((s,a)=>s+a.views,0);
 const activeProspects=agencyProspects.filter(p=>p.status!=="CLOTURE").length;
 return <AgencyShell active="dashboard" eyebrow="Espace professionnel" title="Tableau de bord Agence" description="Suivez votre portefeuille, vos annonces et vos prospects sous l’identité validée de l’agence." action={<Link href="/agence/biens/nouveau" className={styles.action}><Plus size={17}/>Ajouter un bien</Link>}>
  <section className={styles.verification}><span><Building2 size={24}/></span><div><strong>Habitat Conakry — identité professionnelle validée</strong><p>Les données affichées sont limitées au périmètre de cette agence.</p></div><Link href="/agence/profil-professionnel">Gérer le profil</Link></section>
  <section className={styles.stats}>
   {[["Biens du portefeuille",agencyProperties.length,Building2],["Annonces publiées",published,FileText],["Consultations",views,Eye],["Prospects actifs",activeProspects,MessageSquareText]].map(([label,value,Icon])=><article key={String(label)} className={styles.card}><span><Icon size={21}/></span><div><small>{label}</small><strong>{String(value)}</strong></div></article>)}
  </section>
  <div className={styles.grid}>
   <section className={`${styles.card} ${styles.chartCard}`}><div className={styles.sectionTitle}><div><h2>Visibilité du portefeuille</h2><p>Consultations cumulées des annonces.</p></div><div className={styles.periods}>{["7j","30j","90j"].map(p=><button key={p} className={period===p?styles.activePeriod:""} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div><div className={styles.chart}>{[45,58,54,74,66,83,92].map((v,i)=><div key={i}><span style={{height:`${v}%`}}/><small>S{i+1}</small></div>)}</div><div className={styles.trend}><TrendingUp size={16}/>+21 % par rapport à la période précédente</div></section>
   <section className={`${styles.card} ${styles.actionsCard}`}><div className={styles.sectionTitle}><div><h2>Actions requises</h2><p>Éléments à traiter.</p></div></div>
    <Link href="/agence/biens"><span>1</span><div><strong>Bien incomplet</strong><small>Terrain commercial à Matoto</small></div><ArrowRight size={15}/></Link>
    <Link href="/agence/annonces"><span>1</span><div><strong>Annonce rejetée</strong><small>Correction requise</small></div><ArrowRight size={15}/></Link>
    <Link href="/agence/prospects"><span>2</span><div><strong>Nouveaux prospects</strong><small>Demandes à examiner</small></div><ArrowRight size={15}/></Link>
   </section>
  </div>
  <section className={`${styles.card} ${styles.recent}`}><div className={styles.sectionTitle}><div><h2>Portefeuille récent</h2><p>Derniers biens gérés par l’agence.</p></div><Link href="/agence/biens">Tout afficher</Link></div><div className={styles.propertyGrid}>{agencyProperties.slice(0,3).map(p=><article key={p.id}><img src={p.images[0]} alt={p.title}/><div><small>{p.reference} · {p.mandateType}</small><h3>{p.title}</h3><p>{p.location}</p><Link href={`/agence/biens/${p.slug}`}>Ouvrir<ArrowRight size={14}/></Link></div></article>)}</div></section>
 </AgencyShell>
}
