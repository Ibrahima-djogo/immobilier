"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerContacts } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function ContactDetailPage() {
  const params=useParams<{id:string}>();
  const contact=ownerContacts.find(c=>c.id===params.id)??ownerContacts[0];
  const [status,setStatus]=useState(contact.status);
  const [note,setNote]=useState("");
  const [saved,setSaved]=useState(false);
  return <OwnerShell active="contacts" eyebrow="Détail du contact" title={contact.name} description={`Demande liée à ${contact.propertyTitle}.`}>
    <Link href="/proprietaire/contacts" className={styles.back}><ArrowLeft size={15}/>Retour aux contacts</Link>
    <div className={styles.grid}>
      <section className={`${styles.card} ${styles.main}`}><span className={styles.avatar}>{contact.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><h2>{contact.subject}</h2><p className={styles.message}>{contact.message}</p><div className={styles.info}><span><Mail size={16}/>{contact.email}</span><span><Phone size={16}/>{contact.phone}</span></div></section>
      <aside className={`${styles.card} ${styles.side}`}><h2>Suivi</h2><label>Statut<select value={status} onChange={(e)=>setStatus(e.target.value as typeof status)}><option value="NOUVEAU">Nouveau</option><option value="EN_COURS">En cours</option><option value="TRAITE">Traité</option><option value="ARCHIVE">Archivé</option></select></label><label>Note interne<textarea rows={6} value={note} onChange={(e)=>setNote(e.target.value)}/></label><button onClick={()=>setSaved(true)}><Save size={16}/>Enregistrer</button>{saved&&<p className={styles.saved}>Suivi simulé enregistré.</p>}</aside>
    </div>
  </OwnerShell>;
}
