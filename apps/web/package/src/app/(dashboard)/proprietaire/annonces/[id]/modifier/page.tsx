"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerAds } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function EditAdPage() {
  const params=useParams<{id:string}>();
  const ad=ownerAds.find(a=>a.id===params.id)??ownerAds[0];
  const [title,setTitle]=useState(ad.title);
  const [summary,setSummary]=useState("Présentation publique de l’annonce à mettre à jour.");
  const [saved,setSaved]=useState(false);
  return <OwnerShell active="annonces" eyebrow="Modification" title="Modifier l’annonce" description="Modifiez le contenu avant une nouvelle soumission.">
    <Link href={`/proprietaire/annonces/${ad.id}`} className={styles.back}><ArrowLeft size={15}/>Retour au détail</Link>
    {saved&&<div className={styles.notice}>Modifications simulées enregistrées.</div>}
    <form className={`${styles.card} ${styles.form}`} onSubmit={(e)=>{e.preventDefault();setSaved(true)}}>
      <label>Titre public<input value={title} onChange={(e)=>setTitle(e.target.value)}/></label>
      <label>Résumé<textarea rows={9} value={summary} onChange={(e)=>setSummary(e.target.value)}/></label>
      <div><p>Une modification importante peut nécessiter une nouvelle modération.</p><button><Save size={16}/>Enregistrer</button></div>
    </form>
  </OwnerShell>;
}
