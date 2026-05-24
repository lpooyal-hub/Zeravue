import { useMemo, useState } from "react";
import { clampCoordinate, createBlankSpaceScene, planetPresets } from "../utils/viewerState.js";

export function useSketchWorkspace({
  dictionary,
  language,
  savedSketches,
  setSavedSketches,
  sceneData,
  currentPage,
  setCurrentPage,
  setViewMode,
  setFocusedConstellation,
  setTrackConstellation,
  setSelectedTarget
}) {
  const [creativeTool, setCreativeTool] = useState("star");
  const [planetPreset, setPlanetPreset] = useState(planetPresets[0].id);
  const [presetConstellationName, setPresetConstellationName] = useState("");
  const [sketchName, setSketchName] = useState("");
  const [activeSketchId, setActiveSketchId] = useState("draft");
  const [watchSketchId, setWatchSketchId] = useState(null);
  const [customSpace, setCustomSpace] = useState(() => createBlankSpaceScene());

  const activeCustomConstellation = useMemo(
    () => customSpace.constellations.find((constellation) => constellation.id === customSpace.activeConstellationId) || customSpace.constellations[0],
    [customSpace]
  );
  const activeCustomConstellationStars = useMemo(() => {
    if (!activeCustomConstellation) {
      return [];
    }
    const starIds = new Set(activeCustomConstellation.starIds);
    return customSpace.stars.filter((star) => starIds.has(star.id));
  }, [activeCustomConstellation, customSpace.stars]);
  const activeConstellationCenter = useMemo(() => {
    if (!activeCustomConstellationStars.length) {
      return null;
    }
    const total = activeCustomConstellationStars.reduce(
      (current, star) => ({ x: current.x + star.x, y: current.y + star.y, z: current.z + star.z }),
      { x: 0, y: 0, z: 0 }
    );
    return {
      x: total.x / activeCustomConstellationStars.length,
      y: total.y / activeCustomConstellationStars.length,
      z: total.z / activeCustomConstellationStars.length
    };
  }, [activeCustomConstellationStars]);
  const watchedSketch = useMemo(() => savedSketches.find((sketch) => sketch.id === watchSketchId) || null, [savedSketches, watchSketchId]);
  const isSketchWatch = currentPage === "watch" && Boolean(watchedSketch);
  const watchedSketchSummary = useMemo(() => {
    if (!watchedSketch) {
      return null;
    }
    return {
      stars: watchedSketch.stars.length,
      planets: watchedSketch.planets.length,
      constellations: watchedSketch.constellations.length
    };
  }, [watchedSketch]);
  const activeCreativeScene = currentPage === "sketch" ? customSpace : watchedSketch;
  const activeSketchName = sketchName.trim() || customSpace.name || dictionary.viewer.draftSketch;
  const existingSavedSketch = useMemo(
    () => savedSketches.find((sketch) => sketch.id === activeSketchId || sketch.id === customSpace.id) || null,
    [activeSketchId, customSpace.id, savedSketches]
  );
  const saveSketchLabel = existingSavedSketch ? dictionary.viewer.updateSketch : dictionary.viewer.saveSketch;

  function startNewSketch() {
    const nextScene = createBlankSpaceScene();
    setActiveSketchId("draft");
    setCustomSpace(nextScene);
    setSelectedTarget(null);
    setSketchName("");
  }

  function clearDraftSketch() {
    setCustomSpace((current) => ({
      ...current,
      stars: [],
      planets: [],
      constellations: current.constellations.map((constellation) => ({ ...constellation, starIds: [] }))
    }));
    setSelectedTarget(null);
  }

  function saveDraftSketch() {
    if (customSpace.stars.length === 0 && customSpace.planets.length === 0) {
      return;
    }
    const existingSketch = savedSketches.find((sketch) => sketch.id === activeSketchId || sketch.id === customSpace.id) || null;
    const name = sketchName.trim() || existingSketch?.name || `${dictionary.viewer.savedSketch} ${savedSketches.length + 1}`;
    const sketchId = existingSketch?.id || (customSpace.id.startsWith("space-") ? customSpace.id : `space-${Date.now()}`);
    const nextSketch = { ...customSpace, id: sketchId, name, favorite: existingSketch?.favorite || false };
    setSavedSketches((current) => [nextSketch, ...current.filter((sketch) => sketch.id !== sketchId)]);
    setActiveSketchId(sketchId);
    setCustomSpace((current) => ({ ...current, id: sketchId, name }));
    setSketchName("");
  }

  function saveSketchAsNew() {
    if (customSpace.stars.length === 0 && customSpace.planets.length === 0) {
      return;
    }
    const name = sketchName.trim() || `${dictionary.viewer.savedSketch} ${savedSketches.length + 1}`;
    const sketchId = `space-${Date.now()}`;
    const nextSketch = { ...customSpace, id: sketchId, name, favorite: false };
    setSavedSketches((current) => [nextSketch, ...current]);
    setActiveSketchId(sketchId);
    setCustomSpace((current) => ({ ...current, id: sketchId, name }));
    setSketchName("");
  }

  function loadSketch(sketchId) {
    const sketch = savedSketches.find((item) => item.id === sketchId);
    if (!sketch) {
      return;
    }
    setCustomSpace(sketch);
    setActiveSketchId(sketch.id);
    setSketchName(sketch.name);
    setSelectedTarget(null);
  }

  function previewSketchInWatch(sketchId) {
    const sketch = savedSketches.find((item) => item.id === sketchId);
    if (!sketch) {
      return;
    }
    setWatchSketchId(sketch.id);
    setCurrentPage("watch");
    setSelectedTarget(null);
    setViewMode("space");
    setFocusedConstellation("all");
    setTrackConstellation(false);
  }

  function exitSketchWatch() {
    setWatchSketchId(null);
    setSelectedTarget(null);
  }

  function removeSketch(sketchId) {
    setSavedSketches((current) => current.filter((sketch) => sketch.id !== sketchId));
    if (activeSketchId === sketchId) {
      setActiveSketchId("draft");
    }
    if (watchSketchId === sketchId) {
      setWatchSketchId(null);
    }
  }

  function toggleSketchFavorite(sketchId) {
    setSavedSketches((current) => current.map((sketch) => (sketch.id === sketchId ? { ...sketch, favorite: !sketch.favorite } : sketch)));
  }

  function renameSketch(sketchId) {
    const target = savedSketches.find((sketch) => sketch.id === sketchId);
    if (!target) {
      return;
    }
    const nextName = window.prompt(dictionary.viewer.renameSketchPrompt, target.name);
    if (nextName === null) {
      return;
    }
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === target.name) {
      return;
    }
    setSavedSketches((current) => current.map((sketch) => (sketch.id === sketchId ? { ...sketch, name: trimmed } : sketch)));
    if (activeSketchId === sketchId) {
      setCustomSpace((current) => ({ ...current, name: trimmed }));
      setSketchName(trimmed);
    }
  }

  function addCustomConstellation() {
    const nextId = `constellation-${Date.now()}`;
    setCustomSpace((current) => ({
      ...current,
      activeConstellationId: nextId,
      constellations: [
        ...current.constellations,
        {
          id: nextId,
          name: `${dictionary.viewer.customConstellation} ${current.constellations.length + 1}`,
          color: ["#ffcf70", "#7fdbc9", "#a7c7ff", "#f095b8"][current.constellations.length % 4],
          starIds: [],
          segments: []
        }
      ]
    }));
  }

  function transformActiveConstellation(transformer) {
    const constellationId = customSpace.activeConstellationId || customSpace.constellations[0]?.id;
    if (!constellationId) {
      return;
    }
    setCustomSpace((current) => ({
      ...current,
      stars: current.stars.map((star) => (star.constellationId === constellationId ? transformer(star) : star))
    }));
  }

  function nudgeActiveConstellation(deltaX, deltaY) {
    transformActiveConstellation((star) => ({ ...star, x: clampCoordinate(star.x + deltaX), y: clampCoordinate(star.y + deltaY) }));
  }

  function scaleActiveConstellation(scaleDelta) {
    if (!activeConstellationCenter) {
      return;
    }
    transformActiveConstellation((star) => ({
      ...star,
      x: clampCoordinate(activeConstellationCenter.x + (star.x - activeConstellationCenter.x) * scaleDelta),
      y: clampCoordinate(activeConstellationCenter.y + (star.y - activeConstellationCenter.y) * scaleDelta),
      z: clampCoordinate(activeConstellationCenter.z + (star.z - activeConstellationCenter.z) * scaleDelta, -16, 4)
    }));
  }

  function spreadActiveConstellation(spreadDelta) {
    if (!activeConstellationCenter) {
      return;
    }
    transformActiveConstellation((star) => ({
      ...star,
      x: clampCoordinate(activeConstellationCenter.x + (star.x - activeConstellationCenter.x) * spreadDelta),
      y: clampCoordinate(activeConstellationCenter.y + (star.y - activeConstellationCenter.y) * spreadDelta)
    }));
  }

  function rotateActiveConstellation(angleDegrees) {
    if (!activeConstellationCenter) {
      return;
    }
    const angle = (angleDegrees * Math.PI) / 180;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    transformActiveConstellation((star) => {
      const offsetX = star.x - activeConstellationCenter.x;
      const offsetY = star.y - activeConstellationCenter.y;
      return {
        ...star,
        x: clampCoordinate(activeConstellationCenter.x + offsetX * cosine - offsetY * sine),
        y: clampCoordinate(activeConstellationCenter.y + offsetX * sine + offsetY * cosine)
      };
    });
  }

  function duplicateActiveConstellation() {
    const sourceConstellation = activeCustomConstellation;
    if (!sourceConstellation || activeCustomConstellationStars.length < 2) {
      return;
    }
    const nextConstellationId = `constellation-${Date.now()}`;
    const starIdMap = new Map();
    const duplicateStars = activeCustomConstellationStars.map((star, index) => {
      const nextStarId = `star-${Date.now()}-${index}`;
      starIdMap.set(star.id, nextStarId);
      return {
        ...star,
        id: nextStarId,
        name: `${star.name}`,
        x: clampCoordinate(star.x + 1.4),
        y: clampCoordinate(star.y - 0.9),
        constellationId: nextConstellationId
      };
    });
    const duplicateSegments = (sourceConstellation.segments || [])
      .map((segment) => [starIdMap.get(segment[0]), starIdMap.get(segment[1])])
      .filter((segment) => segment[0] && segment[1]);

    setCustomSpace((current) => ({
      ...current,
      activeConstellationId: nextConstellationId,
      stars: [...current.stars, ...duplicateStars],
      constellations: [
        ...current.constellations,
        {
          ...sourceConstellation,
          id: nextConstellationId,
          name: language === "ko" ? `${sourceConstellation.name} 복사본` : `${sourceConstellation.name} Copy`,
          color: sourceConstellation.color,
          starIds: duplicateStars.map((star) => star.id),
          segments: duplicateSegments
        }
      ]
    }));
    setSelectedTarget({ kind: "custom-star", id: duplicateStars[0].id });
  }

  function importPresetConstellation() {
    if (!presetConstellationName || !sceneData) {
      return;
    }
    const sourceStars = sceneData.stars
      .filter((star) => star.constellation === presetConstellationName && star.visible)
      .sort((left, right) => left.magnitude - right.magnitude);
    if (sourceStars.length < 2) {
      return;
    }
    const constellationId = `constellation-${Date.now()}`;
    const offsetX = customSpace.constellations.length * 1.2;
    const idMap = new Map();
    const importedStars = sourceStars.map((star, index) => {
      const starId = `star-${Date.now()}-${index}`;
      idMap.set(star.id, starId);
      return {
        id: starId,
        name: star.name,
        x: Number((star.x + offsetX).toFixed(3)),
        y: Number(star.y.toFixed(3)),
        z: Number(star.z.toFixed(3)),
        size: Number(Math.max(0.95, Math.min(2.2, star.size * 3.4)).toFixed(2)),
        color: star.color,
        constellationId
      };
    });
    const importedSegments = sceneData.lines
      .filter((line) => idMap.has(line.from) && idMap.has(line.to))
      .map((line) => [idMap.get(line.from), idMap.get(line.to)]);
    setCustomSpace((current) => ({
      ...current,
      activeConstellationId: constellationId,
      stars: [...current.stars, ...importedStars],
      constellations: [
        ...current.constellations,
        {
          id: constellationId,
          name: dictionary.constellations?.[presetConstellationName]?.[language] || presetConstellationName,
          color: "#ffcf70",
          starIds: importedStars.map((star) => star.id),
          segments: importedSegments
        }
      ]
    }));
    setSelectedTarget({ kind: "custom-star", id: importedStars[0].id });
  }

  function updateActiveConstellationName(name) {
    setCustomSpace((current) => ({
      ...current,
      constellations: current.constellations.map((constellation) =>
        constellation.id === current.activeConstellationId ? { ...constellation, name } : constellation
      )
    }));
  }

  function updateActiveConstellationColor(color) {
    setCustomSpace((current) => ({
      ...current,
      constellations: current.constellations.map((constellation) =>
        constellation.id === current.activeConstellationId ? { ...constellation, color } : constellation
      )
    }));
  }

  function removeActiveConstellation() {
    const constellationId = customSpace.activeConstellationId || customSpace.constellations[0]?.id;
    if (!constellationId || customSpace.constellations.length <= 1) {
      return;
    }
    setCustomSpace((current) => {
      const nextConstellations = current.constellations.filter((constellation) => constellation.id !== constellationId);
      return {
        ...current,
        activeConstellationId: nextConstellations[0]?.id || "",
        stars: current.stars.filter((star) => star.constellationId !== constellationId),
        constellations: nextConstellations
      };
    });
    setSelectedTarget(null);
  }

  function addCustomObject(point) {
    if (currentPage !== "sketch") {
      return;
    }
    if (creativeTool === "star") {
      const starId = `star-${Date.now()}`;
      const constellationId = customSpace.activeConstellationId || customSpace.constellations[0]?.id;
      const star = {
        id: starId,
        name: `${dictionary.viewer.customStar} ${customSpace.stars.length + 1}`,
        x: Number(point.x.toFixed(3)),
        y: Number(point.y.toFixed(3)),
        z: Number(point.z.toFixed(3)),
        size: 1.25 + (customSpace.stars.length % 4) * 0.22,
        color: ["#fff3c8", "#dbe8ff", "#ffe0b5", "#bfefff"][customSpace.stars.length % 4],
        constellationId
      };
      setCustomSpace((current) => ({
        ...current,
        stars: [...current.stars, star],
        constellations: current.constellations.map((constellation) =>
          constellation.id === constellationId ? { ...constellation, starIds: [...constellation.starIds, starId] } : constellation
        )
      }));
      setSelectedTarget({ kind: "custom-star", id: starId });
      return;
    }
    if (creativeTool === "planet") {
      const preset = planetPresets.find((item) => item.id === planetPreset) || planetPresets[0];
      const planetId = `planet-${Date.now()}`;
      const planet = {
        id: planetId,
        name: `${dictionary.viewer.customPlanet} ${customSpace.planets.length + 1}`,
        x: Number(point.x.toFixed(3)),
        y: Number(point.y.toFixed(3)),
        z: Number(point.z.toFixed(3)),
        size: 1.6 + (customSpace.planets.length % 3) * 0.34,
        color: preset.color,
        ring: preset.ring
      };
      setCustomSpace((current) => ({ ...current, planets: [...current.planets, planet] }));
      setSelectedTarget({ kind: "custom-planet", id: planetId });
    }
  }

  function removeCustomObject(target) {
    setCustomSpace((current) => {
      if (target.kind === "custom-star") {
        return {
          ...current,
          stars: current.stars.filter((star) => star.id !== target.id),
          constellations: current.constellations.map((constellation) => ({
            ...constellation,
            starIds: constellation.starIds.filter((starId) => starId !== target.id),
            segments: (constellation.segments || []).filter((segment) => !segment.includes(target.id))
          }))
        };
      }
      if (target.kind === "custom-planet") {
        return {
          ...current,
          planets: current.planets.filter((planet) => planet.id !== target.id)
        };
      }
      return current;
    });
    setSelectedTarget(null);
  }

  function updateCustomObject(target, patch) {
    if (!target?.kind || currentPage !== "sketch") {
      return;
    }
    setCustomSpace((current) => {
      if (target.kind === "custom-constellation") {
        const origin = Array.isArray(patch.dragOrigin) ? new Map(patch.dragOrigin.map((star) => [star.id, star])) : null;
        if (!origin) {
          return current;
        }
        return {
          ...current,
          stars: current.stars.map((star) => {
            if (star.constellationId !== target.id) {
              return star;
            }
            const baseline = origin.get(star.id);
            if (!baseline) {
              return star;
            }
            return {
              ...star,
              x: clampCoordinate(baseline.x + patch.deltaX),
              y: clampCoordinate(baseline.y + patch.deltaY),
              z: baseline.z
            };
          })
        };
      }
      if (target.kind === "custom-star") {
        return { ...current, stars: current.stars.map((star) => (star.id === target.id ? { ...star, ...patch } : star)) };
      }
      if (target.kind === "custom-planet") {
        return { ...current, planets: current.planets.map((planet) => (planet.id === target.id ? { ...planet, ...patch } : planet)) };
      }
      return current;
    });
  }

  return {
    creativeTool,
    setCreativeTool,
    planetPreset,
    setPlanetPreset,
    presetConstellationName,
    setPresetConstellationName,
    sketchName,
    setSketchName,
    activeSketchId,
    watchSketchId,
    customSpace,
    setCustomSpace,
    activeCustomConstellation,
    activeCustomConstellationStars,
    activeConstellationCenter,
    watchedSketch,
    isSketchWatch,
    watchedSketchSummary,
    activeCreativeScene,
    activeSketchName,
    saveSketchLabel,
    startNewSketch,
    clearDraftSketch,
    saveDraftSketch,
    saveSketchAsNew,
    loadSketch,
    previewSketchInWatch,
    exitSketchWatch,
    removeSketch,
    toggleSketchFavorite,
    renameSketch,
    addCustomConstellation,
    nudgeActiveConstellation,
    scaleActiveConstellation,
    spreadActiveConstellation,
    rotateActiveConstellation,
    duplicateActiveConstellation,
    importPresetConstellation,
    updateActiveConstellationName,
    updateActiveConstellationColor,
    removeActiveConstellation,
    addCustomObject,
    removeCustomObject,
    updateCustomObject
  };
}
