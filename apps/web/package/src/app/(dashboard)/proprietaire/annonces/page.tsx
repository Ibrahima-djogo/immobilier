"use client";

import Link from "next/link";
import { ArrowRight, Eye, FileText, Heart, MessageSquareText, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerAds } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function OwnerAdsPage() {
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("TOUS");
  const filtered=useMemo(()=>ownerAds.filter(ad=>ad.title.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||ad.status===status)),[query,status]);

  return (
    <OwnerShell active="annonces" eyebrow="Diffusion publique" title="Mes annonces" description="Gérez les annonces rattachées à vos biens."
      action={<Link className={styles.action} href="/proprietaire/annonces/nouvelle"><Plus size={17}/>Nouvelle annonce</Link>}>
      <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher une annonce..."/></div><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="PUBLIEE">Publiées</option><option value="BROUILLON">Brouillons</option><option value="EN_ATTENTE">En attente</option><option value="REJETEE">Rejetées</option></select></section>
      <section className={`${styles.card} ${styles.table}`}>
        <div className={styles.head}><span>Annonce</span><span>Statut</span><span>Performance</span><span>Mise à jour</span><span></span></div>
        {filtered.map(ad=><article key={ad.id}>
          <div><span className={styles.icon}><FileText size={18}/></span><div><strong>{ad.title}</strong><small>Bien : {ad.propertySlug}</small></div></div>
          <span className={styles[ad.status.toLowerCase()]}>{ad.status.replace("_"," ")}</span>
          <div className={styles.metrics}><span><Eye size={14}/>{ad.views}</span><span><Heart size={14}/>{ad.favorites}</span><span><MessageSquareText size={14}/>{ad.contacts}</span></div>
          <small>{ad.updatedAt}</small>
          <Link href={`/proprietaire/annonces/${ad.id}`}>Ouvrir<ArrowRight size={14}/></Link>
        </article>)}
      </section>
    </OwnerShell>
  );
}
