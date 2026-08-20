"use client";

import Link from "next/link";
import { ArrowRight, Mail, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerContacts } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function OwnerContactsPage() {
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("TOUS");
  const filtered=useMemo(()=>ownerContacts.filter(c=>`${c.name} ${c.propertyTitle} ${c.subject}`.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||c.status===status)),[query,status]);
  return <OwnerShell active="contacts" eyebrow="Prospects et demandes" title="Contacts reçus" description="Consultez et suivez les demandes liées à vos annonces.">
    <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Nom, bien ou sujet..."/></div><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="NOUVEAU">Nouveaux</option><option value="EN_COURS">En cours</option><option value="TRAITE">Traités</option><option value="ARCHIVE">Archivés</option></select></section>
    <section className={`${styles.card} ${styles.list}`}>{filtered.map(c=><article key={c.id}>
      <span className={styles.avatar}>{c.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span>
      <div><strong>{c.name}</strong><small>{c.subject} · {c.propertyTitle}</small><p>{c.message}</p><span>{c.createdAt}</span></div>
      <div className={styles.contact}><span><Mail size={14}/>{c.email}</span><span><Phone size={14}/>{c.phone}</span></div>
      <span className={styles[c.status.toLowerCase()]}>{c.status.replace("_"," ")}</span>
      <Link href={`/proprietaire/contacts/${c.id}`}>Ouvrir<ArrowRight size={14}/></Link>
    </article>)}</section>
  </OwnerShell>;
}
