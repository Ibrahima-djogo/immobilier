"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Banknote, BrickWall, Building2, ChevronDown, MapPin, Search } from "lucide-react";

import { RealEstateListingConfig } from "@/components/listing/listing-configs";
import styles from "@/components/listing/listingSearch.module.css";
import { ContentScopeTabs } from "@/components/search/ContentScopeTabs";
import { readContentScope } from "@/lib/search/content-scope";

export function HeroSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = readContentScope(searchParams);

  const [localisation, setLocalisation] = useState(
    searchParams.get("localisation") || searchParams.get("quartier") || "",
  );
  const [operation, setOperation] = useState(searchParams.get("operation") || "");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [prixMin, setPrixMin] = useState(searchParams.get("prixMin") || "");
  const [prixMax, setPrixMax] = useState(
    searchParams.get("prixMax") || searchParams.get("budget") || "",
  );

  useEffect(() => {
    setLocalisation(
      searchParams.get("localisation") || searchParams.get("quartier") || "",
    );
    setOperation(searchParams.get("operation") || "");
    setCategorie(searchParams.get("categorie") || "");
    setQuery(searchParams.get("q") || "");
    setPrixMin(searchParams.get("prixMin") || "");
    setPrixMax(
      searchParams.get("prixMax") || searchParams.get("budget") || "",
    );
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (scope === "materiaux") {
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      params.set("contenu", "materiaux");
      params.set("page", "1");
      router.push(`/annonces?${params.toString()}`);
      return;
    }

    if (localisation.trim()) {
      params.set("localisation", localisation.trim());
    } else {
      params.delete("localisation");
    }

    if (operation) params.set("operation", operation);
    else params.delete("operation");

    if (categorie) params.set("categorie", categorie);
    else params.delete("categorie");

    if (scope === "tous" && query.trim()) params.set("q", query.trim());
    else if (scope !== "tous") params.delete("q");

    const min = prixMin.replace(/\D/g, "");
    const max = prixMax.replace(/\D/g, "");
    if (min) params.set("prixMin", min);
    else params.delete("prixMin");
    if (max) {
      params.set("prixMax", max);
      params.delete("budget");
    } else {
      params.delete("prixMax");
      params.delete("budget");
    }

    params.set("page", "1");
    router.push(`/annonces?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.searchForm}
      aria-label={
        scope === "materiaux"
          ? "Rechercher un matériau"
          : RealEstateListingConfig.searchLabel
      }
    >
      <div className={styles.searchScopeRow}>
        <ContentScopeTabs
          scope={scope}
          searchParams={new URLSearchParams(searchParams.toString())}
          onChange={(params) => {
            router.push(
              params.toString() ? `/annonces?${params.toString()}` : "/annonces",
            );
          }}
        />
      </div>

      {scope === "materiaux" ? (
        <div className={`${styles.searchField} ${styles.mainLocationField}`}>
          <label htmlFor="search-material">Matériau</label>
          <div className={styles.searchControl}>
            <BrickWall size={18} aria-hidden="true" />
            <input
              id="search-material"
              name="q"
              type="search"
              placeholder="Ex. ciment, fer à béton, peinture…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <>
          {scope === "tous" ? (
            <div className={styles.searchField}>
              <label htmlFor="search-keyword">Mot-clé</label>
              <div className={styles.searchControl}>
                <Search size={18} aria-hidden="true" />
                <input
                  id="search-keyword"
                  name="q"
                  type="search"
                  placeholder="Bien ou matériau (ex. Ciment, villa…)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className={`${styles.searchField} ${styles.mainLocationField}`}>
            <label htmlFor="search-location">Localisation</label>
            <div className={styles.searchControl}>
              <MapPin size={18} aria-hidden="true" />
              <input
                id="search-location"
                name="localisation"
                type="text"
                placeholder="Ville ou quartier (ex. Kipé, Lambanyi...)"
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.searchField}>
            <label htmlFor="search-operation">Opération</label>
            <div className={styles.searchControl}>
              <Banknote size={18} aria-hidden="true" />
              <select
                id="search-operation"
                name="operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                <option value="">Vente et location</option>
                <option value="vente">À vendre</option>
                <option value="location">À louer</option>
              </select>
              <ChevronDown className={styles.searchChevron} size={16} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.searchField}>
            <label htmlFor="search-category">Type de bien</label>
            <div className={styles.searchControl}>
              <Building2 size={18} aria-hidden="true" />
              <select
                id="search-category"
                name="categorie"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
              >
                <option value="">Tous les biens</option>
                <option value="maison">Maison</option>
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="terrain">Terrain</option>
                <option value="bureau">Bureau</option>
                <option value="commerce">Commerce</option>
              </select>
              <ChevronDown className={styles.searchChevron} size={16} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.budgetPair}>
            <div className={styles.searchField}>
              <label htmlFor="search-prix-min">Budget minimum</label>
              <div className={styles.searchControl}>
                <Banknote size={18} aria-hidden="true" />
                <input
                  id="search-prix-min"
                  name="prixMin"
                  inputMode="numeric"
                  placeholder="500 000 GNF"
                  value={prixMin}
                  onChange={(e) => setPrixMin(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.searchField}>
              <label htmlFor="search-prix-max">Budget maximum</label>
              <div className={styles.searchControl}>
                <Banknote size={18} aria-hidden="true" />
                <input
                  id="search-prix-max"
                  name="prixMax"
                  inputMode="numeric"
                  placeholder="5 000 000 GNF"
                  value={prixMax}
                  onChange={(e) => setPrixMax(e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <button type="submit" className={styles.searchButton}>
        <Search size={19} aria-hidden="true" />
        Rechercher
      </button>
    </form>
  );
}
