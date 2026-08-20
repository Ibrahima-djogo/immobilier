"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2 } from "lucide-react";
import { useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerProperties } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function NewAdPage() {
  const [done,setDone]=useState(false);
  const [form,setForm]=useState({property:ownerProperties[0].slug,title:"",summary:"",contactPhone:true,contactEmail:true,terms:false});
  if(done) return <OwnerShell active="annonces" eyebrow="Annonce créée" title="Annonce prête à être soumise" description="La démonstration a été validée."><section className={`${styles.card} ${styles.success}`}><CheckCircle2 size={43}/><h2>{form.title}</h2><p>L’annonce sera enregistrée comme brouillon puis soumise à modération.</p><Link href="/proprietaire/annonces">Voir mes annonces<ArrowRight size={15}/></Link></section></OwnerShell>;

  return (
    <OwnerShell active="annonces" eyebrow="Nouvelle annonce" title="Créer une annonce" description="Rattachez l’annonce à un bien existant et préparez sa diffusion.">
      <form className={`${styles.card} ${styles.form}`} onSubmit={(e)=>{e.preventDefault();setDone(true)}}>
        <label>Bien rattaché<select value={form.property} onChange={(e)=>setForm(v=>({...v,property:e.target.value}))}>{ownerProperties.map(p=><option key={p.id} value={p.slug}>{p.title}</option>)}</select></label>
        <label>Titre public<input value={form.title} onChange={(e)=>setForm(v=>({...v,title:e.target.value}))} placeholder="Villa contemporaine à louer à Kipé"/></label>
        <label>Résumé de l’annonce<textarea rows={8} value={form.summary} onChange={(e)=>setForm(v=>({...v,summary:e.target.value}))}/></label>
        <div className={styles.options}><label><input type="checkbox" checked={form.contactPhone} onChange={(e)=>setForm(v=>({...v,contactPhone:e.target.checked}))}/>Afficher le téléphone autorisé</label><label><input type="checkbox" checked={form.contactEmail} onChange={(e)=>setForm(v=>({...v,contactEmail:e.target.checked}))}/>Autoriser le contact par e-mail</label></div>
        <label className={styles.terms}><input type="checkbox" checked={form.terms} onChange={(e)=>setForm(v=>({...v,terms:e.target.checked}))}/>Je confirme que l’annonce correspond au bien rattaché.</label>
        <div className={styles.footer}><p>La publication reste soumise à modération.</p><button type="submit" disabled={!form.title||!form.summary||!form.terms}><FileCheck2 size={16}/>Créer le brouillon</button></div>
      </form>
    </OwnerShell>
  );
}
