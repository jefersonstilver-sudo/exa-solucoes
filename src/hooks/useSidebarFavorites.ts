import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sidebar_favorites';
const MAX_FAVORITES = 8;

export const useSidebarFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage ONLY after initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites, isLoaded]);

  const addFavorite = useCallback((href: string) => {
    setFavorites(prev => {
      if (prev.length >= MAX_FAVORITES || prev.includes(href)) {
        return prev;
      }
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
      if (prev.length >= MAX_FAVORITES) {
        return prev;
      }
      return [...prev, href];
    });
  }, []);

  const isFavorite = useCallback((href: string) => {
    return favorites.includes(href);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    MAX_FAVORITES
  };
};
