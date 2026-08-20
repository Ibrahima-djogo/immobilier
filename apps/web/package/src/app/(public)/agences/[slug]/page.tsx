"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useParams } from "next/navigation";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import { publicAgencies } from "@/lib/public/demo-data";
import styles from "./page.module.css";

export default function AgencyPublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const agency = publicAgencies.find((item) => item.slug === params.slug) ?? publicAgencies[0];

  return (
    <InstitutionalShell active="agences">
      <section className={styles.cover}>
        <img src={agency.image} alt={agency.name} />
        <div className={styles.overlay} />
        <div className={styles.container}>
          <Link href="/agences" className={styles.back}><ArrowLeft size={15} />Retour aux agences</Link>
          <div className={styles.identity}>
            <span>{agency.initials}</span>
            <div>
              <div className={styles.badge}><ShieldCheck size={15} />Agence vérifiée</div>
              <h1>{agency.name}</h1>
              <p><MapPin size={16} />{agency.address}, {agency.city}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <section className={`${styles.card} ${styles.main}`}>
              <span className={styles.eyebrow}>Présentation</span>
              <h2>À propos de l’agence</h2>
              <p>{agency.description}</p>

              <div className={styles.tags}>
                {agency.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
              </div>

              <h2>Portefeuille public</h2>
              <div className={styles.properties}>
                {[1, 2, 3].map((item) => (
                  <article key={item}>
                    <span><Building2 size={23} /></span>
                    <div>
                      <strong>Bien immobilier de démonstration {item}</strong>
                      <small>Les annonces réelles seront chargées depuis l’API.</small>
                    </div>
                    <Link href="/annonces">Consulter <ArrowRight size={14} /></Link>
                  </article>
                ))}
              </div>
            </section>

            <aside>
              <section className={`${styles.card} ${styles.contact}`}>
                <h2>Contacter l’agence</h2>
                <p>Utilisez uniquement les coordonnées professionnelles autorisées.</p>
                <a href={`tel:${agency.phone}`}><Phone size={17} />{agency.phone}</a>
                <a href={`mailto:${agency.email}`}><Mail size={17} />{agency.email}</a>
                <Link href="/contact">Envoyer une demande</Link>
              </section>

              <section className={`${styles.card} ${styles.metrics}`}>
                <p><strong>{agency.properties}</strong><small>biens gérés</small></p>
                <p><strong>{agency.ads}</strong><small>annonces publiques</small></p>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </InstitutionalShell>
  );
}
