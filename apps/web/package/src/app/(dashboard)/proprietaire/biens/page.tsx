"use client";

import Link from "next/link";
import { ArrowRight, Building2, Eye, Grid2X2, List, MapPin, MessageSquareText, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { formatGnf, ownerProperties } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function OwnerPropertiesPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid"|"list">("grid");
  const [status, setStatus] = useState("TOUS");

  const filtered = useMemo(() => ownerProperties.filter((property) => {
    const matchText = `${property.title} ${property.location} ${property.type}`.toLowerCase().includes(query.toLowerCase());
    return matchText && (status === "TOUS" || property.status === status);
  }), [query,status]);

  return (
    <OwnerShell
      active="biens"
      eyebrow="Portefeuille immobilier"
      title="Mes biens"
      description="Créez, complétez et gérez les biens rattachés à votre compte."
      action={<Link className={styles.action} href="/proprietaire/biens/nouveau"><Plus size={17} /> Ajouter un bien</Link>}
    >
      <section className={`${styles.card} ${styles.filters}`}>
        <div className={styles.search}><Search size={17} /><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Titre, quartier, type..." /></div>
        <select value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="BROUILLON">Brouillons</option>
          <option value="ARCHIVE">Archivés</option>
        </select>
        <div className={styles.views}>
          <button className={view==="grid"?styles.active:""} onClick={()=>setView("grid")}><Grid2X2 size={17}/></button>
          <button className={view==="list"?styles.active:""} onClick={()=>setView("list")}><List size={18}/></button>
        </div>
      </section>

      <div className={styles.resultCount}><strong>{filtered.length}</strong> bien(s) affiché(s)</div>

      <section className={view==="grid"?styles.grid:styles.list}>
        {filtered.map((property) => (
          <article key={property.id} className={`${styles.card} ${styles.property}`}>
            <div className={styles.imageWrap}>
              <img src={property.images[0]} alt={property.title}/>
              <span className={styles[property.status.toLowerCase()]}>{property.status}</span>
            </div>
            <div className={styles.body}>
              <small>{property.type} · {property.operation==="VENTE"?"Vente":"Location"}</small>
              <h2>{property.title}</h2>
              <p><MapPin size={14}/>{property.location}</p>
              <strong>{formatGnf(property.price)}{property.operation==="LOCATION"?" / mois":""}</strong>
              <div className={styles.metrics}>
                <span><Eye size={14}/>{property.views} vues</span>
                <span><MessageSquareText size={14}/>{property.contacts} contacts</span>
              </div>
              <div className={styles.completion}><div><small>Complétude</small><b>{property.completeness}%</b></div><span><i style={{width:`${property.completeness}%`}}/></span></div>
              <Link href={`/proprietaire/biens/${property.slug}`}>Gérer le bien <ArrowRight size={14}/></Link>
            </div>
          </article>
        ))}
      </section>

      {filtered.length===0 && <section className={`${styles.card} ${styles.empty}`}><Building2 size={37}/><h2>Aucun bien trouvé</h2><p>Modifiez la recherche ou créez un nouveau bien.</p></section>}
    </OwnerShell>
  );
}
