"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useFavorites } from "@/context/FavoritesContext";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export function DashboardFavoritesStat() {
  const { favoritesCount } = useFavorites();

  return (
    <article className={styles.statCard}>
      <span className={styles.statIcon}>
        <Heart size={22} aria-hidden="true" />
      </span>
      <div>
        <small>Biens favoris</small>
        <strong>{favoritesCount}</strong>
        <Link href={routes.favorites}>Voir mes favoris</Link>
      </div>
    </article>
  );
}
