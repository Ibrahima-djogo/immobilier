"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { DemoToast } from "@/components/ui";

type FavoritesContextType = {
  favorites: string[];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  favoritesCount: number;
};

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
  favoritesCount: 0,
});

const STORAGE_KEY = "demeure_guinee_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), [setToast]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Hydratation locale intentionnelle pour la démo (pas de backend).
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage bootstrap
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load favorites from localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.error("Failed to save favorites to localStorage", e);
      }
    }
  }, [favorites, isLoaded]);

  const toggleFavorite = (slug: string) => {
    const exists = favorites.includes(slug);
    setFavorites((prev) =>
      exists ? prev.filter((item) => item !== slug) : [...prev, slug],
    );
    setToast(
      exists
        ? "Favori retiré de la démonstration."
        : "Favori ajouté à la démonstration.",
    );
  };

  const isFavorite = (slug: string) => favorites.includes(slug);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        favoritesCount: favorites.length,
      }}
    >
      {children}
      <DemoToast message={toast} onDismiss={dismissToast} />
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
