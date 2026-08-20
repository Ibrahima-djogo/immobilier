"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Building2,
  ChevronDown,
  Grid2X2,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { FilterControls } from "@/components/search/FilterControls";
import { useDemoListings } from "@/hooks/useDemoListings";
import { mapDemoListingToProperty } from "@/lib/demo-api/mapToProperty";
import styles from "@/app/(public)/(site)/annonces/page.module.css";

const ITEMS_PER_PAGE = 6;

export function ListingsContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: demoListings, loading, error } = useDemoListings(
    { publicOnly: true },
    { poll: true },
  );

  const catalog = useMemo(
    () => demoListings.map((listing) => mapDemoListingToProperty(listing)),
    [demoListings],
  );

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const operation = searchParams.get("operation") || "";
  const categoryParam = searchParams.get("categorie") || "";
  const ville = searchParams.get("ville") || "";
  const quartier =
    searchParams.get("quartier") || searchParams.get("localisation") || "";
  const prixMinStr = searchParams.get("prixMin") || "";
  const prixMaxStr =
    searchParams.get("prixMax") || searchParams.get("budget") || "";
  const chambresStr = searchParams.get("chambres") || "";
  const verifieOnly = searchParams.get("verifie") === "true";
  const tri = searchParams.get("tri") || "recent";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const categoriesList = categoryParam
    ? categoryParam.split(",").map((c) => c.toLowerCase())
    : [];

  const filteredProperties = catalog.filter((item) => {
    if (operation && item.operationValue !== operation) return false;

    if (categoriesList.length > 0) {
      if (!categoriesList.includes(item.categorySlug.toLowerCase())) {
        return false;
      }
    }

    if (ville && item.city.toLowerCase() !== ville.toLowerCase()) {
      return false;
    }

    if (quartier) {
      const q = quartier.toLowerCase().trim();
      const locMatch = item.location.toLowerCase().includes(q);
      const titleMatch = item.title.toLowerCase().includes(q);
      const districtMatch = item.district.toLowerCase().includes(q);
      const cityMatch = item.city.toLowerCase().includes(q);
      if (!locMatch && !titleMatch && !districtMatch && !cityMatch) {
        return false;
      }
    }

    if (prixMinStr) {
      const pMin = parseFloat(prixMinStr);
      if (!Number.isNaN(pMin) && item.numericPrice < pMin) return false;
    }

    if (prixMaxStr) {
      const pMax = parseFloat(prixMaxStr);
      if (!Number.isNaN(pMax) && item.numericPrice > pMax) return false;
    }

    if (chambresStr) {
      const minRooms = parseInt(chambresStr, 10);
      if (
        !Number.isNaN(minRooms) &&
        (item.rooms === undefined || item.rooms < minRooms)
      ) {
        return false;
      }
    }

    if (verifieOnly && !item.verified) return false;

    return true;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (tri === "price-asc") return a.numericPrice - b.numericPrice;
    if (tri === "price-desc") return b.numericPrice - a.numericPrice;
    if (tri === "area-desc") return b.numericArea - a.numericArea;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalItems = sortedProperties.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const paginatedProperties = sortedProperties.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const removeFilter = (key: string, valueToRemove?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "categorie" && valueToRemove) {
      const currentCats = (params.get("categorie") || "").split(",");
      const updated = currentCats.filter((c) => c !== valueToRemove);
      if (updated.length > 0) params.set("categorie", updated.join(","));
      else params.delete("categorie");
    } else {
      params.delete(key);
      if (key === "quartier") params.delete("localisation");
      if (key === "prixMax") params.delete("budget");
    }
    params.set("page", "1");
    router.push(`/annonces?${params.toString()}`);
  };

  const handleClearAll = () => {
    const op = searchParams.get("operation");
    if (op === "vente" || op === "location") {
      router.push(`/annonces?operation=${op}`);
    } else {
      router.push("/annonces");
    }
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tri", newSort);
    params.set("page", "1");
    router.push(`/annonces?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/annonces?${params.toString()}`);
  };

  const activeTags: { label: string; key: string; valueToRemove?: string }[] =
    [];
  if (operation) {
    activeTags.push({
      label: operation === "vente" ? "À vendre" : "À louer",
      key: "operation",
    });
  }
  categoriesList.forEach((c) => {
    activeTags.push({
      label: c.charAt(0).toUpperCase() + c.slice(1),
      key: "categorie",
      valueToRemove: c,
    });
  });
  if (ville) {
    activeTags.push({
      label: `Ville: ${ville.charAt(0).toUpperCase() + ville.slice(1)}`,
      key: "ville",
    });
  }
  if (quartier) {
    activeTags.push({ label: `Lieu: ${quartier}`, key: "quartier" });
  }
  if (prixMinStr) {
    activeTags.push({
      label: `Min: ${parseInt(prixMinStr, 10).toLocaleString()} GNF`,
      key: "prixMin",
    });
  }
  if (prixMaxStr) {
    activeTags.push({
      label: `Max: ${parseInt(prixMaxStr, 10).toLocaleString()} GNF`,
      key: "prixMax",
    });
  }
  if (chambresStr) {
    activeTags.push({ label: `${chambresStr}+ ch.`, key: "chambres" });
  }
  if (verifieOnly) {
    activeTags.push({ label: "Annonces vérifiées", key: "verifie" });
  }

  return (
    <>
      <details className={styles.mobileFilters}>
        <summary>
          <span>
            <SlidersHorizontal size={18} aria-hidden="true" />
            Filtres
            {activeTags.length > 0 ? ` (${activeTags.length})` : ""}
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className={styles.mobileFiltersContent}>
          <FilterControls idPrefix="mobile" />
        </div>
      </details>

      <div className={styles.resultsLayout}>
        <aside className={styles.filtersSidebar}>
          <div className={styles.filtersPanel}>
            <div className={styles.filtersHeader}>
              <div>
                <span>Recherche avancée</span>
                <h2>Filtres</h2>
              </div>
              <SlidersHorizontal size={20} aria-hidden="true" />
            </div>
            <FilterControls idPrefix="desktop" />
          </div>
        </aside>

        <div className={styles.resultsContent}>
          {error ? (
            <p role="alert" style={{ marginBottom: 12, color: "#9d6b10" }}>
              {error} — lancez `npm start` dans immo-demo-api (port 4000).
            </p>
          ) : null}
          <div className={styles.resultsToolbar}>
            <div className={styles.resultsCount}>
              <span>Résultats</span>
              <strong>
                {loading
                  ? "Chargement…"
                  : `${totalItems} bien${totalItems > 1 ? "s" : ""} trouvé${totalItems > 1 ? "s" : ""}`}
              </strong>
            </div>

            <div className={styles.toolbarControls}>
              <label className={styles.sortControl}>
                <ArrowDownUp size={16} aria-hidden="true" />
                <span>Trier</span>
                <select
                  name="tri"
                  value={tri}
                  onChange={(event) => handleSortChange(event.target.value)}
                >
                  <option value="recent">Plus récentes</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="area-desc">Plus grande surface</option>
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </label>

              <div className={styles.viewControls} aria-label="Affichage">
                <button
                  type="button"
                  className={
                    viewMode === "grid"
                      ? styles.activeViewButton
                      : styles.viewButton
                  }
                  onClick={() => setViewMode("grid")}
                  aria-label="Afficher en grille"
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid2X2 size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={
                    viewMode === "list"
                      ? styles.activeViewButton
                      : styles.viewButton
                  }
                  onClick={() => setViewMode("list")}
                  aria-label="Afficher en liste"
                  aria-pressed={viewMode === "list"}
                >
                  <List size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {activeTags.length > 0 ? (
            <div className={styles.activeFilters}>
              {activeTags.map((tag, index) => (
                <button
                  key={`${tag.key}-${index}`}
                  type="button"
                  className={styles.filterChip}
                  onClick={() => removeFilter(tag.key, tag.valueToRemove)}
                >
                  {tag.label}
                  <X size={13} aria-hidden="true" />
                </button>
              ))}
              <button
                type="button"
                className={styles.clearFilters}
                onClick={handleClearAll}
              >
                Tout effacer
              </button>
            </div>
          ) : null}

          {paginatedProperties.length > 0 ? (
            <div
              className={
                viewMode === "list"
                  ? styles.propertiesListContainer
                  : styles.propertiesGrid
              }
            >
              {paginatedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Building2 size={26} aria-hidden="true" />
              </div>
              <h3>Aucune annonce ne correspond</h3>
              <p>
                Modifiez vos critères ou réinitialisez les filtres pour
                afficher davantage de biens.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className={styles.searchButton}
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}

          {totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Pagination">
              <button
                type="button"
                className={styles.navPage}
                disabled={validPage <= 1}
                onClick={() => handlePageChange(validPage - 1)}
              >
                Précédent
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === validPage ? styles.activePage : styles.pageButton
                    }
                    onClick={() => handlePageChange(page)}
                    aria-current={page === validPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                className={styles.navPage}
                disabled={validPage >= totalPages}
                onClick={() => handlePageChange(validPage + 1)}
              >
                Suivant
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </>
  );
}
