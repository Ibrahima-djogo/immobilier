"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  Check,
  Grid2X2,
  Heart,
  Home,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { skipImageOptimization } from "@/lib/imageOptimization";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

type ViewMode = "grid" | "list";
type PropertyType = "Tous" | "Villa" | "Appartement" | "Terrain";
type TransactionType = "Tous" | "Vente" | "Location";

type FavoriteProperty = {
  id: number;
  slug: string;
  title: string;
  location: string;
  city: string;
  propertyType: Exclude<PropertyType, "Tous">;
  transactionType: Exclude<TransactionType, "Tous">;
  price: string;
  numericPrice: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  image: string;
  verified: boolean;
};

const initialFavorites: FavoriteProperty[] = [
  {
    id: 1,
    slug: "villa-contemporaine-kipe",
    title: "Villa contemporaine avec jardin",
    location: "Kipé, Ratoma",
    city: "Conakry",
    propertyType: "Villa",
    transactionType: "Location",
    price: "4 500 000 GNF / mois",
    numericPrice: 4500000,
    area: 310,
    bedrooms: 5,
    bathrooms: 4,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=86",
    verified: true,
  },
  {
    id: 2,
    slug: "appartement-moderne-lambanyi",
    title: "Appartement moderne et lumineux",
    location: "Lambanyi, Ratoma",
    city: "Conakry",
    propertyType: "Appartement",
    transactionType: "Vente",
    price: "950 000 000 GNF",
    numericPrice: 950000000,
    area: 145,
    bedrooms: 3,
    bathrooms: 2,
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=86",
    verified: true,
  },
  {
    id: 3,
    slug: "terrain-viabilise-sonfonia",
    title: "Terrain résidentiel bien situé",
    location: "Sonfonia, Ratoma",
    city: "Conakry",
    propertyType: "Terrain",
    transactionType: "Vente",
    price: "680 000 000 GNF",
    numericPrice: 680000000,
    area: 600,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=86",
    verified: false,
  },
  {
    id: 4,
    slug: "villa-piscine-miniere",
    title: "Villa familiale avec grande cour",
    location: "Manquepas, Kindia",
    city: "Kindia",
    propertyType: "Villa",
    transactionType: "Vente",
    price: "1 350 000 000 GNF",
    numericPrice: 1350000000,
    area: 420,
    bedrooms: 4,
    bathrooms: 3,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=86",
    verified: true,
  },
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [propertyType, setPropertyType] = useState<PropertyType>("Tous");
  const [transactionType, setTransactionType] = useState<TransactionType>("Tous");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  const filteredFavorites = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return favorites
      .filter((property) => {
        const queryMatches =
          !normalizedQuery ||
          property.title.toLowerCase().includes(normalizedQuery) ||
          property.location.toLowerCase().includes(normalizedQuery) ||
          property.city.toLowerCase().includes(normalizedQuery);

        return (
          queryMatches &&
          (propertyType === "Tous" || property.propertyType === propertyType) &&
          (transactionType === "Tous" || property.transactionType === transactionType)
        );
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.numericPrice - b.numericPrice;
        if (sortBy === "price-desc") return b.numericPrice - a.numericPrice;
        if (sortBy === "area-desc") return b.area - a.area;
        return a.id - b.id;
      });
  }, [favorites, propertyType, debouncedQuery, sortBy, transactionType]);

  function removeFavorite(id: number) {
    setFavorites((current) => current.filter((item) => item.id !== id));
    setSelectedIds((current) => current.filter((item) => item !== id));
    setMessage("Le bien a été retiré de vos favoris dans cette démonstration.");
  }

  function toggleSelection(id: number) {
    setMessage("");
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) {
        setMessage("Vous pouvez comparer jusqu’à trois biens à la fois.");
        return current;
      }
      return [...current, id];
    });
  }

  function resetFilters() {
    setQuery("");
    setPropertyType("Tous");
    setTransactionType("Tous");
    setSortBy("recent");
    setMessage("");
  }

  return (
    <UserShell active="favoris" favoritesCount={favorites.length}>
      <section className={styles.content}>
          <PageHero
            variant="dashboard"
            eyebrow="Votre sélection"
            title="Mes favoris"
            description="Retrouvez les biens enregistrés et comparez les options qui correspondent à votre recherche."
            icon={<Heart size={16} aria-hidden="true" />}
            backHref="/tableau-de-bord"
            backLabel="Tableau de bord"
            actions={
              <Link href="/annonces" className={styles.exploreButton}>
                <Search size={18} aria-hidden="true" />
                Explorer les annonces
              </Link>
            }
          />

          <section className={styles.summaryGrid}>
            <article><span><Heart size={21} /></span><div><small>Total enregistré</small><strong>{favorites.length}</strong></div></article>
            <article><span><Building2 size={21} /></span><div><small>Biens à vendre</small><strong>{favorites.filter((item) => item.transactionType === "Vente").length}</strong></div></article>
            <article><span><Home size={21} /></span><div><small>Biens à louer</small><strong>{favorites.filter((item) => item.transactionType === "Location").length}</strong></div></article>
            <article><span><Check size={21} /></span><div><small>Annonceurs vérifiés</small><strong>{favorites.filter((item) => item.verified).length}</strong></div></article>
          </section>

          <section className={styles.toolbar}>
            <div className={styles.searchField}><Search size={18} /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans mes favoris..." /></div>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}>
              <option value="Tous">Tous les biens</option><option value="Villa">Villas</option><option value="Appartement">Appartements</option><option value="Terrain">Terrains</option>
            </select>
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value as TransactionType)}>
              <option value="Tous">Vente et location</option><option value="Vente">Vente</option><option value="Location">Location</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Ajout récent</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option><option value="area-desc">Plus grande surface</option>
            </select>
            <div className={styles.viewSwitcher}>
              <button type="button" className={viewMode === "grid" ? styles.activeViewButton : styles.viewButton} onClick={() => setViewMode("grid")} aria-label="Vue grille"><Grid2X2 size={18} /></button>
              <button type="button" className={viewMode === "list" ? styles.activeViewButton : styles.viewButton} onClick={() => setViewMode("list")} aria-label="Vue liste"><List size={19} /></button>
            </div>
          </section>

          <div className={styles.resultsHeader}>
            <p><strong>{filteredFavorites.length}</strong> bien{filteredFavorites.length > 1 ? "s" : ""} affiché{filteredFavorites.length > 1 ? "s" : ""}</p>
            <button type="button" onClick={resetFilters}><X size={15} />Effacer les filtres</button>
          </div>

          {message && <div className={styles.informationMessage} role="status">{message}</div>}

          {filteredFavorites.length > 0 ? (
            <section className={viewMode === "grid" ? styles.propertiesGrid : styles.propertiesList}>
              {filteredFavorites.map((property) => (
                <article key={property.id} className={styles.propertyCard}>
                  <div className={styles.propertyImageWrapper}>
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      className={styles.propertyImage}
                      unoptimized={skipImageOptimization(property.image)}
                    />
                    <span className={styles.transactionBadge}>{property.transactionType}</span>
                    <button type="button" className={styles.removeFavoriteButton} onClick={() => removeFavorite(property.id)} aria-label={`Retirer ${property.title} des favoris`}><Heart size={19} fill="currentColor" /></button>
                  </div>

                  <div className={styles.propertyContent}>
                    <div className={styles.propertyTopLine}>
                      <span>{property.propertyType}</span>
                      {property.verified && <span className={styles.verifiedBadge}><Check size={13} />Vérifié</span>}
                    </div>
                    <h2>{property.title}</h2>
                    <p className={styles.location}><MapPin size={15} />{property.location}, {property.city}</p>
                    <div className={styles.features}>
                      {property.bedrooms && <span><BedDouble size={16} />{property.bedrooms} chambres</span>}
                      {property.bathrooms && <span><Bath size={16} />{property.bathrooms} salles d’eau</span>}
                      <span><Building2 size={16} />{property.area} m²</span>
                    </div>
                    <div className={styles.propertyFooter}>
                      <strong>{property.price}</strong>
                      <Link href={routes.publicProperty(property.slug)}>Voir l’annonce<ArrowRight size={16} /></Link>
                    </div>
                    <label className={styles.compareControl}>
                      <input type="checkbox" checked={selectedIds.includes(property.id)} onChange={() => toggleSelection(property.id)} />
                      <span className={styles.customCheckbox}><Check size={13} /></span>
                      Ajouter à la comparaison
                    </label>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className={styles.emptyState}>
              <span><Heart size={38} /></span>
              <h2>{favorites.length === 0 ? "Vous n’avez encore aucun favori" : "Aucun bien ne correspond aux filtres"}</h2>
              <p>Explorez les annonces ou réinitialisez les filtres pour retrouver votre sélection.</p>
              {favorites.length === 0 ? <Link href="/annonces">Explorer les annonces<ArrowRight size={17} /></Link> : <button type="button" onClick={resetFilters}>Réinitialiser les filtres</button>}
            </section>
          )}
        </section>

      {selectedIds.length > 0 && (
        <aside className={styles.compareBar}>
          <div><span className={styles.compareIcon}><SlidersHorizontal size={20} /></span><div><strong>{selectedIds.length} bien{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}</strong><small>Maximum : 3 biens</small></div></div>
          <div className={styles.compareActions}>
            <button type="button" className={styles.clearSelectionButton} onClick={() => setSelectedIds([])}>Effacer</button>
            <button type="button" className={styles.compareButton} disabled={selectedIds.length < 2} onClick={() => setMessage("La comparaison détaillée sera connectée aux données réelles des annonces.")}>Comparer<ArrowRight size={16} /></button>
          </div>
        </aside>
      )}
    </UserShell>
  );
}