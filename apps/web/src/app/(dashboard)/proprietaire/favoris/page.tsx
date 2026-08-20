"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Heart,
  MapPin,
  Ruler,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { useFavorites } from "@/context/FavoritesContext";
import { skipImageOptimization } from "@/lib/imageOptimization";
import { formatGnf } from "@/lib/proprietaire/demo-data";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

type FavoriteListing = {
  slug: string;
  title: string;
  location: string;
  type: string;
  operation: "VENTE" | "LOCATION";
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  image: string;
};

const catalog: FavoriteListing[] = [
  {
    slug: "villa-contemporaine-kipe",
    title: "Villa contemporaine avec jardin",
    location: "Kipé, Ratoma, Conakry",
    type: "Villa",
    operation: "LOCATION",
    price: 4500000,
    area: 310,
    bedrooms: 5,
    bathrooms: 4,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=86",
  },
  {
    slug: "appartement-moderne-lambanyi",
    title: "Appartement moderne et lumineux",
    location: "Lambanyi, Ratoma, Conakry",
    type: "Appartement",
    operation: "VENTE",
    price: 950000000,
    area: 145,
    bedrooms: 3,
    bathrooms: 2,
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=86",
  },
  {
    slug: "terrain-viabilise-sonfonia",
    title: "Terrain résidentiel bien situé",
    location: "Sonfonia, Ratoma, Conakry",
    type: "Terrain",
    operation: "VENTE",
    price: 680000000,
    area: 600,
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=86",
  },
  {
    slug: "maison-familiale-nongo",
    title: "Maison familiale à Nongo",
    location: "Nongo, Ratoma, Conakry",
    type: "Maison",
    operation: "LOCATION",
    price: 3800000,
    area: 180,
    bedrooms: 4,
    bathrooms: 3,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=86",
  },
];

export default function OwnerFavorisPage() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const items = useMemo(() => {
    const selected =
      favorites.length === 0
        ? catalog
        : catalog.filter((item) => favorites.includes(item.slug));
    return selected.filter((item) =>
      `${item.title} ${item.location} ${item.type}`
        .toLowerCase()
        .includes(debouncedQuery.toLowerCase()),
    );
  }, [favorites, debouncedQuery]);

  const showingSeedHint = favorites.length === 0;

  return (
    <>
      <OwnerPageHeader
        eyebrow="Compte personnel"
        title="Mes favoris"
        description="Retrouvez les biens enregistrés depuis l’exploration publique, sans quitter votre espace propriétaire."
      />
      <section className={`${styles.card} ${styles.toolbar}`}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un favori..."
          />
        </div>
        <p>
          <strong>{items.length}</strong> bien(s)
          {showingSeedHint ? " suggérés" : " en favoris"}
        </p>
      </section>

      {showingSeedHint && (
        <div className={styles.hint}>
          Aucun favori enregistré pour l’instant. Voici une sélection à
          explorer — cliquez sur le cœur pour sauvegarder.
        </div>
      )}

      <section className={styles.grid}>
        {items.map((item) => (
          <article key={item.slug} className={`${styles.card} ${styles.property}`}>
            <div className={styles.imageWrap}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                className={styles.image}
                unoptimized={skipImageOptimization(item.image)}
              />
              <button
                type="button"
                className={isFavorite(item.slug) ? styles.loved : styles.love}
                onClick={() => toggleFavorite(item.slug)}
                aria-label={
                  isFavorite(item.slug)
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
                }
              >
                <Heart size={16} />
              </button>
              <span>{item.operation === "VENTE" ? "Vente" : "Location"}</span>
            </div>
            <div className={styles.body}>
              <small>
                {item.type} · {item.location}
              </small>
              <h2>{item.title}</h2>
              <p>
                <MapPin size={14} />
                {item.location}
              </p>
              <strong>
                {formatGnf(item.price)}
                {item.operation === "LOCATION" ? " / mois" : ""}
              </strong>
              <div className={styles.features}>
                <span>
                  <Ruler size={14} />
                  {item.area} m²
                </span>
                {item.bedrooms != null && (
                  <span>
                    <BedDouble size={14} />
                    {item.bedrooms}
                  </span>
                )}
                {item.bathrooms != null && (
                  <span>
                    <Bath size={14} />
                    {item.bathrooms}
                  </span>
                )}
              </div>
              <Link href={routes.publicProperty(item.slug)}>
                Voir l’annonce <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </section>

      {items.length === 0 && (
        <section className={`${styles.card} ${styles.empty}`}>
          <Heart size={36} />
          <h2>Aucun résultat</h2>
          <p>Modifiez votre recherche ou explorez les annonces publiques.</p>
          <Link href="/annonces">Explorer les annonces</Link>
        </section>
      )}
    </>
  );
}
