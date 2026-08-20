"use client";
import Link from "next/link";
import {ArrowRight,Search,Users} from "lucide-react";
import {useMemo,useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {adminUsers} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AdminUsersPage(){
 const [query,setQuery]=useState("");const [status,setStatus]=useState("TOUS");const [role,setRole]=useState("TOUS");
 const filtered=useMemo(()=>adminUsers.filter(u=>`${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(query.toLowerCase())&&(status==="TOUS"||u.status===status)&&(role==="TOUS"||u.role===role)),[query,status,role]);
 return <AdminShell active="utilisateurs" eyebrow="Gestion des comptes" title="Utilisateurs" description="Recherchez, filtrez et examinez les comptes de la plateforme.">
  <section className={`${styles.card} ${styles.filters}`}><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, e-mail ou téléphone..."/></div><select value={role} onChange={e=>setRole(e.target.value)}><option value="TOUS">Tous les rôles</option><option value="UTILISATEUR">Utilisateur</option><option value="PROPRIETAIRE">Propriétaire</option><option value="AGENCE">Agence</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="TOUS">Tous les statuts</option><option value="ACTIF">Actifs</option><option value="EN_ATTENTE">En attente</option><option value="SUSPENDU">Suspendus</option><option value="BLOQUE">Bloqués</option><option value="DESACTIVE">Désactivés</option></select></section>
  <section className={`${styles.card} ${styles.table}`}><div className={styles.head}><span>Identité</span><span>Rôle</span><span>Statut</span><span>Activité</span><span>Inscription</span><span></span></div>{filtered.map(u=><article key={u.id}><div><span className={styles.avatar}>{u.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><div><strong>{u.name}</strong><small>{u.email}</small><small>{u.phone}</small></div></div><span>{u.role}</span><b className={styles[u.status.toLowerCase()]}>{u.status.replace("_"," ")}</b><div className={styles.activity}><small>{u.properties} biens</small><small>{u.ads} annonces</small><small>Dernière connexion : {u.lastLogin}</small></div><small>{u.createdAt}</small><Link href={`/administration/utilisateurs/${u.id}`}>Ouvrir<ArrowRight size={14}/></Link></article>)}</section>
  {filtered.length===0&&<section className={`${styles.card} ${styles.empty}`}><Users size={36}/><h2>Aucun utilisateur trouvé</h2></section>}
 </AdminShell>
}
