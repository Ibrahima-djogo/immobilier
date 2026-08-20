"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Banknote, Building2, ChevronDown, MapPin, Search } from "lucide-react";
import styles from "@/app/(public)/(site)/annonces/page.module.css";

export function HeroSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localisation, setLocalisation] = useState(
    searchParams.get("localisation") || searchParams.get("quartier") || ""
  );
  const [operation, setOperation] = useState(searchParams.get("operation") || "");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "");

  useEffect(() => {
    setLocalisation(searchParams.get("localisation") || searchParams.get("quartier") || "");
    setOperation(searchParams.get("operation") || "");
    setCategorie(searchParams.get("categorie") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (localisation.trim()) {
      params.set("localisation", localisation.trim());
    } else {
      params.delete("localisation");
    }

    if (operation) {
      params.set("operation", operation);
    } else {
      params.delete("operation");
    }

    if (categorie) {
      params.set("categorie", categorie);
    } else {
      params.delete("categorie");
    }

    params.set("page", "1"); // Reset page to 1 on new search
    router.push(`/annonces?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.searchForm} aria-label="Rechercher un bien">
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

      <button type="submit" className={styles.searchButton}>
        <Search size={19} aria-hidden="true" />
        Rechercher
      </button>
    </form>
  );
}
