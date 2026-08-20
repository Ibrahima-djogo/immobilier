"use client";
import {BarChart3,ClipboardCheck,Eye,Flag,Users} from "lucide-react";
import {useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {adminAds,adminUsers,reports,roleRequests} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AdminStatisticsPage(){
 const [period,setPeriod]=useState("30j");
 return <AdminShell active="statistiques" eyebrow="Vision globale" title="Statistiques de la plateforme" description="Suivez les utilisateurs, demandes, annonces, publications et signalements.">
  <div className={styles.periods}>{["7j","30j","90j","12 mois"].map(p=><button key={p} className={period===p?styles.active:""} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
  <section className={styles.stats}>
   <article className={styles.card}><Users size={21}/><div><small>Utilisateurs</small><strong>{adminUsers.length}</strong></div></article>
   <article className={styles.card}><ClipboardCheck size={21}/><div><small>Demandes de rôle</small><strong>{roleRequests.length}</strong></div></article>
   <article className={styles.card}><Eye size={21}/><div><small>Annonces</small><strong>{adminAds.length}</strong></div></article>
   <article className={styles.card}><Flag size={21}/><div><small>Signalements</small><strong>{reports.length}</strong></div></article>
  </section>
  <div className={styles.grid}>
   <section className={`${styles.card} ${styles.chartCard}`}><div className={styles.sectionTitle}><div><h2>Activité globale</h2><p>Période : {period}</p></div></div><div className={styles.chart}>{[45,58,52,66,61,79,86,74,91,84,96,89].map((v,i)=><div key={i}><span style={{height:`${v}%`}}/><small>{i+1}</small></div>)}</div></section>
   <section className={`${styles.card} ${styles.breakdown}`}><div className={styles.sectionTitle}><div><h2>Répartition des comptes</h2><p>Par rôle principal.</p></div></div>{["UTILISATEUR","PROPRIETAIRE","AGENCE"].map(role=>{const count=adminUsers.filter(u=>u.role===role).length;const pct=Math.round(count/adminUsers.length*100);return <div key={role}><p><span>{role}</span><strong>{count} · {pct}%</strong></p><i><b style={{width:`${pct}%`}}/></i></div>})}</section>
  </div>
  <section className={`${styles.card} ${styles.events}`}><div className={styles.sectionTitle}><div><h2>Événements à mesurer</h2><p>Plan analytique à connecter.</p></div><BarChart3 size={20}/></div><div>{["Recherches lancées","Annonces consultées","Favoris ajoutés","Contacts initiés","Demandes de rôle soumises","Annonces publiées ou rejetées"].map(item=><span key={item}>{item}</span>)}</div></section>
 </AdminShell>
}
