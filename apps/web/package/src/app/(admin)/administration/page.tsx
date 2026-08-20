"use client";
import Link from "next/link";
import {ArrowRight,ClipboardCheck,FileText,Flag,ShieldAlert,Users} from "lucide-react";
import AdminShell from "@/components/administration/AdminShell";
import {adminAds,adminUsers,reports,roleRequests} from "@/lib/administration/demo-data";
import styles from "./page.module.css";

export default function AdministrationDashboard(){
 const pendingRoles=roleRequests.filter(r=>["SOUMISE","EN_EXAMEN","COMPLEMENT_REQUIS"].includes(r.status)).length;
 const pendingAds=adminAds.filter(a=>a.status==="EN_ATTENTE").length;
 const activeReports=reports.filter(r=>["NOUVEAU","EN_ANALYSE"].includes(r.status)).length;
 return <AdminShell active="dashboard" eyebrow="Back-office central" title="Administration" description="Pilotez les comptes, la modération, les référentiels et la traçabilité de la plateforme.">
  <section className={styles.alert}><ShieldAlert size={22}/><div><strong>Zone d’administration sensible</strong><p>Chaque action destructive ou critique doit être confirmée, motivée et journalisée.</p></div></section>
  <section className={styles.stats}>
   {[["Utilisateurs",adminUsers.length,Users],["Demandes de rôle",pendingRoles,ClipboardCheck],["Annonces à modérer",pendingAds,FileText],["Signalements actifs",activeReports,Flag]].map(([label,value,Icon])=><article className={styles.card} key={String(label)}><span><Icon size={21}/></span><div><small>{label}</small><strong>{String(value)}</strong></div></article>)}
  </section>
  <div className={styles.grid}>
   <section className={`${styles.card} ${styles.queue}`}><div className={styles.sectionTitle}><div><h2>Priorités du jour</h2><p>Éléments nécessitant une décision administrative.</p></div></div>
    <Link href="/administration/demandes-role"><span>3</span><div><strong>Demandes de rôle à examiner</strong><small>Propriétaires et agences en attente</small></div><ArrowRight size={15}/></Link>
    <Link href="/administration/moderation"><span>1</span><div><strong>Annonce à risque élevé</strong><small>Suspension et preuves à vérifier</small></div><ArrowRight size={15}/></Link>
    <Link href="/administration/signalements"><span>2</span><div><strong>Signalements non qualifiés</strong><small>Identité du déclarant protégée</small></div><ArrowRight size={15}/></Link>
   </section>
   <section className={`${styles.card} ${styles.health}`}><div className={styles.sectionTitle}><div><h2>État de la plateforme</h2><p>Indicateurs front-end de démonstration.</p></div></div>
    {[["API","À connecter","warning"],["Base de données","À connecter","warning"],["Médias","URLs de démonstration","warning"],["Audit","Interface prête","ok"]].map(([label,value,state])=><div key={label}><span>{label}</span><strong className={styles[state]}>{value}</strong></div>)}
   </section>
  </div>
  <section className={`${styles.card} ${styles.shortcuts}`}><div className={styles.sectionTitle}><div><h2>Accès rapides</h2><p>Principaux modules administratifs.</p></div></div><div>{[
   ["/administration/utilisateurs","Gérer les utilisateurs"],
   ["/administration/annonces","Contrôler les annonces"],
   ["/administration/referentiels","Administrer les référentiels"],
   ["/administration/audit","Consulter l’audit"],
   ["/administration/contenus","Gérer les contenus publics"],
   ["/administration/administrateurs","Gérer les administrateurs"]
  ].map(([href,label])=><Link key={href} href={href}>{label}<ArrowRight size={14}/></Link>)}</div></section>
 </AdminShell>
}
