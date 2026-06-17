import { useEffect, useMemo, useRef, useState } from "react";
import { getSkyScene } from "./api/backend.js";
import { AuroraExperience } from "./components/experiences/AuroraExperience.jsx";
import { LagoonBelowExperience } from "./components/experiences/LagoonBelowExperience.jsx";
import { MonsoonCanopyExperience } from "./components/experiences/MonsoonCanopyExperience.jsx";
import { NightSkyExperience } from "./components/experiences/NightSkyExperience.jsx";
import { config } from "./config.js";
import { getInitialLanguage, translations } from "./data/i18n.js";
import { useAmbientAudio } from "./hooks/useAmbientAudio.js";
import { useConstellationCollections } from "./hooks/useConstellationCollections.js";
import { useFavoriteConstellations } from "./hooks/useFavoriteConstellations.js";
import { useNightSkyAmbientTrack } from "./hooks/useNightSkyAmbientTrack.js";
import { useAuroraExperience } from "./hooks/useAuroraExperience.js";
import { useNightSkyExperience } from "./hooks/useNightSkyExperience.js";
import { useSavedSketches } from "./hooks/useSavedSketches.js";
import { useSketchWorkspace } from "./hooks/useSketchWorkspace.js";
import { useWatchWorkspace } from "./hooks/useWatchWorkspace.js";
import { useTheme } from "./context/ThemeContext.jsx";
import {
  endAnalyticsSession,
  markAmbientOff,
  markAmbientUsed,
  markFullscreenEnter,
  markFullscreenExit,
  markSettingsOpen,
  markThemeSwitch,
  markThemeView,
  markViewerEnter,
  startAnalyticsSession
} from "./lib/analyticsStore.js";
import {
  defaultObserver,
  getInitialObservedAt,
  planetPresets,
  setObserverHourTimestamp,
  setTonightTimestamp
} from "./utils/viewerState.js";
import { getThemeHeaderCopy, getThemeViewModes } from "./utils/themePresentation.js";

export function App({ forcedLanguage, setForcedLanguage, showThemeSwitcher = true, auroraRenderer = "css" }) {
  const { currentTheme, currentThemeId, themes, switchTheme } = useTheme();
  const viewerRef = useRef(null);
  const analyticsSessionRef = useRef(null);
  const hasMarkedAmbientRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(() => (window.location.hash === "#sketch" ? "sketch" : "watch"));
  const [language, setLanguage] = useState(() => forcedLanguage || getInitialLanguage());
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
  const [resetViewToken, setResetViewToken] = useState(0);
  const [auroraIntensity, setAuroraIntensity] = useState(0.54);
  const [auroraSpeed, setAuroraSpeed] = useState(0.39);
  const [auroraWindProfile, setAuroraWindProfile] = useState("cold");
  const [rainIntensity, setRainIntensity] = useState(0.56);
  const [rainFlow, setRainFlow] = useState(0.42);
  const [rainPreset, setRainPreset] = useState("balanced");
  const [rainThunderEnabled, setRainThunderEnabled] = useState(true);
  const [showRainMoodControls, setShowRainMoodControls] = useState(false);
  const [lagoonClarity, setLagoonClarity] = useState(0.68);
  const [lagoonDrift, setLagoonDrift] = useState(0.44);
  const [lagoonPreset, setLagoonPreset] = useState("balanced");
  const [showLagoonMoodControls, setShowLagoonMoodControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsHiddenInFullscreen, setControlsHiddenInFullscreen] = useState(false);
  const { savedSketches, setSavedSketches, sortedSavedSketches } = useSavedSketches();
  const { favoriteConstellations, setFavoriteConstellations } = useFavoriteConstellations();
  const auroraAmbientTrackMap = {
    default: "/audio/aurora-wind-loop.wav",
    rough: "/audio/aurora-wind-rough.wav",
    distant: "/audio/aurora-wind-distant.wav",
    cold: "/audio/aurora-wind-cold.wav"
  };
  const configuredAmbientTrackUrl =
    currentThemeId === "aurora-night"
      ? config.auroraAmbientTrackUrl || config.ambientTrackUrl || auroraAmbientTrackMap[auroraWindProfile] || auroraAmbientTrackMap.cold
      : currentThemeId === "monsoon-canopy" || currentThemeId === "rain-window"
        ? config.rainAmbientTrackUrl || "/audio/monsoon-canopy-rain-loop.wav"
        : currentThemeId === "lagoon-below"
          ? config.lagoonAmbientTrackUrl || ""
        : config.ambientTrackUrl;
  const { ambientTrackUrl, ambientTrackPending, ambientTrackError } = useNightSkyAmbientTrack({
    configuredTrackUrl: configuredAmbientTrackUrl,
    themeId: currentThemeId
  });
  const ambientOutputGain = currentThemeId === "aurora-night" ? 1.62 : currentThemeId === "lagoon-below" ? 1.08 : 1.18;
  const { ambientEnabled, ambientVolume, setAmbientVolume, ambientStatus, toggleAmbientSound, wakeAmbient, ensureAmbientOn } = useAmbientAudio({
    trackUrl: ambientTrackUrl,
    isReady: sceneState.status === "ready",
    outputGain: ambientOutputGain
  });
  const dictionary = translations[language];
  const updateLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (setForcedLanguage) {
      setForcedLanguage(nextLanguage);
    }
  };
  const sketchWorkspace = useSketchWorkspace({
    dictionary,
    language,
    savedSketches,
    setSavedSketches,
    sceneData: sceneState.data,
    currentPage,
    setCurrentPage,
    setViewMode,
    setFocusedConstellation,
    setTrackConstellation,
    setSelectedTarget
  });
  const {
    creativeTool,
    setCreativeTool,
    planetPreset,
    setPlanetPreset,
    presetConstellationName,
    setPresetConstellationName,
    sketchName,
    setSketchName,
    activeSketchId,
    customSpace,
    setCustomSpace,
    activeCustomConstellation,
    activeCustomConstellationStars,
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
  } = sketchWorkspace;
  const watchWorkspace = useWatchWorkspace({
    language,
    currentPage,
    isSketchWatch,
    viewMode,
    creativeTool,
    sceneData: sceneState.data,
    setObservedAt,
    setObserver,
    setFavoriteConstellations,
    setSelectedTarget,
    setFocusedConstellation,
    removeCustomObject,
    setZoomLevel,
    setConstellationSearch,
    setTrackConstellation,
    setResetViewToken
  });
  const { updateObserver, requestLocation, toggleFavoriteConstellation, selectTarget, shiftTime, changeZoom, resetView } = watchWorkspace;
  const sketchEnabled = currentTheme?.features?.sketching !== false;
  const auroraEnabled = currentThemeId === "aurora-night";
  const rainEnabled = currentThemeId === "monsoon-canopy" || currentThemeId === "rain-window";
  const lagoonEnabled = currentThemeId === "lagoon-below";
  const immersiveThemeEnabled = auroraEnabled || rainEnabled || lagoonEnabled;
  const auroraWatchLayout = auroraEnabled && currentPage === "watch";
  const rainWatchLayout = rainEnabled && currentPage === "watch";
  const lagoonWatchLayout = lagoonEnabled && currentPage === "watch";
  const effectiveSketchEnabled = immersiveThemeEnabled ? false : sketchEnabled;
  const { eyebrow: headerEyebrow, title: headerTitle, subtitle: headerSubtitle } = useMemo(
    () => getThemeHeaderCopy({ currentThemeId, language, dictionary }),
    [currentThemeId, dictionary, language]
  );
  const themeViewModes = useMemo(() => getThemeViewModes(currentTheme), [currentTheme]);
  const autoEnterTargetRef = useRef(null);
  const effectiveAtmosphereStrength = atmosphereStrength;
  const effectiveStarGlowStrength = starGlowStrength;
  const effectiveLimitingMagnitude = limitingMagnitude;
  const effectiveMaxStars = maxStars;
  const {
    showAuroraMoodControls,
    setShowAuroraMoodControls,
    auroraViewerOpen,
    immersiveIntro,
    auroraViewerRef,
    auroraUiVisible,
    revealAuroraUi,
    startAuroraViewer,
    toggleAuroraFullscreen,
    closeAuroraViewer,
    shouldShowAuroraPageChrome
  } = useAuroraExperience({
    auroraWatchLayout,
    autoEnterTargetRef,
    currentPage,
    language,
    markFullscreenEnter,
    markViewerEnter,
    analyticsSessionRef,
    currentThemeId,
    wakeAmbient,
    ensureAmbientOn,
    isFullscreen,
    setIsFullscreen,
    markFullscreenExit,
    setViewMode
  });
  const { timeShiftCue, observerMomentLabel, timeShiftOverlayLabel, viewerUiVisible, revealViewerUi, toggleFullscreen, handleThemeSwitch } = useNightSkyExperience({
    observedAt,
    language,
    currentPage,
    auroraWatchLayout,
    viewMode,
    resetView,
    changeZoom,
    isFullscreen,
    setControlsHiddenInFullscreen,
    viewerRef,
    markViewerEnter,
    markFullscreenEnter,
    analyticsSessionRef,
    currentThemeId,
    markThemeSwitch,
    switchTheme
  });

  useEffect(() => {
    try {
      const target = window.sessionStorage.getItem("zeravue:auto-enter-target");
      const enteredAt = Number(window.sessionStorage.getItem("zeravue:auto-enter-at") || "0");
      window.sessionStorage.removeItem("zeravue:auto-enter-target");
      window.sessionStorage.removeItem("zeravue:auto-enter-at");
      if (!target || !enteredAt) {
        return;
      }
      const ageMs = Date.now() - enteredAt;
      if (ageMs > 30_000) {
        return;
      }
      const currentPath = window.location.pathname?.replace(/\/+$/, "") || "/";
      const normalizedTarget = target.replace(/\/+$/, "") || "/";
      if (currentPath === normalizedTarget) {
        autoEnterTargetRef.current = normalizedTarget;
      }
    } catch (error) {
      console.warn("Failed to read auto-enter flag:", error);
    }
  }, []);

  useEffect(() => {
    if (forcedLanguage && forcedLanguage !== language) {
      setLanguage(forcedLanguage);
    }
  }, [forcedLanguage]);

  useEffect(() => {
    const state = window.history.state || {};
    if (!state.zeravueThemeSentinel) {
      window.history.pushState({ ...state, zeravueThemeSentinel: true }, "", window.location.href);
    }

    function handlePopState() {
      window.location.assign("/");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const routePath = window.location.pathname || "/";
    let cancelled = false;
    startAnalyticsSession({
      themeId: currentThemeId,
      routePath
    }).then((session) => {
      if (cancelled) {
        return;
      }
      analyticsSessionRef.current = session;
      markThemeView(session, currentThemeId, routePath);
    });
    return () => {
      cancelled = true;
      endAnalyticsSession(analyticsSessionRef.current);
      analyticsSessionRef.current = null;
      hasMarkedAmbientRef.current = false;
    };
  }, [currentThemeId]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("planetarium-language", language);
  }, [language]);

  useEffect(() => {
    if (!ambientEnabled || hasMarkedAmbientRef.current) {
      return;
    }
    markAmbientUsed(analyticsSessionRef.current);
    hasMarkedAmbientRef.current = true;
  }, [ambientEnabled]);

  useEffect(() => {
    if (!ambientEnabled && hasMarkedAmbientRef.current) {
      markAmbientOff(analyticsSessionRef.current);
    }
  }, [ambientEnabled]);

  useEffect(() => {
    function handleVisibilityOrHide() {
      if (document.visibilityState === "hidden") {
        endAnalyticsSession(analyticsSessionRef.current);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityOrHide);
    window.addEventListener("pagehide", handleVisibilityOrHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrHide);
      window.removeEventListener("pagehide", handleVisibilityOrHide);
    };
  }, []);

  useEffect(() => {
    if (!effectiveSketchEnabled && currentPage === "sketch") {
      setCurrentPage("watch");
    }
  }, [currentPage, effectiveSketchEnabled]);

  useEffect(() => {
    if (immersiveThemeEnabled) {
      if (window.location.hash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }
      return;
    }

    const nextHash = currentPage === "sketch" ? "#sketch" : "";
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [currentPage, immersiveThemeEnabled]);

  useEffect(() => {
    function handleHashChange() {
      const wantsSketch = window.location.hash === "#sketch";
      setCurrentPage(wantsSketch && effectiveSketchEnabled ? "sketch" : "watch");
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [effectiveSketchEnabled]);

  useEffect(() => {
    if (!immersiveThemeEnabled) {
      return;
    }
    setCurrentPage("watch");
    setViewMode("space");
    setShowConstellations(false);
    setShowLabels(false);
    setFocusedConstellation("all");
    setTrackConstellation(false);
  }, [immersiveThemeEnabled]);

  useEffect(() => {
    if (!rainWatchLayout) {
      return;
    }
    ensureAmbientOn();
  }, [ensureAmbientOn, rainWatchLayout]);

  useEffect(() => {
    if (!auroraWatchLayout) {
      return;
    }
    ensureAmbientOn();
  }, [auroraWatchLayout, ensureAmbientOn]);

  useEffect(() => {
    if (!lagoonWatchLayout) {
      return;
    }
    ensureAmbientOn();
  }, [ensureAmbientOn, lagoonWatchLayout]);

  useEffect(() => {
    const defaultViewMode = currentTheme?.defaultViewMode;
    setViewMode((current) => {
      if (themeViewModes.includes(current)) {
        return current;
      }
      if (defaultViewMode && themeViewModes.includes(defaultViewMode)) {
        return defaultViewMode;
      }
      return themeViewModes[0] || "space";
    });
    setFocusedConstellation("all");
    setTrackConstellation(false);
    setSelectedTarget(null);
  }, [currentTheme?.id, themeViewModes]);

  useEffect(() => {
    let cancelled = false;

    async function loadScene() {
      if (immersiveThemeEnabled) {
        setSceneState({ status: "ready", data: null, error: "" });
        return;
      }
      setSceneState((current) => ({ ...current, status: "loading", error: "" }));

      try {
        const data = await getSkyScene({
          latitude: observer.latitude,
          longitude: observer.longitude,
          observedAt: new Date(observedAt).toISOString(),
          limitingMagnitude: effectiveLimitingMagnitude,
          maxStars: effectiveMaxStars
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
  }, [observer.latitude, observer.longitude, observedAt, effectiveLimitingMagnitude, effectiveMaxStars, immersiveThemeEnabled]);

  const selectedStar = useMemo(
    () => (selectedTarget?.kind === "star" ? sceneState.data?.stars.find((star) => star.id === selectedTarget.id) || null : null),
    [sceneState.data, selectedTarget]
  );
  const selectedSolarBody = useMemo(() => (selectedTarget?.kind === "solar-body" ? selectedTarget : null), [selectedTarget]);
  const visibleConstellations = sceneState.data?.summary.visibleConstellations || [];
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
  const constellationStoryStateLines = useMemo(() => {
    if (!activeConstellationKey || activeConstellationKey === "all") {
      return [];
    }

    const lines = [];
    if (activeConstellationStats?.visibleStars) {
      lines.push(
        language === "ko"
          ? `현재 ${activeConstellationStats.visibleStars}개의 별이 비교적 선명하게 보입니다.`
          : `${activeConstellationStats.visibleStars} stars are currently standing out clearly.`
      );
    }

    if (viewMode === "observer" && observerFocusSummary?.altitude != null) {
      const altitudeValue = Number(observerFocusSummary.altitude);
      const altitudeBand =
        altitudeValue >= 60
          ? language === "ko"
            ? "머리 위 높은 하늘"
            : "high overhead sky"
          : altitudeValue >= 35
            ? language === "ko"
              ? "중간 고도 하늘"
              : "mid-altitude sky"
            : language === "ko"
              ? "지평선 근처 하늘"
              : "near the horizon";
      lines.push(
        language === "ko"
          ? `지금은 ${altitudeBand}에서 감상하기 좋은 흐름입니다.`
          : `Right now it reads best in the ${altitudeBand}.`
      );
    }

    if (activeConstellationStats?.brightestStar) {
      lines.push(
        language === "ko"
          ? `밝은 기준점은 ${activeConstellationStats.brightestStar}입니다.`
          : `Your brightest anchor star is ${activeConstellationStats.brightestStar}.`
      );
    }

    return lines.slice(0, 2);
  }, [activeConstellationKey, activeConstellationStats, language, observerFocusSummary, viewMode]);
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

  const applyNightSkyPreset = (preset) => {
    if (preset === "calm") {
      setAtmosphereStrength(0.9);
      setStarGlowStrength(0.56);
      setLimitingMagnitude(4.6);
      setMaxStars(2200);
      setShowConstellations(true);
      setShowLabels(false);
      setShowGuides(false);
      setAutoRotate(false);
      setZoomLevel(0.42);
      return;
    }

    if (preset === "deep") {
      setAtmosphereStrength(0.48);
      setStarGlowStrength(1);
      setLimitingMagnitude(6);
      setMaxStars(5200);
      setShowConstellations(true);
      setShowLabels(false);
      setShowGuides(false);
      setAutoRotate(true);
      setZoomLevel(0.62);
      return;
    }

    setAtmosphereStrength(0.7);
    setStarGlowStrength(0.8);
    setLimitingMagnitude(5.2);
    setMaxStars(3600);
    setShowConstellations(true);
    setShowLabels(false);
    setShowGuides(false);
    setAutoRotate(true);
    setZoomLevel(0.52);
  };

  const applyRainPreset = (preset) => {
    setRainPreset(preset);

    if (preset === "light") {
      setRainIntensity(0.4);
      setRainFlow(0.32);
      setAmbientVolume(0.72);
      return;
    }

    if (preset === "deep") {
      setRainIntensity(0.78);
      setRainFlow(0.6);
      setAmbientVolume(1.08);
      return;
    }

    setRainIntensity(0.56);
    setRainFlow(0.42);
    setAmbientVolume(0.9);
  };

  const applyLagoonPreset = (preset) => {
    setLagoonPreset(preset);

    if (preset === "shallow") {
      setLagoonClarity(0.82);
      setLagoonDrift(0.3);
      setAmbientVolume(0.76);
      return;
    }

    if (preset === "deep") {
      setLagoonClarity(0.46);
      setLagoonDrift(0.64);
      setAmbientVolume(0.88);
      return;
    }

    setLagoonClarity(0.68);
    setLagoonDrift(0.44);
    setAmbientVolume(0.82);
  };

  useEffect(() => {
    const isLight = Math.abs(rainIntensity - 0.4) < 0.015 && Math.abs(rainFlow - 0.32) < 0.015;
    const isBalanced = Math.abs(rainIntensity - 0.56) < 0.015 && Math.abs(rainFlow - 0.42) < 0.015;
    const isDeep = Math.abs(rainIntensity - 0.78) < 0.015 && Math.abs(rainFlow - 0.6) < 0.015;

    if (isLight) {
      setRainPreset("light");
      return;
    }
    if (isBalanced) {
      setRainPreset("balanced");
      return;
    }
    if (isDeep) {
      setRainPreset("deep");
      return;
    }
    setRainPreset("custom");
  }, [rainFlow, rainIntensity]);

  useEffect(() => {
    const isShallow = Math.abs(lagoonClarity - 0.82) < 0.015 && Math.abs(lagoonDrift - 0.3) < 0.015;
    const isBalanced = Math.abs(lagoonClarity - 0.68) < 0.015 && Math.abs(lagoonDrift - 0.44) < 0.015;
    const isDeep = Math.abs(lagoonClarity - 0.46) < 0.015 && Math.abs(lagoonDrift - 0.64) < 0.015;

    if (isShallow) {
      setLagoonPreset("shallow");
      return;
    }
    if (isBalanced) {
      setLagoonPreset("balanced");
      return;
    }
    if (isDeep) {
      setLagoonPreset("deep");
      return;
    }
    setLagoonPreset("custom");
  }, [lagoonClarity, lagoonDrift]);
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

  return (
    <div className={`planetarium-app theme-${currentThemeId}`} data-language={language}>
      {auroraWatchLayout ? (
        <AuroraExperience
          isFullscreen={isFullscreen}
          shouldShowAuroraPageChrome={shouldShowAuroraPageChrome}
          language={language}
          updateLanguage={updateLanguage}
          headerEyebrow={headerEyebrow}
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          dictionary={dictionary}
          auroraRenderer={auroraRenderer}
          startAuroraViewer={startAuroraViewer}
          wakeAmbient={wakeAmbient}
          revealAuroraUi={revealAuroraUi}
          auroraViewerRef={auroraViewerRef}
          auroraViewerOpen={auroraViewerOpen}
          auroraUiVisible={auroraUiVisible}
          immersiveIntro={immersiveIntro}
          showAuroraMoodControls={showAuroraMoodControls}
          setShowAuroraMoodControls={setShowAuroraMoodControls}
          markSettingsOpen={markSettingsOpen}
          analyticsSessionRef={analyticsSessionRef}
          currentThemeId={currentThemeId}
          ambientEnabled={ambientEnabled}
          toggleAmbientSound={toggleAmbientSound}
          closeAuroraViewer={async () => {
            await closeAuroraViewer();
            window.location.assign("/");
          }}
          auroraIntensity={auroraIntensity}
          setAuroraIntensity={setAuroraIntensity}
          auroraSpeed={auroraSpeed}
          setAuroraSpeed={setAuroraSpeed}
          auroraWindProfile={auroraWindProfile}
          setAuroraWindProfile={setAuroraWindProfile}
          ambientVolume={ambientVolume}
          setAmbientVolume={setAmbientVolume}
          toggleFullscreen={toggleAuroraFullscreen}
        />
      ) : rainWatchLayout ? (
        <MonsoonCanopyExperience
          viewerRef={viewerRef}
          isFullscreen={isFullscreen}
          language={language}
          updateLanguage={updateLanguage}
          headerEyebrow={headerEyebrow}
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          ambientEnabled={ambientEnabled}
          toggleAmbientSound={toggleAmbientSound}
          ambientVolume={ambientVolume}
          setAmbientVolume={setAmbientVolume}
          toggleFullscreen={toggleFullscreen}
          closeRainViewer={() => window.location.assign("/")}
          rainIntensity={rainIntensity}
          setRainIntensity={setRainIntensity}
          rainFlow={rainFlow}
          setRainFlow={setRainFlow}
          rainPreset={rainPreset}
          applyRainPreset={applyRainPreset}
          rainThunderEnabled={rainThunderEnabled}
          setRainThunderEnabled={setRainThunderEnabled}
          showRainMoodControls={showRainMoodControls}
          setShowRainMoodControls={setShowRainMoodControls}
          ensureAmbientOn={ensureAmbientOn}
        />
      ) : lagoonWatchLayout ? (
        <LagoonBelowExperience
          viewerRef={viewerRef}
          isFullscreen={isFullscreen}
          language={language}
          updateLanguage={updateLanguage}
          headerEyebrow={headerEyebrow}
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          ambientEnabled={ambientEnabled}
          toggleAmbientSound={toggleAmbientSound}
          ambientVolume={ambientVolume}
          setAmbientVolume={setAmbientVolume}
          toggleFullscreen={toggleFullscreen}
          closeLagoonViewer={() => window.location.assign("/")}
          lagoonClarity={lagoonClarity}
          setLagoonClarity={setLagoonClarity}
          lagoonDrift={lagoonDrift}
          setLagoonDrift={setLagoonDrift}
          lagoonPreset={lagoonPreset}
          applyLagoonPreset={applyLagoonPreset}
          showLagoonMoodControls={showLagoonMoodControls}
          setShowLagoonMoodControls={setShowLagoonMoodControls}
          ensureAmbientOn={ensureAmbientOn}
        />
      ) : (
        <NightSkyExperience
          dictionary={dictionary}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          language={language}
          updateLanguage={updateLanguage}
          observer={observer}
          observedAt={observedAt}
          setObservedAt={setObservedAt}
          headerEyebrow={headerEyebrow}
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          themes={themes}
          currentThemeId={currentThemeId}
          handleThemeSwitch={handleThemeSwitch}
          effectiveSketchEnabled={effectiveSketchEnabled}
          showThemeSwitcher={showThemeSwitcher}
          auroraWatchLayout={auroraWatchLayout}
          viewMode={viewMode}
          setViewMode={setViewMode}
          observerMomentLabel={observerMomentLabel}
          observerFocusSummary={observerFocusSummary}
          updateObserver={updateObserver}
          requestLocation={requestLocation}
          timeShiftCue={timeShiftCue}
          focusedConstellation={focusedConstellation}
          setFocusedConstellation={setFocusedConstellation}
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
          applyNightSkyPreset={applyNightSkyPreset}
          auroraEnabled={auroraEnabled}
          auroraIntensity={auroraIntensity}
          setAuroraIntensity={setAuroraIntensity}
          auroraSpeed={auroraSpeed}
          setAuroraSpeed={setAuroraSpeed}
          isSketchWatch={isSketchWatch}
          watchedSketch={watchedSketch}
          watchedSketchSummary={watchedSketchSummary}
          exitSketchWatch={exitSketchWatch}
          shiftTime={shiftTime}
          setTonightTimestamp={setTonightTimestamp}
          setObserverHourTimestamp={setObserverHourTimestamp}
          sketchWorkspace={sketchWorkspace}
          themeViewModes={themeViewModes}
          sketchViewDescription={sketchViewDescription}
          viewerRef={viewerRef}
          isFullscreen={isFullscreen}
          viewerUiVisible={viewerUiVisible}
          controlsHiddenInFullscreen={controlsHiddenInFullscreen}
          wakeAmbient={wakeAmbient}
          revealViewerUi={revealViewerUi}
          immersiveIntro={immersiveIntro}
          timeShiftOverlayLabel={timeShiftOverlayLabel}
          sceneState={sceneState}
          selectedTarget={selectedTarget}
          selectTarget={selectTarget}
          effectiveAtmosphereStrength={effectiveAtmosphereStrength}
          effectiveStarGlowStrength={effectiveStarGlowStrength}
          zoomLevel={zoomLevel}
          trackConstellation={trackConstellation}
          activeCreativeScene={activeCreativeScene}
          resetViewToken={resetViewToken}
          currentViewConstellationDetails={currentViewConstellationDetails}
          focusConstellations={focusConstellations}
          constellationSearch={constellationSearch}
          setConstellationSearch={setConstellationSearch}
          filteredConstellations={filteredConstellations}
          setTrackConstellation={setTrackConstellation}
          setZoomLevel={setZoomLevel}
          changeZoom={changeZoom}
          resetView={resetView}
          constellationStoryStateLines={constellationStoryStateLines}
          selectedStar={selectedStar}
          selectedSolarBody={selectedSolarBody}
          ambientTrackPending={ambientTrackPending}
          ambientTrackError={ambientTrackError}
          ambientEnabled={ambientEnabled}
          ambientStatus={ambientStatus}
          ambientStatusLabel={ambientStatusLabel}
          ambientStatusHint={ambientStatusHint}
          ambientVolume={ambientVolume}
          setAmbientVolume={setAmbientVolume}
          onToggleControlsHidden={() => setControlsHiddenInFullscreen((current) => !current)}
          toggleFullscreen={toggleFullscreen}
          toggleAmbientSound={toggleAmbientSound}
          selectedCustomStar={selectedCustomStar}
          selectedCustomConstellation={selectedCustomConstellation}
          selectedCustomPlanet={selectedCustomPlanet}
          customSpace={customSpace}
          removeCustomObject={removeCustomObject}
          savedSketches={savedSketches}
          sortedSavedSketches={sortedSavedSketches}
          addCustomObject={addCustomObject}
          updateCustomObject={updateCustomObject}
          planetPresets={planetPresets}
          removeSketch={removeSketch}
        />
      )}
    </div>
  );
}
