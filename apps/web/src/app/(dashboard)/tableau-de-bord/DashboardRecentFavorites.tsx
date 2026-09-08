"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin } from "lucide-react";
import { useMemo } from "react";

import { useFavorites } from "@/context/FavoritesContext";
import { useDemoListings } from "@/hooks/useDemoListings";
import { mapDemoListingToProperty } from "@/lib/demo-api/mapToProperty";
import { skipImageOptimization } from "@/lib/imageOptimization";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

export function DashboardRecentFavorites() {
  const { favorites, toggleFavorite } = useFavorites();
  const { items: listings, loading } = useDemoListings({ publicOnly: true });

  const resolved = useMemo(() => {
    return favorites.slice(0, 2).flatMap((slug) => {
      const listing = listings.find((item) => item.slug === slug);
      if (!listing) return [];
      const property = mapDemoListingToProperty(listing);
      return [
        {
          slug: property.slug,
          title: property.title,
          location: property.location,
          price: `${property.price}${property.pricePeriod ? ` ${property.pricePeriod}` : ""}`,
          image: property.image,
        },
      ];
    });
  }, [favorites, listings]);

  if (loading && favorites.length > 0 && resolved.length === 0) {
    return <p className={styles.emptyFavorites}>Chargement de vos favoris…</p>;
  }

  if (favorites.length === 0 || resolved.length === 0) {
    return (
      <p className={styles.emptyFavorites}>
        Aucun favori enregistré.{" "}
        <Link href={routes.listings}>Parcourir les annonces</Link>
      </p>
    );
  }

  return (
    <div className={styles.favoritesGrid}>
      {resolved.map((property) => (
        <article key={property.slug} className={styles.propertyCard}>
          <div className={styles.propertyImage}>
            <Image
              src={property.image}
              alt={property.title}
              fill
              sizes="(max-width: 700px) 100vw, 240px"
              className={styles.propertyPhoto}
              unoptimized={skipImageOptimization(property.image)}
            />
            <button
              type="button"
              aria-label={`Retirer ${property.title} des favoris`}
              onClick={() => toggleFavorite(property.slug)}
            >
              <Heart size={18} fill="currentColor" aria-hidden="true" />
            </button>
          </div>

          <div className={styles.propertyContent}>
            <p>
              <MapPin size={14} aria-hidden="true" />
              {property.location}
            </p>
            <h3>{property.title}</h3>
            <strong>{property.price}</strong>
            <Link href={routes.publicProperty(property.slug)}>
              Voir le bien
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
