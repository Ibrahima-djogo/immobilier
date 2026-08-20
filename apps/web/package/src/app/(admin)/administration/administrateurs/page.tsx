"use client";
import {CheckCircle2,KeyRound,Plus,Save,ShieldCheck,UserCog,UserX} from "lucide-react";
import {useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import styles from "./page.module.css";

const initial=[
{id:1,name:"Super Administrateur",email:"admin@demeureguinee.com",role:"SUPER_ADMIN",status:"ACTIF",lastLogin:"Aujourd’hui à 10:42",permissions:["TOUTES"]},
{id:2,name:"Modérateur principal",email:"moderateur@demeureguinee.com",role:"MODERATEUR",status:"ACTIF",lastLogin:"Aujourd’hui à 09:35",permissions:["MODERATION","SIGNALEMENTS","ANNONCES"]},
{id:3,name:"Support utilisateurs",email:"support@demeureguinee.com",role:"SUPPORT",status:"ACTIF",lastLogin:"Hier à 16:10",permissions:["UTILISATEURS_LECTURE","CONTACTS"]},
{id:4,name:"Administration contenu",email:"contenu@demeureguinee.com",role:"CONTENT_ADMIN",status:"DESACTIVE",lastLogin:"20 juillet 2026",permissions:["CONTENUS","FAQ","GUIDES"]},
];

export default function AdministratorsPage(){
 const [items,setItems]=useState(initial);const [saved,setSaved]=useState(false);const [creating,setCreating]=useState(false);
 function toggle(id:number){setItems(v=>v.map(a=>a.id===id?{...a,status:a.status==="ACTIF"?"DESACTIVE":"ACTIF"}:a));setSaved(true)}
 return <AdminShell active="administrateurs" eyebrow="Super Administration" title="Administrateurs" description="Créez, désactivez et limitez les permissions administratives selon le moindre privilège." action={<button className={styles.action} onClick={()=>setCreating(true)}><Plus size={16}/>Nouvel administrateur</button>}>
  <section className={styles.warning}><ShieldCheck size={20}/><p>La création, la désactivation et l’attribution des permissions sont réservées au Super Administrateur et doivent être journalisées.</p></section>
  {saved&&<div className={styles.success}><CheckCircle2 size={17}/>Modification simulée enregistrée.</div>}
  {creating&&<section className={`${styles.card} ${styles.create}`}><h2>Nouvel administrateur</h2><div><label>Nom<input placeholder="Nom complet"/></label><label>E-mail<input type="email" placeholder="admin@example.com"/></label><label>Rôle<select><option>MODERATEUR</option><option>SUPPORT</option><option>CONTENT_ADMIN</option><option>ADMIN</option></select></label></div><p>Les permissions détaillées seront définies après création.</p><button onClick={()=>{setCreating(false);setSaved(true)}}><Save size={16}/>Créer le compte</button></section>}
  <section className={`${styles.card} ${styles.table}`}><div className={styles.head}><span>Administrateur</span><span>Rôle</span><span>Permissions</span><span>Statut</span><span>Dernière connexion</span><span>Actions</span></div>{items.map(a=><article key={a.id}><div><span><UserCog size={18}/></span><div><strong>{a.name}</strong><small>{a.email}</small></div></div><code>{a.role}</code><div className={styles.permissions}>{a.permissions.map(p=><span key={p}>{p}</span>)}</div><b className={a.status==="ACTIF"?styles.active:styles.inactive}>{a.status}</b><small>{a.lastLogin}</small><div className={styles.actions}><button title="Permissions"><KeyRound size={16}/></button><button title={a.status==="ACTIF"?"Désactiver":"Activer"} onClick={()=>toggle(a.id)}><UserX size={16}/></button></div></article>)}</section>
 </AdminShell>
}
