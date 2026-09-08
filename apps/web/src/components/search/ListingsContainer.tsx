"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  Grid2X2,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  CatalogEmptyState,
  CatalogFilterDrawer,
  CatalogFilterPanel,
  CatalogPagination,
  CatalogResultGrid,
  CatalogToolbar,
  CatalogWorkspace,
} from "@/components/catalog";
import { MaterialCard } from "@/components/materiaux/MaterialCard";
import { MaterialsCartBar } from "@/components/materiaux/MaterialsCartBar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui";
import { ContentScopeTabs } from "@/components/search/ContentScopeTabs";
import { FilterControls } from "@/components/search/FilterControls";
import { MaterialListingFilters } from "@/components/search/MaterialListingFilters";
import { useDemoListings } from "@/hooks/useDemoListings";
import { mapDemoListingToProperty } from "@/lib/demo-api/mapToProperty";
import {
  filterPublicMaterials,
  foldSearch,
  sortPublicMaterials,
} from "@/lib/materiaux/catalog";
import { loadPublicCatalog } from "@/lib/materiaux/catalog-source";
import type { PublicCatalog, PublicMaterial } from "@/lib/materiaux/types";
import { routes } from "@/lib/routes/app-routes";
import { parseBudgetInput } from "@/lib/search/budget";
import {
  isTerrainCategory,
  readContentScope,
} from "@/lib/search/content-scope";
import styles from "@/app/(public)/(site)/annonces/page.module.css";

const ITEMS_PER_PAGE = 6;

type ResultRow =
  | { kind: "listing"; id: string; property: ReturnType<typeof mapDemoListingToProperty> }
  | { kind: "material"; id: string; material: PublicMaterial };

export function ListingsContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = readContentScope(searchParams);
  const { items: demoListings, loading, error } = useDemoListings(
    { publicOnly: true },
    { poll: true },
  );
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const listingsCatalog = useMemo(
    () => demoListings.map((listing) => mapDemoListingToProperty(listing)),
    [demoListings],
  );

  useEffect(() => {
    if (scope !== "materiaux" && scope !== "tous") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadPublicCatalog()
        .then((next) => {
          if (cancelled) return;
          setCatalog(next);
          setCatalogError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setCatalog({ categories: [], materials: [] });
          setCatalogError("Catalogue matériaux indisponible.");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [scope]);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

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
  const query = searchParams.get("q") || "";
  const famille = searchParams.get("famille") || "";
  const dispo = searchParams.get("dispo") || "";

  const categoriesList = categoryParam
    ? categoryParam.split(",").map((c) => c.toLowerCase())
    : [];

  const filteredProperties = listingsCatalog.filter((item) => {
    if (scope === "materiaux") return false;
    if (scope === "terrains" && !isTerrainCategory(item.categorySlug)) return false;
    if (
      scope === "biens" &&
      searchParams.get("contenu") === "biens" &&
      isTerrainCategory(item.categorySlug) &&
      !categoriesList.includes("terrain")
    ) {
      return false;
    }
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

    if (query) {
      const haystack = foldSearch(`${item.title} ${item.location} ${item.categorySlug}`);
      if (!haystack.includes(foldSearch(query))) return false;
    }

    const pMin = parseBudgetInput(prixMinStr);
    const pMax = parseBudgetInput(prixMaxStr);
    if (pMin != null && item.numericPrice < pMin) return false;
    if (pMax != null && item.numericPrice > pMax) return false;

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

  const filteredMaterials = useMemo(() => {
    if (scope !== "materiaux" && scope !== "tous") return [];
    const source = catalog?.materials || [];
    const next = filterPublicMaterials(source, query, famille, dispo);
    return next.filter((item) => {
      const pMin = parseBudgetInput(prixMinStr);
      const pMax = parseBudgetInput(prixMaxStr);
      if (pMin != null && item.price < pMin) return false;
      if (pMax != null && item.price > pMax) return false;
      return true;
    });
  }, [catalog, dispo, famille, prixMaxStr, prixMinStr, query, scope]);

  const sortedMaterials = sortPublicMaterials(
    filteredMaterials,
    tri === "price-asc" ? "prix-asc" : tri === "price-desc" ? "prix-desc" : "pertinence",
  );

  const listingRows: ResultRow[] = sortedProperties.map((property) => ({
    kind: "listing",
    id: `listing-${property.id}`,
    property,
  }));
  const materialRows: ResultRow[] = sortedMaterials.map((material) => ({
    kind: "material",
    id: `material-${material.id}`,
    material,
  }));

  const pageSource = scope === "materiaux" ? materialRows : listingRows;
  const totalItems =
    scope === "tous"
      ? listingRows.length + materialRows.length
      : pageSource.length;
  const totalPages = Math.ceil(pageSource.length / ITEMS_PER_PAGE) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const paginatedRows =
    scope === "materiaux"
      ? materialRows.slice(startIndex, startIndex + ITEMS_PER_PAGE)
      : listingRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const visibleMaterials =
    scope === "tous" ? materialRows.slice(0, ITEMS_PER_PAGE) : [];

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
    if (scope === "materiaux") {
      router.push("/annonces?contenu=materiaux");
      return;
    }
    const op = searchParams.get("operation");
    if (op === "vente" || op === "location") {
      router.push(`/annonces?operation=${op}`);
    } else if (scope === "terrains") {
      router.push("/annonces?contenu=terrains");
    } else if (scope === "biens") {
      router.push("/annonces?contenu=biens");
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
  if (query) {
    activeTags.push({ label: `Recherche: ${query}`, key: "q" });
  }
  if (famille) {
    activeTags.push({ label: `Famille: ${famille}`, key: "famille" });
  }
  if (dispo) {
    activeTags.push({ label: `Dispo: ${dispo}`, key: "dispo" });
  }
  const parsedMinTag = parseBudgetInput(prixMinStr);
  const parsedMaxTag = parseBudgetInput(prixMaxStr);
  const hasBudgetFilter = parsedMinTag != null || parsedMaxTag != null;
  if (parsedMinTag != null) {
    activeTags.push({
      label: `Min: ${parsedMinTag.toLocaleString("fr-FR")} GNF`,
      key: "prixMin",
    });
  }
  if (parsedMaxTag != null) {
    activeTags.push({
      label: `Max: ${parsedMaxTag.toLocaleString("fr-FR")} GNF`,
      key: "prixMax",
    });
  }
  if (chambresStr) {
    activeTags.push({ label: `${chambresStr}+ ch.`, key: "chambres" });
  }
  if (verifieOnly) {
    activeTags.push({ label: "Annonces vérifiées", key: "verifie" });
  }

  const resultLabel =
    scope === "materiaux"
      ? `matériau${totalItems > 1 ? "x" : ""}`
      : scope === "tous"
        ? `résultat${totalItems > 1 ? "s" : ""}`
        : `bien${totalItems > 1 ? "s" : ""}`;

  const filterFields =
    scope === "materiaux" ? (
      <MaterialListingFilters idPrefix="desktop" catalog={catalog} />
    ) : (
      <FilterControls idPrefix="desktop" />
    );

  return (
    <>
      <CatalogWorkspace
        filters={<CatalogFilterPanel>{filterFields}</CatalogFilterPanel>}
      >
          {error ? (
            <p role="alert" style={{ marginBottom: 12, color: "#9d6b10" }}>
              {error}
            </p>
          ) : null}
          {catalogError && (scope === "materiaux" || scope === "tous") ? (
            <p role="alert" style={{ marginBottom: 12, color: "#9d6b10" }}>
              {catalogError}
            </p>
          ) : null}
          <CatalogToolbar
            title={
              loading
                ? "Chargement…"
                : `${totalItems} ${resultLabel} trouvé${totalItems > 1 ? "s" : ""}`
            }
            extra={
            <div className={styles.toolbarControls}>
              <Button
                type="button"
                variant="secondary"
                className={styles.mobileFilterButton}
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filtres
                {activeTags.length > 0 ? ` (${activeTags.length})` : ""}
              </Button>
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
                  {scope !== "materiaux" ? (
                    <option value="area-desc">Plus grande surface</option>
                  ) : null}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </label>

              {scope === "materiaux" ? <MaterialsCartBar /> : null}

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
            }
          />

          <ContentScopeTabs
            scope={scope}
            searchParams={new URLSearchParams(searchParams.toString())}
            onChange={(params) => {
              router.push(
                params.toString() ? `/annonces?${params.toString()}` : "/annonces",
              );
            }}
          />

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

          {paginatedRows.length > 0 || visibleMaterials.length > 0 ? (
            <>
              {paginatedRows.length > 0 ? (
                <CatalogResultGrid view={viewMode}>
                  {paginatedRows.map((row) =>
                    row.kind === "listing" ? (
                      <PropertyCard
                        key={row.id}
                        property={row.property}
                        viewMode={viewMode}
                      />
                    ) : (
                      <MaterialCard key={row.id} material={row.material} />
                    ),
                  )}
                </CatalogResultGrid>
              ) : null}

              {visibleMaterials.length > 0 ? (
                <section className={styles.materialsBlock} aria-label="Matériaux">
                  <div className={styles.materialsBlockHead}>
                    <h2>Matériaux de construction</h2>
                    <button
                      type="button"
                      className={styles.clearFilters}
                      onClick={() => router.push(routes.materials)}
                    >
                      Voir le catalogue
                    </button>
                  </div>
                  <CatalogResultGrid>
                    {visibleMaterials.map((row) =>
                      row.kind === "material" ? (
                        <MaterialCard key={row.id} material={row.material} />
                      ) : null,
                    )}
                  </CatalogResultGrid>
                </section>
              ) : null}
            </>
          ) : (
            <CatalogEmptyState
              title={
                scope === "materiaux"
                  ? hasBudgetFilter
                    ? "Aucun matériau ne correspond à votre budget."
                    : "Aucun matériau ne correspond"
                  : hasBudgetFilter
                    ? "Aucun bien ne correspond à votre budget."
                    : "Aucune annonce ne correspond"
              }
              description={
                hasBudgetFilter
                  ? "Élargissez la fourchette de prix ou réinitialisez les filtres."
                  : "Modifiez vos critères ou réinitialisez les filtres pour afficher davantage de résultats."
              }
              action={
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={styles.searchButton}
                >
                  Réinitialiser les filtres
                </button>
              }
            />
          )}

          <CatalogPagination
            page={validPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
      </CatalogWorkspace>

      <CatalogFilterDrawer open={filtersOpen} onClose={closeFilters}>
        {scope === "materiaux" ? (
          <MaterialListingFilters idPrefix="mobile" catalog={catalog} />
        ) : (
          <FilterControls idPrefix="mobile" onApply={closeFilters} />
        )}
      </CatalogFilterDrawer>
    </>
  );
}
