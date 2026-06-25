"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "photo_album_favorites";

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage full or unavailable
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const isFavorite = useCallback(
    (photoId: string) => favorites.includes(photoId),
    [favorites]
  );

  const toggleFavorite = useCallback((photoId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId];
      saveFavorites(next);
      return next;
    });
  }, []);

  const favoriteIds = favorites;

  return { favorites: favoriteIds, isFavorite, toggleFavorite };
}
