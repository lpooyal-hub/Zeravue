import { useMemo } from "react";

export function useConstellationCollections({
  stars,
  backendVisibleConstellations,
  constellationSearch,
  dictionary,
  language,
  favoriteConstellations,
  viewMode
}) {
  const currentViewConstellationDetails = useMemo(() => {
    if (!stars.length) {
      return [];
    }

    const minAltitude = viewMode === "observer" ? 28 : viewMode === "panorama" ? 18 : viewMode === "projection" ? 22 : 12;
    const minStars = viewMode === "space" ? 2 : 3;
    const bucket = new Map();

    stars.forEach((star) => {
      if (!star.visible || star.constellation === "Unknown" || star.altitude < minAltitude) {
        return;
      }

      const current = bucket.get(star.constellation) || { count: 0, altitude: 0, azimuth: 0, magnitude: 0 };
      bucket.set(star.constellation, {
        count: current.count + 1,
        altitude: current.altitude + star.altitude,
        azimuth: current.azimuth + star.azimuth,
        magnitude: current.magnitude + star.magnitude
      });
    });

    return [...bucket.entries()]
      .filter(([, value]) => value.count >= minStars)
      .map(([name, value]) => ({
        name,
        score: value.count * 3 + value.altitude / value.count / 14 - value.magnitude / value.count / 3,
        visibleStars: value.count,
        averageAltitude: Number((value.altitude / value.count).toFixed(1)),
        averageAzimuth: Number((value.azimuth / value.count).toFixed(1))
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 10);
  }, [stars, viewMode]);

  const currentViewConstellations = useMemo(() => currentViewConstellationDetails.map((item) => item.name), [currentViewConstellationDetails]);

  const importableConstellations = useMemo(() => {
    if (!stars.length) {
      return [];
    }

    const bucket = new Map();
    stars.forEach((star) => {
      if (!star.visible || star.constellation === "Unknown") {
        return;
      }

      const current = bucket.get(star.constellation) || { count: 0, magnitude: 0, altitude: 0 };
      bucket.set(star.constellation, {
        count: current.count + 1,
        magnitude: current.magnitude + star.magnitude,
        altitude: current.altitude + star.altitude
      });
    });

    return [...bucket.entries()]
      .filter(([, value]) => value.count >= 2)
      .map(([name, value]) => ({
        name,
        score: value.count * 2.6 + value.altitude / value.count / 18 - value.magnitude / value.count / 3.4
      }))
      .sort((left, right) => right.score - left.score)
      .map((item) => item.name);
  }, [stars]);

  const focusConstellations = useMemo(() => {
    const priority = new Map();
    const merged = [];

    const pushAll = (items, baseScore) => {
      items.forEach((name, index) => {
        if (!priority.has(name)) {
          merged.push(name);
        }
        const current = priority.get(name) ?? -Infinity;
        priority.set(name, Math.max(current, baseScore - index));
      });
    };

    pushAll(backendVisibleConstellations, 3000);
    pushAll(currentViewConstellations, 2000);
    pushAll(importableConstellations, 1000);

    return merged.sort((left, right) => (priority.get(right) || 0) - (priority.get(left) || 0));
  }, [backendVisibleConstellations, currentViewConstellations, importableConstellations]);

  const filteredConstellations = useMemo(() => {
    const query = constellationSearch.trim().toLowerCase();
    if (!query) {
      return focusConstellations;
    }

    return focusConstellations.filter((name) => {
      const translated = dictionary.constellations?.[name]?.[language] || name;
      return name.toLowerCase().includes(query) || translated.toLowerCase().includes(query);
    });
  }, [constellationSearch, dictionary.constellations, focusConstellations, language]);

  const visibleFavoriteConstellations = useMemo(
    () => favoriteConstellations.filter((name) => focusConstellations.includes(name)),
    [favoriteConstellations, focusConstellations]
  );

  return {
    currentViewConstellations,
    currentViewConstellationDetails,
    importableConstellations,
    focusConstellations,
    filteredConstellations,
    visibleFavoriteConstellations
  };
}
