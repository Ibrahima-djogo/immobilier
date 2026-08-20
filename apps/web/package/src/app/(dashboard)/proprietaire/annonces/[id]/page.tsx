"use client";

import Link from "next/link";
import { ArrowLeft, Edit3, Eye, Heart, MessageSquareText } from "lucide-react";
import { useParams } from "next/navigation";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerAds } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function AdDetailPage() {
  const params=useParams<{id:string}>();
  const ad=ownerAds.find(a=>a.id===params.id)??ownerAds[0];
  return (
    <OwnerShell active="annonces" eyebrow="Détail de l’annonce" title={ad.title} description="Consultez le statut, les performances et l’historique de modération."
      action={<Link className={styles.action} href={`/proprietaire/annonces/${ad.id}/modifier`}><Edit3 size={16}/>Modifier</Link>}>
      <Link href="/proprietaire/annonces" className={styles.back}><ArrowLeft size={15}/>Retour aux annonces</Link>
      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.main}`}>
          <div className={styles.status}><span className={styles[ad.status.toLowerCase()]}>{ad.status.replace("_"," ")}</span><small>Dernière mise à jour : {ad.updatedAt}</small></div>
          <h2>Résumé</h2><p>Cette annonce est rattachée au bien <strong>{ad.propertySlug}</strong>. Les données réelles seront chargées depuis l’API.</p>
          {ad.rejectionReason&&<div className={styles.rejection}><strong>Motif du rejet</strong><p>{ad.rejectionReason}</p></div>}
          <h2>Historique</h2><ol><li><span>1</span><div><strong>Brouillon créé</strong><small>28 juillet 2026</small></div></li><li><span>2</span><div><strong>Soumission à la modération</strong><small>29 juillet 2026</small></div></li><li><span>3</span><div><strong>Statut actuel</strong><small>{ad.status.replace("_"," ")}</small></div></li></ol>
        </section>
        <aside className={`${styles.card} ${styles.metrics}`}><h2>Performance</h2><div><span><Eye size={18}/>Vues</span><strong>{ad.views}</strong></div><div><span><Heart size={18}/>Favoris</span><strong>{ad.favorites}</strong></div><div><span><MessageSquareText size={18}/>Contacts</span><strong>{ad.contacts}</strong></div></aside>
      </div>
    </OwnerShell>
  );
}
