"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, SlidersHorizontal } from "lucide-react";

import {
  CatalogEmptyState,
  CatalogFilterDrawer,
  CatalogFilterPanel,
  CatalogResultGrid,
  CatalogToolbar,
  CatalogWorkspace,
} from "@/components/catalog";
import {
  ListingPageLayout,
  MaterialsListingConfig,
  MaterialsListingSearch,
} from "@/components/listing";
import searchStyles from "@/components/listing/listingSearch.module.css";
import { Button } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  filterPublicMaterials,
  materialSupplierName,
  parseBudgetInput,
  parseMaterialSort,
  sortPublicMaterials,
  uniqueMaterialValues,
} from "@/lib/materiaux/catalog";
import type {
  PublicCatalog,
  PublicMaterialAvailability,
} from "@/lib/materiaux/types";

import { MaterialsCartBar } from "./MaterialsCartBar";
import { MaterialCard } from "./MaterialCard";
import { MaterialsCategoryRail } from "./MaterialsCategoryRail";
import { MaterialsTrust } from "./MaterialsTrust";
import styles from "./MaterialsCatalog.module.css";

const AVAILABILITY_FILTERS: Array<{
  value: "tous" | PublicMaterialAvailability;
  label: string;
}> = [
  { value: "tous", label: "Tous" },
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "STOCK_FAIBLE", label: "Stock faible" },
  { value: "RUPTURE", label: "Rupture" },
];

type MaterialsCatalogProps = {
  catalog: PublicCatalog;
};

export function MaterialsCatalog({ catalog }: MaterialsCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const categorySlug = searchParams.get("categorie") ?? "tous";
  const availability = searchParams.get("dispo") ?? "tous";
  const brand = searchParams.get("marque") ?? "tous";
  const supplier = searchParams.get("fournisseur") ?? "tous";
  const location = searchParams.get("localisation") ?? "tous";
  const priceMin = searchParams.get("prixMin") ?? "";
  const priceMax = searchParams.get("prixMax") ?? "";
  const sort = parseMaterialSort(searchParams.get("tri"));
  const debouncedQuery = useDebouncedValue(query, 250);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searching = query !== debouncedQuery;

  const brands = useMemo(
    () => uniqueMaterialValues(catalog.materials, (item) => item.brand),
    [catalog.materials],
  );
  const suppliers = useMemo(
    () => uniqueMaterialValues(catalog.materials, materialSupplierName),
    [catalog.materials],
  );
  const parsedPriceMin = parseBudgetInput(priceMin);
  const parsedPriceMax = parseBudgetInput(priceMax);
  const hasBudgetFilter =
    parsedPriceMin != null || parsedPriceMax != null;

  const filtered = useMemo(() => {
    const next = filterPublicMaterials(
      catalog.materials,
      debouncedQuery,
      categorySlug,
      availability,
      {
        brand,
        supplier,
        location,
        priceMin: parsedPriceMin,
        priceMax: parsedPriceMax,
      },
    );
    return sortPublicMaterials(next, sort);
  }, [
    catalog.materials,
    debouncedQuery,
    categorySlug,
    availability,
    brand,
    supplier,
    location,
    parsedPriceMin,
    parsedPriceMax,
    sort,
  ]);

  const hasFilters =
    Boolean(query.trim()) ||
    (categorySlug !== "tous" && Boolean(categorySlug)) ||
    (availability !== "tous" && Boolean(availability)) ||
    (brand !== "tous" && Boolean(brand)) ||
    (supplier !== "tous" && Boolean(supplier)) ||
    (location !== "tous" && Boolean(location)) ||
    hasBudgetFilter ||
    sort !== "pertinence";

  function patchParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (
        !value ||
        value === "tous" ||
        (key === "tri" && value === "pertinence")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function resetFilters() {
    router.replace(pathname, { scroll: false });
  }

  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const filterFields = (
    <div className={styles.filterFields}>
      <fieldset className={styles.field}>
        <legend className={styles.fieldLabel}>Disponibilité</legend>
        <div className={styles.choices}>
          {AVAILABILITY_FILTERS.map((item) => (
            <label key={item.value} className={styles.choice}>
              <input
                type="radio"
                name="dispo"
                checked={availability === item.value}
                onChange={() => patchParams({ dispo: item.value })}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.field}>
        <legend className={styles.fieldLabel}>Prix</legend>
        <div className={styles.priceRow}>
          <label className={styles.priceField}>
            <span className={styles.priceHint}>Minimum</span>
            <input
              inputMode="numeric"
              value={priceMin}
              placeholder="50 000"
              aria-label="Prix minimum en GNF"
              onChange={(event) => patchParams({ prixMin: event.target.value })}
            />
          </label>
          <label className={styles.priceField}>
            <span className={styles.priceHint}>Maximum</span>
            <input
              inputMode="numeric"
              value={priceMax}
              placeholder="500 000"
              aria-label="Prix maximum en GNF"
              onChange={(event) => patchParams({ prixMax: event.target.value })}
            />
          </label>
        </div>
      </fieldset>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Marque</span>
        <select
          value={brand}
          disabled={brands.length === 0}
          onChange={(event) => patchParams({ marque: event.target.value })}
        >
          <option value="tous">
            {brands.length === 0 ? "Aucune marque renseignée" : "Toutes les marques"}
          </option>
          {brands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Fournisseur</span>
        <select
          value={supplier}
          disabled={suppliers.length === 0}
          onChange={(event) => patchParams({ fournisseur: event.target.value })}
        >
          <option value="tous">
            {suppliers.length === 0
              ? "Aucun fournisseur renseigné"
              : "Tous les fournisseurs"}
          </option>
          {suppliers.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {hasFilters ? (
        <button type="button" className={styles.reset} onClick={resetFilters}>
          Réinitialiser
        </button>
      ) : null}
    </div>
  );

  return (
    <ListingPageLayout
      config={MaterialsListingConfig}
      actions={<MaterialsCartBar />}
      search={
        <MaterialsListingSearch
          catalog={catalog}
          values={{
            q: query,
            localisation: location,
          }}
          onSubmit={(next) => {
            patchParams({
              q: next.q,
              localisation: next.localisation,
            });
          }}
        />
      }
    >
      <div className={styles.catalog}>
      <CatalogWorkspace
        filters={
          <CatalogFilterPanel>{filterFields}</CatalogFilterPanel>
        }
      >
        <MaterialsCategoryRail
          catalog={catalog}
          activeSlug={categorySlug}
          onSelect={(slug) => patchParams({ categorie: slug })}
        />

        <CatalogToolbar
          eyebrow={hasFilters ? "Résultats" : "Catalogue"}
          title={
            searching
              ? "Recherche…"
              : `${filtered.length} matériau${filtered.length > 1 ? "x" : ""}`
          }
          extra={
            <div className={searchStyles.toolbarControls}>
              <Button
                type="button"
                variant="secondary"
                className={searchStyles.mobileFilterButton}
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filtres
              </Button>
              <label className={searchStyles.sortControl}>
                <ArrowDownUp size={16} aria-hidden="true" />
                <span>Trier</span>
                <select
                  value={sort}
                  onChange={(event) => patchParams({ tri: event.target.value })}
                >
                  <option value="pertinence">Pertinence</option>
                  <option value="nom">Nom</option>
                  <option value="prix-asc">Prix croissant</option>
                  <option value="prix-desc">Prix décroissant</option>
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </label>
            </div>
          }
        />

        {catalog.materials.length === 0 ? (
          <CatalogEmptyState
            title="Catalogue vide"
            description="Aucun matériau n’est publié pour le moment."
          />
        ) : filtered.length === 0 ? (
          <CatalogEmptyState
            title={
              hasBudgetFilter
                ? "Aucun matériau ne correspond à votre budget."
                : "Aucun matériau ne correspond à votre recherche."
            }
            description={
              hasBudgetFilter
                ? "Élargissez la fourchette de prix ou réinitialisez les filtres."
                : "Modifiez le mot-clé ou réinitialisez les filtres pour afficher d’autres résultats."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={styles.reset}
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </button>
              ) : null
            }
          />
        ) : (
          <CatalogResultGrid>
            {filtered.map((material) => (
              <MaterialCard key={material.slug} material={material} />
            ))}
          </CatalogResultGrid>
        )}
      </CatalogWorkspace>

      <CatalogFilterDrawer
        open={filtersOpen}
        onClose={closeFilters}
        footer={
          <Button type="button" fullWidth onClick={closeFilters}>
            Voir {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </Button>
        }
      >
        {filterFields}
      </CatalogFilterDrawer>

      <MaterialsTrust />
      </div>
    </ListingPageLayout>
  );
}
