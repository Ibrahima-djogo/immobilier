"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Building2, House, KeyRound, MapPin, Search } from "lucide-react";

import styles from "./HomeHeroSearch.module.css";

export function HomeHeroSearch() {
  const router = useRouter();
  const [operation, setOperation] = useState<"vente" | "location">("vente");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    params.set("operation", operation);

    if (location.trim()) {
      params.set("quartier", location.trim());
    }

    if (category) {
      params.set("categorie", category);
    }

    if (budget.trim()) {
      params.set("prixMax", budget.trim());
    }

    router.push(`/annonces?${params.toString()}`);
  };

  return (
    <div className={styles.searchWrapper}>
      <form
        onSubmit={handleSubmit}
        className={styles.searchForm}
        aria-label="Recherche de biens immobiliers"
      >
        <fieldset className={styles.operationTabs}>
          <legend>Type d’opération</legend>
          <input
            type="radio"
            id="operation-vente"
            name="operation"
            value="vente"
            checked={operation === "vente"}
            onChange={() => setOperation("vente")}
          />
          <label htmlFor="operation-vente">
            <House size={16} aria-hidden="true" />
            Acheter
          </label>

          <input
            type="radio"
            id="operation-location"
            name="operation"
            value="location"
            checked={operation === "location"}
            onChange={() => setOperation("location")}
          />
          <label htmlFor="operation-location">
            <KeyRound size={16} aria-hidden="true" />
            Louer
          </label>
        </fieldset>

        <div className={styles.searchFields}>
          <div className={styles.searchField}>
            <label htmlFor="location">Où recherchez-vous ?</label>
            <div className={styles.fieldControl}>
              <MapPin className={styles.fieldIcon} size={18} aria-hidden="true" />
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Ville ou quartier (ex. Kipé, Lambanyi...)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.searchField}>
            <label htmlFor="category">Type de bien</label>
            <div className={styles.fieldControl}>
              <Building2 className={styles.fieldIcon} size={18} aria-hidden="true" />
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Tous les biens</option>
                <option value="maison">Maison</option>
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="terrain">Terrain</option>
                <option value="bureau">Bureau</option>
                <option value="commerce">Local commercial</option>
              </select>
            </div>
          </div>

          <div className={styles.searchField}>
            <label htmlFor="budget">Budget maximum (GNF)</label>
            <div className={styles.fieldControl}>
              <Banknote className={styles.fieldIcon} size={18} aria-hidden="true" />
              <input
                id="budget"
                name="budget"
                type="number"
                min="0"
                placeholder="Ex. 5000000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className={styles.searchButton}>
            <Search size={19} aria-hidden="true" />
            Rechercher
          </button>
        </div>
      </form>
    </div>
  );
}
