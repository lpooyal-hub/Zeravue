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
import { useSketchWorkspace } from "./hooks/useSketchWorkspace.js";
import { useWatchWorkspace } from "./hooks/useWatchWorkspace.js";
import { useTheme } from "./context/ThemeContext.jsx";
import {
  defaultObserver,
  getInitialObservedAt,
  planetPresets,
  setObserverHourTimestamp,
  setTonightTimestamp
} from "./utils/viewerState.js";
import { getThemeHeaderCopy, getThemeViewModes } from "./utils/themePresentation.js";

export function App({ forcedLanguage, setForcedLanguage, showThemeSwitcher = true }) {
  const { currentTheme, currentThemeId, themes, switchTheme } = useTheme();
  const viewerRef = useRef(null);
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
  const effectiveSketchEnabled = auroraEnabled ? false : sketchEnabled;
  const { eyebrow: headerEyebrow, title: headerTitle, subtitle: headerSubtitle } = useMemo(
    () => getThemeHeaderCopy({ auroraEnabled, language, dictionary }),
    [auroraEnabled, dictionary, language]
  );
  const themeViewModes = useMemo(() => getThemeViewModes(currentTheme), [currentTheme]);

  useEffect(() => {
    if (forcedLanguage && forcedLanguage !== language) {
      setLanguage(forcedLanguage);
    }
  }, [forcedLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("planetarium-language", language);
  }, [language]);

  useEffect(() => {
    if (!effectiveSketchEnabled && currentPage === "sketch") {
      setCurrentPage("watch");
    }
  }, [currentPage, effectiveSketchEnabled]);

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
    if (defaultViewMode && themeViewModes.includes(defaultViewMode)) {
      setViewMode(defaultViewMode);
    } else if (!themeViewModes.includes(viewMode)) {
      setViewMode(themeViewModes[0] || "space");
    }
    setFocusedConstellation("all");
    setTrackConstellation(false);
    setSelectedTarget(null);
  }, [currentTheme?.id, themeViewModes, viewMode]);

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

  useEffect(() => {
    function handleKeydown(event) {
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
  }, [currentPage, isSketchWatch, viewMode]);

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

  const auroraWatchLayout = auroraEnabled && currentPage === "watch";

  return (
    <div className={`planetarium-app theme-${currentThemeId}`}>
      <ViewerHeader
        dictionary={dictionary}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        language={language}
        setLanguage={updateLanguage}
        observer={observer}
        headerEyebrow={headerEyebrow}
        headerTitle={headerTitle}
        headerSubtitle={headerSubtitle}
        themes={themes}
        currentThemeId={currentThemeId}
        switchTheme={switchTheme}
        sketchEnabled={effectiveSketchEnabled}
        showThemeSwitcher={showThemeSwitcher}
        homeHref="/"
      />

      <div className={`workspace ${auroraWatchLayout ? "workspace-aurora" : ""}`}>
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
              viewModeOrder={themeViewModes}
              setViewMode={setViewMode}
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
            showLabels={auroraWatchLayout ? false : showLabels}
            showGuides={showGuides}
            showConstellations={auroraWatchLayout ? false : showConstellations}
            autoRotate={autoRotate}
            atmosphereStrength={atmosphereStrength}
            starGlowStrength={starGlowStrength}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
            focusedConstellation={auroraWatchLayout ? "all" : currentPage === "watch" && !isSketchWatch ? focusedConstellation : "all"}
            trackConstellation={auroraWatchLayout ? false : currentPage === "watch" && !isSketchWatch ? trackConstellation : false}
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
          {currentPage === "watch" && !isSketchWatch && !auroraWatchLayout ? (
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

        {!auroraWatchLayout ? (
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
        ) : null}
      </div>
    </div>
  );
}
