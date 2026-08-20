"use client";

import { Eye, Heart, MessageSquareText, TrendingUp } from "lucide-react";
import { useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerAds } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function OwnerStatisticsPage() {
  const [period,setPeriod]=useState("30j");
  const totals={views:ownerAds.reduce((s,a)=>s+a.views,0),favorites:ownerAds.reduce((s,a)=>s+a.favorites,0),contacts:ownerAds.reduce((s,a)=>s+a.contacts,0)};
  return <OwnerShell active="statistiques" eyebrow="Analyse du portefeuille" title="Statistiques" description="Analysez uniquement les performances de vos propres annonces.">
    <div className={styles.periods}>{["7j","30j","90j","12 mois"].map(p=><button key={p} className={period===p?styles.active:""} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
    <section className={styles.stats}>
      <article className={styles.card}><Eye size={21}/><div><small>Vues</small><strong>{totals.views}</strong></div></article>
      <article className={styles.card}><Heart size={21}/><div><small>Favoris</small><strong>{totals.favorites}</strong></div></article>
      <article className={styles.card}><MessageSquareText size={21}/><div><small>Contacts</small><strong>{totals.contacts}</strong></div></article>
      <article className={styles.card}><TrendingUp size={21}/><div><small>Taux de contact</small><strong>1,4 %</strong></div></article>
    </section>
    <div className={styles.grid}>
      <section className={`${styles.card} ${styles.chartCard}`}><div className={styles.sectionTitle}><div><h2>Évolution des consultations</h2><p>Période sélectionnée : {period}</p></div></div><div className={styles.chart}>{[38,52,47,68,61,80,92,76,88,69,96,84].map((v,i)=><div key={i}><span style={{height:`${v}%`}}/><small>{i+1}</small></div>)}</div></section>
      <section className={`${styles.card} ${styles.ranking}`}><div className={styles.sectionTitle}><div><h2>Annonces les plus vues</h2><p>Classement indicatif.</p></div></div>{ownerAds.sort((a,b)=>b.views-a.views).map((a,i)=><article key={a.id}><span>{i+1}</span><div><strong>{a.title}</strong><small>{a.views} vues · {a.contacts} contacts</small></div></article>)}</section>
    </div>
  </OwnerShell>;
}
