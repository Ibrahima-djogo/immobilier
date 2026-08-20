"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import { publicAgencies } from "@/lib/public/demo-data";
import styles from "./page.module.css";

export default function AgenciesPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("TOUTES");

  const filtered = useMemo(
    () =>
      publicAgencies.filter(
        (agency) =>
          `${agency.name} ${agency.city} ${agency.address} ${agency.specialties.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (city === "TOUTES" || agency.city === city),
      ),
    [city, query],
  );

  const cities = Array.from(new Set(publicAgencies.map((agency) => agency.city)));

  return (
    <InstitutionalShell active="agences">
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Professionnels vérifiés</span>
          <h1>Trouvez une agence immobilière</h1>
          <p>
            Consultez les profils professionnels validés et découvrez leur
            portefeuille public.
          </p>

          <div className={styles.searchPanel}>
            <div>
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, spécialité ou quartier..."
              />
            </div>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="TOUTES">Toutes les villes</option>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className={styles.results}>
        <div className={styles.container}>
          <div className={styles.resultTop}>
            <div>
              <span className={styles.eyebrow}>Annuaire public</span>
              <h2>{filtered.length} agence(s) disponible(s)</h2>
            </div>
            <p>
              Le badge vérifié confirme uniquement la validation du rôle
              professionnel sur la plateforme.
            </p>
          </div>

          <div className={styles.grid}>
            {filtered.map((agency) => (
              <article key={agency.slug} className={styles.card}>
                <div className={styles.image}>
                  <img src={agency.image} alt={agency.name} />
                  {agency.verified && (
                    <span><ShieldCheck size={15} />Agence vérifiée</span>
                  )}
                </div>

                <div className={styles.body}>
                  <div className={styles.identity}>
                    <span>{agency.initials}</span>
                    <div>
                      <h3>{agency.name}</h3>
                      <p><MapPin size={14} />{agency.address}, {agency.city}</p>
                    </div>
                  </div>

                  <p className={styles.description}>{agency.description}</p>

                  <div className={styles.tags}>
                    {agency.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
                  </div>

                  <div className={styles.metrics}>
                    <p><strong>{agency.properties}</strong><small>biens</small></p>
                    <p><strong>{agency.ads}</strong><small>annonces</small></p>
                  </div>

                  <Link href={`/agences/${agency.slug}`}>
                    Voir le profil <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className={`${styles.card} ${styles.empty}`}>
              <Building2 size={39} />
              <h2>Aucune agence trouvée</h2>
              <p>Modifiez les critères de recherche.</p>
            </div>
          )}
        </div>
      </section>
    </InstitutionalShell>
  );
}
