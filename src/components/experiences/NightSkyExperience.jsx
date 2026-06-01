import { PlanetariumCanvas } from "../PlanetariumCanvas.jsx";
import { SelectionInspectorPanel } from "../SelectionInspectorPanel.jsx";
import { SketchControlsPanel, SketchLibraryPanel } from "../SketchPanel.jsx";
import { ViewerHeader } from "../ViewerLayout.jsx";
import { ViewerAmbientOverlay, ViewerFocusOverlay } from "../ViewerOverlays.jsx";
import { WatchControlsPanel, WatchInspectorPanel } from "../WatchPanels.jsx";

export function NightSkyExperience(props) {
  const {
    dictionary,
    currentPage,
    setCurrentPage,
    language,
    updateLanguage,
    observer,
    observedAt,
    headerEyebrow,
    headerTitle,
    headerSubtitle,
    themes,
    currentThemeId,
    handleThemeSwitch,
    effectiveSketchEnabled,
    showThemeSwitcher,
    auroraWatchLayout,
    viewMode,
    observerMomentLabel,
    observerFocusSummary,
    updateObserver,
    requestLocation,
    timeShiftCue,
    focusedConstellation,
    setFocusedConstellation,
    activeConstellationKey,
    activeConstellationName,
    activeConstellationIsFavorite,
    toggleFavoriteConstellation,
    visibleFavoriteConstellations,
    activeConstellationStory,
    activeConstellationStats,
    atmosphereStrength,
    setAtmosphereStrength,
    starGlowStrength,
    setStarGlowStrength,
    limitingMagnitude,
    setLimitingMagnitude,
    maxStars,
    setMaxStars,
    showConstellations,
    setShowConstellations,
    showLabels,
    setShowLabels,
    autoRotate,
    setAutoRotate,
    showGuides,
    setShowGuides,
    applyNightSkyPreset,
    auroraEnabled,
    auroraIntensity,
    setAuroraIntensity,
    auroraSpeed,
    setAuroraSpeed,
    isSketchWatch,
    watchedSketch,
    watchedSketchSummary,
    exitSketchWatch,
    shiftTime,
    setTonightTimestamp,
    setObserverHourTimestamp,
    sketchWorkspace,
    themeViewModes,
    sketchViewDescription,
    viewerRef,
    isFullscreen,
    viewerUiVisible,
    controlsHiddenInFullscreen,
    wakeAmbient,
    revealViewerUi,
    immersiveIntro,
    timeShiftOverlayLabel,
    sceneState,
    selectedTarget,
    selectTarget,
    effectiveAtmosphereStrength,
    effectiveStarGlowStrength,
    zoomLevel,
    trackConstellation,
    activeCreativeScene,
    resetViewToken,
    currentViewConstellationDetails,
    focusConstellations,
    constellationSearch,
    setConstellationSearch,
    filteredConstellations,
    setTrackConstellation,
    setZoomLevel,
    changeZoom,
    resetView,
    constellationStoryStateLines,
    selectedStar,
    selectedSolarBody,
    ambientTrackPending,
    ambientTrackError,
    ambientEnabled,
    ambientStatus,
    ambientStatusLabel,
    ambientStatusHint,
    ambientVolume,
    setAmbientVolume,
    onToggleControlsHidden,
    toggleFullscreen,
    toggleAmbientSound,
    selectedCustomStar,
    selectedCustomConstellation,
    selectedCustomPlanet,
    customSpace,
    removeCustomObject,
    savedSketches,
    sortedSavedSketches
  } = props;

  const {
    creativeTool,
    setCreativeTool,
    planetPreset,
    setPlanetPreset,
    presetConstellationName,
    setPresetConstellationName,
    importableConstellations,
    importPresetConstellation,
    nudgeActiveConstellation,
    scaleActiveConstellation,
    spreadActiveConstellation,
    rotateActiveConstellation,
    activeCustomConstellation,
    updateActiveConstellationName,
    updateActiveConstellationColor,
    removeActiveConstellation,
    activeCustomConstellationStars,
    setCustomSpace,
    addCustomConstellation,
    duplicateActiveConstellation,
    sketchName,
    setSketchName,
    activeSketchName,
    saveSketchLabel,
    startNewSketch,
    clearDraftSketch,
    saveDraftSketch,
    saveSketchAsNew,
    activeSketchId,
    loadSketch,
    previewSketchInWatch,
    renameSketch,
    toggleSketchFavorite
  } = sketchWorkspace;

  return (
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
        showPageSwitcher={false}
        showThemeSwitcher={showThemeSwitcher}
        homeHref="/"
      />
      <div className="workspace">
        {!auroraWatchLayout ? (
          <div className="workspace-page-switcher page-switcher" aria-label={dictionary.viewer.pageMode}>
            <button type="button" aria-pressed={currentPage === "watch"} onClick={() => setCurrentPage("watch")}>
              {dictionary.viewer.pages.watch}
            </button>
            <button type="button" aria-pressed={currentPage === "sketch"} onClick={() => setCurrentPage("sketch")} disabled={!effectiveSketchEnabled}>
              {dictionary.viewer.pages.sketch}
            </button>
          </div>
        ) : null}
        <aside className="control-panel">
          {currentPage === "watch" ? (
            <WatchControlsPanel
              dictionary={dictionary}
              language={language}
              observedAt={observedAt}
              setObservedAt={props.setObservedAt}
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
              applyNightSkyPreset={applyNightSkyPreset}
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
                  setViewMode={props.setViewMode}
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
                  planetPresets={props.planetPresets}
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
            </>
          )}
        </aside>
        <main
          ref={viewerRef}
          className={`viewer ${isFullscreen ? "is-fullscreen" : ""} ${currentPage === "watch" && !viewerUiVisible ? "ambient-ui-hidden" : ""} ${
            controlsHiddenInFullscreen ? "ambient-ui-manual-hidden" : ""
          }`}
          onClickCapture={(event) => {
            wakeAmbient(event);
            if (currentPage === "watch") {
              revealViewerUi();
            }
          }}
          onWheelCapture={(event) => {
            wakeAmbient(event);
            if (currentPage === "watch") {
              revealViewerUi();
            }
          }}
          onPointerDownCapture={(event) => {
            wakeAmbient(event);
            if (currentPage === "watch") {
              revealViewerUi();
            }
          }}
          onTouchStartCapture={(event) => {
            wakeAmbient(event);
            if (currentPage === "watch") {
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
          {currentPage === "watch" ? (
            <div className={`viewer-time-shift-toast ${timeShiftCue ? "is-visible" : ""}`} aria-live="polite">
              {timeShiftOverlayLabel || "\u00a0"}
            </div>
          ) : null}
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
            atmosphereStrength={effectiveAtmosphereStrength}
            starGlowStrength={effectiveStarGlowStrength}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
            focusedConstellation={currentPage === "watch" && !isSketchWatch ? focusedConstellation : "all"}
            trackConstellation={currentPage === "watch" && !isSketchWatch ? trackConstellation : false}
            drawMode={currentPage === "sketch"}
            customSketchStarIds={[]}
            creativeMode={currentPage === "sketch" || isSketchWatch}
            customSpace={activeCreativeScene}
            creativeTool={currentPage === "sketch" ? creativeTool : "none"}
            onCreativeSpaceClick={currentPage === "sketch" ? props.addCustomObject : undefined}
            onUpdateCustomObject={currentPage === "sketch" ? props.updateCustomObject : undefined}
            editingEnabled={currentPage === "sketch"}
            resetViewToken={resetViewToken}
            auroraEnabled={false}
            auroraIntensity={auroraIntensity}
            auroraSpeed={auroraSpeed}
          />
          {currentPage === "watch" && !isSketchWatch ? (
            <div className="viewer-viewmode-overlay" aria-label={dictionary.viewer.viewModeLabel}>
              {themeViewModes.map((mode) => (
                <button key={mode} type="button" className={`focus-chip ${viewMode === mode ? "is-active" : ""}`} onClick={() => props.setViewMode(mode)}>
                  {dictionary.viewer.viewModes[mode]}
                </button>
              ))}
            </div>
          ) : null}
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
              resetView={resetView}
            />
          ) : null}
          {currentPage === "watch" && !isSketchWatch && !auroraEnabled ? (
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
                        <span className="story-state-pill">{viewMode === "observer" ? (language === "ko" ? "올려보기" : "Looking up") : dictionary.viewer.viewModes[viewMode]}</span>
                        <span className="story-state-pill">{activeConstellationIsFavorite ? (language === "ko" ? "즐겨찾기됨" : "Favorited") : language === "ko" ? "감상 중" : "In focus"}</span>
                      </div>
                    ) : null}
                    {constellationStoryStateLines.length ? (
                      <ul className="story-state-list">
                        {constellationStoryStateLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
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
            showHideControlsButton={isFullscreen && currentPage === "watch"}
            controlsHidden={controlsHiddenInFullscreen}
            onToggleControlsHidden={onToggleControlsHidden}
            toggleFullscreen={toggleFullscreen}
            toggleAmbientSound={toggleAmbientSound}
          />
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
              updateCustomObject={props.updateCustomObject}
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
              selectedSolarBody={selectedSolarBody}
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
              removeSketch={props.removeSketch}
            />
          )}
        </aside>
      </div>
    </>
  );
}
