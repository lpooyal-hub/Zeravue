import { useEffect, useState } from "react";

const FAVORITE_CONSTELLATIONS_STORAGE_KEY = "planetarium-favorite-constellations";

function getInitialFavoriteConstellations() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(FAVORITE_CONSTELLATIONS_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function useFavoriteConstellations() {
  const [favoriteConstellations, setFavoriteConstellations] = useState(getInitialFavoriteConstellations);

  useEffect(() => {
    window.localStorage.setItem(FAVORITE_CONSTELLATIONS_STORAGE_KEY, JSON.stringify(favoriteConstellations));
  }, [favoriteConstellations]);

  return { favoriteConstellations, setFavoriteConstellations };
}

export { useFavoriteConstellations };
