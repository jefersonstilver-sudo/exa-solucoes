import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-favorites';
const MAX_FAVORITES = 8;

export interface FavoriteItem {
  href: string;
  title: string;
  icon: string;
}

export function useSidebarFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  const isFavorite = useCallback((href: string) => {
    return favorites.includes(href);
  }, [favorites]);

  const addFavorite = useCallback((href: string) => {
    setFavorites(prev => {
      if (prev.includes(href) || prev.length >= MAX_FAVORITES) return prev;
      return [...prev, href];
    });
  }, []);

  const removeFavorite = useCallback((href: string) => {
    setFavorites(prev => prev.filter(f => f !== href));
  }, []);

  const toggleFavorite = useCallback((href: string) => {
    setFavorites(prev => {
      if (prev.includes(href)) {
        return prev.filter(f => f !== href);
      }
      if (prev.length >= MAX_FAVORITES) return prev;
      return [...prev, href];
    });
  }, []);

  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    reorderFavorites,
    maxFavorites: MAX_FAVORITES,
    canAddMore: favorites.length < MAX_FAVORITES
  };
}
