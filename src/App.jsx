import { useEffect, useMemo, useRef, useState } from "react";
import { getSkyScene } from "./api/backend.js";
import { PlanetariumCanvas } from "./components/PlanetariumCanvas.jsx";
import { AuroraPanoramaScene } from "./components/AuroraPanoramaScene.jsx";
import { AuroraLiveViewer } from "./components/AuroraLiveViewer.jsx";
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
  const [currentPage, setCurrentPage] = useState("watch");
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
  const [auroraSpeed, setAuroraSpeed] = useState(0.34);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAuroraMoodControls, setShowAuroraMoodControls] = useState(false);
  const [auroraViewerOpen, setAuroraViewerOpen] = useState(false);
  const [immersiveIntro, setImmersiveIntro] = useState(null);
  const auroraViewerRef = useRef(null);
  const auroraUiTimerRef = useRef(null);
  const [auroraUiVisible, setAuroraUiVisible] = useState(true);
  const viewerUiTimerRef = useRef(null);
  const [viewerUiVisible, setViewerUiVisible] = useState(true);
  const [controlsHiddenInFullscreen, setControlsHiddenInFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [timeShiftCue, setTimeShiftCue] = useState(null);
  const timeShiftCueTimerRef = useRef(null);
  const previousObservedAtRef = useRef(observedAt);
  const { savedSketches, setSavedSketches, sortedSavedSketches } = useSavedSketches();
  const { favoriteConstellations, setFavoriteConstellations } = useFavoriteConstellations();
  const configuredAmbientTrackUrl = currentThemeId === "aurora-night" ? config.auroraAmbientTrackUrl || config.ambientTrackUrl : config.ambientTrackUrl;
  const { ambientTrackUrl, ambientTrackPending, ambientTrackError } = useNightSkyAmbientTrack({
    configuredTrackUrl: configuredAmbientTrackUrl,
    themeId: currentThemeId
  });
  const { ambientEnabled, ambientVolume, setAmbientVolume, ambientStatus, toggleAmbientSound, wakeAmbient } = useAmbientAudio({
    trackUrl: ambientTrackUrl,
    isReady: sceneState.status === "ready"
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
  const auroraWatchLayout = auroraEnabled && currentPage === "watch";
  const effectiveSketchEnabled = auroraEnabled ? false : sketchEnabled;
  const { eyebrow: headerEyebrow, title: headerTitle, subtitle: headerSubtitle } = useMemo(
    () => getThemeHeaderCopy({ auroraEnabled, language, dictionary }),
    [auroraEnabled, dictionary, language]
  );
  const themeViewModes = useMemo(() => getThemeViewModes(currentTheme), [currentTheme]);
  const autoEnterTargetRef = useRef(null);

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
    if (currentPage !== "watch" || auroraWatchLayout) {
      setFocusMode(false);
    }
  }, [auroraWatchLayout, currentPage]);

  useEffect(() => {
    function handleFocusModeShortcut(event) {
      if (event.defaultPrevented || event.repeat) {
        return;
      }
      if (event.key.toLowerCase() !== "f") {
        return;
      }
      if (currentPage !== "watch" || auroraWatchLayout) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      setFocusMode((current) => !current);
    }

    window.addEventListener("keydown", handleFocusModeShortcut);
    return () => window.removeEventListener("keydown", handleFocusModeShortcut);
  }, [auroraWatchLayout, currentPage]);

  useEffect(() => {
    const previousValue = previousObservedAtRef.current;
    if (previousValue === observedAt) {
      return;
    }

    previousObservedAtRef.current = observedAt;
    const previousDate = new Date(previousValue);
    const currentDate = new Date(observedAt);
    if (Number.isNaN(previousDate.getTime()) || Number.isNaN(currentDate.getTime())) {
      return;
    }

    const deltaMs = currentDate.getTime() - previousDate.getTime();
    if (Math.abs(deltaMs) < 60 * 1000) {
      return;
    }

    const deltaHours = Math.round((deltaMs / (60 * 60 * 1000)) * 10) / 10;
    setTimeShiftCue({ deltaHours });
    if (timeShiftCueTimerRef.current) {
      clearTimeout(timeShiftCueTimerRef.current);
    }
    timeShiftCueTimerRef.current = setTimeout(() => {
      setTimeShiftCue(null);
    }, 1600);
  }, [observedAt]);

  useEffect(() => {
    return () => {
      if (timeShiftCueTimerRef.current) {
        clearTimeout(timeShiftCueTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!auroraEnabled) {
      return;
    }
    setCurrentPage("watch");
    setViewMode("space");
    setShowConstellations(false);
    setShowLabels(false);
    setFocusedConstellation("all");
    setTrackConstellation(false);
  }, [auroraEnabled]);

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
    function handleFullscreenChange() {
      const next = Boolean(document.fullscreenElement);
      if (isFullscreen && !next) {
        markFullscreenExit(analyticsSessionRef.current);
      }
      setIsFullscreen(next);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      setControlsHiddenInFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!auroraViewerOpen) {
      return;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setAuroraViewerOpen(false);
        setShowAuroraMoodControls(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [auroraViewerOpen]);

  useEffect(() => {
    const target = autoEnterTargetRef.current;
    if (!target) {
      return;
    }

    const intro =
      target === "/aurora"
        ? {
            title: language === "ko" ? "오로라" : "Aurora",
            subtitle: language === "ko" ? "조용히 흐르는 빛" : "quiet drifting lights"
          }
        : {
            title: language === "ko" ? "밤하늘" : "Night Sky",
            subtitle: language === "ko" ? "천천히 숨 고르는 밤" : "breathe and stay for a while"
          };

    setImmersiveIntro(intro);
    const clearIntroTimer = window.setTimeout(() => setImmersiveIntro(null), 2800);

    if (target === "/aurora" && auroraWatchLayout) {
      startAuroraViewer();
    }

    if (target === "/night-sky" && !auroraWatchLayout && currentPage === "watch") {
      setViewMode("space");
      window.setTimeout(() => {
        if (!viewerRef.current) {
          return;
        }
        viewerRef.current.requestFullscreen?.().catch((error) => {
          console.debug("Night Sky fullscreen auto-enter skipped:", error);
        });
        revealViewerUi();
      }, 80);
    }

    autoEnterTargetRef.current = null;
    return () => window.clearTimeout(clearIntroTimer);
  }, [auroraWatchLayout, currentPage, language]);

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
          ? `지금은 ${altitudeBand}에서 관측하기 좋은 흐름입니다.`
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
  const timeShiftOverlayLabel = useMemo(() => {
    if (!timeShiftCue) {
      return "";
    }
    const deltaHours = timeShiftCue.deltaHours;
    if (deltaHours > 0) {
      return language === "ko" ? `+${deltaHours}시간 이동` : `+${deltaHours}h jump`;
    }
    return language === "ko" ? `${deltaHours}시간 이동` : `${deltaHours}h jump`;
  }, [language, timeShiftCue]);

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

  useEffect(() => {
    function handleKeydown(event) {
      if (currentPage === "watch" && !auroraWatchLayout) {
        revealViewerUi();
      }
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField = tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable;
      if (isTypingField) {
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetView();
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(0.1);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        changeZoom(-0.1);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [auroraWatchLayout, currentPage, isSketchWatch, viewMode]);

  async function toggleFullscreen() {
    if (!viewerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    markViewerEnter(analyticsSessionRef.current, currentThemeId, window.location.pathname || "/");
    markFullscreenEnter(analyticsSessionRef.current);
    await viewerRef.current.requestFullscreen();
  }

  async function startAuroraViewer() {
    wakeAmbient();
    setAuroraViewerOpen(true);
    setAuroraUiVisible(true);

    const target = auroraViewerRef.current;
    if (!target?.requestFullscreen) {
      return;
    }

    try {
      markFullscreenEnter(analyticsSessionRef.current);
      markViewerEnter(analyticsSessionRef.current, currentThemeId, window.location.pathname || "/");
      await target.requestFullscreen();
    } catch (error) {
      console.error("Aurora fullscreen request failed:", error);
    }
  }

  async function closeAuroraViewer() {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Aurora fullscreen exit failed:", error);
      }
    }
    setAuroraViewerOpen(false);
    setShowAuroraMoodControls(false);
    setAuroraUiVisible(true);
    if (auroraUiTimerRef.current) {
      clearTimeout(auroraUiTimerRef.current);
      auroraUiTimerRef.current = null;
    }
  }

  function revealAuroraUi() {
    setAuroraUiVisible(true);
    if (auroraUiTimerRef.current) {
      clearTimeout(auroraUiTimerRef.current);
    }
    auroraUiTimerRef.current = setTimeout(() => {
      setAuroraUiVisible(false);
    }, 2800);
  }

  function revealViewerUi() {
    setViewerUiVisible(true);
    if (viewerUiTimerRef.current) {
      clearTimeout(viewerUiTimerRef.current);
    }
    viewerUiTimerRef.current = setTimeout(() => {
      setViewerUiVisible(false);
    }, 2800);
  }

  function handleThemeSwitch(nextThemeId) {
    markThemeSwitch(analyticsSessionRef.current, nextThemeId, window.location.pathname || "/");
    switchTheme(nextThemeId);
  }

  const shouldShowAuroraPageChrome = auroraWatchLayout && !auroraViewerOpen;

  useEffect(() => {
    if (!auroraViewerOpen) {
      return;
    }
    revealAuroraUi();
    return () => {
      if (auroraUiTimerRef.current) {
        clearTimeout(auroraUiTimerRef.current);
        auroraUiTimerRef.current = null;
      }
    };
  }, [auroraViewerOpen]);

  useEffect(() => {
    if (auroraWatchLayout || currentPage !== "watch") {
      setViewerUiVisible(true);
      if (viewerUiTimerRef.current) {
        clearTimeout(viewerUiTimerRef.current);
        viewerUiTimerRef.current = null;
      }
      return;
    }
    revealViewerUi();
    return () => {
      if (viewerUiTimerRef.current) {
        clearTimeout(viewerUiTimerRef.current);
        viewerUiTimerRef.current = null;
      }
    };
  }, [auroraWatchLayout, currentPage, viewMode]);

  return (
    <div className={`planetarium-app theme-${currentThemeId}`}>
      {auroraWatchLayout ? (
        <div className={`aurora-page ${isFullscreen ? "is-fullscreen-view" : ""}`}>
          {shouldShowAuroraPageChrome ? (
            <>
              <header className="aurora-floating-header aurora-landing-header">
                <a className="aurora-header-logo-wrap" href="/" aria-label={language === "ko" ? "메인 홈으로 이동" : "Go to home"}>
                  <img className="aurora-header-logo" src="/branding/zeravue-logo.svg" alt="Zeravue logo" />
                </a>
                <div className="aurora-header-controls">
                  <div className="page-switcher" aria-label={dictionary.viewer.pageMode}>
                    <button type="button" aria-pressed={currentPage === "watch"} onClick={() => setCurrentPage("watch")}>
                      {dictionary.viewer.pages.watch}
                    </button>
                    <button type="button" aria-pressed={currentPage === "sketch"} onClick={() => setCurrentPage("sketch")} disabled={!effectiveSketchEnabled}>
                      {dictionary.viewer.pages.sketch}
                    </button>
                  </div>
                  <div className="language-switcher" aria-label="Language">
                    <button type="button" aria-pressed={language === "en"} onClick={() => updateLanguage("en")}>
                      EN
                    </button>
                    <button type="button" aria-pressed={language === "ko"} onClick={() => updateLanguage("ko")}>
                      KR
                    </button>
                  </div>
                </div>
              </header>

              <section className="aurora-landing-content">
                <p className="eyebrow">{headerEyebrow || dictionary.viewer.eyebrow}</p>
                {auroraRenderer === "webgl" ? <p className="aurora-experimental-badge">Experimental WebGL</p> : null}
                <h1 className="aurora-title">{headerTitle || dictionary.viewer.title}</h1>
                <p className="aurora-subtitle">{headerSubtitle || dictionary.viewer.subtitle}</p>
                <button type="button" className="primary-button aurora-start-button" onClick={startAuroraViewer}>
                  {language === "ko" ? "감상 시작" : "Enter Aurora"}
                </button>
              </section>
            </>
          ) : null}

          <section
            ref={auroraViewerRef}
            className={`aurora-live-shell ${auroraViewerOpen ? "is-open" : ""} ${auroraUiVisible ? "ui-visible" : ""}`}
            onClickCapture={wakeAmbient}
            onWheelCapture={wakeAmbient}
            onPointerDownCapture={(event) => {
              wakeAmbient(event);
              revealAuroraUi();
            }}
            onTouchStartCapture={(event) => {
              wakeAmbient(event);
              revealAuroraUi();
            }}
            onPointerMoveCapture={revealAuroraUi}
          >
            {auroraRenderer === "webgl" ? <AuroraLiveViewer intensity={auroraIntensity} speed={auroraSpeed} /> : <AuroraPanoramaScene />}
            {immersiveIntro ? (
              <div className="ambient-intro-overlay">
                <h2>{immersiveIntro.title}</h2>
                <p>{immersiveIntro.subtitle}</p>
              </div>
            ) : null}
            <section className={`aurora-soft-controls aurora-live-controls ${showAuroraMoodControls ? "is-open" : ""}`}>
              <div className="aurora-live-quick-actions">
                  <button
                    type="button"
                    className="aurora-soft-controls-trigger"
                    onClick={() =>
                      setShowAuroraMoodControls((current) => {
                        const next = !current;
                        if (next) {
                          markSettingsOpen(analyticsSessionRef.current, currentThemeId, window.location.pathname || "/");
                        }
                        return next;
                      })
                    }
                  >
                    {language === "ko" ? "설정" : "Settings"}
                  </button>
                <button type="button" className="aurora-soft-controls-trigger" onClick={toggleAmbientSound}>
                  {ambientEnabled ? (language === "ko" ? "음소거" : "Mute") : language === "ko" ? "소리" : "Sound"}
                </button>
                <button type="button" className="aurora-soft-controls-trigger" onClick={closeAuroraViewer}>
                  {language === "ko" ? "종료" : "Close"}
                </button>
              </div>
              {showAuroraMoodControls ? (
                <div className="aurora-soft-controls-body">
                  <label>
                    <span>{language === "ko" ? `오로라 강도 ${Math.round(auroraIntensity * 100)}%` : `Intensity ${Math.round(auroraIntensity * 100)}%`}</span>
                    <input type="range" min="0.25" max="0.9" step="0.01" value={auroraIntensity} onChange={(event) => setAuroraIntensity(Number(event.target.value))} />
                  </label>
                  <label>
                    <span>{language === "ko" ? `오로라 흐름 ${Math.round(auroraSpeed * 100)}%` : `Flow ${Math.round(auroraSpeed * 100)}%`}</span>
                    <input type="range" min="0.15" max="0.72" step="0.01" value={auroraSpeed} onChange={(event) => setAuroraSpeed(Number(event.target.value))} />
                  </label>
                  <label>
                    <span>{language === "ko" ? `볼륨 ${Math.round(ambientVolume * 100)}%` : `Volume ${Math.round(ambientVolume * 100)}%`}</span>
                    <input type="range" min="0.35" max="1" step="0.05" value={ambientVolume} onChange={(event) => setAmbientVolume(Number(event.target.value))} />
                  </label>
                </div>
              ) : null}
            </section>
          </section>
        </div>
      ) : (
        <>
          <ViewerHeader
            dictionary={dictionary}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            language={language}
            setLanguage={updateLanguage}
            observer={observer}
            observedAt={observedAt}
            headerEyebrow={headerEyebrow}
            headerTitle={headerTitle}
            headerSubtitle={headerSubtitle}
            themes={themes}
            currentThemeId={currentThemeId}
            switchTheme={handleThemeSwitch}
            sketchEnabled={effectiveSketchEnabled}
            showThemeSwitcher={showThemeSwitcher}
            homeHref="/"
          />
          <div className={`workspace ${focusMode ? "is-focus-mode" : ""}`}>
        {auroraWatchLayout ? (
          <aside className="control-panel aurora-control-panel">
            <section>
              <p className="eyebrow">{language === "ko" ? "오로라 감상" : "Aurora viewing"}</p>
              <p className="helper-copy">
                {language === "ko"
                  ? "차가운 파스텔 톤의 오로라를 천천히 바라보는 감상 페이지입니다."
                  : "A quiet aurora page with cool pastel tones and slow movement."}
              </p>
            </section>
            <section>
              <p className="eyebrow">{language === "ko" ? "오로라 분위기" : "Aurora mood"}</p>
              <label>
                <span>{language === "ko" ? `오로라 강도: ${Math.round(auroraIntensity * 100)}%` : `Aurora intensity: ${Math.round(auroraIntensity * 100)}%`}</span>
                <input type="range" min="0.25" max="0.9" step="0.01" value={auroraIntensity} onChange={(event) => setAuroraIntensity(Number(event.target.value))} />
              </label>
              <label>
                <span>{language === "ko" ? `오로라 흐름 속도: ${Math.round(auroraSpeed * 100)}%` : `Aurora drift speed: ${Math.round(auroraSpeed * 100)}%`}</span>
                <input type="range" min="0.15" max="0.72" step="0.01" value={auroraSpeed} onChange={(event) => setAuroraSpeed(Number(event.target.value))} />
              </label>
            </section>
          </aside>
        ) : (
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
              auroraEnabled={auroraEnabled}
              auroraIntensity={auroraIntensity}
              setAuroraIntensity={setAuroraIntensity}
              auroraSpeed={auroraSpeed}
              setAuroraSpeed={setAuroraSpeed}
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
                  viewModeOrder={themeViewModes}
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
        )}

        <main
          ref={viewerRef}
          className={`viewer ${auroraWatchLayout ? "viewer-aurora" : ""} ${isFullscreen ? "is-fullscreen" : ""} ${
            currentPage === "watch" && !viewerUiVisible ? "ambient-ui-hidden" : ""
          } ${controlsHiddenInFullscreen ? "ambient-ui-manual-hidden" : ""}`}
          onClickCapture={(event) => {
            wakeAmbient(event);
            if (!auroraWatchLayout && currentPage === "watch") {
              revealViewerUi();
            }
          }}
          onWheelCapture={(event) => {
            wakeAmbient(event);
            if (!auroraWatchLayout && currentPage === "watch") {
              revealViewerUi();
            }
          }}
          onPointerDownCapture={(event) => {
            wakeAmbient(event);
            if (!auroraWatchLayout && currentPage === "watch") {
              revealViewerUi();
            }
          }}
          onTouchStartCapture={(event) => {
            wakeAmbient(event);
            if (!auroraWatchLayout && currentPage === "watch") {
              revealViewerUi();
            }
          }}
        >
          {immersiveIntro ? (
            <div className="ambient-intro-overlay">
              <h2>{immersiveIntro.title}</h2>
              <p>{immersiveIntro.subtitle}</p>
            </div>
          ) : null}
          {currentPage === "watch" && !auroraWatchLayout ? (
            <div className={`viewer-time-shift-toast ${timeShiftCue ? "is-visible" : ""}`} aria-live="polite">
              {timeShiftOverlayLabel || "\u00a0"}
            </div>
          ) : null}
          {auroraWatchLayout ? (
            <AuroraPanoramaScene />
          ) : (
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
              resetViewToken={resetViewToken}
              auroraEnabled={auroraEnabled}
              auroraIntensity={auroraIntensity}
              auroraSpeed={auroraSpeed}
            />
          )}
          {currentPage === "watch" && !isSketchWatch && !auroraWatchLayout && !focusMode ? (
            <div className="viewer-viewmode-overlay" aria-label={dictionary.viewer.viewModeLabel}>
              {themeViewModes.map((mode) => (
                <button key={mode} type="button" className={`focus-chip ${viewMode === mode ? "is-active" : ""}`} onClick={() => setViewMode(mode)}>
                  {dictionary.viewer.viewModes[mode]}
                </button>
              ))}
            </div>
          ) : null}
          {currentPage === "watch" && !auroraWatchLayout ? (
            <button
              type="button"
              className="viewer-focus-mode-toggle"
              title={language === "ko" ? "단축키 F" : "Shortcut: F"}
              onClick={() => setFocusMode((current) => !current)}
            >
              {focusMode ? (language === "ko" ? "패널 보기" : "Show panels") : language === "ko" ? "집중 모드" : "Focus mode"}
            </button>
          ) : null}
          {currentPage === "watch" && !isSketchWatch && !auroraWatchLayout && !focusMode ? (
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
              resetView={resetView}
            />
          ) : null}
          {currentPage === "watch" && !isSketchWatch && !auroraWatchLayout && !auroraEnabled && !focusMode ? (
            <section className="viewer-bottom-dock">
              <details className="viewer-bottom-dock-details">
                <summary>{language === "ko" ? "무드 · 분위기 · 하늘 조정" : "Mood · Atmosphere · Sky tuning"}</summary>
                <div className="viewer-bottom-dock-content">
                  <section className="story-card">
                    <p className="eyebrow">{dictionary.viewer.tonightMood}</p>
                    <h2>{activeConstellationName || dictionary.viewer.allSky}</h2>
                    <p>{activeConstellationStory}</p>
                    {activeConstellationKey && activeConstellationKey !== "all" ? (
                      <div className="story-state-row">
                        <span className="story-state-pill">{viewMode === "observer" ? (language === "ko" ? "관측자 시점" : "Observer view") : dictionary.viewer.viewModes[viewMode]}</span>
                        <span className="story-state-pill">{activeConstellationIsFavorite ? (language === "ko" ? "즐겨찾기됨" : "Favorited") : language === "ko" ? "관측 중" : "In focus"}</span>
                      </div>
                    ) : null}
                    {constellationStoryStateLines.length ? (
                      <ul className="story-state-list">
                        {constellationStoryStateLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {activeConstellationStats ? (
                      <dl className="summary-list compact">
                        <div>
                          <dt>{dictionary.viewer.constellationVisibleStars}</dt>
                          <dd>{activeConstellationStats.visibleStars}</dd>
                        </div>
                        <div>
                          <dt>{dictionary.viewer.brightestStar}</dt>
                          <dd>{activeConstellationStats.brightestStar || "--"}</dd>
                        </div>
                        <div>
                          <dt>{dictionary.viewer.magnitude}</dt>
                          <dd>{activeConstellationStats.brightestMagnitude ?? "--"}</dd>
                        </div>
                      </dl>
                    ) : null}
                  </section>
                  <section>
                    <p className="eyebrow">{dictionary.viewer.atmosphere}</p>
                    <div className="observer-moment-card">
                      <strong>{language === "ko" ? "차분한 감상 설정" : "Calm viewing preset"}</strong>
                      <span>
                        {language === "ko"
                          ? "기본값은 별의 가독성과 부드러운 움직임을 우선합니다."
                          : "Defaults favor star readability and gentle motion."}
                      </span>
                    </div>
                    <div className="viewer-dock-tuning-grid">
                      <label className="stacked-field">
                        <span>
                          {dictionary.viewer.atmosphereDensity}: {Math.round(atmosphereStrength * 100)}%
                        </span>
                        <input type="range" min="0.2" max="1" step="0.05" value={atmosphereStrength} onChange={(event) => setAtmosphereStrength(Number(event.target.value))} />
                      </label>
                      <label className="stacked-field">
                        <span>
                          {dictionary.viewer.starGlow}: {Math.round(starGlowStrength * 100)}%
                        </span>
                        <input type="range" min="0.2" max="1" step="0.05" value={starGlowStrength} onChange={(event) => setStarGlowStrength(Number(event.target.value))} />
                      </label>
                      <label className="stacked-field">
                        <span>
                          {dictionary.viewer.limitingMagnitude}: {limitingMagnitude.toFixed(1)}
                        </span>
                        <input type="range" min="3" max="6" step="0.1" value={limitingMagnitude} onChange={(event) => setLimitingMagnitude(Number(event.target.value))} />
                      </label>
                      <label className="stacked-field">
                        <span>
                          {dictionary.viewer.maxStars}: {maxStars.toLocaleString()}
                        </span>
                        <input type="range" min="1800" max="6000" step="200" value={maxStars} onChange={(event) => setMaxStars(Number(event.target.value))} />
                      </label>
                    </div>
                    <div className="toggle-grid">
                      <label className="toggle-item">
                        <input type="checkbox" checked={showConstellations} onChange={(event) => setShowConstellations(event.target.checked)} />
                        <span>{dictionary.viewer.toggles.constellations}</span>
                      </label>
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
                </div>
              </details>
            </section>
          ) : null}
          <ViewerAmbientOverlay
            dictionary={dictionary}
            language={language}
            ambientTrackPending={ambientTrackPending}
            ambientTrackError={ambientTrackError}
            ambientEnabled={ambientEnabled}
            ambientStatus={ambientStatus}
            ambientStatusLabel={ambientStatusLabel}
            ambientStatusHint={ambientStatusHint}
            ambientVolume={ambientVolume}
            setAmbientVolume={setAmbientVolume}
            isFullscreen={isFullscreen}
            showHideControlsButton={isFullscreen && currentPage === "watch" && !auroraWatchLayout}
            controlsHidden={controlsHiddenInFullscreen}
            onToggleControlsHidden={() => setControlsHiddenInFullscreen((current) => !current)}
            toggleFullscreen={toggleFullscreen}
            toggleAmbientSound={toggleAmbientSound}
          />
          {isFullscreen && currentPage === "watch" && !auroraWatchLayout && controlsHiddenInFullscreen ? (
            <button
              type="button"
              className="viewer-unhide-button"
              onClick={() => {
                setControlsHiddenInFullscreen(false);
                revealViewerUi();
              }}
            >
              {language === "ko" ? "UI" : "UI"}
            </button>
          ) : null}
        </main>

          <aside className="inspector-panel">
          {currentPage === "sketch" ? (
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
          ) : null}

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
              auroraEnabled={auroraEnabled}
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
        </>
      )}
    </div>
  );
}
