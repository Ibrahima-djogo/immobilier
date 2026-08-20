"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  House,
  LandPlot,
  MapPin,
  Search,
  Store,
} from "lucide-react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import styles from "@/app/(public)/(site)/annonces/page.module.css";

type FilterControlsProps = {
  idPrefix: string;
  onApply?: () => void;
};

const categoryFilters = [
  { name: "Maisons", value: "maison", count: 128, icon: House },
  { name: "Appartements", value: "appartement", count: 96, icon: Building2 },
  { name: "Villas", value: "villa", count: 54, icon: House },
  { name: "Terrains", value: "terrain", count: 82, icon: LandPlot },
  { name: "Bureaux", value: "bureau", count: 36, icon: BriefcaseBusiness },
  { name: "Commerces", value: "commerce", count: 41, icon: Store },
];

type Draft = {
  operation: string;
  categories: string[];
  ville: string;
  quartier: string;
  prixMin: string;
  prixMax: string;
  chambres: string;
  verifie: boolean;
};

function draftFromParams(searchParams: URLSearchParams): Draft {
  const catParam = searchParams.get("categorie");
  return {
    operation: searchParams.get("operation") || "",
    categories: catParam ? catParam.split(",").filter(Boolean) : [],
    ville: searchParams.get("ville") || "",
    quartier:
      searchParams.get("quartier") || searchParams.get("localisation") || "",
    prixMin: searchParams.get("prixMin") || "",
    prixMax: searchParams.get("prixMax") || searchParams.get("budget") || "",
    chambres: searchParams.get("chambres") || "",
    verifie: searchParams.get("verifie") === "true",
  };
}

export function FilterControls({ idPrefix, onApply }: FilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<Draft>(() =>
    draftFromParams(new URLSearchParams(searchParams.toString())),
  );
  const skipDebounce = useRef(true);

  const debouncedQuartier = useDebouncedValue(draft.quartier, 300);
  const debouncedPrixMin = useDebouncedValue(draft.prixMin, 300);
  const debouncedPrixMax = useDebouncedValue(draft.prixMax, 300);

  useEffect(() => {
    setDraft(draftFromParams(new URLSearchParams(searchParams.toString())));
    skipDebounce.current = true;
  }, [searchParams]);

  const commit = useCallback(
    (next: Draft) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.operation) params.set("operation", next.operation);
      else params.delete("operation");

      if (next.categories.length > 0) {
        params.set("categorie", next.categories.join(","));
      } else {
        params.delete("categorie");
      }

      if (next.ville) params.set("ville", next.ville);
      else params.delete("ville");

      if (next.quartier.trim()) {
        params.set("quartier", next.quartier.trim());
        params.delete("localisation");
      } else {
        params.delete("quartier");
        params.delete("localisation");
      }

      if (next.prixMin) params.set("prixMin", next.prixMin);
      else params.delete("prixMin");

      if (next.prixMax) {
        params.set("prixMax", next.prixMax);
        params.delete("budget");
      } else {
        params.delete("prixMax");
        params.delete("budget");
      }

      if (next.chambres) params.set("chambres", next.chambres);
      else params.delete("chambres");

      if (next.verifie) params.set("verifie", "true");
      else params.delete("verifie");

      params.set("page", "1");
      const qs = params.toString();
      const nextUrl = qs ? `/annonces?${qs}` : "/annonces";
      const current = searchParams.toString()
        ? `/annonces?${searchParams.toString()}`
        : "/annonces";
      if (nextUrl !== current) {
        router.replace(nextUrl, { scroll: false });
      }
      onApply?.();
    },
    [onApply, router, searchParams],
  );

  function updateImmediate(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    commit(next);
  }

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      return;
    }
    const next: Draft = {
      ...draft,
      quartier: debouncedQuartier,
      prixMin: debouncedPrixMin,
      prixMax: debouncedPrixMax,
    };
    commit(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when debounced text fields settle
  }, [debouncedQuartier, debouncedPrixMin, debouncedPrixMax]);

  function handleReset() {
    const op = searchParams.get("operation");
    const keepOp = op === "vente" || op === "location" ? op : "";
    const next: Draft = {
      operation: keepOp,
      categories: [],
      ville: "",
      quartier: "",
      prixMin: "",
      prixMax: "",
      chambres: "",
      verifie: false,
    };
    setDraft(next);
    skipDebounce.current = true;
    if (keepOp) router.replace(`/annonces?operation=${keepOp}`, { scroll: false });
    else router.replace("/annonces", { scroll: false });
    onApply?.();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        commit(draft);
      }}
    >
      <fieldset className={styles.filterGroup}>
        <legend>Type d’opération</legend>
        <div className={styles.segmentedFilter}>
          {[
            { id: "all", value: "", label: "Tous" },
            { id: "sale", value: "vente", label: "À vendre" },
            { id: "rent", value: "location", label: "À louer" },
          ].map((opt) => (
            <span key={opt.id}>
              <input
                type="radio"
                id={`${idPrefix}-${opt.id}`}
                name={`${idPrefix}-operation`}
                value={opt.value}
                checked={draft.operation === opt.value}
                onChange={() => updateImmediate({ operation: opt.value })}
              />
              <label htmlFor={`${idPrefix}-${opt.id}`}>{opt.label}</label>
            </span>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Type de bien</legend>
        <div className={styles.categoryFilters}>
          {categoryFilters.map(({ icon: Icon, ...category }) => {
            const inputId = `${idPrefix}-${category.value}`;
            const isChecked = draft.categories.includes(category.value);
            return (
              <label key={category.value} htmlFor={inputId}>
                <span className={styles.filterCategoryIdentity}>
                  <input
                    type="checkbox"
                    id={inputId}
                    name="categorie"
                    value={category.value}
                    checked={isChecked}
                    onChange={() => {
                      const categories = isChecked
                        ? draft.categories.filter((c) => c !== category.value)
                        : [...draft.categories, category.value];
                      updateImmediate({ categories });
                    }}
                  />
                  <span className={styles.customCheckbox}>
                    <Check size={13} aria-hidden="true" />
                  </span>
                  <Icon size={17} aria-hidden="true" />
                  <span>{category.name}</span>
                </span>
                <small>{category.count}</small>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Localisation</legend>
        <div className={styles.filterField}>
          <label htmlFor={`${idPrefix}-city`}>Ville</label>
          <div className={styles.filterControl}>
            <MapPin size={17} aria-hidden="true" />
            <select
              id={`${idPrefix}-city`}
              name="ville"
              value={draft.ville}
              onChange={(e) => updateImmediate({ ville: e.target.value })}
            >
              <option value="">Toutes les villes</option>
              <option value="conakry">Conakry</option>
              <option value="kindia">Kindia</option>
              <option value="kankan">Kankan</option>
              <option value="labe">Labé</option>
              <option value="nzerekore">N’Zérékoré</option>
            </select>
            <ChevronDown
              className={styles.selectChevron}
              size={16}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className={styles.filterField}>
          <label htmlFor={`${idPrefix}-district`}>Quartier</label>
          <div className={styles.filterControl}>
            <Search size={17} aria-hidden="true" />
            <input
              id={`${idPrefix}-district`}
              name="quartier"
              type="text"
              placeholder="Ex. Kipé, Lambanyi..."
              value={draft.quartier}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, quartier: e.target.value }))
              }
            />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Budget (GNF)</legend>
        <div className={styles.priceGrid}>
          <div className={styles.filterField}>
            <label htmlFor={`${idPrefix}-min-price`}>Minimum</label>
            <input
              id={`${idPrefix}-min-price`}
              name="prixMin"
              type="number"
              min="0"
              placeholder="0"
              value={draft.prixMin}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, prixMin: e.target.value }))
              }
            />
          </div>
          <div className={styles.filterField}>
            <label htmlFor={`${idPrefix}-max-price`}>Maximum</label>
            <input
              id={`${idPrefix}-max-price`}
              name="prixMax"
              type="number"
              min="0"
              placeholder="Sans limite"
              value={draft.prixMax}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, prixMax: e.target.value }))
              }
            />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Nombre de chambres</legend>
        <div className={styles.roomOptions}>
          {[
            { label: "Toutes", value: "" },
            { label: "1+", value: "1" },
            { label: "2+", value: "2" },
            { label: "3+", value: "3" },
            { label: "4+", value: "4" },
          ].map((opt, index) => {
            const inputId = `${idPrefix}-rooms-${index}`;
            return (
              <label key={opt.label} htmlFor={inputId}>
                <input
                  id={inputId}
                  type="radio"
                  name={`${idPrefix}-rooms`}
                  value={opt.value}
                  checked={draft.chambres === opt.value}
                  onChange={() => updateImmediate({ chambres: opt.value })}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className={styles.verifiedOnly}>
        <input
          type="checkbox"
          name="verifie"
          value="true"
          checked={draft.verifie}
          onChange={(e) => updateImmediate({ verifie: e.target.checked })}
        />
        <span className={styles.customCheckbox}>
          <Check size={13} aria-hidden="true" />
        </span>
        <BadgeCheck size={18} aria-hidden="true" />
        <span>Afficher uniquement les annonces vérifiées</span>
      </label>

      <div className={styles.filterActions}>
        <button
          type="button"
          onClick={handleReset}
          className={styles.resetFiltersButton}
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
}
