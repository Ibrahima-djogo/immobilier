"use client";
import Link from "next/link";
import {ArrowRight,CheckCircle2,FileCheck2} from "lucide-react";
import {useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyProperties} from "@/lib/agence/demo-data";
import styles from "./page.module.css";

export default function NewAgencyAdPage(){
 const [done,setDone]=useState(false);const [form,setForm]=useState({property:agencyProperties[0].slug,title:"",summary:"",phone:true,email:true,terms:false});
 if(done)return <AgencyShell active="annonces" eyebrow="Annonce créée" title="Annonce prête à être soumise" description="La démonstration a été validée."><section className={`${styles.card} ${styles.success}`}><CheckCircle2 size={43}/><h2>{form.title}</h2><p>L’annonce sera enregistrée comme brouillon professionnel.</p><Link href="/agence/annonces">Voir les annonces<ArrowRight size={15}/></Link></section></AgencyShell>;
 return <AgencyShell active="annonces" eyebrow="Nouvelle annonce professionnelle" title="Créer une annonce" description="Rattachez l’annonce à un bien du portefeuille.">
  <form className={`${styles.card} ${styles.form}`} onSubmit={e=>{e.preventDefault();setDone(true)}}>
   <label>Bien rattaché<select value={form.property} onChange={e=>setForm(v=>({...v,property:e.target.value}))}>{agencyProperties.map(p=><option key={p.id} value={p.slug}>{p.reference} — {p.title}</option>)}</select></label>
   <label>Titre public<input value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))}/></label>
   <label>Résumé<textarea rows={8} value={form.summary} onChange={e=>setForm(v=>({...v,summary:e.target.value}))}/></label>
   <div className={styles.options}><label><input type="checkbox" checked={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.checked}))}/>Afficher le téléphone professionnel</label><label><input type="checkbox" checked={form.email} onChange={e=>setForm(v=>({...v,email:e.target.checked}))}/>Autoriser l’e-mail professionnel</label></div>
   <label className={styles.terms}><input type="checkbox" checked={form.terms} onChange={e=>setForm(v=>({...v,terms:e.target.checked}))}/>Je confirme que l’annonce correspond au bien et au mandat détenu.</label>
   <div className={styles.footer}><p>La publication reste soumise à modération.</p><button type="submit" disabled={!form.title||!form.summary||!form.terms}><FileCheck2 size={16}/>Créer le brouillon</button></div>
  </form>
 </AgencyShell>
}
