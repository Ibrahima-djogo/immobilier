"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin } from "lucide-react";
import { useCallback, useState } from "react";

import { DemoToast } from "@/components/ui";
import { useFavorites } from "@/context/FavoritesContext";
import { skipImageOptimization } from "@/lib/imageOptimization";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

type FavoriteProperty = {
  slug: string;
  title: string;
  location: string;
  price: string;
  image: string;
};

type Props = {
  items: FavoriteProperty[];
};

export function DashboardRecentFavorites({ items }: Props) {
  const { toggleFavorite } = useFavorites();
  const [visible, setVisible] = useState(items);
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  function removeFavorite(property: FavoriteProperty) {
    toggleFavorite(property.slug);
    setVisible((current) => current.filter((item) => item.slug !== property.slug));
    setToast("Action simulée dans la démonstration frontend. Favori retiré.");
  }

  if (visible.length === 0) {
    return (
      <p className={styles.emptyFavorites}>
        Aucun favori récent.{" "}
        <Link href={routes.favorites}>Voir tous mes favoris</Link>
      </p>
    );
  }

  return (
    <>
      <div className={styles.favoritesGrid}>
        {visible.map((property) => (
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
                onClick={() => removeFavorite(property)}
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
      <DemoToast message={toast} onDismiss={dismissToast} />
    </>
  );
}
