"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Chip } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { publicAgencies } from "@/lib/public/demo-data";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

export default function AgenciesDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const villeParam = searchParams.get("ville");
  const city = villeParam?.trim() ? villeParam : "TOUTES";
  const verifiedOnly = searchParams.get("verified") === "true";

  const cities = Array.from(
    new Set(publicAgencies.map((agency) => agency.city)),
  );

  const filtered = useMemo(
    () =>
      publicAgencies.filter((agency) => {
        const haystack =
          `${agency.name} ${agency.city} ${agency.address} ${agency.specialties.join(" ")}`.toLowerCase();
        const matchesQuery = haystack.includes(
          debouncedQuery.toLowerCase().trim(),
        );
        const matchesCity = city === "TOUTES" || agency.city === city;
        const matchesVerified = !verifiedOnly || agency.verified;
        return matchesQuery && matchesCity && matchesVerified;
      }),
    [city, debouncedQuery, verifiedOnly],
  );

  function updateUrl(nextCity: string, nextVerified: boolean) {
    const params = new URLSearchParams();
    if (nextCity !== "TOUTES") params.set("ville", nextCity);
    if (nextVerified) params.set("verified", "true");
    const qs = params.toString();
    router.replace(qs ? `/agences?${qs}` : "/agences", { scroll: false });
  }

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div className={styles.container}>
          <p className={styles.breadcrumb}>
            <Link href="/">Accueil</Link>
            <span>/</span>
            <strong>Agences</strong>
          </p>

          <div className={styles.introGrid}>
            <div>
              <p className={styles.eyebrow}>Professionnels vérifiés</p>
              <h1>Agences immobilières de confiance</h1>
              <p className={styles.lead}>
                Un annuaire clair des partenaires validés sur Demeure Guinée —
                pour identifier un interlocuteur sérieux avant de contacter ou
                visiter.
              </p>
            </div>

            <ul className={styles.trustStrip}>
              <li>
                <ShieldCheck size={18} aria-hidden="true" />
                <div>
                  <strong>Rôles validés</strong>
                  <span>Profils professionnels contrôlés</span>
                </div>
              </li>
              <li>
                <Building2 size={18} aria-hidden="true" />
                <div>
                  <strong>{publicAgencies.length} agences</strong>
                  <span>Présentes dans l’annuaire</span>
                </div>
              </li>
            </ul>
          </div>

          <form
            className={styles.searchBar}
            onSubmit={(event) => event.preventDefault()}
            role="search"
            aria-label="Filtrer les agences"
          >
            <label className={styles.searchField}>
              <span className={styles.srOnly}>Rechercher</span>
              <Search size={17} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, spécialité ou quartier…"
              />
            </label>
            <label className={styles.cityField}>
              <span className={styles.srOnly}>Ville</span>
              <select
                value={city}
                onChange={(event) =>
                  updateUrl(event.target.value, verifiedOnly)
                }
              >
                <option value="TOUTES">Toutes les villes</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.cityField}>
              <span className={styles.srOnly}>Vérification</span>
              <select
                value={verifiedOnly ? "true" : "all"}
                onChange={(event) =>
                  updateUrl(city, event.target.value === "true")
                }
              >
                <option value="all">Toutes les agences</option>
                <option value="true">Agences vérifiées</option>
              </select>
            </label>
          </form>

          {(city !== "TOUTES" || verifiedOnly) && (
            <div
              style={{
                marginTop: "0.85rem",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {city !== "TOUTES" ? <Chip>Ville : {city}</Chip> : null}
              {verifiedOnly ? <Chip>Vérifiées uniquement</Chip> : null}
            </div>
          )}
        </div>
      </section>

      <section className={styles.listing}>
        <div className={styles.container}>
          <p className={styles.resultCount}>
            <strong>{filtered.length}</strong> agence
            {filtered.length > 1 ? "s" : ""} trouvée
            {filtered.length > 1 ? "s" : ""}
          </p>

          <ul className={styles.grid}>
            {filtered.map((agency) => (
              <li key={agency.slug}>
                <Link href={routes.agency(agency.slug)} className={styles.card}>
                  <div className={styles.cardMedia} aria-hidden="true">
                    <span>{agency.initials}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTitleRow}>
                      <h2>{agency.name}</h2>
                      {agency.verified ? (
                        <span className={styles.verified}>
                          <ShieldCheck size={14} aria-hidden="true" />
                          Vérifiée
                        </span>
                      ) : null}
                    </div>
                    <p>
                      <MapPin size={14} aria-hidden="true" />
                      {agency.address}, {agency.city}
                    </p>
                    <div className={styles.tags}>
                      {agency.specialties.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <span className={styles.cardCta}>
                      Voir le profil
                      <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <Building2 size={36} aria-hidden="true" />
              <h2>Aucune agence trouvée</h2>
              <p>Modifiez la recherche ou changez de ville.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
