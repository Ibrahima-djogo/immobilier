"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Eye,
  FileText,
  MessageSquareText,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import { ownerAds, ownerContacts, ownerProperties } from "@/lib/proprietaire/demo-data";
import styles from "./page.module.css";

export default function OwnerDashboardPage() {
  const [period, setPeriod] = useState("30j");
  const published = ownerAds.filter((ad) => ad.status === "PUBLIEE").length;
  const views = ownerAds.reduce((sum, ad) => sum + ad.views, 0);

  return (
    <OwnerShell
      active="dashboard"
      eyebrow="Espace Propriétaire"
      title="Bonjour Mamadou"
      description="Pilotez vos biens, vos annonces et les demandes reçues depuis un seul espace."
      action={
        <Link href="/proprietaire/biens/nouveau" className={styles.action}>
          <Plus size={17} aria-hidden="true" />
          Ajouter un bien
        </Link>
      }
    >
      <section className={styles.stats}>
        {[
          ["Biens", ownerProperties.length, Building2],
          ["Annonces publiées", published, FileText],
          ["Consultations", views, Eye],
          ["Contacts", ownerContacts.length, MessageSquareText],
        ].map(([label, value, Icon]) => (
          <article key={String(label)} className={styles.card}>
            <span><Icon size={21} aria-hidden="true" /></span>
            <div><small>{label}</small><strong>{String(value)}</strong></div>
          </article>
        ))}
      </section>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.sectionTitle}>
            <div><h2>Performance des annonces</h2><p>Visibilité et contacts sur la période.</p></div>
            <div className={styles.periods}>
              {["7j","30j","90j"].map((item) => (
                <button key={item} type="button" className={period === item ? styles.activePeriod : ""} onClick={() => setPeriod(item)}>{item}</button>
              ))}
            </div>
          </div>
          <div className={styles.chart}>
            {[42,60,48,72,63,89,77].map((value, index) => (
              <div key={index}><span style={{height:`${value}%`}} /><small>S{index+1}</small></div>
            ))}
          </div>
          <div className={styles.trend}><TrendingUp size={16} aria-hidden="true" /> +18 % par rapport à la période précédente</div>
        </section>

        <section className={`${styles.card} ${styles.quick}`}>
          <div className={styles.sectionTitle}><div><h2>Actions rapides</h2><p>Accès aux principales opérations.</p></div></div>
          {[
            ["/proprietaire/biens","Gérer mes biens",Building2],
            ["/proprietaire/annonces","Gérer mes annonces",FileText],
            ["/proprietaire/contacts","Traiter les contacts",MessageSquareText],
            ["/proprietaire/statistiques","Voir les statistiques",BarChart3],
          ].map(([href,label,Icon]) => (
            <Link key={String(href)} href={String(href)}>
              <span><Icon size={18} aria-hidden="true" /></span>
              <strong>{String(label)}</strong>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </section>
      </div>

      <section className={`${styles.card} ${styles.recent}`}>
        <div className={styles.sectionTitle}>
          <div><h2>Biens récents</h2><p>Derniers éléments de votre portefeuille.</p></div>
          <Link href="/proprietaire/biens">Tout afficher</Link>
        </div>
        <div className={styles.propertyGrid}>
          {ownerProperties.map((property) => (
            <article key={property.id}>
              <img src={property.images[0]} alt={property.title} />
              <div>
                <small>{property.type} · {property.operation === "VENTE" ? "Vente" : "Location"}</small>
                <h3>{property.title}</h3>
                <p>{property.location}</p>
                <Link href={`/proprietaire/biens/${property.slug}`}>Ouvrir <ArrowRight size={14} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </OwnerShell>
  );
}
