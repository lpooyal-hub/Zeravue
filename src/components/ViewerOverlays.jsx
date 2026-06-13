export function ViewerFocusOverlay({
  dictionary,
  language,
  constellationSearch,
  setConstellationSearch,
  focusedConstellation,
  setFocusedConstellation,
  focusConstellations,
  filteredConstellations,
  trackConstellation,
  setTrackConstellation,
  zoomLevel,
  setZoomLevel,
  changeZoom,
  resetView
}) {
  return (
    <div className="viewer-focus-overlay">
      <div className="overlay-focus-shell">
        <label className="overlay-focus-field">
          <span>{dictionary.viewer.searchConstellation}</span>
          <input
            type="text"
            value={constellationSearch}
            placeholder={dictionary.viewer.searchPlaceholder}
            onChange={(event) => setConstellationSearch(event.target.value)}
          />
        </label>
        <label className="overlay-focus-field">
          <span>{dictionary.viewer.focusConstellation}</span>
          <select value={focusedConstellation} onChange={(event) => setFocusedConstellation(event.target.value)}>
            <option value="all">{dictionary.viewer.allSky}</option>
            {(filteredConstellations.length ? filteredConstellations : focusConstellations).map((name) => (
              <option key={name} value={name}>
                {dictionary.constellations?.[name]?.[language] || name}
              </option>
            ))}
          </select>
        </label>
        <div className="overlay-focus-actions">
          <label className="overlay-track-toggle">
            <input
              type="checkbox"
              checked={trackConstellation}
              disabled={focusedConstellation === "all"}
              onChange={(event) => setTrackConstellation(event.target.checked)}
            />
            <span>{dictionary.viewer.trackConstellation}</span>
          </label>
          {focusedConstellation !== "all" ? (
            <button
              type="button"
              className="overlay-button overlay-inline-button"
              title={language === "ko" ? "선택 해제" : "Clear selection"}
              aria-label={language === "ko" ? "선택 해제" : "Clear selection"}
              onClick={() => {
                setFocusedConstellation("all");
                setTrackConstellation(false);
              }}
            >
              {language === "ko" ? "선택 해제" : "Clear selection"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="overlay-zoom-shell">
        <label className="overlay-zoom">
          <span>{dictionary.viewer.zoom}</span>
          <div className="overlay-zoom-controls">
            <button
              type="button"
              className="overlay-button overlay-icon-button"
              title={dictionary.viewer.zoomOut}
              aria-label={dictionary.viewer.zoomOut}
              onClick={() => changeZoom(-0.1)}
            >
              -
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={zoomLevel}
              aria-label={dictionary.viewer.zoom}
              onChange={(event) => setZoomLevel(Number(event.target.value))}
            />
            <button
              type="button"
              className="overlay-button overlay-icon-button"
              title={dictionary.viewer.zoomIn}
              aria-label={dictionary.viewer.zoomIn}
              onClick={() => changeZoom(0.1)}
            >
              +
            </button>
          </div>
        </label>
        <div className="overlay-zoom-footer">
          <span className="overlay-shortcut-hint">{language === "ko" ? "R 초기화 · +/- 줌" : "R reset · +/- zoom"}</span>
          <button
            type="button"
            className="overlay-button overlay-inline-button"
            title={dictionary.viewer.resetView}
            aria-label={dictionary.viewer.resetView}
            onClick={resetView}
          >
            {language === "ko" ? "시점 초기화" : "Reset view"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SketchFullscreenOverlay({
  dictionary,
  language,
  viewMode,
  viewModeOrder,
  setViewMode,
  creativeTool,
  setCreativeTool,
  activeSketchName,
  saveSketchLabel,
  saveDraftSketch,
  startNewSketch,
  clearDraftSketch,
  saveSketchAsNew,
  addCustomConstellation,
  presetConstellationName,
  setPresetConstellationName,
  importableConstellations,
  importPresetConstellation,
  sortedSavedSketches,
  loadSketch
}) {
  const overlayTitle = language === "ko" ? "스케치 도구" : "Sketch tools";
  const importLabel = language === "ko" ? "별자리 불러오기" : "Import shape";
  const loadLabel = language === "ko" ? "저장 스케치 열기" : "Open saved sketch";
  const currentToolLabel = dictionary.viewer.creativeTools?.[creativeTool] || dictionary.viewer.addStarTool;
  const quickActionLabel = language === "ko" ? "빠른 정리와 저장" : "Quick cleanup and save";

  return (
    <section className="sketch-fullscreen-overlay">
      <details className="sketch-fullscreen-dock" open>
        <summary>
          <span>{overlayTitle}</span>
          <strong>{activeSketchName}</strong>
          <small>{currentToolLabel}</small>
        </summary>
        <div className="sketch-fullscreen-dock-body">
          {viewModeOrder.length > 1 ? (
            <div className="constellation-list focus-list">
              {viewModeOrder.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`focus-chip ${viewMode === mode ? "is-active" : ""}`}
                  onClick={() => setViewMode(mode)}
                >
                  {dictionary.viewer.viewModes[mode]}
                </button>
              ))}
            </div>
          ) : null}

          <div className="sketch-fullscreen-tool-row">
            <button type="button" className={`focus-chip ${creativeTool === "star" ? "is-active" : ""}`} onClick={() => setCreativeTool("star")}>
              {dictionary.viewer.addStarTool}
            </button>
            <button type="button" className={`focus-chip ${creativeTool === "planet" ? "is-active" : ""}`} onClick={() => setCreativeTool("planet")}>
              {dictionary.viewer.addPlanetTool}
            </button>
            <button type="button" className={`focus-chip ${creativeTool === "delete" ? "is-active" : ""}`} onClick={() => setCreativeTool("delete")}>
              {dictionary.viewer.deleteTool}
            </button>
          </div>

          <p className="sketch-fullscreen-copy">{quickActionLabel}</p>
          <div className="sketch-fullscreen-action-row">
            <button type="button" className="focus-chip" onClick={startNewSketch}>
              {dictionary.viewer.newSketch}
            </button>
            <button type="button" className="focus-chip" onClick={clearDraftSketch}>
              {dictionary.viewer.clearSketch}
            </button>
            <button type="button" className="focus-chip" onClick={addCustomConstellation}>
              {dictionary.viewer.addConstellation}
            </button>
            <button type="button" className="focus-chip is-active" onClick={saveDraftSketch}>
              {saveSketchLabel}
            </button>
            <button type="button" className="focus-chip" onClick={saveSketchAsNew}>
              {dictionary.viewer.saveSketchAsNew}
            </button>
          </div>

          <details className="sketch-fullscreen-section">
            <summary>{language === "ko" ? "불러오기" : "Load options"}</summary>
            <div className="sketch-fullscreen-section-body">
              <div className="sketch-fullscreen-field-row">
                <label className="overlay-focus-field">
                  <span>{importLabel}</span>
                  <select value={presetConstellationName} onChange={(event) => setPresetConstellationName(event.target.value)}>
                    {importableConstellations.length === 0 ? (
                      <option value="">{dictionary.viewer.noPresetConstellations}</option>
                    ) : (
                      importableConstellations.map((name) => (
                        <option key={name} value={name}>
                          {dictionary.constellations?.[name]?.[language] || name}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <button type="button" className="overlay-button overlay-inline-button" onClick={importPresetConstellation} disabled={!presetConstellationName}>
                  {dictionary.viewer.importConstellation}
                </button>
              </div>

              <div className="sketch-fullscreen-field-row">
                <label className="overlay-focus-field">
                  <span>{loadLabel}</span>
                  <select defaultValue="" onChange={(event) => event.target.value && loadSketch(event.target.value)}>
                    <option value="">{sortedSavedSketches.length ? (language === "ko" ? "저장한 스케치 선택" : "Choose a saved sketch") : dictionary.viewer.noSavedSketches}</option>
                    {sortedSavedSketches.map((sketch) => (
                      <option key={sketch.id} value={sketch.id}>
                        {sketch.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </details>
        </div>
      </details>
    </section>
  );
}

export function ViewerAmbientOverlay({
  dictionary,
  language,
  ambientTrackPending,
  ambientTrackError,
  ambientEnabled,
  ambientStatus,
  ambientStatusLabel,
  ambientStatusHint,
  ambientVolume,
  setAmbientVolume,
  isFullscreen,
  showHideControlsButton,
  onToggleControlsHidden,
  controlsHidden,
  toggleFullscreen,
  toggleAmbientSound
}) {
  return (
    <div className="viewer-overlay">
      {(ambientTrackPending || ambientTrackError || (ambientEnabled && ambientStatus !== "playing")) ? (
        <div className="overlay-ambient-status">
          <strong>{ambientStatusLabel}</strong>
          <span>{ambientStatusHint}</span>
        </div>
      ) : null}
      <label className="overlay-volume">
        <span>{dictionary.viewer.ambient.volumeShort}</span>
        <input
          type="range"
          min="0.5"
          max="1.15"
          step="0.05"
          value={ambientVolume}
          aria-label={dictionary.viewer.ambient.volume}
          onChange={(event) => setAmbientVolume(Number(event.target.value))}
        />
        <strong>{Math.round(ambientVolume * 100)}%</strong>
      </label>
      <button
        type="button"
        className="overlay-button overlay-icon-button"
        title={isFullscreen ? dictionary.viewer.exitFullscreen : dictionary.viewer.enterFullscreen}
        aria-label={isFullscreen ? dictionary.viewer.exitFullscreen : dictionary.viewer.enterFullscreen}
        onClick={toggleFullscreen}
      >
        {language === "ko" ? (isFullscreen ? "전체화면 종료" : "전체화면") : isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      </button>
      {showHideControlsButton ? (
        <button
          type="button"
          className="overlay-button overlay-icon-button"
          title={controlsHidden ? (language === "ko" ? "컨트롤 보이기" : "Show UI") : language === "ko" ? "컨트롤 숨기기" : "Hide UI"}
          aria-label={controlsHidden ? (language === "ko" ? "컨트롤 보이기" : "Show UI") : language === "ko" ? "컨트롤 숨기기" : "Hide UI"}
          onClick={onToggleControlsHidden}
        >
          {controlsHidden ? "UI+" : "UI-"}
        </button>
      ) : null}
      <button
        type="button"
        className={`overlay-button overlay-icon-button ${ambientEnabled ? "is-active" : ""}`}
        title={ambientEnabled ? dictionary.viewer.ambient.off : dictionary.viewer.ambient.on}
        aria-label={ambientEnabled ? dictionary.viewer.ambient.off : dictionary.viewer.ambient.on}
        onClick={toggleAmbientSound}
      >
        {ambientEnabled ? dictionary.viewer.ambient.off : dictionary.viewer.ambient.on}
      </button>
    </div>
  );
}
