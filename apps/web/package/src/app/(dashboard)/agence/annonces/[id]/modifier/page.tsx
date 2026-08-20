"use client";
import Link from "next/link";
import {ArrowLeft,Save} from "lucide-react";
import {useParams} from "next/navigation";
import {useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import {agencyAds} from "@/lib/agence/demo-data";
import styles from "./page.module.css";
export default function EditAgencyAdPage(){
 const params=useParams<{id:string}>();const a=agencyAds.find(x=>x.id===params.id)??agencyAds[0];const [title,setTitle]=useState(a.title);const [summary,setSummary]=useState("Présentation publique de l’annonce professionnelle.");const [saved,setSaved]=useState(false);
 return <AgencyShell active="annonces" eyebrow="Modification" title="Modifier l’annonce" description="Modifiez le contenu avant une nouvelle soumission."><Link href={`/agence/annonces/${a.id}`} className={styles.back}><ArrowLeft size={15}/>Retour au détail</Link>{saved&&<div className={styles.notice}>Modifications simulées enregistrées.</div>}<form className={`${styles.card} ${styles.form}`} onSubmit={e=>{e.preventDefault();setSaved(true)}}><label>Titre public<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Résumé<textarea rows={9} value={summary} onChange={e=>setSummary(e.target.value)}/></label><div><p>Une modification sensible peut provoquer une nouvelle modération.</p><button type="submit"><Save size={16}/>Enregistrer</button></div></form></AgencyShell>
}
