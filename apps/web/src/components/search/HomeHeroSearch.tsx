"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, BrickWall, Building2, House, KeyRound, MapPin, Search } from "lucide-react";

import { routes } from "@/lib/routes/app-routes";

import styles from "./HomeHeroSearch.module.css";

type Universe = "immobilier" | "terrain" | "materiaux";

export function HomeHeroSearch() {
  const router = useRouter();
  const [universe, setUniverse] = useState<Universe>("immobilier");
  const [operation, setOperation] = useState<"vente" | "location">("vente");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [materialQuery, setMaterialQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (universe === "materiaux") {
      const params = new URLSearchParams();
      if (materialQuery.trim()) params.set("q", materialQuery.trim());
      const qs = params.toString();
      router.push(qs ? `${routes.materials}?${qs}` : routes.materials);
      return;
    }

    const params = new URLSearchParams();
    params.set("operation", operation);
    if (location.trim()) params.set("quartier", location.trim());
    if (universe === "terrain") {
      params.set("categorie", "terrain");
    } else if (category) {
      params.set("categorie", category);
    }
    const min = budgetMin.replace(/\D/g, "");
    const max = budgetMax.replace(/\D/g, "");
    if (min) params.set("prixMin", min);
    if (max) params.set("prixMax", max);
    router.push(`/annonces?${params.toString()}`);
  };

  return (
    <div className={styles.searchWrapper}>
      <form
        onSubmit={handleSubmit}
        className={styles.searchForm}
        aria-label={
          universe === "materiaux"
            ? "Recherche de matériaux"
            : "Recherche de biens immobiliers"
        }
      >
        <div className={styles.searchIntro}>
          <p className={styles.searchHeading}>Que recherchez-vous ?</p>
          <div className={styles.universeRow} role="tablist" aria-label="Univers de recherche">
            <button
              type="button"
              role="tab"
              aria-selected={universe === "immobilier"}
              className={
                universe === "immobilier" ? styles.universeActive : styles.universeLink
              }
              onClick={() => setUniverse("immobilier")}
            >
              <House size={14} aria-hidden="true" />
              Bien immobilier
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={universe === "terrain"}
              className={
                universe === "terrain" ? styles.universeActive : styles.universeLink
              }
              onClick={() => setUniverse("terrain")}
            >
              Terrain
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={universe === "materiaux"}
              className={
                universe === "materiaux" ? styles.universeActive : styles.universeLink
              }
              onClick={() => setUniverse("materiaux")}
            >
              <BrickWall size={14} aria-hidden="true" />
              Matériaux
            </button>
          </div>
        </div>

        {universe !== "materiaux" ? (
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
        ) : null}

        <div className={styles.searchFields}>
          {universe === "materiaux" ? (
            <div className={styles.searchField}>
              <label htmlFor="material-query">Quel matériau ?</label>
              <div className={styles.fieldControl}>
                <Search className={styles.fieldIcon} size={18} aria-hidden="true" />
                <input
                  id="material-query"
                  name="q"
                  type="search"
                  placeholder="Ex. ciment, fer à béton, peinture…"
                  value={materialQuery}
                  onChange={(e) => setMaterialQuery(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
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

              {universe === "immobilier" ? (
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
              ) : null}

              <div className={styles.budgetPair}>
                <div className={styles.searchField}>
                  <label htmlFor="budget-min">Budget minimum</label>
                  <div className={styles.fieldControl}>
                    <Banknote className={styles.fieldIcon} size={18} aria-hidden="true" />
                    <input
                      id="budget-min"
                      name="prixMin"
                      inputMode="numeric"
                      placeholder="500 000 GNF"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.searchField}>
                  <label htmlFor="budget-max">Budget maximum</label>
                  <div className={styles.fieldControl}>
                    <Banknote className={styles.fieldIcon} size={18} aria-hidden="true" />
                    <input
                      id="budget-max"
                      name="prixMax"
                      inputMode="numeric"
                      placeholder="5 000 000 GNF"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
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
        </div>
      </form>
    </div>
  );
}
