import { useEffect, useMemo, useRef, useState } from "react";
import { getSkyScene } from "./api/backend.js";
import { PlanetariumCanvas } from "./components/PlanetariumCanvas.jsx";
import { SelectionInspectorPanel } from "./components/SelectionInspectorPanel.jsx";
import { SketchControlsPanel, SketchLibraryPanel } from "./components/SketchPanel.jsx";
import { ViewerHeader } from "./components/ViewerLayout.jsx";
import { ViewerAmbientOverlay, ViewerFocusOverlay } from "./components/ViewerOverlays.jsx";
import { WatchControlsPanel, WatchInspectorPanel } from "./components/WatchPanels.jsx";
import { config } from "./config.js";
import { getInitialLanguage, translations } from "./data/i18n.js";
import { useAmbientAudio } from "./hooks/useAmbientAudio.js";
import { useConstellationCollections } from "./hooks/useConstellationCollections.js";
import { useFavoriteConstellations } from "./hooks/useFavoriteConstellations.js";
import { useNightSkyAmbientTrack } from "./hooks/useNightSkyAmbientTrack.js";
import { useSavedSketches } from "./hooks/useSavedSketches.js";

const planetPresets = [
  { id: "amber", color: "#f3b46c", ring: false },
  { id: "blue", color: "#7db7ff", ring: false },
  { id: "rose", color: "#f095b8", ring: false },
  { id: "saturn", color: "#d6bd8a", ring: true }
];

const defaultObserver = {
  latitude: 37.5665,
  longitude: 126.978,
  label: "Seoul"
};

function getInitialObservedAt() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function shiftObservedTimestamp(value, hours) {
  const date = new Date(value);
  date.setHours(date.getHours() + hours);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function setTonightTimestamp(value) {
  const date = new Date(value);
  date.setHours(21, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function setObserverHourTimestamp(value, hours, minutes = 0) {
  const date = new Date(value);
  date.setHours(hours, minutes, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function createBlankSpaceScene(name = "") {
  const constellationId = `constellation-${Date.now()}`;
  return {
    id: `space-${Date.now()}`,
    name,
    activeConstellationId: constellationId,
    stars: [],
    planets: [],
    constellations: [
      {
        id: constellationId,
        name: "My Constellation",
        color: "#ffcf70",
        starIds: [],
        segments: []
      }
    ]
  };
}

function clampCoordinate(value, min = -18, max = 18) {
  return Number(Math.min(max, Math.max(min, value)).toFixed(3));
}

const VIEW_MODE_ORDER = [
  "space",
  "observer",
  // "panorama", // Kept in code for possible return, but hidden from the current UI.
  "projection"
];

export function App() {
  const viewerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState("watch");
  const [language, setLanguage] = useState(getInitialLanguage);
  const [observer, setObserver] = useState(defaultObserver);
  const [observedAt, setObservedAt] = useState(getInitialObservedAt);
  const [limitingMagnitude, setLimitingMagnitude] = useState(5.2);
  const [maxStars, setMaxStars] = useState(3600);
  const [sceneState, setSceneState] = useState({ status: "loading", data: null, error: "" });
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showLabels, setShowLabels] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [showConstellations, setShowConstellations] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [atmosphereStrength, setAtmosphereStrength] = useState(0.7);
  const [starGlowStrength, setStarGlowStrength] = useState(0.8);
  const [viewMode, setViewMode] = useState("space");
  const [zoomLevel, setZoomLevel] = useState(0.52);
  const [focusedConstellation, setFocusedConstellation] = useState("all");
  const [constellationSearch, setConstellationSearch] = useState("");
  const [trackConstellation, setTrackConstellation] = useState(false);
  const [creativeTool, setCreativeTool] = useState("star");
  const [planetPreset, setPlanetPreset] = useState(planetPresets[0].id);
  const [presetConstellationName, setPresetConstellationName] = useState("");
  const [sketchName, setSketchName] = useState("");
  const [activeSketchId, setActiveSketchId] = useState("draft");
  const [watchSketchId, setWatchSketchId] = useState(null);
  const [customSpace, setCustomSpace] = useState(() => createBlankSpaceScene());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { savedSketches, setSavedSketches, sortedSavedSketches } = useSavedSketches();
  const { favoriteConstellations, setFavoriteConstellations } = useFavoriteConstellations();
  const { ambientTrackUrl, ambientTrackPending, ambientTrackError } = useNightSkyAmbientTrack(config.ambientTrackUrl);
  const { ambientEnabled, ambientVolume, setAmbientVolume, ambientStatus, toggleAmbientSound, wakeAmbient } = useAmbientAudio({
    trackUrl: ambientTrackUrl,
    isReady: sceneState.status === "ready"
  });
  const dictionary = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("planetarium-language", language);
  }, [language]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadScene() {
      setSceneState((current) => ({ ...current, status: "loading", error: "" }));

      try {
        const data = await getSkyScene({
          latitude: observer.latitude,
          longitude: observer.longitude,
          observedAt: new Date(observedAt).toISOString(),
          limitingMagnitude,
          maxStars
        });

        if (cancelled) {
          return;
        }

        setSceneState({ status: "ready", data, error: "" });
        setSelectedTarget((current) => current || { kind: "star", id: data.stars.find((star) => star.visible)?.id || data.stars[0]?.id || null });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSceneState({ status: "error", data: null, error: error.message || "Failed to load the scene." });
      }
    }

    loadScene();

    return () => {
      cancelled = true;
    };
  }, [observer.latitude, observer.longitude, observedAt, limitingMagnitude, maxStars]);

  const selectedStar = useMemo(
    () => (selectedTarget?.kind === "star" ? sceneState.data?.stars.find((star) => star.id === selectedTarget.id) || null : null),
    [sceneState.data, selectedTarget]
  );
  const visibleConstellations = sceneState.data?.summary.visibleConstellations || [];
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
      (current, star) => ({
        x: current.x + star.x,
        y: current.y + star.y,
        z: current.z + star.z
      }),
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
  const selectedCustomStar = useMemo(
    () => (selectedTarget?.kind === "custom-star" ? activeCreativeScene?.stars.find((star) => star.id === selectedTarget.id) || null : null),
    [activeCreativeScene, selectedTarget]
  );
  const selectedCustomPlanet = useMemo(
    () => (selectedTarget?.kind === "custom-planet" ? activeCreativeScene?.planets.find((planet) => planet.id === selectedTarget.id) || null : null),
    [activeCreativeScene, selectedTarget]
  );
  const selectedCustomConstellation = useMemo(
    () =>
      selectedTarget?.kind === "custom-constellation"
        ? activeCreativeScene?.constellations.find((constellation) => constellation.id === selectedTarget.id) || null
        : null,
    [activeCreativeScene, selectedTarget]
  );
  const activeSketchName = sketchName.trim() || customSpace.name || dictionary.viewer.draftSketch;
  const existingSavedSketch = useMemo(
    () => savedSketches.find((sketch) => sketch.id === activeSketchId || sketch.id === customSpace.id) || null,
    [activeSketchId, customSpace.id, savedSketches]
  );
  const saveSketchLabel = existingSavedSketch ? dictionary.viewer.updateSketch : dictionary.viewer.saveSketch;
  const { currentViewConstellations, currentViewConstellationDetails, importableConstellations, focusConstellations, filteredConstellations, visibleFavoriteConstellations } =
    useConstellationCollections({
      stars: sceneState.data?.stars || [],
      backendVisibleConstellations: visibleConstellations,
      constellationSearch,
      dictionary,
      language,
      favoriteConstellations,
      viewMode
    });
  const activeConstellationKey = useMemo(() => {
    if (focusedConstellation !== "all") {
      return focusedConstellation;
    }
    if (selectedStar?.constellation && selectedStar.constellation !== "Unknown") {
      return selectedStar.constellation;
    }
    return focusConstellations[0] || null;
  }, [focusConstellations, focusedConstellation, selectedStar]);
  const activeConstellationName = activeConstellationKey ? dictionary.constellations?.[activeConstellationKey]?.[language] || activeConstellationKey : null;
  const activeConstellationStory =
    (activeConstellationKey && dictionary.viewer.constellationMoods?.[activeConstellationKey]?.[language]) || dictionary.viewer.constellationFallback;
  const activeConstellationIsFavorite = Boolean(activeConstellationKey && favoriteConstellations.includes(activeConstellationKey));
  const activeConstellationStats = useMemo(() => {
    if (!activeConstellationKey || activeConstellationKey === "all" || !sceneState.data?.stars?.length) {
      return null;
    }

    const constellationStars = sceneState.data.stars
      .filter((star) => star.constellation === activeConstellationKey && star.visible)
      .sort((left, right) => left.magnitude - right.magnitude);

    if (!constellationStars.length) {
      return null;
    }

    return {
      visibleStars: constellationStars.length,
      brightestStar: constellationStars[0]?.name || null,
      brightestMagnitude: constellationStars[0]?.magnitude ?? null,
      brightestAltitude: constellationStars[0]?.altitude ?? null,
      brightestAzimuth: constellationStars[0]?.azimuth ?? null
    };
  }, [activeConstellationKey, sceneState.data]);
  const observerFocusSummary = useMemo(() => {
    if (viewMode !== "observer") {
      return null;
    }

    if (selectedStar?.visible) {
      return {
        name: selectedStar.name,
        altitude: selectedStar.altitude,
        azimuth: selectedStar.azimuth
      };
    }

    if (activeConstellationStats?.brightestStar) {
      return {
        name: activeConstellationStats.brightestStar,
        altitude: activeConstellationStats.brightestAltitude,
        azimuth: activeConstellationStats.brightestAzimuth
      };
    }

    return null;
  }, [activeConstellationStats, selectedStar, viewMode]);
  const sketchViewDescription = dictionary.viewer.viewModeDescriptions[viewMode];
  const ambientStatusLabel = ambientTrackPending
    ? dictionary.viewer.ambient.preparing
    : ambientTrackError
      ? dictionary.viewer.ambient.error
      : dictionary.viewer.ambient[ambientStatus] || dictionary.viewer.ambient.waiting;
  const ambientStatusHint = ambientTrackPending
    ? dictionary.viewer.ambient.preparingHint
    : ambientTrackError
      ? ambientTrackError
      : ambientStatus === "missing"
        ? dictionary.viewer.ambient.missingHint
        : ambientStatus === "error"
          ? dictionary.viewer.ambient.errorHint
          : dictionary.viewer.ambient.hint;
  const observerMomentLabel = useMemo(() => {
    const date = new Date(observedAt);
    if (Number.isNaN(date.getTime())) {
      return observedAt;
    }
    return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }, [language, observedAt]);

  useEffect(() => {
    if (!importableConstellations.length) {
      setPresetConstellationName("");
      return;
    }
    if (!presetConstellationName || !importableConstellations.includes(presetConstellationName)) {
      setPresetConstellationName(importableConstellations[0]);
    }
  }, [importableConstellations, presetConstellationName]);

  useEffect(() => {
    if (focusedConstellation === "all") {
      setTrackConstellation(false);
    }
  }, [focusedConstellation]);

  useEffect(() => {
    if (!trackConstellation || focusedConstellation === "all") {
      return;
    }
    setZoomLevel((current) => Number(Math.min(current, 0.44).toFixed(2)));
  }, [focusedConstellation, trackConstellation]);

  function updateObserver(key, value) {
    setObserver((current) => ({
      ...current,
      [key]: Number(value),
      label: language === "ko" ? "사용자 위치" : "Custom observer"
    }));
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      setObserver({
        latitude: Number(position.coords.latitude.toFixed(4)),
        longitude: Number(position.coords.longitude.toFixed(4)),
        label: language === "ko" ? "현재 위치" : "Live location"
      });
    });
  }

  function toggleFavoriteConstellation(name) {
    if (!name || name === "all") {
      return;
    }
    setFavoriteConstellations((current) => (current.includes(name) ? current.filter((item) => item !== name) : [name, ...current]));
  }

  function selectTarget(target) {
    if ((currentPage === "sketch" || isSketchWatch) && target?.kind?.startsWith("custom-")) {
      if (isSketchWatch) {
        setSelectedTarget(target);
        return;
      }
      if (creativeTool === "delete") {
        removeCustomObject(target);
        return;
      }
      setSelectedTarget(target);
      return;
    }

    if (currentPage === "watch" && viewMode === "space") {
      return;
    }

    setSelectedTarget(target);

    if (target?.kind === "star") {
      const star = sceneState.data?.stars.find((item) => item.id === target.id);
      if (star?.constellation) {
        setFocusedConstellation(star.constellation);
      }
    }
  }

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
    const sketchId =
      existingSketch?.id || (customSpace.id.startsWith("space-") ? customSpace.id : `space-${Date.now()}`);
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
    setSavedSketches((current) =>
      current.map((sketch) => (sketch.id === sketchId ? { ...sketch, favorite: !sketch.favorite } : sketch))
    );
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
    transformActiveConstellation((star) => ({
      ...star,
      x: clampCoordinate(star.x + deltaX),
      y: clampCoordinate(star.y + deltaY)
    }));
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
    if (!presetConstellationName || !sceneState.data) {
      return;
    }

    const sourceStars = sceneState.data.stars
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

    const importedSegments = sceneState.data.lines
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
    if (!target?.kind) {
      return;
    }

    if (currentPage !== "sketch") {
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
        return {
          ...current,
          stars: current.stars.map((star) => (star.id === target.id ? { ...star, ...patch } : star))
        };
      }

      if (target.kind === "custom-planet") {
        return {
          ...current,
          planets: current.planets.map((planet) => (planet.id === target.id ? { ...planet, ...patch } : planet))
        };
      }

      return current;
    });
  }

  async function toggleFullscreen() {
    if (!viewerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await viewerRef.current.requestFullscreen();
  }

  function shiftTime(hours) {
    setObservedAt((current) => shiftObservedTimestamp(current, hours));
  }

  function changeZoom(delta) {
    setZoomLevel((current) => Math.min(1, Math.max(0, Number((current + delta).toFixed(2)))));
  }

  return (
    <div className="planetarium-app">
      <ViewerHeader dictionary={dictionary} currentPage={currentPage} setCurrentPage={setCurrentPage} language={language} setLanguage={setLanguage} observer={observer} />

      <div className="workspace">
        <aside className="control-panel">
          {currentPage === "watch" ? (
            <WatchControlsPanel
              dictionary={dictionary}
              language={language}
              observedAt={observedAt}
              setObservedAt={setObservedAt}
              shiftTime={shiftTime}
              setTonightTimestamp={setTonightTimestamp}
              viewMode={viewMode}
              observerMomentLabel={observerMomentLabel}
              observerFocusSummary={observerFocusSummary}
              setObserverHourTimestamp={setObserverHourTimestamp}
              observer={observer}
              updateObserver={updateObserver}
              requestLocation={requestLocation}
              viewModeOrder={VIEW_MODE_ORDER}
              setViewMode={setViewMode}
              focusedConstellation={focusedConstellation}
              setFocusedConstellation={setFocusedConstellation}
              trackConstellation={trackConstellation}
              setTrackConstellation={setTrackConstellation}
              activeConstellationKey={activeConstellationKey}
              activeConstellationName={activeConstellationName}
              activeConstellationIsFavorite={activeConstellationIsFavorite}
              toggleFavoriteConstellation={toggleFavoriteConstellation}
              visibleFavoriteConstellations={visibleFavoriteConstellations}
              activeConstellationStory={activeConstellationStory}
              activeConstellationStats={activeConstellationStats}
              atmosphereStrength={atmosphereStrength}
              setAtmosphereStrength={setAtmosphereStrength}
              starGlowStrength={starGlowStrength}
              setStarGlowStrength={setStarGlowStrength}
              limitingMagnitude={limitingMagnitude}
              setLimitingMagnitude={setLimitingMagnitude}
              maxStars={maxStars}
              setMaxStars={setMaxStars}
              showConstellations={showConstellations}
              setShowConstellations={setShowConstellations}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              showGuides={showGuides}
              setShowGuides={setShowGuides}
              isSketchWatch={isSketchWatch}
              activeSketchWatchName={watchedSketch?.name || dictionary.viewer.savedSketch}
              watchedSketchSummary={watchedSketchSummary}
              exitSketchWatch={exitSketchWatch}
            />
          ) : (
            <>
              <section>
                <p className="eyebrow">{dictionary.viewer.sketchControls}</p>
                <SketchControlsPanel
                  dictionary={dictionary}
                  language={language}
                  viewMode={viewMode}
                  viewModeOrder={VIEW_MODE_ORDER}
                  setViewMode={setViewMode}
                  sketchViewDescription={sketchViewDescription}
                  creativeTool={creativeTool}
                  setCreativeTool={setCreativeTool}
                  addCustomConstellation={addCustomConstellation}
                  duplicateActiveConstellation={duplicateActiveConstellation}
                  activeCustomConstellationStars={activeCustomConstellationStars}
                  customSpace={customSpace}
                  setCustomSpace={setCustomSpace}
                  presetConstellationName={presetConstellationName}
                  setPresetConstellationName={setPresetConstellationName}
                  importableConstellations={importableConstellations}
                  importPresetConstellation={importPresetConstellation}
                  nudgeActiveConstellation={nudgeActiveConstellation}
                  scaleActiveConstellation={scaleActiveConstellation}
                  spreadActiveConstellation={spreadActiveConstellation}
                  rotateActiveConstellation={rotateActiveConstellation}
                  activeCustomConstellation={activeCustomConstellation}
                  updateActiveConstellationName={updateActiveConstellationName}
                  updateActiveConstellationColor={updateActiveConstellationColor}
                  removeActiveConstellation={removeActiveConstellation}
                  planetPreset={planetPreset}
                  setPlanetPreset={setPlanetPreset}
                  planetPresets={planetPresets}
                  sketchName={sketchName}
                  setSketchName={setSketchName}
                  activeSketchName={activeSketchName}
                  saveSketchLabel={saveSketchLabel}
                  startNewSketch={startNewSketch}
                  clearDraftSketch={clearDraftSketch}
                  saveDraftSketch={saveDraftSketch}
                  saveSketchAsNew={saveSketchAsNew}
                />
              </section>
              <section>
                <p className="eyebrow">{dictionary.viewer.atmosphere}</p>
                <p className="helper-copy">{dictionary.viewer.creationPickHint}</p>
                <div className="toggle-grid">
                  <label className="toggle-item">
                    <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
                    <span>{dictionary.viewer.toggles.labels}</span>
                  </label>
                  <label className="toggle-item">
                    <input type="checkbox" checked={autoRotate} onChange={(event) => setAutoRotate(event.target.checked)} />
                    <span>{dictionary.viewer.toggles.autoRotate}</span>
                  </label>
                  <label className="toggle-item">
                    <input type="checkbox" checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} />
                    <span>{dictionary.viewer.toggles.guides}</span>
                  </label>
                </div>
              </section>
            </>
          )}
        </aside>

        <main
          ref={viewerRef}
          className={`viewer ${isFullscreen ? "is-fullscreen" : ""}`}
          onClickCapture={wakeAmbient}
          onWheelCapture={wakeAmbient}
          onPointerDownCapture={wakeAmbient}
          onTouchStartCapture={wakeAmbient}
        >
          <PlanetariumCanvas
            scene={sceneState.data}
            selectedTarget={selectedTarget}
            onSelectTarget={selectTarget}
            language={language}
            dictionary={dictionary}
            showLabels={showLabels}
            showGuides={showGuides}
            showConstellations={showConstellations}
            autoRotate={autoRotate}
            atmosphereStrength={atmosphereStrength}
            starGlowStrength={starGlowStrength}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
            focusedConstellation={currentPage === "watch" && !isSketchWatch ? focusedConstellation : "all"}
            trackConstellation={currentPage === "watch" && !isSketchWatch ? trackConstellation : false}
            drawMode={currentPage === "sketch"}
            customSketchStarIds={[]}
            creativeMode={currentPage === "sketch" || isSketchWatch}
            customSpace={activeCreativeScene}
            creativeTool={currentPage === "sketch" ? creativeTool : "none"}
            onCreativeSpaceClick={currentPage === "sketch" ? addCustomObject : undefined}
            onUpdateCustomObject={currentPage === "sketch" ? updateCustomObject : undefined}
            editingEnabled={currentPage === "sketch"}
          />
          {currentPage === "watch" && !isSketchWatch ? (
            <ViewerFocusOverlay
              dictionary={dictionary}
              language={language}
              constellationSearch={constellationSearch}
              setConstellationSearch={setConstellationSearch}
              focusedConstellation={focusedConstellation}
              setFocusedConstellation={setFocusedConstellation}
              focusConstellations={focusConstellations}
              filteredConstellations={filteredConstellations}
              trackConstellation={trackConstellation}
              setTrackConstellation={setTrackConstellation}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              changeZoom={changeZoom}
            />
          ) : null}
          <ViewerAmbientOverlay
            dictionary={dictionary}
            ambientTrackPending={ambientTrackPending}
            ambientTrackError={ambientTrackError}
            ambientEnabled={ambientEnabled}
            ambientStatus={ambientStatus}
            ambientStatusLabel={ambientStatusLabel}
            ambientStatusHint={ambientStatusHint}
            ambientVolume={ambientVolume}
            setAmbientVolume={setAmbientVolume}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            toggleAmbientSound={toggleAmbientSound}
          />
        </main>

        <aside className="inspector-panel">
          <SelectionInspectorPanel
            dictionary={dictionary}
            language={language}
            currentPage={isSketchWatch ? "sketch" : currentPage}
            selectedCustomStar={selectedCustomStar}
            selectedCustomConstellation={selectedCustomConstellation}
            activeCustomConstellation={
              isSketchWatch
                ? activeCreativeScene?.constellations.find((constellation) => constellation.id === activeCreativeScene.activeConstellationId) ||
                  activeCreativeScene?.constellations?.[0] ||
                  null
                : activeCustomConstellation
            }
            updateCustomObject={updateCustomObject}
            selectedTarget={selectedTarget}
            customSpace={activeCreativeScene || customSpace}
            removeCustomObject={removeCustomObject}
            selectedCustomPlanet={selectedCustomPlanet}
            selectedStar={selectedStar}
          />

          {currentPage === "watch" ? (
            <WatchInspectorPanel
              dictionary={dictionary}
              language={language}
              selectedStar={selectedStar}
              currentViewConstellationDetails={isSketchWatch ? [] : currentViewConstellationDetails}
              focusedConstellation={focusedConstellation}
              setFocusedConstellation={setFocusedConstellation}
              focusConstellations={isSketchWatch ? [] : focusConstellations}
              sceneState={sceneState}
              viewMode={viewMode}
              isSketchWatch={isSketchWatch}
            />
          ) : (
            <SketchLibraryPanel
              dictionary={dictionary}
              savedSketches={savedSketches}
              sortedSavedSketches={sortedSavedSketches}
              activeSketchId={activeSketchId}
              loadSketch={loadSketch}
              previewSketchInWatch={previewSketchInWatch}
              renameSketch={renameSketch}
              toggleSketchFavorite={toggleSketchFavorite}
              removeSketch={removeSketch}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
