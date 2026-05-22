import { useEffect, useMemo, useState } from "react";

const SKETCH_STORAGE_KEY = "planetarium-custom-space-scenes";

function useSavedSketches() {
  const [savedSketches, setSavedSketches] = useState([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(SKETCH_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSavedSketches(
          parsed
            .filter((scene) => Array.isArray(scene.stars) && Array.isArray(scene.planets) && Array.isArray(scene.constellations))
            .map((scene) => ({ favorite: false, ...scene }))
        );
      }
    } catch (error) {
      console.warn("Failed to restore saved sketches:", error);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SKETCH_STORAGE_KEY, JSON.stringify(savedSketches));
  }, [savedSketches]);

  const sortedSavedSketches = useMemo(
    () =>
      [...savedSketches].sort((left, right) => {
        if (left.favorite === right.favorite) {
          return 0;
        }
        return left.favorite ? -1 : 1;
      }),
    [savedSketches]
  );

  return { savedSketches, setSavedSketches, sortedSavedSketches };
}

export { useSavedSketches };
