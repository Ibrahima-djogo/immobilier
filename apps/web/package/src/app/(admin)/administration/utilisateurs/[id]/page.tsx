"use client";
import Link from "next/link";
import {ArrowLeft,Ban,CheckCircle2,Lock,RotateCcw,Save,ShieldAlert} from "lucide-react";
import {useParams} from "next/navigation";
import {useState} from "react";
import AdminShell from "@/components/administration/AdminShell";
import {adminUsers} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AdminUserDetailPage(){
 const params=useParams<{id:string}>();const user=adminUsers.find(u=>u.id===params.id)??adminUsers[0];
 const [status,setStatus]=useState(user.status);const [reason,setReason]=useState("");const [saved,setSaved]=useState(false);
 return <AdminShell active="utilisateurs" eyebrow="Détail du compte" title={user.name} description="Consultez le profil, les rôles, les ressources et l’état du compte.">
  <Link href="/administration/utilisateurs" className={styles.back}><ArrowLeft size={15}/>Retour aux utilisateurs</Link>
  {saved&&<div className={styles.success}><CheckCircle2 size={17}/>Décision simulée enregistrée et prête à être journalisée.</div>}
  <div className={styles.grid}><section className={`${styles.card} ${styles.main}`}><div className={styles.identity}><span>{user.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><div><h2>{user.name}</h2><p>{user.email}</p><p>{user.phone}</p></div><b className={styles[user.status.toLowerCase()]}>{user.status.replace("_"," ")}</b></div><div className={styles.facts}><p><small>Rôle</small><strong>{user.role}</strong></p><p><small>Inscription</small><strong>{user.createdAt}</strong></p><p><small>Dernière connexion</small><strong>{user.lastLogin}</strong></p><p><small>Ressources</small><strong>{user.properties} biens · {user.ads} annonces</strong></p></div><h3>Historique récent</h3><ol><li><span>1</span><div><strong>Compte créé</strong><small>{user.createdAt}</small></div></li><li><span>2</span><div><strong>Profil vérifié</strong><small>Contrôle automatique simulé</small></div></li><li><span>3</span><div><strong>État actuel</strong><small>{status}</small></div></li></ol></section>
   <aside className={`${styles.card} ${styles.side}`}><ShieldAlert size={24}/><h2>Action administrative</h2><label>Nouveau statut<select value={status} onChange={e=>setStatus(e.target.value as typeof status)}><option value="ACTIF">Actif</option><option value="EN_ATTENTE">En attente</option><option value="SUSPENDU">Suspendu</option><option value="BLOQUE">Bloqué</option><option value="DESACTIVE">Désactivé</option></select></label><label>Motif obligatoire<textarea rows={6} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Expliquez la décision..."/></label><div className={styles.warning}><Lock size={15}/>Cette action doit être confirmée, notifiée et auditée côté serveur.</div><button disabled={!reason.trim()} onClick={()=>setSaved(true)}><Save size={16}/>Enregistrer la décision</button><button className={styles.secondary} onClick={()=>setStatus("ACTIF")}><RotateCcw size={16}/>Réactiver</button><button className={styles.danger} onClick={()=>setStatus("BLOQUE")}><Ban size={16}/>Bloquer</button></aside>
  </div>
 </AdminShell>
}
